"""
knowledge_healer.py — Cyber Tree Phase 8: Knowledge Graph Healer
========================================================================
Heals anomalies in the knowledge graph:
  1. Identifies orphan nodes (zero relationships) and auto-links them
     to semantically similar nodes (similarity > 0.82) using cosine similarity.
  2. Identifies duplicate nodes (same external_id), merges their
     relationships to the highest-confidence version, and deletes the duplicates.
  3. Detects and deletes orphaned relationships whose target or source
     nodes no longer exist.
  4. Identifies low-confidence nodes (< 0.2) and flags them with
     metadata.needs_review = true.

Usage:
    python scripts/knowledge_healer.py
"""

import os
import sys
import json
import numpy as np
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv

# Add scripts directory to path to load local modules
sys.path.append(os.path.dirname(__file__))
from db_client import DBClient

load_dotenv()

def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)

# ── 1. Helper: Cosine Similarity on Local SQLite ──────────────────────────
def find_similar_nodes_local(db, query_embedding, exclude_id, match_threshold=0.82, match_count=5):
    """Computes cosine similarity in memory for local SQLite environments."""
    try:
        conn = db._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, node_type, embedding FROM nodes WHERE embedding IS NOT NULL AND id != ?", (exclude_id,))
        rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        log(f"  Error reading embeddings locally: {e}")
        return []

    q_arr = np.array(query_embedding)
    q_norm = np.linalg.norm(q_arr)
    if q_norm == 0:
        return []

    matches = []
    for r in rows:
        nid, title, ntype, emb_str = r
        try:
            emb = json.loads(emb_str)
            arr = np.array(emb)
            norm = np.linalg.norm(arr)
            if norm == 0:
                continue
            # Cosine similarity
            sim = float(np.dot(q_arr, arr) / (q_norm * norm))
            if sim >= match_threshold:
                matches.append({
                    "id": nid,
                    "title": title,
                    "node_type": ntype,
                    "similarity": sim
                })
        except Exception:
            pass

    matches.sort(key=lambda x: x["similarity"], reverse=True)
    return matches[:match_count]

# ── 2. Helper: Find Orphan Nodes ───────────────────────────────────────────
def get_orphan_nodes(db) -> list[dict]:
    log("Identifying orphan nodes (zero relationships)...")
    connected_ids = set()
    
    # Fetch all relationship endpoints
    if db.use_supabase:
        offset = 0
        limit = 1000
        while True:
            res = db.client.table("relationships").select("from_node_id, to_node_id").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            for r in res.data:
                if r.get("from_node_id"):
                    connected_ids.add(r["from_node_id"])
                if r.get("to_node_id"):
                    connected_ids.add(r["to_node_id"])
            if len(res.data) < limit:
                break
            offset += limit
    else:
        conn = db._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT from_node_id, to_node_id FROM relationships")
        for row in cursor.fetchall():
            if row[0]: connected_ids.add(row[0])
            if row[1]: connected_ids.add(row[1])
        conn.close()

    log(f"  Found {len(connected_ids)} unique node ID(s) referenced in relationships.")

    # Page through nodes to find orphans
    orphans = []
    if db.use_supabase:
        offset = 0
        limit = 1000
        while len(orphans) < 200:  # Cap at 200 orphans to link per run
            res = db.client.table("nodes").select("id, title, node_type, embedding, tags").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            for n in res.data:
                if n["id"] not in connected_ids:
                    orphans.append(n)
            if len(res.data) < limit:
                break
            offset += limit
    else:
        conn = db._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, node_type, embedding, tags FROM nodes")
        for row in cursor.fetchall():
            nid = row[0]
            if nid not in connected_ids:
                orphans.append({
                    "id": nid,
                    "title": row[1],
                    "node_type": row[2],
                    "embedding": json.loads(row[3]) if row[3] else None,
                    "tags": json.loads(row[4]) if row[4] else []
                })
        conn.close()

    log(f"  Detected {len(orphans)} orphan node(s).")
    return orphans

# ── 3. Helper: Parse Embeddings Safely ─────────────────────────────────────
def parse_embedding(val) -> list[float] | None:
    if not val:
        return None
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return [float(x) for x in val.strip('[]{}').split(',') if x.strip()]
    return None

# ── 4. Main Healing Routines ───────────────────────────────────────────────
def heal_orphans(db) -> int:
    orphans = get_orphan_nodes(db)
    if not orphans:
        log("No orphan nodes found. Skipping orphan healing.")
        return 0

    log(f"Healing {len(orphans)} orphan node(s)...")
    links_created = 0

    for orphan in orphans:
        orphan_id = orphan["id"]
        orphan_title = orphan["title"]
        orphan_emb = parse_embedding(orphan.get("embedding"))

        if not orphan_emb:
            continue

        # Get candidates
        if db.use_supabase:
            try:
                res = db.client.rpc("match_nodes", {
                    "query_embedding": orphan_emb,
                    "match_threshold": 0.82,
                    "match_count": 4,
                    "filter_type": "all"
                }).execute()
                similar = [n for n in (res.data or []) if n["id"] != orphan_id]
            except Exception as e:
                log(f"  Error invoking match_nodes RPC: {e}")
                similar = []
        else:
            similar = find_similar_nodes_local(db, orphan_emb, exclude_id=orphan_id, match_threshold=0.82)

        for match in similar:
            match_id = match["id"]
            match_title = match["title"]
            sim_score = match.get("similarity", 0.85)

            log(f"  Linking orphan '{orphan_title}' -> '{match_title}' (similarity: {sim_score:.3f})")
            db.insert_relationship({
                "from_node_id": orphan_id,
                "to_node_id": match_id,
                "relationship": "SIMILAR_TO",
                "confidence": round(sim_score, 3),
                "evidence": "Knowledge healer auto-link via semantic similarity"
            })
            links_created += 1

    db.flush()
    log(f"Created {links_created} relationship(s) to heal orphan nodes.")
    return links_created

def heal_duplicates(db) -> int:
    log("Identifying duplicate nodes (by external_id or exact title)...")
    nodes_data = []
    
    if db.use_supabase:
        offset = 0
        limit = 1000
        while True:
            res = db.client.table("nodes") \
                .select("id, title, confidence, external_id, node_type, created_at") \
                .or_("metadata->>archived_reason.is.null,metadata->>archived_reason.neq.synthetic-mock-data-phase13-removal") \
                .range(offset, offset + limit - 1) \
                .execute()
            if not res.data:
                break
            nodes_data.extend(res.data)
            if len(res.data) < limit:
                break
            offset += limit
    else:
        conn = db._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, confidence, external_id, node_type, created_at FROM nodes")
        for row in cursor.fetchall():
            nodes_data.append({
                "id": row[0],
                "title": row[1],
                "confidence": row[2],
                "external_id": row[3],
                "node_type": row[4],
                "created_at": row[5]
            })
        conn.close()

    # Group by external_id, or by (title, node_type) if external_id is missing
    ext_groups = defaultdict(list)
    title_groups = defaultdict(list)
    
    for n in nodes_data:
        ext_id = (n.get("external_id") or "").strip()
        if ext_id:
            ext_groups[ext_id].append(n)
        else:
            title_key = (n["title"].strip().lower(), n["node_type"])
            title_groups[title_key].append(n)

    merged_count = 0
    all_groups = list(ext_groups.values()) + list(title_groups.values())

    for group in all_groups:
        if len(group) <= 1:
            continue

        # Sort: highest confidence first, then newest created_at
        group.sort(key=lambda x: (x.get("confidence") or 0.5, x.get("created_at") or ""), reverse=True)
        survivor = group[0]
        duplicates = group[1:]

        log(f"Merging duplicates: Keeping '{survivor['title']}' ({survivor['id'][:8]}…)")

        for dup in duplicates:
            dup_id = dup["id"]
            log(f"  -> Merging duplicate '{dup['title']}' ({dup_id[:8]}…)")

            # Re-route relationships pointing to the duplicate
            if db.use_supabase:
                try:
                    db.client.table("relationships").update({"from_node_id": survivor["id"]}).eq("from_node_id", dup_id).execute()
                    db.client.table("relationships").update({"to_node_id": survivor["id"]}).eq("to_node_id", dup_id).execute()
                    # Delete the duplicate node
                    db.client.table("nodes").delete().eq("id", dup_id).execute()
                    merged_count += 1
                except Exception as e:
                    log(f"    Error merging duplicate in Supabase: {e}")
            else:
                try:
                    conn = db._get_sqlite_conn()
                    cursor = conn.cursor()
                    cursor.execute("UPDATE relationships SET from_node_id = ? WHERE from_node_id = ?", (survivor["id"], dup_id))
                    cursor.execute("UPDATE relationships SET to_node_id = ? WHERE to_node_id = ?", (survivor["id"], dup_id))
                    cursor.execute("DELETE FROM nodes WHERE id = ?", (dup_id,))
                    conn.commit()
                    conn.close()
                    merged_count += 1
                except Exception as e:
                    log(f"    Error merging duplicate in SQLite: {e}")

    log(f"Deduplicated and merged {merged_count} node(s).")
    return merged_count

def clean_orphaned_relationships(db) -> int:
    log("Checking for orphaned relationships pointing to non-existent nodes...")
    
    # 1. Fetch all valid node IDs
    valid_ids = set()
    if db.use_supabase:
        offset = 0
        limit = 1000
        while True:
            res = db.client.table("nodes").select("id").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            for row in res.data:
                valid_ids.add(row["id"])
            if len(res.data) < limit:
                break
            offset += limit
    else:
        conn = db._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM nodes")
        for row in cursor.fetchall():
            valid_ids.add(row[0])
        conn.close()

    log(f"  Valid nodes in DB: {len(valid_ids)}")

    # 2. Query relationships and detect orphans
    orphaned_rel_ids = []
    if db.use_supabase:
        offset = 0
        limit = 1000
        while True:
            res = db.client.table("relationships").select("id, from_node_id, to_node_id").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            for r in res.data:
                from_id = r.get("from_node_id")
                to_id = r.get("to_node_id")
                if from_id not in valid_ids or to_id not in valid_ids:
                    orphaned_rel_ids.append(r["id"])
            if len(res.data) < limit:
                break
            offset += limit
    else:
        conn = db._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id, from_node_id, to_node_id FROM relationships")
        for row in cursor.fetchall():
            if row[1] not in valid_ids or row[2] not in valid_ids:
                orphaned_rel_ids.append(row[0])
        conn.close()

    log(f"  Detected {len(orphaned_rel_ids)} orphaned relationship(s) to remove.")

    removed_count = 0
    # Delete them
    for rid in orphaned_rel_ids:
        if db.use_supabase:
            try:
                db.client.table("relationships").delete().eq("id", rid).execute()
                removed_count += 1
            except Exception as e:
                log(f"    Error deleting relationship: {e}")
        else:
            try:
                conn = db._get_sqlite_conn()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM relationships WHERE id = ?", (rid,))
                conn.commit()
                conn.close()
                removed_count += 1
            except Exception as e:
                log(f"    Error deleting relationship: {e}")

    log(f"Successfully cleaned up {removed_count} orphaned relationship(s).")
    return removed_count

def flag_low_confidence_nodes(db) -> int:
    log("Scanning for low-confidence nodes (< 0.2) to flag for review...")
    low_nodes = []
    
    if db.use_supabase:
        offset = 0
        limit = 1000
        while True:
            res = db.client.table("nodes").select("id, title, confidence, metadata").lt("confidence", 0.2).range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            low_nodes.extend(res.data)
            if len(res.data) < limit:
                break
            offset += limit
    else:
        conn = db._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, confidence, metadata FROM nodes WHERE confidence < 0.2")
        for row in cursor.fetchall():
            low_nodes.append({
                "id": row[0],
                "title": row[1],
                "confidence": row[2],
                "metadata": json.loads(row[3] or "{}")
            })
        conn.close()

    log(f"  Found {len(low_nodes)} low-confidence node(s).")

    flagged_count = 0
    for node in low_nodes:
        nid = node["id"]
        meta = node.get("metadata") or {}
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except Exception:
                meta = {}
                
        # If already flagged, skip
        if meta.get("needs_review"):
            continue

        meta["needs_review"] = True
        log(f"  Flagging '{node['title']}' ({nid[:8]}… | confidence: {node['confidence']:.2f})")

        if db.use_supabase:
            try:
                db.client.table("nodes").update({"metadata": meta}).eq("id", nid).execute()
                flagged_count += 1
            except Exception as e:
                log(f"    Error updating node metadata: {e}")
        else:
            try:
                conn = db._get_sqlite_conn()
                cursor = conn.cursor()
                cursor.execute("UPDATE nodes SET metadata = ? WHERE id = ?", (json.dumps(meta), nid))
                conn.commit()
                conn.close()
                flagged_count += 1
            except Exception as e:
                log(f"    Error updating node metadata: {e}")

    log(f"Flagged {flagged_count} new node(s) for manual review.")
    return flagged_count

def main():
    log("=" * 60)
    log("CYBER TREE — Knowledge Graph Healer (Phase 8)")
    log("=" * 60)

    db = DBClient()
    job_id = db.log_job("knowledge_healer", datetime.utcnow(), status="running")

    try:
        orphans_linked = heal_orphans(db)
        duplicates_merged = heal_duplicates(db)
        relationships_cleaned = clean_orphaned_relationships(db)
        low_confidence_flagged = flag_low_confidence_nodes(db)

        summary = (
            f"Healed graph. Orphans linked: {orphans_linked}. "
            f"Duplicates merged: {duplicates_merged}. "
            f"Relationships cleaned: {relationships_cleaned}. "
            f"Low confidence flagged: {low_confidence_flagged}."
        )
        log(f"Summary: {summary}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            notes=summary
        )

    except Exception as e:
        log(f"FATAL error in knowledge healer: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        sys.exit(1)

    log("=" * 60)
    log("Knowledge Graph Healer complete.")
    log("=" * 60)

if __name__ == "__main__":
    main()
