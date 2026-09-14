"""
learning_engine.py — Cyber Tree Phase 7: Self-Improving Intelligence
========================================================================
Queries all resolved predictions, calculates accuracy scores, tracks
pattern type confirmation rates, updates node confidence scores for
linked threat_actor and vulnerability nodes, and stores all metrics
in the learning_metrics table.

Accuracy scoring:
  confirmed  → 1.0
  partial    → 0.5
  pending    → null (skipped)
  disproven  → 0.0

Pattern types tracked: firmware, cloud, auth, supply_chain, ransomware,
phishing, zero_day, apt, ai_model, exploit

Usage:
    python scripts/learning_engine.py
"""

import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv
from db_client import DBClient

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

PATTERN_KEYWORDS = {
    "firmware":      ["firmware", "bios", "uefi", "bootkit", "embedded"],
    "cloud":         ["cloud", "aws", "azure", "gcp", "s3", "container", "kubernetes", "docker"],
    "auth":          ["authentication", "oauth", "jwt", "session", "credential", "login", "password"],
    "supply_chain":  ["supply chain", "dependency", "npm", "pypi", "open source", "third-party"],
    "ransomware":    ["ransomware", "ransom", "encrypt", "lockbit", "clop", "blackcat"],
    "phishing":      ["phishing", "smishing", "vishing", "spear", "social engineering"],
    "zero_day":      ["zero-day", "0-day", "zero day", "unpatched", "cve"],
    "apt":           ["apt", "nation-state", "threat actor", "espionage", "government"],
    "ai_model":      ["llm", "gpt", "claude", "gemini", "langchain", "ai model", "machine learning"],
    "exploit":       ["exploit", "rce", "privilege escalation", "buffer overflow", "injection"],
}

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

def classify_pattern(text: str) -> list[str]:
    """Return all matching pattern types for a prediction's text."""
    text_lower = text.lower()
    matched = []
    for pattern, keywords in PATTERN_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            matched.append(pattern)
    return matched if matched else ["general"]

def score_prediction(status: str) -> float | None:
    """Map prediction status to accuracy score."""
    return {"confirmed": 1.0, "partial": 0.5, "disproven": 0.0}.get(status)

def store_metric(client, metric_type: str, value: float, context: dict) -> bool:
    """Insert a row into learning_metrics."""
    try:
        client.table("learning_metrics").insert({
            "metric_type":  metric_type,
            "value":        value,
            "context":      context,
            "recorded_at":  datetime.utcnow().isoformat(),
        }).execute()
        return True
    except Exception as e:
        log(f"  WARN: Failed to store metric '{metric_type}': {e}")
        return False

def update_node_confidence(client, node_id: str, new_confidence: float, source: str) -> bool:
    """Update a node's confidence score."""
    try:
        client.table("nodes").update({
            "confidence": round(new_confidence, 4),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", node_id).execute()
        log(f"    ↳ Updated node {node_id[:8]}… confidence → {new_confidence:.3f} [{source}]")
        return True
    except Exception as e:
        log(f"    WARN: Could not update node {node_id[:8]}…: {e}")
        return False

def run_learning_engine(db, client, job_id):
    # ── 1. Fetch all non-pending predictions ─────────────────────
    log("Fetching resolved predictions (confirmed / partial / disproven)…")
    try:
        resp = (
            client.table("predictions")
            .select("id, title, hypothesis, status, confidence, related_nodes, "
                    "evidence_for, evidence_against, technology_context, created_at")
            .neq("status", "pending")
            .order("created_at", desc=True)
            .execute()
        )
        predictions = resp.data or []
    except Exception as e:
        log(f"ERROR fetching predictions: {e}")
        raise e

    log(f"Found {len(predictions)} resolved prediction(s).")
    if not predictions:
        log("Nothing to learn from yet. Exiting.")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            notes="No resolved predictions found to score."
        )
        return

    # ── 2. Score each prediction & aggregate pattern stats ───────
    pattern_scores: dict[str, list[float]] = defaultdict(list)
    accuracy_series: list[dict] = []
    node_score_map: dict[str, list[float]] = defaultdict(list)   # node_id → [scores]

    scored_count = 0
    for pred in predictions:
        score = score_prediction(pred["status"])
        if score is None:
            continue  # pending — shouldn't be here but guard anyway

        scored_count += 1
        text = f"{pred.get('title', '')} {pred.get('hypothesis', '')} {pred.get('technology_context', '')}"
        patterns = classify_pattern(text)

        log(f"  Prediction '{pred['title'][:60]}…' | status={pred['status']} | score={score} | patterns={patterns}")

        for pt in patterns:
            pattern_scores[pt].append(score)

        accuracy_series.append({
            "prediction_id": pred["id"],
            "status":        pred["status"],
            "score":         score,
            "confidence":    pred.get("confidence"),
            "patterns":      patterns,
            "created_at":    pred.get("created_at"),
        })

        # Collect related node ids to update confidence
        related = pred.get("related_nodes") or []
        for nid in related:
            node_score_map[nid].append(score)

    log(f"\nScored {scored_count} predictions.")

    # ── 3. Compute & store overall accuracy ──────────────────────
    if accuracy_series:
        all_scores = [e["score"] for e in accuracy_series]
        overall_accuracy = sum(all_scores) / len(all_scores)
        log(f"Overall system accuracy: {overall_accuracy:.3f}")

        store_metric(client, "accuracy_score", overall_accuracy, {
            "sample_size":    scored_count,
            "confirmed":      sum(1 for e in accuracy_series if e["status"] == "confirmed"),
            "partial":        sum(1 for e in accuracy_series if e["status"] == "partial"),
            "disproven":      sum(1 for e in accuracy_series if e["status"] == "disproven"),
            "series":         accuracy_series[:50],   # cap at 50 for JSONB size
        })

    # ── 4. Compute & store per-pattern confirmation rates ────────
    log("\nPattern confirmation rates:")
    for pattern, scores in sorted(pattern_scores.items()):
        rate = sum(scores) / len(scores)
        log(f"  {pattern:20s} → {rate:.3f} ({len(scores)} predictions)")
        store_metric(client, "pattern_confirmation_rate", rate, {
            "pattern":        pattern,
            "sample_size":    len(scores),
            "confirmed":      sum(1 for s in scores if s == 1.0),
            "partial":        sum(1 for s in scores if s == 0.5),
            "disproven":      sum(1 for s in scores if s == 0.0),
        })

    # ── 5. Update node confidence from confirmed predictions ──────
    log(f"\nUpdating confidence for {len(node_score_map)} linked node(s)…")
    nodes_updated = 0
    for node_id, scores in node_score_map.items():
        if not scores:
            continue
        avg_score = sum(scores) / len(scores)

        # Fetch current confidence
        try:
            node_resp = client.table("nodes").select("id, confidence, node_type").eq("id", node_id).single().execute()
            node = node_resp.data
            if not node:
                continue
            node_type = node.get("node_type", "")
            if node_type not in ("threat_actor", "vulnerability", "technique", "malware"):
                continue  # only update high-signal node types

            current_conf = float(node.get("confidence") or 0.5)
            # Bayesian blend: weight existing confidence 70%, new evidence 30%
            new_confidence = (current_conf * 0.7) + (avg_score * 0.3)
            new_confidence = min(0.99, max(0.05, new_confidence))

            if abs(new_confidence - current_conf) < 0.005:
                continue  # insignificant change

            if update_node_confidence(client, node_id, new_confidence, f"avg_score={avg_score:.2f}"):
                nodes_updated += 1
                store_metric(client, "confidence_update", new_confidence, {
                    "node_id":          node_id,
                    "node_type":        node_type,
                    "previous":         current_conf,
                    "prediction_count": len(scores),
                    "avg_prediction_score": avg_score,
                })
        except Exception as e:
            log(f"  WARN: Could not process node {node_id[:8]}…: {e}")

    log(f"Updated confidence for {nodes_updated} node(s).")

    # ── 6. Store run summary ─────────────────────────────────────
    run_summary = {
        "scored_predictions":  scored_count,
        "patterns_tracked":    len(pattern_scores),
        "nodes_updated":       nodes_updated,
        "overall_accuracy":    round(sum(e["score"] for e in accuracy_series) / len(accuracy_series), 4)
                               if accuracy_series else None,
        "finished_at":         datetime.utcnow().isoformat(),
    }
    store_metric(client, "engine_run", 1.0, run_summary)
    log(f"\nRun summary stored: {json.dumps(run_summary, indent=2)}")

    db.update_job_log(
        job_id,
        datetime.utcnow(),
        status="success",
        rows_processed=scored_count,
        notes=f"Scored {scored_count} predictions, updated {nodes_updated} nodes."
    )

def main():
    log("=" * 60)
    log("CYBER TREE — Learning Engine (Phase 7)")
    log("=" * 60)

    db = DBClient()
    if not db.use_supabase:
        log("ERROR: Supabase connection required for learning engine.")
        sys.exit(1)

    job_id = db.log_job("learning_engine", datetime.utcnow(), status="running")
    
    try:
        run_learning_engine(db, db.client, job_id)
        log("=" * 60)
        log("Learning Engine run complete.")
        log("=" * 60)
    except Exception as e:
        log(f"FATAL error in learning engine: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        sys.exit(1)

if __name__ == "__main__":
    main()
