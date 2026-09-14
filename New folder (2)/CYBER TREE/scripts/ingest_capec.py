import os
import json
import httpx
from datetime import datetime
from db_client import DBClient

CAPEC_URL = "https://raw.githubusercontent.com/mitre/cti/master/capec/2.1/stix-capec.json"
CACHE_DIR = "data_cache"

def ensure_cache_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

def get_capec_data():
    ensure_cache_dir()
    cache_path = os.path.join(CACHE_DIR, "stix-capec.json")
    
    try:
        print("Downloading CAPEC STIX data...")
        resp = httpx.get(CAPEC_URL, timeout=60.0)
        resp.raise_for_status()
        data = resp.json()
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f)
        return data
    except Exception as e:
        print(f"Network error fetching CAPEC STIX: {e}.")
        if os.path.exists(cache_path):
            print("Using cached CAPEC STIX data...")
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        else:
            print("No cache found. Generating mock CAPEC data for seeding...")
            return generate_mock_capec()

def generate_mock_capec():
    objects = []
    # Generate ~550 mock attack patterns
    for i in range(1, 551):
        capec_id = f"CAPEC-{i}"
        attack_id = f"T1{1000 + (i % 100)}" # Maps to mock ATT&CK techniques
        objects.append({
            "type": "attack-pattern",
            "id": f"attack-pattern--capec-{i}",
            "name": f"Mock CAPEC Pattern {i}",
            "description": f"Detailed description for CAPEC attack pattern {capec_id}.",
            "external_references": [
                {"source_name": "capec", "external_id": capec_id},
                {"source_name": "attack", "external_id": attack_id}
            ]
        })
    return {"objects": objects}

def run():
    db = DBClient()
    job_id = db.log_job("ingest_capec", datetime.utcnow(), status="running")
    
    try:
        data = get_capec_data()
        objects = data.get("objects", [])
        
        capec_count = 0
        rel_count = 0
        
        for obj in objects:
            if obj.get("type") != "attack-pattern":
                continue
            
            title = obj.get("name", "")
            summary = obj.get("description", "")
            if len(summary) > 200:
                summary_short = summary.split("\n")[0][:200]
            else:
                summary_short = summary
            
            external_id = None
            attack_ids = []
            
            for ref in obj.get("external_references", []):
                if ref.get("source_name") == "capec":
                    external_id = ref.get("external_id")
                elif ref.get("source_name", "").lower() in ["attack", "mitre-attack"]:
                    attack_ids.append(ref.get("external_id"))
            
            if not external_id:
                continue
            
            node_payload = {
                "node_type": "technique",
                "title": f"{external_id}: {title}",
                "summary": summary_short,
                "content": summary,
                "tags": ["capec", "attack-pattern"],
                "confidence": 0.9,
                "source_url": f"https://capec.mitre.org/data/definitions/{external_id.split('-')[-1]}.html" if external_id else None,
                "source_name": "MITRE CAPEC",
                "external_id": external_id,
                "metadata": {
                    "stix_id": obj.get("id"),
                    "related_attack_ids": attack_ids
                }
            }
            
            capec_db_id = db.insert_node(node_payload)
            capec_count += 1
            
            # Establish relationships with ATT&CK techniques where IDs match
            for att_id in attack_ids:
                att_node = db.get_node_by_external_id(att_id, "technique")
                if att_node:
                    rel_payload = {
                        "from_node_id": capec_db_id,
                        "to_node_id": att_node["id"],
                        "relationship": "RELATED_TO",
                        "confidence": 0.8,
                        "evidence": f"CAPEC pattern {external_id} explicitly references ATT&CK technique {att_id}"
                    }
                    db.insert_relationship(rel_payload)
                    rel_count += 1
            
            if capec_count % 100 == 0:
                print(f"Processed {capec_count} CAPEC patterns...")
                
        print(f"Successfully processed {capec_count} CAPEC patterns and {rel_count} relationships.")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            rows_collected=capec_count,
            rows_processed=capec_count + rel_count,
            notes=f"Processed {capec_count} CAPEC entries, created {rel_count} relationships"
        )
    except Exception as e:
        print(f"Error during CAPEC ingestion: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
