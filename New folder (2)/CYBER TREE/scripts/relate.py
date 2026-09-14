import os
import re
import json
import numpy as np
from datetime import datetime, timedelta
from db_client import DBClient

def get_cosine_similarity(v1, v2):
    if not v1 or not v2:
        return 0.0
    
    # Parse if string
    if isinstance(v1, str):
        try:
            v1 = json.loads(v1)
        except Exception:
            v1 = [float(x) for x in v1.strip('[]{}').split(',') if x.strip()]
            
    if isinstance(v2, str):
        try:
            v2 = json.loads(v2)
        except Exception:
            v2 = [float(x) for x in v2.strip('[]{}').split(',') if x.strip()]
            
    arr1 = np.array(v1)
    arr2 = np.array(v2)
    norm1 = np.linalg.norm(arr1)
    norm2 = np.linalg.norm(arr2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(arr1, arr2) / (norm1 * norm2))

def insert_safe_relationship(db, rel):
    if rel.get("from_node_id") == rel.get("to_node_id"):
        print(f"Skipping self-referential relationship creation: {rel.get('from_node_id')} -> {rel.get('to_node_id')}")
        return None
    return db.insert_relationship(rel)

def run():
    db = DBClient()
    job_id = db.log_job("relate", datetime.utcnow(), status="running")
    
    relations_created = 0
    
    try:
        # Fetch all nodes to build references
        nodes = db.get_all_nodes(limit=15000)
        print(f"Loaded {len(nodes)} total nodes for relationship mapping.")
        
        # Build caches for fast lookup
        cve_nodes = {}
        actor_nodes = {}
        technique_nodes = {}
        
        for node in nodes:
            ext_id = node.get("external_id")
            node_type = node.get("node_type")
            
            if node_type == "vulnerability" and ext_id:
                cve_nodes[ext_id.upper()] = node["id"]
            elif node_type == "threat_actor":
                if ext_id:
                    actor_nodes[ext_id.lower()] = node["id"]
                # Also index by name
                actor_nodes[node["title"].lower()] = node["id"]
            elif node_type == "technique" and ext_id:
                technique_nodes[ext_id.upper()] = node["id"]
        
        # Filter: Only process nodes created/modified in the last 24h
        # If running offline test and none found, process the last 200 nodes to verify functionality
        time_limit = datetime.utcnow() - timedelta(days=1)
        recent_nodes = []
        for node in nodes:
            try:
                created_dt = datetime.fromisoformat(node["created_at"].replace("Z", "+00:00")).replace(tzinfo=None)
                if created_dt > time_limit:
                    recent_nodes.append(node)
            except Exception:
                pass
                
        if not recent_nodes:
            print("No nodes created in last 24h. Falling back to processing the last 200 nodes.")
            sorted_nodes = sorted(nodes, key=lambda x: x.get("created_at", ""), reverse=True)
            recent_nodes = sorted_nodes[:200]
            
        print(f"Processing relationships for {len(recent_nodes)} target nodes...")
        
        # Process relationships
        for node in recent_nodes:
            node_id = node["id"]
            content = (node.get("content") or "") + " " + (node.get("title") or "")
            content_upper = content.upper()
            content_lower = content.lower()
            
            # 1. Look for CVEs mentioned
            cves_found = re.findall(r"(CVE-\d{4}-\d{4,7})", content_upper)
            for cve in set(cves_found):
                target_id = cve_nodes.get(cve)
                if target_id and target_id != node_id:
                    rel_type = "EXPLOITED" if node["node_type"] in ["malware", "threat_actor", "incident"] else "RELATED_TO"
                    insert_safe_relationship(db, {
                        "from_node_id": node_id,
                        "to_node_id": target_id,
                        "relationship": rel_type,
                        "confidence": 0.8,
                        "evidence": f"Node content mentions {cve}"
                    })
                    relations_created += 1
            
            # 2. Look for Threat Actors mentioned
            for actor_name, target_id in actor_nodes.items():
                if target_id != node_id and re.search(r'\b' + re.escape(actor_name) + r'\b', content_lower):
                    rel_type = "OBSERVED_IN" if node["node_type"] == "incident" else "RELATED_TO"
                    insert_safe_relationship(db, {
                        "from_node_id": target_id,
                        "to_node_id": node_id,
                        "relationship": rel_type,
                        "confidence": 0.75,
                        "evidence": f"Node content mentions threat actor '{actor_name}'"
                    })
                    relations_created += 1
            
            # 3. Look for MITRE ATT&CK techniques mentioned (e.g. T1059)
            tech_found = re.findall(r"\b(T\d{4}(?:\.\d{3})?)\b", content_upper)
            for tech in set(tech_found):
                target_id = technique_nodes.get(tech)
                if target_id and target_id != node_id:
                    insert_safe_relationship(db, {
                        "from_node_id": node_id,
                        "to_node_id": target_id,
                        "relationship": "USED",
                        "confidence": 0.8,
                        "evidence": f"Node content mentions ATT&CK technique {tech}"
                    })
                    relations_created += 1
            
            # 4. Semantic similarity relationships
            # Skip for vulnerabilities/weaknesses to avoid N x N explosion and low-value links
            if node["node_type"] in ["vulnerability", "weakness"]:
                continue
                
            emb_source = node.get("embedding")
            if emb_source:
                similarities = []
                for other in nodes:
                    if other["id"] == node_id or not other.get("embedding"):
                        continue
                    # Skip comparing against vulnerabilities/weaknesses to speed up drastically
                    if other["node_type"] in ["vulnerability", "weakness"]:
                        continue
                        
                    sim = get_cosine_similarity(emb_source, other["embedding"])
                    if sim > 0.88:
                        similarities.append((sim, other["id"]))
                
                # Sort by similarity and take top 3
                similarities.sort(key=lambda x: x[0], reverse=True)
                for sim, target_id in similarities[:3]:
                    insert_safe_relationship(db, {
                        "from_node_id": node_id,
                        "to_node_id": target_id,
                        "relationship": "SIMILAR_TO",
                        "confidence": sim,
                        "evidence": f"Semantic embedding similarity score: {sim:.4f}"
                    })
                    relations_created += 1
                    
        print(f"Successfully processed nodes and created {relations_created} relationships.")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            rows_collected=relations_created,
            rows_processed=relations_created,
            notes=f"Created {relations_created} relationships based on string extraction and embeddings"
        )
    except Exception as e:
        print(f"Error during relationship building: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
