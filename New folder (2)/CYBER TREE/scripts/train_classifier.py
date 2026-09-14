"""
train_classifier.py — CYBER TREE Phase 4: ML Classification
=============================================================
Trains a TF-IDF + LogisticRegression classifier on the exported
labeled training data (models/training_data.csv).

Outputs:
  models/classifier.pkl   — serialised Pipeline (TfidfVectorizer + LR)
  models/classifier.json  — serialised weights for TypeScript inference
  models/training_report.txt — classification report + metadata

Usage:
    python scripts/train_classifier.py
"""

import os
import csv
import sys
import json
import pickle
from datetime import datetime
from collections import Counter


def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)


def load_training_data(path: str):
    texts, labels = [], []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = row.get("text", "").strip()
            label = row.get("label", "").strip()
            if text and label:
                texts.append(text)
                labels.append(label)
    return texts, labels


def main():
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    data_path = os.path.join(models_dir, "training_data.csv")
    clf_path = os.path.join(models_dir, "classifier.pkl")
    json_path = os.path.join(models_dir, "classifier.json")
    report_path = os.path.join(models_dir, "training_report.txt")

    log("=" * 60)
    log("CYBER TREE — Classifier Training (Phase 4)")
    log("=" * 60)

    # --- Imports ---
    try:
        from sklearn.pipeline import Pipeline
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import classification_report, accuracy_score
    except ImportError as e:
        log(f"ERROR: scikit-learn not installed or blocked: {e}")
        sys.exit(1)

    # --- Load data ---
    if not os.path.exists(data_path):
        log(f"ERROR: Training data not found at {data_path}. Run export_training_data.py first.")
        sys.exit(1)

    log(f"Loading training data from {data_path} ...")
    texts, labels = load_training_data(data_path)
    log(f"Loaded {len(texts)} samples.")

    dist = Counter(labels)
    log("Class distribution:")
    for cls, cnt in sorted(dist.items(), key=lambda x: -x[1]):
        log(f"  {cls}: {cnt} ({cnt/len(labels)*100:.1f}%)")

    # --- Train / test split (80/20 stratified) ---
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.20, random_state=42, stratify=labels
    )
    log(f"Split: {len(X_train)} train / {len(X_test)} test")

    # --- Build pipeline ---
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),   # unigrams + bigrams
            max_features=50000,
            sublinear_tf=True,    # log-scale TF
            min_df=2,
            strip_accents="unicode",
            analyzer="word",
        )),
        ("clf", LogisticRegression(
            C=5.0,
            max_iter=1000,
            class_weight="balanced",  # handle class imbalance
            solver="lbfgs",
        )),
    ])

    log("Training TF-IDF + LogisticRegression pipeline ...")
    pipeline.fit(X_train, y_train)
    log("Training complete.")

    # --- Evaluate ---
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, digits=4)

    log(f"Test accuracy: {acc*100:.2f}%")
    log("Classification report:")
    for line in report.split("\n"):
        log(f"  {line}")

    # --- Save pipeline ---
    os.makedirs(models_dir, exist_ok=True)
    with open(clf_path, "wb") as f:
        pickle.dump(pipeline, f)
    log(f"Classifier saved to {clf_path}")

    # --- Save JSON weights for TS inference ---
    log("Exporting weights to JSON format for TS implementation...")
    tfidf = pipeline.named_steps["tfidf"]
    clf = pipeline.named_steps["clf"]

    # Vocabulary mapping and idf values
    vocab = tfidf.vocabulary_
    idf = tfidf.idf_.tolist()

    # Sort coefficients and intercepts
    classifier_json = {
        "classes": clf.classes_.tolist(),
        "vocabulary": {word: int(idx) for word, idx in vocab.items()},
        "idf": idf,
        "coef": clf.coef_.tolist(),
        "intercept": clf.intercept_.tolist(),
        "sublinear_tf": bool(tfidf.sublinear_tf),
        "ngram_range": list(tfidf.ngram_range)
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(classifier_json, f, separators=(',', ':'))
    log(f"JSON classifier saved to {json_path}")

    # --- Save training report ---
    meta = {
        "trained_at": datetime.utcnow().isoformat(),
        "total_samples": len(texts),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "test_accuracy": round(acc, 6),
        "classes": sorted(dist.keys()),
        "class_distribution": {k: v for k, v in sorted(dist.items())},
        "model": "TfidfVectorizer(ngram_range=(1,2), max_features=50000) + LogisticRegression(C=5.0, class_weight=balanced)",
    }
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=== CYBER TREE Classifier Training Report ===\n\n")
        f.write(json.dumps(meta, indent=2))
        f.write("\n\n=== Classification Report ===\n\n")
        f.write(report)
    log(f"Training report saved to {report_path}")

    log("=" * 60)
    log(f"DONE — accuracy={acc*100:.2f}%")
    log("=" * 60)


if __name__ == "__main__":
    main()
