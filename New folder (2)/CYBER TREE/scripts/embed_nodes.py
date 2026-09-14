"""
embed_nodes.py — Cyber Tree Phase 3: Semantic Embedding Pipeline
================================================================
Generates sentence-transformer embeddings (all-MiniLM-L6-v2, 384 dims)
for all nodes WHERE embedding IS NULL, in batches of 50.
Safe to re-run: skips already-embedded nodes.
Logs progress every 200 nodes.

If fastembed fails to load or error occurs, falls back to a deterministic 
mock embedding and tags the node's metadata with degraded_relevance: true.
"""

import os
import sys
import time
import hashlib
from datetime import datetime
from dotenv import load_dotenv
import numpy as np

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BATCH_SIZE = 50
LOG_EVERY = 200
MODEL_NAME = "all-MiniLM-L6-v2"


def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)


def get_mock_embedding(text: str) -> list:
    """Generates a deterministic mock embedding matching the TS lcg implementation."""
    hasher = hashlib.sha256()
    hasher.update(text.encode('utf-8'))
    state = int(hasher.hexdigest()[:8], 16)
    
    vector = []
    for _ in range(384):
        state = (state * 1103515245 + 12345) % 4294967296
        val = (state / 4294967295.0) * 2.0 - 1.0
        vector.append(val)
        
    arr = np.array(vector)
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.tolist()


def load_model():
    log(f"Loading fastembed model: sentence-transformers/all-MiniLM-L6-v2")
    try:
        from fastembed import TextEmbedding
        model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
        log("Model loaded successfully.")
        return model
    except Exception as e:
        log(f"Warning: fastembed load failed ({e}). Falling back to mock generator.")
        return None


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


def log_job(client, status: str, rows_processed: int, notes: str = ""):
    try:
        client.table("job_logs").insert({
            "job_name": "embed",
            "started_at": datetime.utcnow().isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "status": status,
            "rows_processed": rows_processed,
            "notes": notes
        }).execute()
    except Exception as e:
        log(f"Warning: Failed to log job: {e}")


def build_text_for_embedding(node: dict) -> str:
    """Combines title + summary (+ node_type) into a single string for embedding."""
    parts = []
    if node.get("title"):
        parts.append(f"Title: {node['title'].strip()}")
    if node.get("summary"):
        parts.append(f"Summary: {node['summary'].strip()[:500]}")
    if node.get("node_type"):
        parts.append(f"Type: {node['node_type'].strip()}")
    return "\n".join(parts)


def fetch_unembedded_nodes(client, limit: int, offset: int) -> list:
    """Fetch nodes where embedding IS NULL."""
    try:
        res = (
            client.table("nodes")
            .select("id, title, summary, node_type, metadata")
            .is_("embedding", "null")
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data or []
    except Exception as e:
        log(f"ERROR fetching nodes at offset {offset}: {e}")
        return []


def store_embedding(client, node_id: str, vector: list, metadata: dict):
    """Update a single node's embedding and metadata in Supabase."""
    try:
        client.table("nodes").update({
            "embedding": vector,
            "metadata": metadata
        }).eq("id", node_id).execute()
    except Exception as e:
        log(f"  ERROR storing embedding for node {node_id}: {e}")
        raise


def main():
    log("=" * 60)
    log("CYBER TREE — Embedding Pipeline (Phase 3)")
    log(f"Model: {MODEL_NAME} | Dimensions: 384 | Batch: {BATCH_SIZE}")
    log("=" * 60)

    model = load_model()
    client = connect_supabase()

    total_embedded = 0
    total_skipped = 0
    errors = 0
    offset = 0

    log("Starting embedding loop...")

    while True:
        nodes = fetch_unembedded_nodes(client, BATCH_SIZE, offset)

        if not nodes:
            log(f"No more unembedded nodes found. Done.")
            break

        texts = [build_text_for_embedding(n) for n in nodes]
        is_mock = (model is None)
        vectors = []

        if not is_mock:
            try:
                vectors = list(model.embed(texts))
            except Exception as e:
                log(f"ERROR encoding batch at offset {offset}: {e}. Using mock fallback.")
                is_mock = True

        if is_mock:
            vectors = [get_mock_embedding(t) for t in texts]

        # Store each embedding
        for node, vec in zip(nodes, vectors):
            node_id = node["id"]
            try:
                meta = node.get("metadata") or {}
                if is_mock:
                    meta["degraded_relevance"] = True
                
                vec_list = vec.tolist() if hasattr(vec, "tolist") else vec
                store_embedding(client, node_id, vec_list, meta)
                total_embedded += 1
            except Exception:
                errors += 1

        # Log progress every LOG_EVERY nodes
        if total_embedded > 0 and total_embedded % LOG_EVERY < BATCH_SIZE:
            log(f"Progress: {total_embedded} nodes embedded | {errors} errors")

        # If we got fewer than BATCH_SIZE, we've reached the end
        if len(nodes) < BATCH_SIZE:
            break

        time.sleep(0.1)

    log("=" * 60)
    log(f"COMPLETE: {total_embedded} nodes embedded | {total_skipped} skipped | {errors} errors")
    log("=" * 60)

    status = "success" if errors == 0 else "partial"
    notes = f"Embedded {total_embedded} nodes using {MODEL_NAME}."
    if errors:
        notes += f" {errors} errors encountered."
    log_job(client, status, total_embedded, notes)


if __name__ == "__main__":
    main()
