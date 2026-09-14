import os
import sys
import random
import httpx
import sqlite3
from datetime import datetime
from db_client import DBClient

# Add current directory to path to load sub-scripts on Windows/GHA
sys.path.append(os.path.dirname(__file__))
import source_discoverer
import dead_source_detector
import knowledge_healer

def run():
    db = DBClient()
    job_id = db.log_job("maintain", datetime.utcnow(), status="running")
    
    deleted_nodes = 0
    checked_urls = 0
    dead_urls = 0
    
    try:
        if db.use_supabase:
            # Supabase maintenance logic
            print("Running maintenance on Supabase database...")
            
            # Clean up relationships pointing to archived nodes
            print("Cleaning up relationships pointing to archived nodes...")
            archived_ids = []
            limit = 1000
            offset = 0
            while True:
                res = db.client.table("nodes").select("id").eq("metadata->>archived_reason", "synthetic-mock-data-phase13-removal").range(offset, offset + limit - 1).execute()
                if not res.data:
                    break
                archived_ids.extend([n["id"] for n in res.data])
                if len(res.data) < limit:
                    break
                offset += limit
            
            if archived_ids:
                relationships_to_delete = []
                for i in range(0, len(archived_ids), 500):
                    batch = archived_ids[i:i+500]
                    res_from = db.client.table("relationships").select("id").in_("from_node_id", batch).execute()
                    if res_from.data:
                        relationships_to_delete.extend([r["id"] for r in res_from.data])
                    res_to = db.client.table("relationships").select("id").in_("to_node_id", batch).execute()
                    if res_to.data:
                        relationships_to_delete.extend([r["id"] for r in res_to.data])
                
                relationships_to_delete = list(set(relationships_to_delete))
                if relationships_to_delete:
                    deleted_count = 0
                    for i in range(0, len(relationships_to_delete), 500):
                        batch_del = relationships_to_delete[i:i+500]
                        db.client.table("relationships").delete().in_("id", batch_del).execute()
                        deleted_count += len(batch_del)
                    print(f"Deleted {deleted_count} orphaned relationships pointing to archived nodes.")
            
            # Deduplication
            # 1. Find nodes with identical titles and source_url
            # Since doing complex window queries on Supabase client directly is difficult,
            # we fetch nodes and do it in memory, or run an RPC.
            # For simplicity and robust operation across both, we fetch duplicate pairs.
            # Let's fetch nodes that might be duplicate
            res = db.client.table("nodes").select("id, title, source_url, created_at").execute()
            all_nodes = res.data
            
            # Group by (title, source_url)
            seen = {}
            for n in all_nodes:
                key = (n["title"], n["source_url"])
                if key[1] is None: # Skip null source urls
                    continue
                if key not in seen:
                    seen[key] = []
                seen[key].append(n)
                
            for key, dup_list in seen.items():
                if len(dup_list) > 1:
                    # Keep newest, delete others
                    dup_list.sort(key=lambda x: x["created_at"], reverse=True)
                    newest = dup_list[0]
                    for old in dup_list[1:]:
                        db.client.table("nodes").delete().eq("id", old["id"]).execute()
                        deleted_nodes += 1
                        print(f"Deduplicated and deleted node: {old['title']}")
                        
            # Dead link detection (50 random nodes with source_url)
            res = db.client.table("nodes").select("id, source_url, metadata").not_.is_("source_url", "null").execute()
            nodes_with_url = res.data
            if nodes_with_url:
                sample = random.sample(nodes_with_url, min(50, len(nodes_with_url)))
                for n in sample:
                    url = n["source_url"]
                    checked_urls += 1
                    try:
                        print(f"Checking URL: {url}")
                        r = httpx.head(url, timeout=5.0, follow_redirects=True)
                        if r.status_code == 404 or r.status_code >= 500:
                            raise Exception(f"HTTP Status {r.status_code}")
                    except Exception as e:
                        print(f"Dead URL detected: {url} - Error: {e}")
                        dead_urls += 1
                        meta = n.get("metadata") or {}
                        meta["source_dead"] = True
                        db.client.table("nodes").update({"metadata": meta}).eq("id", n["id"]).execute()

        else:
            # SQLite maintenance logic
            print("Running maintenance on local SQLite database...")
            conn = sqlite3.connect(db.db_path)
            cursor = conn.cursor()
            
            # Find duplicate nodes by title and source_url
            cursor.execute("""
                SELECT id, title, source_url, created_at 
                FROM nodes 
                WHERE source_url IS NOT NULL AND source_url != ''
            """)
            rows = cursor.fetchall()
            
            seen = {}
            for row in rows:
                nid, title, url, created_at = row
                key = (title, url)
                if key not in seen:
                    seen[key] = []
                seen[key].append((nid, created_at))
                
            for key, dup_list in seen.items():
                if len(dup_list) > 1:
                    # Sort by created_at desc
                    dup_list.sort(key=lambda x: x[1], reverse=True)
                    newest_id = dup_list[0][0]
                    for old_id, _ in dup_list[1:]:
                        # Delete node
                        cursor.execute("DELETE FROM nodes WHERE id = ?", (old_id,))
                        # Delete orphaned relationships
                        cursor.execute("DELETE FROM relationships WHERE from_node_id = ? OR to_node_id = ?", (old_id, old_id))
                        deleted_nodes += 1
            
            # Dead link detection
            cursor.execute("SELECT id, source_url, metadata FROM nodes WHERE source_url IS NOT NULL AND source_url != ''")
            nodes_with_url = cursor.fetchall()
            if nodes_with_url:
                sample = random.sample(nodes_with_url, min(50, len(nodes_with_url)))
                for row in sample:
                    nid, url, meta_str = row
                    checked_urls += 1
                    try:
                        print(f"Checking URL: {url}")
                        r = httpx.head(url, timeout=5.0, follow_redirects=True)
                        if r.status_code == 404 or r.status_code >= 500:
                            raise Exception(f"HTTP Status {r.status_code}")
                    except Exception as e:
                        print(f"Dead URL detected: {url} - Error: {e}")
                        dead_urls += 1
                        import json
                        meta = json.loads(meta_str or "{}")
                        meta["source_dead"] = True
                        cursor.execute("UPDATE nodes SET metadata = ? WHERE id = ?", (json.dumps(meta), nid))
            # Delete orphaned relationships in SQLite
            cursor.execute("""
                DELETE FROM relationships 
                WHERE from_node_id IN (
                    SELECT id FROM nodes 
                    WHERE JSON_EXTRACT(metadata, '$.archived_reason') = 'synthetic-mock-data-phase13-removal'
                ) OR to_node_id IN (
                    SELECT id FROM nodes 
                    WHERE JSON_EXTRACT(metadata, '$.archived_reason') = 'synthetic-mock-data-phase13-removal'
                )
            """)
            deleted_rels_sqlite = cursor.rowcount
            if deleted_rels_sqlite > 0:
                print(f"Deleted {deleted_rels_sqlite} orphaned relationships from SQLite.")
            
            conn.commit()
            conn.close()
            
        # Run the new autonomous maintenance sub-scripts
        print("Running autonomous maintenance sub-scripts...")
        sub_errors = []

        # 1. Source Auto-Discovery
        try:
            print("Starting source auto-discovery...")
            source_discoverer.main()
        except Exception as e:
            print(f"Error during source auto-discovery: {e}")
            sub_errors.append(f"source_discoverer: {e}")

        # 2. Dead Source Detector
        try:
            print("Starting dead source detection...")
            dead_source_detector.main()
        except Exception as e:
            print(f"Error during dead source detection: {e}")
            sub_errors.append(f"dead_source_detector: {e}")

        # 3. Knowledge Graph Healer
        try:
            print("Starting knowledge graph healing...")
            knowledge_healer.main()
        except Exception as e:
            print(f"Error during knowledge graph healing: {e}")
            sub_errors.append(f"knowledge_healer: {e}")
            
        notes = f"Deduplicated: {deleted_nodes}. Checked URLs: {checked_urls}. Dead: {dead_urls}."
        if sub_errors:
            notes += " Warnings: " + "; ".join(sub_errors)

        print(f"Maintenance completed. {notes}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            notes=notes
        )
    except Exception as e:
        print(f"Error during maintenance job: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
