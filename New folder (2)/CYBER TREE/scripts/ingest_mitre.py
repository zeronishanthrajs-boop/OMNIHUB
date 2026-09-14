import os
import json
import httpx
from db_client import DBClient
from datetime import datetime

MITRE_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
CACHE_DIR = "data_cache"

def ensure_cache_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

def get_mitre_data():
    ensure_cache_dir()
    cache_path = os.path.join(CACHE_DIR, "enterprise-attack.json")
    if os.path.exists(cache_path):
        print("Using cached MITRE ATT&CK data...")
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)
    
    print("Downloading MITRE ATT&CK data (this might take a minute)...")
    resp = httpx.get(MITRE_URL, timeout=60.0)
    resp.raise_for_status()
    data = resp.json()
    
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return data

def run():
    db = DBClient()
    job_id = db.log_job("ingest_mitre", datetime.utcnow(), status="running")
    
    try:
        data = get_mitre_data()
        objects = data.get("objects", [])
        
        # Mapping STIX IDs (e.g. attack-pattern--...) to Database UUIDs
        stix_to_db_id = {}
        nodes_to_insert = []
        
        # Supported mappings
        type_mapping = {
            "attack-pattern": "technique",
            "intrusion-set": "threat_actor",
            "tool": "tool",
            "malware": "malware"
        }
        
        # 1. Parse Nodes
        for obj in objects:
            stix_type = obj.get("type")
            if stix_type not in type_mapping:
                continue
            
            node_type = type_mapping[stix_type]
            title = obj.get("name", "")
            summary = obj.get("description", "")
            if len(summary) > 200:
                summary_short = summary.split("\n")[0][:200]
            else:
                summary_short = summary
            
            external_id = None
            for ref in obj.get("external_references", []):
                if ref.get("source_name") in ["mitre-attack", "mitre-capec"]:
                    external_id = ref.get("external_id")
                    break
            
            tags = [stix_type]
            if obj.get("x_mitre_platforms"):
                tags.extend(obj.get("x_mitre_platforms"))
            
            metadata = {
                "stix_id": obj.get("id"),
                "platforms": obj.get("x_mitre_platforms", []),
                "permissions_required": obj.get("x_mitre_permissions_required", []),
                "data_sources": obj.get("x_mitre_data_sources", [])
            }
            
            node_payload = {
                "node_type": node_type,
                "title": title,
                "summary": summary_short,
                "content": summary,
                "tags": tags,
                "confidence": 0.9, # Seed data is high confidence
                "source_url": f"https://attack.mitre.org/{node_type}s/{external_id}" if external_id else None,
                "source_name": "MITRE ATT&CK",
                "external_id": external_id,
                "metadata": metadata
            }
            
            # Insert or update
            db_id = db.insert_node(node_payload)
            stix_to_db_id[obj["id"]] = db_id
            print(f"Ingested {node_type}: {title} ({external_id})")
        
        # 2. Parse Relationships
        rel_count = 0
        for obj in objects:
            if obj.get("type") != "relationship":
                continue
            
            source_ref = obj.get("source_ref")
            target_ref = obj.get("target_ref")
            stix_rel = obj.get("relationship_type")
            
            from_id = stix_to_db_id.get(source_ref)
            to_id = stix_to_db_id.get(target_ref)
            
            if not from_id or not to_id:
                continue
            
            # Map STIX relations to our relationship types
            # relationship mapping: USED | TARGETED | EXPLOITED | RELATED_TO | SIMILAR_TO | MITIGATED_BY | OBSERVED_IN
            rel_mapping = {
                "uses": "USED",
                "mitigates": "MITIGATED_BY",
                "subtechnique-of": "RELATED_TO"
            }
            db_rel = rel_mapping.get(stix_rel, "RELATED_TO")
            
            rel_payload = {
                "from_node_id": from_id,
                "to_node_id": to_id,
                "relationship": db_rel,
                "confidence": 0.8,
                "evidence": obj.get("description", "MITRE ATT&CK relationship mapping")
            }
            db.insert_relationship(rel_payload)
            rel_count += 1
            
        print(f"Successfully ingested {len(stix_to_db_id)} MITRE nodes and {rel_count} relationships.")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            rows_collected=len(stix_to_db_id),
            rows_processed=len(stix_to_db_id) + rel_count,
            notes=f"Ingested {len(stix_to_db_id)} nodes and {rel_count} relationships from MITRE ATT&CK"
        )
    except Exception as e:
        print(f"Error during MITRE ingestion: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
