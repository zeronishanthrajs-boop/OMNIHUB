"""
evidence_linker.py — Cyber Tree Phase 6: Evidence Linker
========================================================================
Scans all pending and partial predictions, searches for matching evidence
in newly created nodes (created after the prediction), updates lists of
evidence_for/evidence_against, adjusts confidence, and updates status.

Usage:
    python scripts/evidence_linker.py
"""

import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re
from datetime import datetime
from dotenv import load_dotenv
from db_client import DBClient

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

def parse_date(date_str):
    try:
        clean_str = date_str.split('+')[0].split('Z')[0]
        return datetime.fromisoformat(clean_str)
    except Exception:
        return datetime.utcnow()

def run_evidence_linker(db, client, job_id):
    # 1. Fetch predictions with status 'pending' or 'partial'
    try:
        res = (
            client.table("predictions")
            .select("*")
            .in_("status", ["pending", "partial"])
            .execute()
        )
        predictions = res.data or []
    except Exception as e:
        log(f"ERROR fetching predictions: {e}")
        predictions = []

    log(f"Found {len(predictions)} pending/partial predictions to validate.")

    if not predictions:
        log("No predictions require validation. Exiting.")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            notes="No predictions require validation."
        )
        return

    # To query new evidence nodes, we first need to know the oldest prediction date
    oldest_prediction_date = datetime.utcnow()
    for pred in predictions:
        created_dt = parse_date(pred["created_at"])
        if created_dt < oldest_prediction_date:
            oldest_prediction_date = created_dt

    # 2. Fetch all nodes created after the oldest prediction date
    log(f"Fetching all potential evidence nodes created since {oldest_prediction_date.isoformat()}...")
    evidence_nodes = []
    offset = 0
    limit = 1000
    while True:
        try:
            res_nodes = (
                client.table("nodes")
                .select("id, title, summary, content, node_type, tags, created_at, external_id")
                .gte("created_at", oldest_prediction_date.isoformat())
                .range(offset, offset + limit - 1)
                .execute()
            )
            data = res_nodes.data or []
            evidence_nodes.extend(data)
            if len(data) < limit:
                break
            offset += limit
        except Exception as e:
            log(f"ERROR fetching potential evidence nodes: {e}")
            break

    log(f"Fetched {len(evidence_nodes)} potential evidence nodes.")

    predictions_updated = 0

    for pred in predictions:
        pred_id = pred["id"]
        pred_title = pred["title"]
        tech_context = (pred.get("technology_context") or "").strip()
        pred_created_at = parse_date(pred["created_at"])
        
        # Extract keywords for matching from technology_context
        # Use full title or key words if it's long
        keywords = []
        if tech_context:
            # Clean up technology name to get core keyword (e.g. "Anthropic Claude" -> ["anthropic", "claude"])
            clean_tech = re.sub(r'[^\w\s-]', '', tech_context.lower())
            keywords = [w for w in clean_tech.split() if len(w) > 3]
            # Add the full name itself
            if tech_context.lower() not in keywords:
                keywords.append(tech_context.lower())

        log(f"Validating Prediction ID: {pred_id} | Context: '{tech_context}' | Keywords: {keywords}")

        # Extract CVE references mentioned in the hypothesis/metadata
        hypo_text = pred.get("hypothesis") or ""
        cve_references = set(re.findall(r"(CVE-\d{4}-\d{4,7})", hypo_text.upper()))
        
        metadata = pred.get("metadata") or {}
        failure_patterns = metadata.get("failure_patterns") or []
        for fp in failure_patterns:
            fp_title = fp.get("title") or ""
            cves_in_fp = re.findall(r"(CVE-\d{4}-\d{4,7})", fp_title.upper())
            cve_references.update(cves_in_fp)

        # Scan for new nodes that match
        new_evidence_for = list(pred.get("evidence_for") or [])
        new_evidence_against = list(pred.get("evidence_against") or [])
        
        # Keep track of unique IDs of nodes we have already linked to avoid duplicates
        existing_evidence_ids = set()
        # Parse titles/IDs from existing strings
        for ev in new_evidence_for + new_evidence_against:
            # If the format is "Vulnerability ID: [uuid]...", extract UUID
            match = re.search(r'\[([a-f0-9\-]{36})\]', ev)
            if match:
                existing_evidence_ids.add(match.group(1))

        # Check nodes created AFTER this specific prediction
        for node in evidence_nodes:
            node_id = node["id"]
            node_type = node["node_type"]
            node_created_at = parse_date(node["created_at"])
            node_title = node["title"]
            node_summary = node.get("summary") or ""
            node_content = node.get("content") or ""
            node_ext_id = node.get("external_id") or ""

            if node_created_at <= pred_created_at:
                continue
            if node_id in existing_evidence_ids:
                continue

            # Check if this node is relevant (contains technology keywords or matches CVE references)
            matches_tech = False
            if keywords:
                text_to_search = (node_title + " " + node_summary + " " + node_content).lower()
                for kw in keywords:
                    if kw in text_to_search:
                        matches_tech = True
                        break
            
            matches_cve = False
            if cve_references and node_ext_id:
                if node_ext_id.upper() in cve_references:
                    matches_cve = True

            if not (matches_tech or matches_cve):
                continue

            # Determine if evidence is FOR or AGAINST
            # Evidence For: new vulnerability/incident/technique affecting this technology
            if node_type in ["vulnerability", "incident"]:
                ev_str = f"[{node_id}] Vulnerability/Incident: {node_title} (Created: {node['created_at']})"
                new_evidence_for.append(ev_str)
                existing_evidence_ids.add(node_id)
                log(f"  -> Found EVIDENCE FOR: {node_title}")
                
            # Evidence Against: new defense/tool/patches/mitigations securing this technology
            elif node_type in ["defense", "tool"] or "patch" in node_title.lower() or "mitigate" in node_title.lower():
                ev_str = f"[{node_id}] Defense/Patch: {node_title} (Created: {node['created_at']})"
                new_evidence_against.append(ev_str)
                existing_evidence_ids.add(node_id)
                log(f"  -> Found EVIDENCE AGAINST: {node_title}")

        # If any changes were found, recalculate confidence and status
        if len(new_evidence_for) > len(pred.get("evidence_for") or []) or len(new_evidence_against) > len(pred.get("evidence_against") or []):
            current_confidence = pred.get("confidence") or 0.5
            
            # Calculate additions
            added_for = len(new_evidence_for) - len(pred.get("evidence_for") or [])
            added_against = len(new_evidence_against) - len(pred.get("evidence_against") or [])
            
            # Recalculate confidence
            confidence = current_confidence + (added_for * 0.15) - (added_against * 0.20)
            confidence = round(min(0.95, max(0.05, confidence)), 2)
            
            # Determine new status
            status = pred["status"]
            resolved_at = pred.get("resolved_at")
            
            if new_evidence_against and confidence < 0.25:
                status = "disproven"
                resolved_at = datetime.utcnow().isoformat()
            elif new_evidence_for and confidence >= 0.85:
                status = "confirmed"
                resolved_at = datetime.utcnow().isoformat()
            elif len(new_evidence_for) > 0:
                status = "partial"
            
            log(f"  -> Updating prediction: Status {pred['status']} -> {status} | Confidence {pred['confidence']} -> {confidence}")

            # Save updates
            update_payload = {
                "evidence_for": new_evidence_for,
                "evidence_against": new_evidence_against,
                "confidence": confidence,
                "status": status,
                "resolved_at": resolved_at
            }
            
            try:
                client.table("predictions").update(update_payload).eq("id", pred_id).execute()
                predictions_updated += 1
            except Exception as e:
                log(f"ERROR updating prediction {pred_id}: {e}")

    # Log job success
    db.update_job_log(
        job_id,
        datetime.utcnow(),
        status="success",
        rows_processed=len(predictions),
        notes=f"Scanned {len(predictions)} predictions. Updated {predictions_updated} with new evidence."
    )

def main():
    log("=" * 60)
    log("CYBER TREE — Evidence Linker Pipeline (Phase 6)")
    log("=" * 60)

    db = DBClient()
    if not db.use_supabase:
        log("ERROR: Supabase connection required for evidence linker.")
        sys.exit(1)

    job_id = db.log_job("evidence_linker", datetime.utcnow(), status="running")
    
    try:
        run_evidence_linker(db, db.client, job_id)
        log("=" * 60)
        log("Evidence Linker run complete.")
        log("=" * 60)
    except Exception as e:
        log(f"FATAL error in evidence linker: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        sys.exit(1)

if __name__ == "__main__":
    main()
