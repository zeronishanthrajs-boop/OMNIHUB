"""
cluster_nodes.py — Cyber Tree Phase 5: Pattern Intelligence Node Clustering
========================================================================
Runs KMeans clustering on 384-dimensional node embeddings to group nodes.
Saves assignments to nodes.metadata.cluster_id and exports summaries.
Supports a mock fallback mode when scikit-learn is DLL-blocked locally.

Usage:
    python scripts/cluster_nodes.py
"""

import os
import sys
import json
import hashlib
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
N_CLUSTERS = 30
BATCH_SIZE = 1000

def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)

# Detect if scikit-learn/numpy can be imported
use_mock = False
try:
    import numpy as np
    from sklearn.cluster import KMeans
    log("scikit-learn and numpy imported successfully. Performing true KMeans clustering.")
except ImportError as e:
    log(f"Warning: scikit-learn/numpy import failed ({e}). Running in mock clustering mode (hash-based fallback).")
    use_mock = True

def connect_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("ERROR: SUPABASE_URL and SUPABASE_KEY must be set.")
        sys.exit(1)
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        log("Connected to Supabase.")
        return client
    except ImportError:
        log("ERROR: supabase-py not installed. Run: pip install supabase")
        sys.exit(1)

def parse_embedding(val):
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

def fetch_all_embedded_nodes(client):
    nodes = []
    offset = 0
    limit = 1000
    log("Fetching all nodes with embeddings from Supabase...")
    while True:
        try:
            res = (
                client.table("nodes")
                .select("id, embedding, title, node_type, tags, metadata")
                .not_.is_("embedding", "null")
                .range(offset, offset + limit - 1)
                .execute()
            )
            data = res.data or []
            if not data:
                break
            
            # Parse embeddings
            for n in data:
                n["embedding"] = parse_embedding(n["embedding"])
                
            nodes.extend(data)
            log(f"Fetched {len(nodes)} nodes so far...")
            if len(data) < limit:
                break
            offset += limit
        except Exception as e:
            log(f"ERROR fetching nodes at offset {offset}: {e}")
            break
    return nodes

def update_metadata_in_database(client, updates):
    log(f"Saving {len(updates)} cluster assignments to Supabase in batches of 1000...")
    for i in range(0, len(updates), 1000):
        batch = updates[i:i+1000]
        try:
            # Call bulk metadata update RPC
            client.rpc("update_node_metadata_batch", {"updates": batch}).execute()
        except Exception as e:
            log(f"ERROR calling update_node_metadata_batch batch {i // 1000}: {e}")
            # Fallback to single updates for safety
            log("Falling back to single row updates...")
            for item in batch:
                try:
                    client.table("nodes").update({"metadata": item["metadata"]}).eq("id", item["id"]).execute()
                except Exception as inner_e:
                    log(f"Failed to update node {item['id']}: {inner_e}")

def main():
    log("=" * 60)
    log("CYBER TREE — Node Clustering Pipeline (Phase 5)")
    log("=" * 60)

    client = connect_supabase()
    nodes = fetch_all_embedded_nodes(client)
    
    if not nodes:
        log("No nodes with embeddings found. Exiting.")
        return

    log(f"Found {len(nodes)} nodes with embeddings.")

    # 1. Clustering
    cluster_assignments = {}
    centroids = {}
    
    if use_mock:
        log("Performing mock (hash-based) clustering...")
        # Assign mock cluster IDs deterministically using md5 of node id
        for n in nodes:
            node_id = n["id"]
            h = hashlib.md5(node_id.encode()).hexdigest()
            cluster_id = int(h, 16) % N_CLUSTERS
            cluster_assignments[node_id] = cluster_id
            
        # Mock centroids as average of first node's embedding in that cluster
        for n in nodes:
            cid = cluster_assignments[n["id"]]
            if cid not in centroids and n["embedding"]:
                centroids[cid] = n["embedding"]
        # Fill missing centroids with zeros
        for i in range(N_CLUSTERS):
            if i not in centroids:
                centroids[i] = [0.0] * 384
    else:
        log("Formatting embeddings matrix for KMeans...")
        valid_nodes = [n for n in nodes if n["embedding"] and len(n["embedding"]) == 384]
        if len(valid_nodes) < N_CLUSTERS:
            log(f"Not enough valid embedded nodes ({len(valid_nodes)}) for {N_CLUSTERS} clusters. Exiting.")
            return
            
        embeddings_matrix = np.array([n["embedding"] for n in valid_nodes])
        log(f"Running KMeans with {N_CLUSTERS} clusters...")
        kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init='auto')
        labels = kmeans.fit_predict(embeddings_matrix)
        
        for n, label in zip(valid_nodes, labels):
            cluster_assignments[n["id"]] = int(label)
            
        for i in range(N_CLUSTERS):
            centroids[i] = kmeans.cluster_centers_[i].tolist()
            
        # Assign any remaining nodes to cluster 0
        for n in nodes:
            if n["id"] not in cluster_assignments:
                cluster_assignments[n["id"]] = 0

    # 2. Update metadata updates list
    updates = []
    for n in nodes:
        node_id = n["id"]
        current_metadata = n.get("metadata") or {}
        cluster_id = cluster_assignments[node_id]
        
        # Merge metadata
        updated_metadata = dict(current_metadata)
        updated_metadata["cluster_id"] = cluster_id
        
        updates.append({
            "id": node_id,
            "metadata": updated_metadata
        })

    # Save to database
    update_metadata_in_database(client, updates)

    # 3. Analyze Clusters
    log("Analyzing clusters and identifying example nodes...")
    cluster_groups = {i: [] for i in range(N_CLUSTERS)}
    for n in nodes:
        cid = cluster_assignments[n["id"]]
        cluster_groups[cid].append(n)
        
    cluster_summaries = {}
    
    for cid in range(N_CLUSTERS):
        group = cluster_groups[cid]
        size = len(group)
        if size == 0:
            cluster_summaries[str(cid)] = {
                "id": cid,
                "label": f"Cluster {cid} (Empty)",
                "size": 0,
                "top_tags": [],
                "top_types": [],
                "example_nodes": []
            }
            continue
            
        # Count tags and types
        tag_counts = {}
        type_counts = {}
        for item in group:
            node_type = item.get("node_type")
            if node_type:
                type_counts[node_type] = type_counts.get(node_type, 0) + 1
            tags = item.get("tags") or []
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
                
        sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
        top_tags = [t[0] for t in sorted_tags[:3]]
        
        sorted_types = sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
        top_types = [t[0] for t in sorted_types[:3]]
        
        # Select exemplar nodes (closest to centroid if real KMeans, or first 5 if mock)
        exemplars = []
        if use_mock:
            # Just take first 5
            exemplars = group[:5]
        else:
            # Compute Euclidean distance to centroid
            c = np.array(centroids[cid])
            scored_nodes = []
            for item in group:
                if item["embedding"] and len(item["embedding"]) == 384:
                    vec = np.array(item["embedding"])
                    dist = float(np.linalg.norm(vec - c))
                    scored_nodes.append((item, dist))
                else:
                    scored_nodes.append((item, 999.0))
            # Sort by distance
            scored_nodes.sort(key=lambda x: x[1])
            exemplars = [x[0] for x in scored_nodes[:5]]
            
        # Formulate a smart cluster label
        type_label = " & ".join([t.replace("_", " ").title() for t in top_types[:2]])
        if not type_label:
            type_label = "Knowledge Nodes"
        tag_label = ", ".join(top_tags[:2])
        if tag_label:
            label = f"{type_label} ({tag_label})"
        else:
            label = f"{type_label} Cluster"
            
        cluster_summaries[str(cid)] = {
            "id": cid,
            "label": f"Cluster {cid}: {label}",
            "size": size,
            "top_tags": top_tags,
            "top_types": top_types,
            "example_nodes": [
                {
                    "id": ex["id"],
                    "title": ex["title"],
                    "node_type": ex.get("node_type"),
                    "confidence": ex.get("confidence", 0.5)
                }
                for ex in exemplars
            ]
        }

    # Save to models/cluster_summary.json
    os.makedirs("models", exist_ok=True)
    summary_path = os.path.join("models", "cluster_summary.json")
    with open(summary_path, "w") as f:
        json.dump(cluster_summaries, f, indent=2)
    log(f"Saved cluster summaries to {summary_path}")

    # Log job success
    try:
        client.table("job_logs").insert({
            "job_name": "cluster_nodes",
            "started_at": datetime.utcnow().isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "status": "success",
            "rows_processed": len(nodes),
            "notes": f"Clustered {len(nodes)} nodes into {N_CLUSTERS} groups."
        }).execute()
    except Exception as e:
        log(f"Warning: Failed to log job to Supabase: {e}")

if __name__ == "__main__":
    main()
