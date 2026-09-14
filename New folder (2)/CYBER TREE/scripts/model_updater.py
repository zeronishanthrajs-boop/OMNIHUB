"""
model_updater.py — Cyber Tree Phase 7: Classifier Self-Improvement
========================================================================
Pulls confirmed and disproven predictions as new labelled training
examples, merges with the original training_data.csv, retrains the
TF-IDF + LogisticRegression classifier, and only saves the new model
if its accuracy is >= the previous model's accuracy.

If the new model passes the gate, it:
  1. Overwrites models/classifier.pkl
  2. Overwrites models/classifier.json (for TypeScript inference)
  3. Writes models/training_report.txt
  4. Commits classifier.pkl + classifier.json to the repo via GitHub API

Label mapping from prediction patterns → node_type:
  If the prediction's technology_context contains a clear node_type
  keyword it is used directly; otherwise the prediction title is
  classified using the original classify.py logic.

Usage:
    python scripts/model_updater.py
"""

import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import csv
import json
import pickle
import base64
import tempfile
import shutil
from datetime import datetime
from io import StringIO
from dotenv import load_dotenv
from db_client import DBClient

load_dotenv()

SUPABASE_URL  = os.getenv("SUPABASE_URL")
SUPABASE_KEY  = os.getenv("SUPABASE_KEY")
GITHUB_TOKEN  = os.getenv("GITHUB_TOKEN")
GITHUB_REPO   = os.getenv("GITHUB_REPO", "zeronishanthrajs-boop/cyber-tree")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

MODELS_DIR    = os.path.join(os.path.dirname(__file__), "..", "models")
DATA_PATH     = os.path.join(MODELS_DIR, "training_data.csv")
CLF_PATH      = os.path.join(MODELS_DIR, "classifier.pkl")
JSON_PATH     = os.path.join(MODELS_DIR, "classifier.json")
REPORT_PATH   = os.path.join(MODELS_DIR, "training_report.txt")

# Status → label suffix for log clarity
STATUS_LABEL_MAP = {
    "confirmed": "threat_actor",   # treated as positive, high-confidence security signal
    "disproven": "defense",        # treated as false-positive / defensive context
    "partial":   "vulnerability",  # mixed evidence maps to vulnerability
}

def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)

def connect_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("ERROR: SUPABASE_URL and SUPABASE_KEY required.")
        sys.exit(1)
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    log("Connected to Supabase.")
    return client

def fetch_resolved_predictions(client) -> list[dict]:
    log("Fetching resolved predictions for new training examples…")
    resp = (
        client.table("predictions")
        .select("id, title, hypothesis, technology_context, status")
        .in_("status", ["confirmed", "disproven", "partial"])
        .order("created_at", desc=True)
        .limit(500)
        .execute()
    )
    return resp.data or []

def build_label_from_prediction(pred: dict) -> str:
    """Derive a node_type label from a resolved prediction."""
    ctx   = (pred.get("technology_context") or "").lower()
    title = (pred.get("title") or "").lower()
    text  = ctx + " " + title

    label_rules = [
        ("threat_actor",  ["apt", "threat actor", "hacker", "nation-state", "espionage"]),
        ("vulnerability", ["cve", "zero-day", "exploit", "rce", "vulnerability", "flaw"]),
        ("malware",       ["ransomware", "malware", "trojan", "worm", "botnet", "backdoor"]),
        ("technique",     ["technique", "phishing", "social engineering", "supply chain"]),
        ("incident",      ["breach", "incident", "attack", "campaign", "compromise"]),
        ("defense",       ["defense", "mitigation", "patch", "update", "fix"]),
        ("tool",          ["tool", "scanner", "framework", "library", "sdk"]),
        ("news",          ["interpol", "fbi", "doj", "seizes", "court", "takedown", "arrests", "disrupts", "webinar"]),
        ("research",      ["opinion", "commentary", "analysis", "mistake", "sprawl", "worries", "worry", "study", "survey", "report", "ciso"]),
        ("technology",    ["ai", "cloud", "container", "api", "platform", "service"]),
    ]
    for label, kws in label_rules:
        if any(kw in text for kw in kws):
            return label

    return STATUS_LABEL_MAP.get(pred.get("status", ""), "research")

def load_existing_csv(path: str) -> list[tuple[str, str]]:
    rows = []
    try:
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                text  = row.get("text", "").strip()
                label = row.get("label", "").strip()
                if text and label:
                    rows.append((text, label))
        log(f"Loaded {len(rows)} existing training examples from {os.path.basename(path)}.")
    except FileNotFoundError:
        log(f"No existing training_data.csv found at {path}. Starting fresh.")
    return rows

def extract_classifier_json(pipeline, label_encoder) -> dict:
    """Convert sklearn pipeline to JSON for TypeScript inference."""
    tfidf = pipeline.named_steps["tfidf"]
    lr    = pipeline.named_steps["lr"]
    return {
        "vocabulary":    {v: int(k) for k, v in enumerate(tfidf.get_feature_names_out())},
        "idf":           tfidf.idf_.tolist(),
        "classes":       lr.classes_.tolist(),
        "coef":          lr.coef_.tolist(),
        "intercept":     lr.intercept_.tolist(),
        "ngram_range":   list(tfidf.ngram_range),
        "max_features":  tfidf.max_features,
        "sublinear_tf":  tfidf.sublinear_tf,
        "trained_at":    datetime.utcnow().isoformat(),
        "model_version": datetime.utcnow().strftime("v%Y%m%d"),
    }

def commit_file_to_github(local_path: str, repo_path: str, commit_message: str) -> bool:
    """Commit a file to GitHub using the REST API."""
    if not GITHUB_TOKEN:
        log(f"  WARN: GITHUB_TOKEN not set — skipping GitHub commit for {repo_path}")
        return False
    try:
        import urllib.request
        api_base = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{repo_path}"
        headers  = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
        }

        # Read file content
        with open(local_path, "rb") as f:
            content_b64 = base64.b64encode(f.read()).decode("utf-8")

        # Get current SHA (if file exists)
        sha = None
        try:
            req = urllib.request.Request(api_base, headers=headers)
            with urllib.request.urlopen(req) as resp:
                existing = json.loads(resp.read())
                sha = existing.get("sha")
        except Exception:
            pass  # New file

        payload = {
            "message": commit_message,
            "content": content_b64,
            "branch":  GITHUB_BRANCH,
        }
        if sha:
            payload["sha"] = sha

        data = json.dumps(payload).encode("utf-8")
        req  = urllib.request.Request(api_base, data=data, headers=headers, method="PUT")
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            log(f"  Committed {repo_path} → {result['commit']['sha'][:7]}")
            return True
    except Exception as e:
        log(f"  WARN: GitHub commit failed for {repo_path}: {e}")
        return False

def run_model_updater(db, client, job_id):
    # ── Imports ──────────────────────────────────────────────────
    try:
        from sklearn.pipeline import Pipeline
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, classification_report
        import numpy as np
    except ImportError as e:
        log(f"ERROR: sklearn not available: {e}")
        raise e

    # ── Load predictions ────────────────────────
    predictions = fetch_resolved_predictions(client)
    log(f"Retrieved {len(predictions)} resolved prediction(s).")

    # ── Build new labelled examples ───────────────────────────────
    new_examples: list[tuple[str, str]] = []
    for pred in predictions:
        text  = f"{pred.get('title', '')} {pred.get('hypothesis', '')} {pred.get('technology_context', '')}".strip()
        label = build_label_from_prediction(pred)
        if text:
            new_examples.append((text, label))
    log(f"Built {len(new_examples)} new training example(s) from predictions.")

    # ── Merge with existing CSV ───────────────────────────────────
    existing_examples = load_existing_csv(DATA_PATH)
    # Deduplicate by text
    existing_texts = {t for t, _ in existing_examples}
    merged = existing_examples + [(t, l) for t, l in new_examples if t not in existing_texts]
    log(f"Merged dataset: {len(merged)} total examples ({len(new_examples) - (len(merged) - len(existing_examples))} duplicates dropped).")

    if len(merged) < 20:
        log("ERROR: Not enough training examples (< 20). Skipping retrain.")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            notes=f"Skipped retrain: not enough training examples ({len(merged)} < 20)."
        )
        return

    texts  = [t for t, _ in merged]
    labels = [l for _, l in merged]

    # ── Load previous accuracy gate ───────────────────────────────
    previous_accuracy = 0.0
    if os.path.exists(CLF_PATH):
        try:
            with open(CLF_PATH, "rb") as f:
                prev_pipeline = pickle.load(f)
            if len(texts) >= 4:
                _, X_test, _, y_test = train_test_split(texts, labels, test_size=0.15, random_state=42, stratify=labels if len(set(labels)) > 1 else None)
                prev_preds = prev_pipeline.predict(X_test)
                previous_accuracy = accuracy_score(y_test, prev_preds)
                log(f"Previous model accuracy on held-out set: {previous_accuracy:.4f}")
        except Exception as e:
            log(f"WARN: Could not evaluate previous model: {e}. Gate disabled.")

    # ── Split & train ─────────────────────────────────────────────
    test_size = min(0.15, max(0.05, 10 / len(merged)))
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=test_size, random_state=42,
            stratify=labels if len(set(labels)) > 1 else None
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=test_size, random_state=42)

    log(f"Training on {len(X_train)} examples, validating on {len(X_test)}…")

    new_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=50_000, sublinear_tf=True)),
        ("lr",    LogisticRegression(C=5.0, max_iter=1000, class_weight="balanced")),
    ])
    new_pipeline.fit(X_train, y_train)

    new_preds    = new_pipeline.predict(X_test)
    new_accuracy = accuracy_score(y_test, new_preds)
    report_str   = classification_report(y_test, new_preds, zero_division=0)

    log(f"New model accuracy: {new_accuracy:.4f} | Previous: {previous_accuracy:.4f}")
    log(f"\nClassification Report:\n{report_str}")

    # ── Accuracy gate ─────────────────────────────────────────────
    if new_accuracy < previous_accuracy:
        log(f"GATE FAILED: new accuracy ({new_accuracy:.4f}) < previous ({previous_accuracy:.4f}). Model NOT saved.")
        # Store the rejected run metrics
        client.table("learning_metrics").insert({
            "metric_type": "model_retrain",
            "value": new_accuracy,
            "context": {
                "result": "rejected",
                "new_accuracy": new_accuracy,
                "previous_accuracy": previous_accuracy,
                "training_examples": len(X_train),
                "new_examples_added": len(new_examples),
            },
            "recorded_at": datetime.utcnow().isoformat(),
        }).execute()
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            rows_processed=len(new_examples),
            notes=f"Model gate failed: new accuracy ({new_accuracy:.4f}) < previous ({previous_accuracy:.4f}). Model not saved."
        )
        return

    # ── Save new model ────────────────────────────────────────────
    os.makedirs(MODELS_DIR, exist_ok=True)

    # Save .pkl
    with open(CLF_PATH, "wb") as f:
        pickle.dump(new_pipeline, f)
    log(f"Saved classifier.pkl → {CLF_PATH}")

    # Save .json for TypeScript
    clf_json = extract_classifier_json(new_pipeline, None)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(clf_json, f, indent=2)
    log(f"Saved classifier.json → {JSON_PATH}")

    # Save report
    report_meta = (
        f"Model version: {clf_json['model_version']}\n"
        f"Trained at:    {clf_json['trained_at']}\n"
        f"Training examples: {len(X_train)}\n"
        f"Test examples:     {len(X_test)}\n"
        f"New examples added: {len(new_examples)}\n"
        f"Accuracy: {new_accuracy:.4f}\n"
        f"Previous: {previous_accuracy:.4f}\n\n"
        f"{report_str}"
    )
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_meta)
    log(f"Saved training_report.txt → {REPORT_PATH}")

    # ── Update merged training CSV ────────────────────────────────
    with open(DATA_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        for text, label in merged:
            writer.writerow([text, label])
    log(f"Updated training_data.csv with {len(merged)} examples.")

    # ── Commit to GitHub ──────────────────────────────────────────
    version = clf_json["model_version"]
    msg = f"Phase 7: retrain classifier {version} | accuracy={new_accuracy:.4f} | +{len(new_examples)} new examples"
    commit_file_to_github(CLF_PATH,    "models/classifier.pkl",  msg)
    commit_file_to_github(JSON_PATH,   "models/classifier.json", msg)
    commit_file_to_github(DATA_PATH,   "models/training_data.csv", msg)

    # ── Store metrics ─────────────────────────────────────────────
    client.table("learning_metrics").insert({
        "metric_type": "model_retrain",
        "value": new_accuracy,
        "context": {
            "result": "accepted",
            "model_version": version,
            "new_accuracy": new_accuracy,
            "previous_accuracy": previous_accuracy,
            "training_examples": len(X_train),
            "test_examples": len(X_test),
            "new_examples_added": len(new_examples),
            "label_distribution": dict(
                zip(*np.unique(labels, return_counts=True))
            ) if labels else {},
        },
        "recorded_at": datetime.utcnow().isoformat(),
    }).execute()

    log("\nModel update complete.")
    log(f"  Version:  {version}")
    log(f"  Accuracy: {new_accuracy:.4f}")
    log(f"  Examples: {len(merged)} total (+{len(new_examples)} new)")
    log("=" * 60)

    db.update_job_log(
        job_id,
        datetime.utcnow(),
        status="success",
        rows_processed=len(new_examples),
        notes=f"Retrained classifier. Version: {version}. Accuracy: {new_accuracy:.4f} (previous: {previous_accuracy:.4f})."
    )

def main():
    log("=" * 60)
    log("CYBER TREE — Model Updater (Phase 7)")
    log("=" * 60)

    db = DBClient()
    if not db.use_supabase:
        log("ERROR: Supabase connection required for model updater.")
        sys.exit(1)

    job_id = db.log_job("model_updater", datetime.utcnow(), status="running")
    
    try:
        run_model_updater(db, db.client, job_id)
        log("=" * 60)
        log("Model Updater run complete.")
        log("=" * 60)
    except Exception as e:
        log(f"FATAL error in model updater: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        sys.exit(1)

if __name__ == "__main__":
    main()
