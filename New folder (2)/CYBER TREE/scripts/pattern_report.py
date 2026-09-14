"""
pattern_report.py — Cyber Tree Phase 5: Pattern Intelligence Report Generator
==========================================================================
Combines the latest cluster assignments and detected trends into a unified
weekly pattern summary report. Inserts the summary into the trends table.

Usage:
    python scripts/pattern_report.py
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

def main():
    log("=" * 60)
    log("CYBER TREE — Pattern Report Generator (Phase 5)")
    log("=" * 60)

    client = connect_supabase()

    # 1. Read cluster summaries
    cluster_summary_path = os.path.join("models", "cluster_summary.json")
    cluster_data = {}
    if os.path.exists(cluster_summary_path):
        try:
            with open(cluster_summary_path, "r") as f:
                cluster_data = json.load(f)
            log(f"Loaded cluster summary data from {cluster_summary_path}.")
        except Exception as e:
            log(f"Warning: Failed to load cluster summaries: {e}")
    else:
        log(f"Warning: {cluster_summary_path} not found. Proceeding with empty cluster list.")

    # Get top 3 largest clusters
    top_clusters = []
    if cluster_data:
        sorted_clusters = sorted(cluster_data.values(), key=lambda x: x.get("size", 0), reverse=True)
        top_clusters = sorted_clusters[:3]
        for c in top_clusters:
            log(f"Top Cluster: {c['label']} (Size: {c['size']})")

    # 2. Read latest trends from the trends table (from the last 24 hours)
    one_day_ago = (datetime.utcnow() - timedelta(days=1)).isoformat()
    trends = []
    try:
        res = (
            client.table("trends")
            .select("*")
            .eq("pattern_type", "trend")
            .gte("detected_at", one_day_ago)
            .order("confidence", desc=True)
            .execute()
        )
        trends = res.data or []
        log(f"Fetched {len(trends)} recent trends from the database.")
    except Exception as e:
        log(f"Warning: Failed to fetch recent trends: {e}")

    # 3. Formulate description
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    parts = []
    parts.append(f"Weekly Intelligence Summary ({date_str}).")
    
    # Add cluster info
    if top_clusters:
        cluster_text = "The knowledge base is organized into 30 semantic clusters. The most active are: " + ", ".join([f"'{c['label']}' ({c['size']} nodes)" for c in top_clusters]) + "."
        parts.append(cluster_text)
        
    # Add trends info
    if trends:
        trend_descriptions = [t["description"] for t in trends[:3]]
        trend_text = f"We detected {len(trends)} Week-over-Week growth trends. Significant shifts: " + "; ".join(trend_descriptions) + "."
        parts.append(trend_text)
    else:
        parts.append("No significant Week-over-Week growth trends were detected this period.")

    description = " ".join(parts)
    log(f"Generated Summary Description: {description}")

    # Gather supporting node IDs from top trends
    supporting_nodes = []
    for t in trends[:5]:
        nodes = t.get("supporting_nodes") or []
        supporting_nodes.extend(nodes)
    # Deduplicate
    supporting_nodes = list(set(supporting_nodes))[:50]  # Limit to 50 nodes

    # 4. Insert summary report into Supabase trends table
    report_metadata = {
        "total_clusters": len(cluster_data),
        "total_trends_detected": len(trends),
        "top_clusters": [
            {
                "id": c["id"],
                "label": c["label"],
                "size": c["size"]
            }
            for c in top_clusters
        ],
        "top_trends": [
            {
                "description": t["description"],
                "confidence": t["confidence"]
            }
            for t in trends[:5]
        ]
    }

    report_record = {
        "pattern_type": "summary",
        "description": description,
        "supporting_nodes": supporting_nodes,
        "confidence": 0.95,
        "metadata": report_metadata
    }

    log("Inserting weekly pattern summary into Supabase trends table...")
    try:
        client.table("trends").insert(report_record).execute()
        log("Weekly pattern summary stored successfully.")
    except Exception as e:
        log(f"ERROR inserting weekly pattern summary: {e}")

    # Log job success
    try:
        client.table("job_logs").insert({
            "job_name": "pattern_report",
            "started_at": datetime.utcnow().isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "status": "success",
            "rows_processed": len(trends),
            "notes": "Generated and stored weekly pattern summary report."
        }).execute()
    except Exception as e:
        log(f"Warning: Failed to log job: {e}")

if __name__ == "__main__":
    main()
