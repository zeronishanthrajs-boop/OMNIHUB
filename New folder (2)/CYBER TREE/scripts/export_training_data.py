"""
export_training_data.py — CYBER TREE Phase 4: ML Classification
================================================================
Exports labeled training data from Supabase nodes table.
Selects all nodes with confidence > 0.7 as ground-truth labels.
Saves to models/training_data.csv with columns: title, summary, node_type

Usage:
    python scripts/export_training_data.py
"""

import os
import csv
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "training_data.csv")
PAGE_SIZE = 1000

# Target classes — must match node_type values in DB
TARGET_CLASSES = {
    "vulnerability", "threat_actor", "malware",
    "technique", "tool", "weakness", "research", "news"
}


def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)


    res = (
        client.table("nodes")
        .select("title, summary, node_type, confidence, metadata")
        .gt("confidence", 0.7)
        .in_("node_type", list(TARGET_CLASSES))
        .range(offset, offset + PAGE_SIZE - 1)
        .execute()
    )
    return res.data or []


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("ERROR: SUPABASE_URL and SUPABASE_KEY must be set.")
        sys.exit(1)

    try:
        from supabase import create_client
    except ImportError:
        log("ERROR: supabase-py not installed. Run: pip install supabase")
        sys.exit(1)

    log("=" * 60)
    log("CYBER TREE — Training Data Export (Phase 4)")
    log(f"Output: {os.path.abspath(OUTPUT_PATH)}")
    log("=" * 60)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Ensure models/ directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    total = 0
    skipped = 0
    class_counts: dict = {}
    offset = 0

    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()

        while True:
            rows = fetch_page(client, offset)
            if not rows:
                break

            for row in rows:
                meta = row.get("metadata") or {}
                if meta.get("archived_reason") == "synthetic-mock-data-phase13-removal":
                    skipped += 1
                    continue

                node_type = row.get("node_type", "").strip()
                title = (row.get("title") or "").strip()
                summary = (row.get("summary") or "").strip()

                # Skip rows that lack usable text or valid class
                if not title or node_type not in TARGET_CLASSES:
                    skipped += 1
                    continue

                # Build combined text feature: title + summary (truncated)
                text = f"{title} {summary[:300]}".strip()

                writer.writerow({"text": text, "label": node_type})
                total += 1
                class_counts[node_type] = class_counts.get(node_type, 0) + 1

            log(f"  Fetched offset={offset}, batch={len(rows)}, total_so_far={total}")

            if len(rows) < PAGE_SIZE:
                break
            offset += PAGE_SIZE

    log("=" * 60)
    log(f"EXPORT COMPLETE: {total} samples written | {skipped} skipped")
    log("Class distribution:")
    for cls, cnt in sorted(class_counts.items(), key=lambda x: -x[1]):
        log(f"  {cls}: {cnt}")
    log("=" * 60)


if __name__ == "__main__":
    main()
