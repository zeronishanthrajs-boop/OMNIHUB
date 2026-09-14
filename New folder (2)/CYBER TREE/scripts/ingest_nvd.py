import os
import time
import httpx
import hashlib
import numpy as np
from datetime import datetime
from db_client import DBClient

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

_model = None
_model_failed = False

def get_embedding(node: dict) -> list:
    global _model, _model_failed
    parts = []
    if node.get("title"):
        parts.append(f"Title: {node['title'].strip()}")
    if node.get("summary"):
        parts.append(f"Summary: {node['summary'].strip()[:500]}")
    if node.get("node_type"):
        parts.append(f"Type: {node['node_type'].strip()}")
    text = "\n".join(parts)

    if not _model_failed:
        try:
            if _model is None:
                print("Loading SentenceTransformer model 'all-MiniLM-L6-v2' for inline NVD embedding...", flush=True)
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer("all-MiniLM-L6-v2")
            vector = _model.encode(text, normalize_embeddings=True)
            return vector.tolist()
        except Exception as e:
            print(f"Warning: sentence-transformers model load/inference failed: {e}. Falling back to deterministic mock embedding.", flush=True)
            _model_failed = True
            
    # Deterministic mock embedding generator of 384 dimensions
    dimensions = 384
    vector = []
    seed_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    state = int(seed_hash[:8], 16)
    
    for _ in range(dimensions):
        state = (state * 1103515245 + 12345) & 0xffffffff
        val = (state / 4294967295.0) * 2.0 - 1.0
        vector.append(val)
        
    arr = np.array(vector)
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.tolist()

def get_cve_nodes_from_api(limit=2000, start_index=0, api_key=None):
    params = {
        "resultsPerPage": limit,
        "startIndex": start_index
    }
    headers = {}
    if api_key:
        headers["apiKey"] = api_key
    
    print(f"Fetching CVEs from NVD (startIndex: {start_index}, limit: {limit})...")
    resp = httpx.get(NVD_API_URL, params=params, headers=headers, timeout=30.0)
    resp.raise_for_status()
    data = resp.json()
    
    vulnerabilities = data.get("vulnerabilities", [])
    nodes = []
    
    for item in vulnerabilities:
        cve = item.get("cve", {})
        cve_id = cve.get("id")
        
        # Get english description
        desc_text = ""
        for desc in cve.get("descriptions", []):
            if desc.get("lang") == "en":
                desc_text = desc.get("value")
                break
        
        # Extract CVSS
        cvss_score = 0.5
        metrics = cve.get("metrics", {})
        # Try CVSS v3.1, then v3.0, then v2
        cvss_data = None
        if "cvssMetricV31" in metrics:
            cvss_data = metrics["cvssMetricV31"][0].get("cvssData")
        elif "cvssMetricV30" in metrics:
            cvss_data = metrics["cvssMetricV30"][0].get("cvssData")
        elif "cvssMetricV2" in metrics:
            cvss_data = metrics["cvssMetricV2"][0].get("cvssData")
        
        if cvss_data:
            cvss_score = float(cvss_data.get("baseScore", 5.0)) / 10.0 # scale to 0.0 - 1.0
        
        # Extract CWEs
        cwes = []
        for weakness in cve.get("weaknesses", []):
            for desc in weakness.get("description", []):
                if desc.get("lang") == "en" and desc.get("value").startswith("CWE-"):
                    cwes.append(desc.get("value"))
        
        tags = ["vulnerability"] + cwes
        
        metadata = {
            "cvss_metrics": cvss_data,
            "references": [ref.get("url") for ref in cve.get("references", [])]
        }
        
        nodes.append({
            "node_type": "vulnerability",
            "title": f"{cve_id}: {desc_text[:60]}...",
            "summary": desc_text[:200] if len(desc_text) > 200 else desc_text,
            "content": desc_text,
            "tags": tags,
            "confidence": 1.0,
            "source_url": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            "source_name": "NVD",
            "external_id": cve_id,
            "embedding": get_embedding({
                "title": f"{cve_id}: {desc_text[:60]}...",
                "summary": desc_text[:200] if len(desc_text) > 200 else desc_text,
                "node_type": "vulnerability"
            }),
            "metadata": metadata
        })
        
    return nodes, data.get("totalResults", len(nodes))

def run():
    import time
    db = DBClient()
    job_id = db.log_job("ingest_nvd", datetime.utcnow(), status="running")
    
    api_key = os.getenv("NVD_API_KEY")
    if not api_key:
        print("Warning: NVD_API_KEY not set. API calls will be heavily rate-limited.")
        
    try:
        total_ingested = 0
        target_ingest = 8000
        start_index = 0
        limit = 500  # 500 is a safe size to avoid gateway timeouts
        
        print(f"Starting real NVD ingestion loop for {target_ingest} CVEs (batch size: {limit})...")
        
        while total_ingested < target_ingest:
            try:
                fetched, total_results = get_cve_nodes_from_api(limit=limit, start_index=start_index, api_key=api_key)
                if not fetched:
                    print("No more CVEs returned from NVD API. Ingestion complete.")
                    break
                    
                # Ingest into DB
                db.insert_nodes_batch(fetched)
                total_ingested += len(fetched)
                start_index += limit
                
                print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] Ingested {len(fetched)} real CVEs. Total real CVEs ingested: {total_ingested}/{target_ingest}")
                
                # Sleep to respect NVD API rate limits (6 seconds is NVD's recommended window for API keys)
                time.sleep(6.0)
                
            except Exception as e:
                print(f"Error fetching batch at startIndex {start_index}: {e}. Retrying after 15 seconds...")
                time.sleep(15.0)
                
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            rows_collected=total_ingested,
            rows_processed=total_ingested,
            notes=f"Successfully ingested {total_ingested} real NVD CVEs."
        )
        print(f"NVD Ingestion Job finished. Total ingested: {total_ingested}")
        
    except Exception as e:
        print(f"Critical error in NVD ingestion job: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
