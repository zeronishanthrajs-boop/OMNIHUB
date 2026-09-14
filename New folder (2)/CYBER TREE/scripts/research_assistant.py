"""
research_assistant.py — Cyber Tree Phase 9: AI Research Assistant
================================================================
Accepts a natural language question, retrieves context nodes via hybrid
(vector + FTS) search, ranks/deduplicates them, and generates a sourced
answer using the Gemini 2.5 Flash API.

Usage:
    python scripts/research_assistant.py "What techniques does Lazarus Group use?"
"""

import os
import sys
import json
import math
import hashlib
import time
from datetime import datetime
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
from dotenv import load_dotenv
import numpy as np


# Load local environment variables
load_dotenv()

# We import DBClient from db_client
from db_client import DBClient

def log_stderr(msg: str):
    """Logs ascii-only message to stderr so stdout remains clean for JSON output."""
    # Use ASCII arrows only ->
    sys.stderr.write(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}\n")
    sys.stderr.flush()

def get_huggingface_embedding(text: str) -> list[float]:
    import httpx
    api_key = os.getenv("HUGGINGFACE_API_KEY", "")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    
    log_stderr("Requesting query embedding from HuggingFace API...")
    res = httpx.post(url, headers=headers, json={"inputs": text, "options": {"wait_for_model": True}}, timeout=10.0)
    res.raise_for_status()
    result = res.json()
    if isinstance(result, list):
        if len(result) > 0 and isinstance(result[0], list):
            return result[0]
        return result
    raise ValueError("Unexpected HuggingFace response format")

def get_local_embedding(text: str) -> list[float]:
    log_stderr("Attempting local sentence-transformers embedding...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    return model.encode(text, normalize_embeddings=True).tolist()

def get_mock_embedding(text: str) -> list[float]:
    log_stderr("Using 384-dim deterministic mock embedding fallback...")
    hash_hex = hashlib.sha256(text.encode("utf-8")).hexdigest()
    state = int(hash_hex[:8], 16)
    dimensions = 384
    vector = []
    for _ in range(dimensions):
        state = (state * 1103515245 + 12345) % 4294967296
        val = (state / 4294967295.0) * 2.0 - 1.0
        vector.append(val)
    sum_sq = sum(v * v for v in vector)
    norm = math.sqrt(sum_sq)
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector

def get_embedding(text: str) -> list[float]:
    try:
        return get_huggingface_embedding(text)
    except Exception as hf_err:
        log_stderr(f"HuggingFace embedding failed: {hf_err}")
        try:
            return get_local_embedding(text)
        except Exception as local_err:
            log_stderr(f"Local sentence-transformers embedding failed: {local_err}")
            return get_mock_embedding(text)

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

def main():
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        log_stderr("ERROR: Question argument is required.")
        print(json.dumps({"error": "Question argument is required."}))
        sys.exit(1)

    question = sys.argv[1].strip()
    log_stderr(f"Starting research assistant for question: '{question}'")
    
    start_time = time.time()
    
    # Initialize DBClient
    db = DBClient()
    
    started_at = datetime.utcnow()
    log_id = db.log_job("research", started_at, "running", notes=f"Q: {question[:100]}")
    
    # Step 1: Embed question
    try:
        emb = get_embedding(question)
    except Exception as e:
        err_msg = f"Failed to generate embedding: {e}"
        log_stderr(err_msg)
        db.update_job_log(log_id, datetime.utcnow(), "failed", error_message=err_msg)
        print(json.dumps({"error": err_msg}))
        sys.exit(1)

    # Step 2: Vector retrieval (Top 15 semantic matches)
    vector_results = []
    if db.use_supabase:
        try:
            log_stderr("Running match_nodes RPC on Supabase...")
            res = db.client.rpc("match_nodes", {
                "query_embedding": emb,
                "match_threshold": 0.0,
                "match_count": 15,
                "filter_type": "all"
            }).execute()
            vector_results = res.data or []
        except Exception as e:
            log_stderr(f"Supabase RPC match_nodes failed: {e}. Falling back to SQLite retrieval...")
    
    # SQLite / Fallback vector retrieval
    if not db.use_supabase or not vector_results:
        log_stderr("Retrieving embeddings for SQLite local cosine similarity...")
        try:
            conn = db._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, summary, node_type, confidence, source_url, source_name, embedding, tags FROM nodes WHERE embedding IS NOT NULL")
            rows = cursor.fetchall()
            conn.close()
            
            q_arr = np.array(emb)
            q_norm = np.linalg.norm(q_arr)
            local_matches = []
            if q_norm > 0:
                for row in rows:
                    nid, title, summary, ntype, conf, src_url, src_name, emb_str, tags_str = row
                    node_emb = parse_embedding(emb_str)
                    if not node_emb:
                        continue
                    arr = np.array(node_emb)
                    norm = np.linalg.norm(arr)
                    if norm == 0:
                        continue
                    sim = float(np.dot(q_arr, arr) / (q_norm * norm))
                    local_matches.append({
                        "id": nid,
                        "title": title,
                        "summary": summary,
                        "node_type": ntype,
                        "confidence": conf or 0.5,
                        "source_url": src_url,
                        "source_name": src_name,
                        "similarity": sim,
                        "tags": json.loads(tags_str or "[]")
                    })
                local_matches.sort(key=lambda x: x["similarity"], reverse=True)
                vector_results = local_matches[:15]
        except Exception as e:
            log_stderr(f"SQLite vector search fallback failed: {e}")

    # Step 3: Full-text search retrieval (Top 10 keyword matches)
    fts_results = []
    if db.use_supabase:
        try:
            log_stderr("Running text_search on Supabase...")
            # range is 0 to 9 for top 10
            res = db.client.table("nodes").select("id, title, summary, node_type, confidence, source_url, source_name, tags").range(0, 9).text_search("title_summary_fts", question).execute()
            fts_results = res.data or []
        except Exception as e:
            log_stderr(f"Supabase text_search failed: {e}. Falling back to SQLite LIKE search...")

    if not db.use_supabase or not fts_results:
        log_stderr("Running LIKE keyword search on SQLite...")
        try:
            conn = db._get_sqlite_conn()
            cursor = conn.cursor()
            # FTS LIKE matching on title/summary/content
            cursor.execute(
                "SELECT id, title, summary, node_type, confidence, source_url, source_name, tags FROM nodes WHERE (title LIKE ? OR summary LIKE ? OR content LIKE ?) LIMIT 10",
                (f"%{question}%", f"%{question}%", f"%{question}%")
            )
            rows = cursor.fetchall()
            conn.close()
            for row in rows:
                nid, title, summary, ntype, conf, src_url, src_name, tags_str = row
                fts_results.append({
                    "id": nid,
                    "title": title,
                    "summary": summary,
                    "node_type": ntype,
                    "confidence": conf or 0.5,
                    "source_url": src_url,
                    "source_name": src_name,
                    "tags": json.loads(tags_str or "[]")
                })
        except Exception as e:
            log_stderr(f"SQLite LIKE search failed: {e}")

    # Step 4: Merge and deduplicate results
    merged = {}
    # Process vector results
    for node in vector_results:
        nid = node["id"]
        # Supabase returns score as similarity
        score = node.get("similarity", 0.0)
        node_copy = dict(node)
        node_copy["score"] = score
        node_copy["sources_found"] = ["semantic"]
        merged[nid] = node_copy

    # Process FTS results
    for node in fts_results:
        nid = node["id"]
        if nid in merged:
            merged[nid]["score"] += 0.2  # Bonus for matching both
            merged[nid]["sources_found"].append("fts")
        else:
            node_copy = dict(node)
            node_copy["score"] = 0.7  # Default FTS-only score
            node_copy["sources_found"] = ["fts"]
            merged[nid] = node_copy

    # Sort by score descending and take top 10
    ranked_nodes = list(merged.values())
    ranked_nodes.sort(key=lambda x: x["score"], reverse=True)
    top_nodes = ranked_nodes[:10]
    
    log_stderr(f"Merged search returned {len(top_nodes)} relevant context nodes.")

    # Step 5: Build structured context string
    context_parts = []
    for idx, node in enumerate(top_nodes, 1):
        summary = node.get("summary", "") or ""
        summary_truncated = summary.strip()[:300]
        context_parts.append(
            f"[{idx}] (ID: {node['id']})\n"
            f"Title: {node['title']}\n"
            f"Type: {node['node_type']} | Confidence: {node.get('confidence', 0.5):.2f} | Relevance: {node['score']:.2f}\n"
            f"Summary: {summary_truncated}\n"
        )
    context_string = "\n---\n".join(context_parts)

    # Step 6: Call NVIDIA NIM API (REST)
    nvidia_key = os.getenv("NVIDIA_API_KEY")
    answer = ""
    error_msg = None
    
    if not nvidia_key:
        error_msg = "NVIDIA_API_KEY is not set in environment or .env file."
        log_stderr(f"WARNING: {error_msg}")
    else:
        log_stderr("Calling NVIDIA NIM API to synthesize answer...")
        import httpx
        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        
        system_instruction = (
            "You are the CYBER TREE Research Assistant, an expert AI security analyst.\n"
            "Your goal is to answer the user's natural language question based strictly on the provided context nodes.\n"
            "Follow these rules:\n"
            "1. Rely ONLY on the information present in the context. Do not invent facts.\n"
            "2. Cite every claim you make using the reference number, like [1], [2], corresponding to the context nodes.\n"
            "3. If the context does not contain enough information to answer the question, clearly state that you don't have sufficient context, but synthesize whatever relevant information IS available.\n"
            "4. Format your answer in clean Markdown."
        )

        prompt = (
            f"Here is the retrieved context from the CYBER TREE knowledge base:\n\n"
            f"{context_string}\n\n"
            f"User Question: {question}\n\n"
            f"Please generate a detailed, sourced answer below."
        )

        payload = {
            "model": "meta/llama-3.1-70b-instruct",
            "messages": [
                {
                    "role": "system",
                    "content": system_instruction
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.2,
            "max_tokens": 2048,
            "top_p": 0.7
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {nvidia_key}"
        }

        try:
            res = httpx.post(url, json=payload, headers=headers, timeout=30.0)
            res.raise_for_status()
            resp_data = res.json()
            answer = resp_data["choices"][0]["message"]["content"]
            log_stderr("NVIDIA Q&A answer generated successfully.")
        except Exception as ex:
            error_msg = f"NVIDIA API call failed: {ex}"
            log_stderr(f"ERROR: {error_msg}")

    # Prepare citations sources payload
    sources_output = []
    for node in top_nodes:
        sources_output.append({
            "id": node["id"],
            "title": node["title"],
            "node_type": node["node_type"],
            "confidence": float(node.get("confidence", 0.5)),
            "score": float(node["score"])
        })

    query_time_ms = int((time.time() - start_time) * 1000)

    # Final Output Structure
    output = {
        "sources": sources_output,
        "query_time_ms": query_time_ms
    }
    if answer:
        output["answer"] = answer
    if error_msg:
        output["error"] = error_msg

    # Write job logs
    status = "success" if not error_msg else "partial"
    notes = f"Processed question: {question[:100]}. Found {len(top_nodes)} sources. Time: {query_time_ms}ms."
    if error_msg:
        notes += f" Error: {error_msg[:100]}"
    db.update_job_log(log_id, datetime.utcnow(), status, notes=notes)

    # Output JSON on stdout
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
