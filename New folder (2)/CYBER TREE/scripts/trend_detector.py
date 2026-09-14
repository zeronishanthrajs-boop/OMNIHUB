"""
trend_detector.py — Cyber Tree Phase 5: Pattern Intelligence Trend Detection
========================================================================
Queries nodes from the last 14 days, groups them by week, and detects
growth trends of >50% Week-over-Week (WoW) in node_type or tags.
Stores findings in the trends database table.

Usage:
    python scripts/trend_detector.py
"""

import os
import sys
import json
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

def parse_date(date_str):
    try:
        clean_str = date_str.split('+')[0].split('Z')[0]
        return datetime.fromisoformat(clean_str)
    except Exception:
        return datetime.utcnow()

def main():
    log("=" * 60)
    log("CYBER TREE — Trend Detector Pipeline (Phase 5)")
    log("=" * 60)

    client = connect_supabase()

    now = datetime.utcnow()
    # Define week boundaries
    # Week 1 (Current): [now - 7 days, now]
    # Week 2 (Previous): [now - 14 days, now - 7 days]
    w1_start = now - timedelta(days=7)
    w2_start = now - timedelta(days=14)

    # Fetch nodes created in the last 14 days
    log("Fetching nodes from the last 14 days...")
    offset = 0
    limit = 1000
    all_nodes = []
    
    while True:
        try:
            res = (
                client.table("nodes")
                .select("id, node_type, tags, created_at")
                .gte("created_at", w2_start.isoformat())
                .range(offset, offset + limit - 1)
                .execute()
            )
            data = res.data or []
            all_nodes.extend(data)
            if len(data) < limit:
                break
            offset += limit
        except Exception as e:
            log(f"ERROR fetching nodes for trend detection: {e}")
            break

    log(f"Fetched {len(all_nodes)} nodes from the last 14 days.")

    # Group nodes into Week 1 and Week 2
    w1_nodes = []
    w2_nodes = []

    for n in all_nodes:
        created_at = parse_date(n["created_at"])
        if created_at >= w1_start:
            w1_nodes.append(n)
        else:
            w2_nodes.append(n)

    log(f"Week 1 (Current): {len(w1_nodes)} nodes | Week 2 (Previous): {len(w2_nodes)} nodes")

    # Group counts
    # 1. By node_type
    w1_types = {}
    w2_types = {}
    w1_type_nodes = {}  # type -> list of node IDs (supporting nodes)

    for n in w1_nodes:
        nt = n["node_type"]
        w1_types[nt] = w1_types.get(nt, 0) + 1
        if nt not in w1_type_nodes:
            w1_type_nodes[nt] = []
        w1_type_nodes[nt].append(n["id"])

    for n in w2_nodes:
        nt = n["node_type"]
        w2_types[nt] = w2_types.get(nt, 0) + 1

    # 2. By tags
    w1_tags = {}
    w2_tags = {}
    w1_tag_nodes = {}  # tag -> list of node IDs

    for n in w1_nodes:
        tags = n.get("tags") or []
        for tag in tags:
            w1_tags[tag] = w1_tags.get(tag, 0) + 1
            if tag not in w1_tag_nodes:
                w1_tag_nodes[tag] = []
            w1_tag_nodes[tag].append(n["id"])

    for n in w2_nodes:
        tags = n.get("tags") or []
        for tag in tags:
            w2_tags[tag] = w2_tags.get(tag, 0) + 1

    trends_to_insert = []

    # Detect trends in node types
    # Minimum count threshold: current week count >= 3 to avoid tiny numbers
    for nt, c1 in w1_types.items():
        c2 = w2_types.get(nt, 0)
        if c1 >= 3:
            if c2 == 0:
                growth = 1.0  # 100% growth or new type detected
            else:
                growth = (c1 - c2) / c2
            
            if growth >= 0.50:  # >50% WoW
                log(f"Trend detected: Node type '{nt}' grew by {growth*100:.1f}% WoW (from {c2} to {c1} nodes).")
                trends_to_insert.append({
                    "pattern_type": "trend",
                    "description": f"Node type '{nt.replace('_', ' ').title()}' grew by {growth*100:.1f}% week-over-week (from {c2} to {c1} nodes).",
                    "supporting_nodes": w1_type_nodes[nt],
                    "confidence": min(1.0, 0.5 + (growth / 2.0)),
                    "metadata": {
                        "item_type": "node_type",
                        "item_value": nt,
                        "current_week_count": c1,
                        "previous_week_count": c2,
                        "growth_rate": growth
                    }
                })

    # Detect trends in tags
    for tag, c1 in w1_tags.items():
        c2 = w2_tags.get(tag, 0)
        if c1 >= 3:
            if c2 == 0:
                growth = 1.0
            else:
                growth = (c1 - c2) / c2
            
            if growth >= 0.50:  # >50% WoW
                log(f"Trend detected: Tag '{tag}' grew by {growth*100:.1f}% WoW (from {c2} to {c1} nodes).")
                trends_to_insert.append({
                    "pattern_type": "trend",
                    "description": f"Tag '{tag}' grew by {growth*100:.1f}% week-over-week (from {c2} to {c1} nodes).",
                    "supporting_nodes": w1_tag_nodes[tag],
                    "confidence": min(1.0, 0.5 + (growth / 2.0)),
                    "metadata": {
                        "item_type": "tag",
                        "item_value": tag,
                        "current_week_count": c1,
                        "previous_week_count": c2,
                        "growth_rate": growth
                    }
                })

    # Save to Supabase trends table
    if trends_to_insert:
        log(f"Inserting {len(trends_to_insert)} detected trends into trends table...")
        try:
            client.table("trends").insert(trends_to_insert).execute()
            log("Trends stored successfully.")
        except Exception as e:
            log(f"ERROR inserting trends: {e}")
    else:
        log("No trends met the >50% WoW growth threshold this week.")

    # Log job success
    try:
        client.table("job_logs").insert({
            "job_name": "trend_detector",
            "started_at": now.isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "status": "success",
            "rows_processed": len(all_nodes),
            "notes": f"Processed {len(all_nodes)} nodes. Detected {len(trends_to_insert)} trends."
        }).execute()
    except Exception as e:
        log(f"Warning: Failed to log job: {e}")

if __name__ == "__main__":
    main()
