"""
classify.py — CYBER TREE Phase 4: Standalone Classification Helper
====================================================================
Loads the trained classifier and exposes a predict(text) helper.
Supports two prediction modes:
  1. Scikit-learn Pipeline (using models/classifier.pkl)
  2. Pure Numpy Fallback (using models/classifier.json) if sklearn is blocked/missing
  3. Simple Keyword Fallback if no model weights are found

Usage (as library):
    from classify import predict
    result = predict("Ransomware group LockBit targeting hospitals")
    # {"node_type": "malware", "confidence": 0.91}
"""

import os
import re
import json
import pickle
import sys
import numpy as np
from functools import lru_cache

MODEL_PKL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "classifier.pkl")
MODEL_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "classifier.json")

# Fallback keyword rules (same as original classify_node_type in process.py)
def keyword_fallback(text: str) -> dict:
    combined = text.lower()
    
    # Check CVEs
    if re.search(r"cve-\d{4}-\d{4,7}", combined):
        pred = "vulnerability"
    # Check APTs / Threat Actors
    elif any(actor in combined for actor in ["apt", "threat actor", "intrusion set", "lazarus", "fancy bear", "cozy bear", "sandworm", "lockbit", "alphv"]):
        pred = "threat_actor"
    # Check Malware
    elif any(mw in combined for mw in ["malware", "ransomware", "trojan", "spyware", "backdoor", "rootkit", "worm", "stealer", "loader"]):
        pred = "malware"
    # Check Technique
    elif any(tq in combined for tq in ["technique", "ttp", "mitre attack", "initial access", "privilege escalation", "lateral movement"]):
        pred = "technique"
    # Check Weakness
    elif any(wk in combined for wk in ["cwe-", "weakness", "owasp", "sql injection", "cross-site scripting", "xss"]):
        pred = "weakness"
    # Check Tool
    elif any(t in combined for t in ["tool", "utility", "software", "framework", "library", "platform"]):
        pred = "tool"
    # Check News
    elif any(ns in combined for ns in ["interpol", "fbi", "doj", "seizes", "seize", "arrests", "arrested", "takedown", "disrupts", "court", "sues", "indictment", "law enforcement", "bulletin", "advisory"]):
        pred = "news"
    # Check Research
    elif any(rs in combined for rs in ["opinion", "commentary", "analysis", "mistake", "sprawl", "worries", "worry", "study", "survey", "report", "trends", "ciso", "cybersecurity storytelling", "slop", "vibe"]):
        pred = "research"
    # Default
    else:
        pred = "vulnerability"
        
    return {
        "node_type": pred,
        "confidence": 0.7,
        "all_scores": {pred: 1.0},
        "fallback": True
    }


@lru_cache(maxsize=1)
def load_classifier():
    """
    Attempts to load the classifier.
    Returns a tuple of (mode, classifier_data).
    Modes can be: 'sklearn', 'numpy', or 'keyword'.
    """
    # 1. Try sklearn mode
    try:
        from sklearn.pipeline import Pipeline
        if os.path.exists(MODEL_PKL_PATH):
            with open(MODEL_PKL_PATH, "rb") as f:
                pipeline = pickle.load(f)
                return "sklearn", pipeline
    except Exception as e:
        print(f"[classify] Sklearn load failed or blocked: {e}. Trying numpy fallback...", file=sys.stderr)

    # 2. Try numpy/JSON mode
    if os.path.exists(MODEL_JSON_PATH):
        try:
            with open(MODEL_JSON_PATH, "r", encoding="utf-8") as f:
                weights = json.load(f)
                # Convert list of lists to numpy arrays
                weights["coef"] = np.array(weights["coef"])
                weights["intercept"] = np.array(weights["intercept"])
                weights["idf"] = np.array(weights["idf"])
                return "numpy", weights
        except Exception as e:
            print(f"[classify] Numpy weights load failed: {e}", file=sys.stderr)

    print("[classify] Using basic keyword rules fallback.", file=sys.stderr)
    return "keyword", None


def predict(text: str) -> dict:
    """
    Predict node_type and confidence for a piece of text.
    """
    text = text.strip()
    if not text:
        return {"node_type": "vulnerability", "confidence": 0.0, "all_scores": {}}

    mode, clf = load_classifier()

    if mode == "sklearn":
        try:
            node_type = clf.predict([text])[0]
            proba = clf.predict_proba([text])[0]
            classes = clf.classes_
            all_scores = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}
            confidence = round(float(max(proba)), 4)
            return {
                "node_type": node_type,
                "confidence": confidence,
                "all_scores": all_scores,
                "method": "sklearn"
            }
        except Exception as e:
            print(f"[classify] Sklearn predict failed: {e}. Falling back to numpy/keyword...", file=sys.stderr)
            # Fall through to other modes if sklearn fails at runtime

    if mode == "numpy" or (mode == "sklearn" and os.path.exists(MODEL_JSON_PATH)):
        try:
            # Load json if not already loaded (in case sklearn failed at runtime)
            if mode == "sklearn":
                with open(MODEL_JSON_PATH, "r", encoding="utf-8") as f:
                    weights = json.load(f)
                    weights["coef"] = np.array(weights["coef"])
                    weights["intercept"] = np.array(weights["intercept"])
                    weights["idf"] = np.array(weights["idf"])
            else:
                weights = clf

            # Simple TF-IDF + Logistic Regression inference in Python/Numpy
            vocab = weights["vocabulary"]
            idf = weights["idf"]
            coef = weights["coef"]
            intercept = weights["intercept"]
            classes = weights["classes"]
            sublinear_tf = weights.get("sublinear_tf", True)

            # Tokenize: regex matching standard scikit-learn word analyzer: (?u)\b\w\w+\b
            tokens = re.findall(r"\b\w\w+\b", text.lower())
            
            # Extract unigrams and bigrams
            features = []
            features.extend(tokens)
            if weights.get("ngram_range", [1, 1])[1] > 1:
                bigrams = [f"{t1} {t2}" for t1, t2 in zip(tokens[:-1], tokens[1:])]
                features.extend(bigrams)

            # Count term frequencies
            counts = {}
            for feat in features:
                if feat in vocab:
                    counts[feat] = counts.get(feat, 0) + 1

            # Build vector
            vector = np.zeros(len(vocab))
            for feat, count in counts.items():
                idx = vocab[feat]
                tf = float(count)
                if sublinear_tf:
                    tf = 1.0 + np.log(tf)
                vector[idx] = tf * idf[idx]

            # L2 normalize
            norm = np.linalg.norm(vector)
            if norm > 0:
                vector = vector / norm

            # Logistic Regression predict: scores = W * x + b
            scores = np.dot(coef, vector) + intercept

            # Softmax
            exp_scores = np.exp(scores - np.max(scores)) # numerical stability
            probs = exp_scores / np.sum(exp_scores)

            pred_idx = np.argmax(probs)
            pred_class = classes[pred_idx]
            confidence = round(float(probs[pred_idx]), 4)
            all_scores = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}

            return {
                "node_type": pred_class,
                "confidence": confidence,
                "all_scores": all_scores,
                "method": "numpy"
            }
        except Exception as e:
            print(f"[classify] Numpy predict failed: {e}", file=sys.stderr)

    return keyword_fallback(text)


if __name__ == "__main__":
    # Smoke-test prediction
    samples = [
        "CVE-2024-1234: Remote code execution in Apache Log4j vulnerability",
        "LockBit ransomware group encrypts hospital database with malware payload",
        "APT29 Cozy Bear phishing campaign targeted government",
        "MITRE ATT&CK T1059 Command and Scripting Interpreter execution technique",
        "CWE-79 Improper Neutralization of Input web application vulnerability",
    ]
    print("Smoke-testing classify.predict:")
    for s in samples:
        r = predict(s)
        method = r.get("method", "keyword")
        print(f"  [{r['node_type']:15s}] conf={r['confidence']:.4f} (method={method}) \"{s[:60]}...\"")
