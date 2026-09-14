"""
hypothesis_engine.py — Cyber Tree Phase 6: Hypothesis Engine
========================================================================
Queries recent technology nodes, finds semantically similar technologies
using pgvector similarity search, analyzes their historical failure
patterns (vulnerabilities and incidents), generates risk hypotheses, and
stores them in the predictions table.

Usage:
    python scripts/hypothesis_engine.py
"""

import os
import sys
import json
import httpx
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)

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

def parse_date(date_str):
    try:
        clean_str = date_str.split('+')[0].split('Z')[0]
        return datetime.fromisoformat(clean_str)
    except Exception:
        return datetime.utcnow()

def generate_nvidia_hypothesis(tech, similar_techs, risk_patterns, nvidia_key):
    if not nvidia_key:
        raise ValueError("NVIDIA_API_KEY is not set.")
        
    tech_title = tech["title"]
    tech_type = tech["node_type"]
    tech_content = tech.get("content") or tech.get("summary") or "No description available."
    
    similar_techs_parts = []
    for idx, st in enumerate(similar_techs, 1):
        st_content = st.get("content") or st.get("summary") or "No details available."
        similar_techs_parts.append(
            f"Similar Technology #{idx}:\n"
            f"- Title: {st['title']}\n"
            f"- Type: {st['node_type']}\n"
            f"- Content: {st_content[:800]}..."
        )
    similar_techs_context = "\n\n".join(similar_techs_parts)
    
    risk_patterns_parts = []
    for idx, rp in enumerate(risk_patterns, 1):
        rp_content = rp.get("content") or rp.get("summary") or "No details available."
        risk_patterns_parts.append(
            f"Failure Pattern #{idx} ({rp['node_type']}):\n"
            f"- Title: {rp['title']}\n"
            f"- Content: {rp_content[:800]}..."
        )
    risk_patterns_context = "\n\n".join(risk_patterns_parts)
    
    system_instruction = (
        "You are the CYBER TREE Threat Intelligence Analyzer, an expert AI security analyst.\n"
        "Your role is to analyze a newly introduced technology, tool, or vulnerability, compare it to historically similar systems and their failure patterns, and generate a specific, deeply reasoned security risk hypothesis.\n\n"
        "Follow these strict constraints:\n"
        "1. Do NOT use generic template wording (e.g. 'Based on semantic similarity...', 'Historically, similar systems have...', 'susceptible to similar security failures').\n"
        "2. Do NOT write obvious or trivial statements (e.g. 'Because it is a database, it might have database vulnerabilities').\n"
        "3. Describe a SPECIFIC, PLAUSIBLE security mechanism, attack vector, or code-level susceptibility based on the shared architecture, protocols, or dependencies of the compared systems. Be highly analytical and detailed.\n"
        "4. Write a professional threat analysis of exactly 2-3 paragraphs. Do not include any greeting, summary headers, or preamble. Output the analysis paragraphs directly."
    )
    
    prompt = (
        f"Subject Node:\n"
        f"- Title: {tech_title}\n"
        f"- Type: {tech_type}\n"
        f"- Content: {tech_content}\n\n"
        f"Historically Similar Technologies:\n"
        f"{similar_techs_context}\n\n"
        f"Historical Failure Patterns (Vulnerabilities/Incidents):\n"
        f"{risk_patterns_context}\n\n"
        f"Task:\n"
        f"Analyze the subject node in relation to the similar technologies and their historical failure patterns. Generate a highly specific security risk hypothesis detailing the plausible attack vector or vulnerability mechanism. Write a professional threat analysis of 2-3 paragraphs."
    )
    
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
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
        "temperature": 0.4,
        "max_tokens": 1024,
        "top_p": 0.7
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {nvidia_key}"
    }
    
    log(f"Calling NVIDIA NIM to generate hypothesis for '{tech_title}'...")
    resp = httpx.post(url, json=payload, headers=headers, timeout=40.0)
    resp.raise_for_status()
    resp_data = resp.json()
    
    try:
        hypothesis = resp_data["choices"][0]["message"]["content"].strip()
        if not hypothesis:
            raise ValueError("Empty response text from NVIDIA API.")
        return hypothesis
    except (KeyError, IndexError, ValueError) as e:
        raise ValueError(f"Failed to parse NVIDIA response structure: {resp_data}. Error: {e}")

def main():
    log("=" * 60)
    log("CYBER TREE — Hypothesis Engine (Phase 6)")
    log("=" * 60)

    nvidia_key = os.getenv("NVIDIA_API_KEY")
    if not nvidia_key:
        log("ERROR: NVIDIA_API_KEY environment variable is not set. Exiting.")
        sys.exit(1)

    client = connect_supabase()

    # 1. Fetch nodes of type 'technology', 'tool', or 'vulnerability' added in the last 30 days
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    log(f"Fetching technology/tool/vulnerability nodes created since {thirty_days_ago.isoformat()}...")

    try:
        res = (
            client.table("nodes")
            .select("id, title, summary, content, embedding, created_at, tags, metadata, node_type")
            .in_("node_type", ["technology", "tool", "vulnerability"])
            .gte("created_at", thirty_days_ago.isoformat())
            .execute()
        )
        tech_nodes = res.data or []
    except Exception as e:
        log(f"ERROR fetching technology/tool/vulnerability nodes: {e}")
        tech_nodes = []

    log(f"Found {len(tech_nodes)} nodes added in the last 30 days.")

    # Fallback: if no recent nodes, use the 5 most recent technology/tool/vulnerability nodes to ensure the pipeline runs
    if not tech_nodes:
        log("No nodes found in the last 30 days. Falling back to the 5 most recent technology/tool/vulnerability nodes...")
        try:
            res = (
                client.table("nodes")
                .select("id, title, summary, content, embedding, created_at, tags, metadata, node_type")
                .in_("node_type", ["technology", "tool", "vulnerability"])
                .order("created_at", desc=True)
                .limit(5)
                .execute()
            )
            tech_nodes = res.data or []
            log(f"Fetched {len(tech_nodes)} fallback nodes.")
        except Exception as e:
            log(f"ERROR fetching fallback nodes: {e}")

    predictions_inserted = 0

    active_tech_nodes = []
    for tech in tech_nodes:
        meta = tech.get("metadata") or {}
        if meta.get("archived_reason") == "synthetic-mock-data-phase13-removal":
            continue
        active_tech_nodes.append(tech)

    log(f"Active technology nodes for analysis: {len(active_tech_nodes)}")

    for tech in active_tech_nodes:
        tech_id = tech["id"]
        tech_title = tech["title"]
        tech_embedding = parse_embedding(tech.get("embedding"))

        if not tech_embedding:
            log(f"Skipping '{tech_title}' (no embedding found).")
            continue

        log(f"Processing technology: '{tech_title}' (ID: {tech_id})")

        # Check if a prediction for this technology already exists to prevent duplicate predictions
        try:
            res_check = (
                client.table("predictions")
                .select("id")
                .eq("metadata->>technology_id", tech_id)
                .neq("status", "archived")
                .execute()
            )
            existing = res_check.data or []
            if existing:
                log(f"Prediction already exists for '{tech_title}' (Prediction ID: {existing[0]['id']}). Skipping.")
                continue
        except Exception as e:
            log(f"ERROR checking existing prediction: {e}")

        # 2. Find historically similar technologies using pgvector match_nodes RPC
        similar_techs = []
        try:
            res_similar = client.rpc("match_nodes", {
                "query_embedding": tech_embedding,
                "match_threshold": 0.4,
                "match_count": 6,  # fetch 6 to allow filtering out self
                "filter_type": tech.get("node_type", "technology")
            }).execute()
            
            raw_similar = res_similar.data or []
            # Filter out self
            similar_techs = [t for t in raw_similar if t["id"] != tech_id][:5]
        except Exception as e:
            log(f"ERROR running match_nodes RPC for similarity search: {e}")
            continue

        log(f"Found {len(similar_techs)} similar technologies.")
        for st in similar_techs:
            log(f"  - Similar tech: '{st['title']}' (similarity: {st.get('similarity', 0.0):.4f})")

        if not similar_techs:
            log(f"Skipping prediction generation for '{tech_title}' (no similar technologies found).")
            continue

        # 3. Analyze failure patterns of those similar technologies
        # Find related vulnerabilities/incidents connected to the similar technologies
        similar_ids = [st["id"] for st in similar_techs]
        related_failures = []

        try:
            # Query relationships involving the similar technologies
            res_rels = (
                client.table("relationships")
                .select("from_node_id, to_node_id, relationship")
                .or_(f"from_node_id.in.({','.join(similar_ids)}),to_node_id.in.({','.join(similar_ids)})")
                .execute()
            )
            rels = res_rels.data or []

            # Collect candidate failure node IDs
            failure_ids = set()
            for r in rels:
                f_id = r["from_node_id"]
                t_id = r["to_node_id"]
                
                # Identify the node connected to the similar technology
                if f_id in similar_ids and t_id not in similar_ids:
                    failure_ids.add(t_id)
                elif t_id in similar_ids and f_id not in similar_ids:
                    failure_ids.add(f_id)

            if failure_ids:
                # Query nodes to check if they are vulnerabilities or incidents
                # Supabase table select in.() expects list of strings
                res_nodes = (
                    client.table("nodes")
                    .select("id, title, summary, content, node_type, created_at, tags")
                    .in_("id", list(failure_ids))
                    .execute()
                )
                nodes_data = res_nodes.data or []
                for node in nodes_data:
                    if node["node_type"] in ["vulnerability", "incident"]:
                        related_failures.append(node)

        except Exception as e:
            log(f"ERROR analyzing failure patterns: {e}")

        log(f"Found {len(related_failures)} related vulnerabilities/incidents for similar technologies.")

        # Extract top 3-5 risk patterns
        # Group similar failures, use their titles and summaries
        risk_patterns = []
        for fail in related_failures[:5]:  # Take up to 5
            desc = fail["title"]
            if fail.get("summary"):
                desc += f" - {fail['summary']}"
            # Clean up long summaries
            if len(desc) > 200:
                desc = desc[:197] + "..."
            risk_patterns.append({
                "id": fail["id"],
                "node_type": fail["node_type"],
                "pattern": desc,
                "title": fail["title"],
                "created_at": fail["created_at"]
            })

        # If no specific related failures found, use general vulnerability/incident nodes that are semantically close to the new tech
        if not risk_patterns:
            log("No direct failure relationships found. Falling back to semantic search for nearest vulnerabilities/incidents...")
            try:
                res_vulns = client.rpc("match_nodes", {
                    "query_embedding": tech_embedding,
                    "match_threshold": 0.3,
                    "match_count": 5,
                    "filter_type": "vulnerability"
                }).execute()
                for fail in (res_vulns.data or []):
                    desc = fail["title"]
                    if fail.get("summary"):
                        desc += f" - {fail['summary']}"
                    if len(desc) > 200:
                        desc = desc[:197] + "..."
                    risk_patterns.append({
                        "id": fail["id"],
                        "node_type": "vulnerability",
                        "pattern": desc,
                        "title": fail["title"],
                        "created_at": fail["created_at"]
                    })
            except Exception as e:
                log(f"ERROR fetching fallback vulnerabilities: {e}")

        if not risk_patterns:
            log(f"Skipping prediction generation for '{tech_title}' (no failure patterns or vulnerabilities found).")
            continue

        # 4. Generate hypothesis text using NVIDIA NIM
        try:
            hypothesis = generate_nvidia_hypothesis(tech, similar_techs, risk_patterns, nvidia_key)
            import time
            time.sleep(1)  # NVIDIA NIM has generous rate limits, but a small delay is nice
        except Exception as ex:
            log(f"ERROR: Failed to generate hypothesis using NVIDIA for '{tech_title}': {ex}. Skipping.")
            import time
            time.sleep(2)  # Sleep on error before next iteration
            continue

        # 5. Assign confidence score
        # - Number of similar technologies found (0.05 per tech, max 0.25)
        similar_tech_score = min(0.25, len(similar_techs) * 0.05)
        
        # - Strength of historical pattern (average similarity score of top matches, max 0.35)
        avg_similarity = sum([st.get("similarity", 0.5) for st in similar_techs]) / len(similar_techs) if similar_techs else 0.5
        strength_score = min(0.35, avg_similarity * 0.35)
        
        # - Recency of evidence (recent failures in the last 180 days, max 0.30)
        recency_score = 0.10
        recent_count = 0
        for rp in risk_patterns:
            created_dt = parse_date(rp["created_at"])
            if (now - created_dt).days < 180:
                recent_count += 1
        if recent_count >= 3:
            recency_score = 0.30
        elif recent_count >= 1:
            recency_score = 0.20

        # Base score starts at 0.10
        confidence = round(min(0.95, max(0.15, 0.10 + similar_tech_score + strength_score + recency_score)), 2)

        log(f"Generated hypothesis with confidence: {confidence} (similar_score={similar_tech_score:.2f}, strength={strength_score:.2f}, recency={recency_score:.2f})")

        # Collect all supporting nodes
        supporting_nodes = [st["id"] for st in similar_techs] + [rp["id"] for rp in risk_patterns]

        # 6. Store in predictions table
        prediction_payload = {
            "title": f"Security Risk Prediction for {tech_title[:50]}",
            "hypothesis": hypothesis,
            "related_nodes": supporting_nodes,
            "confidence": confidence,
            "status": "pending",
            "evidence_for": [],
            "evidence_against": [],
            "technology_context": tech_title,
            "metadata": {
                "technology_id": tech_id,
                "similar_technologies": [
                    {"id": st["id"], "title": st["title"], "similarity": st.get("similarity", 0.0)}
                    for st in similar_techs
                ],
                "failure_patterns": [
                    {"id": rp["id"], "title": rp["title"], "node_type": rp["node_type"]}
                    for rp in risk_patterns
                ],
                "confidence_breakdown": {
                    "similar_tech_score": similar_tech_score,
                    "strength_score": strength_score,
                    "recency_score": recency_score
                }
            }
        }

        # Store in predictions table
        try:
            client.table("predictions").insert(prediction_payload).execute()
            log(f"Successfully stored prediction in database.")
            predictions_inserted += 1
            if predictions_inserted >= 10:
                log("Reached max limit of 10 generated predictions. Stopping execution loop.")
                break
        except Exception as e:
            log(f"ERROR inserting prediction: {e}")

    # Log job success
    try:
        client.table("job_logs").insert({
            "job_name": "hypothesis_engine",
            "started_at": now.isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "status": "success",
            "rows_processed": len(tech_nodes),
            "notes": f"Processed {len(tech_nodes)} technologies. Generated {predictions_inserted} predictions."
        }).execute()
    except Exception as e:
        log(f"Warning: Failed to log job: {e}")

if __name__ == "__main__":
    main()
