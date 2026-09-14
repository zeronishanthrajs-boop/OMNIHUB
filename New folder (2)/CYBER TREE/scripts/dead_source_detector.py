"""
dead_source_detector.py — Cyber Tree Phase 8: Dead Source Detection
========================================================================
Probes active sources to check if they are responsive. If a source fails
3 consecutive times, it is marked inactive. Attempts to search for
alternative replacement feed URLs.

Usage:
    python scripts/dead_source_detector.py
"""

import os
import sys
import json
import httpx
import feedparser
from datetime import datetime
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv

# Add scripts directory to path to load local modules
sys.path.append(os.path.dirname(__file__))
from db_client import DBClient

load_dotenv()

def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)

def find_replacement_url(url: str) -> str | None:
    """Probes variations of the URL to see if a working alternative exists."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        path = parsed.path
    except Exception:
        return None

    # Alternative domains
    domains = []
    if domain.startswith("www."):
        domains.append(domain[4:])
    else:
        domains.append(f"www.{domain}")

    # Alternative paths
    paths = ["/feed", "/rss", "/rss.xml", "/feed/", "/rss/"]
    if path not in paths:
        paths.insert(0, path)

    # Test combinations
    for d in [domain] + domains:
        for p in paths:
            candidate_url = urlunparse((parsed.scheme, d, p, "", "", ""))
            if candidate_url == url:
                continue
            try:
                log(f"    Testing alternative: {candidate_url}")
                # Use GET because HEAD might get blocked or not return XML feed
                r = httpx.get(candidate_url, timeout=5.0, follow_redirects=True)
                if r.status_code == 200:
                    parsed_feed = feedparser.parse(r.text)
                    if parsed_feed.entries and len(parsed_feed.entries) > 0:
                        log(f"    [SUCCESS] Found working replacement feed: {candidate_url}")
                        return candidate_url
            except Exception:
                pass
    return None

def update_source_record(db, source_id: str, updates: dict) -> bool:
    if db.use_supabase:
        try:
            db.client.table("sources").update(updates).eq("id", source_id).execute()
            return True
        except Exception as e:
            log(f"  Error updating source in Supabase: {e}")
            return False
    else:
        try:
            conn = db._get_sqlite_conn()
            cursor = conn.cursor()
            
            # Translate keys
            set_clauses = []
            params = []
            for k, v in updates.items():
                if k == "is_active":
                    set_clauses.append("is_active = ?")
                    params.append(1 if v else 0)
                else:
                    set_clauses.append(f"{k} = ?")
                    params.append(v)
            params.append(source_id)
            
            query = f"UPDATE sources SET {', '.join(set_clauses)} WHERE id = ?"
            cursor.execute(query, tuple(params))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            log(f"  Error updating source in SQLite: {e}")
            return False

def main():
    log("=" * 60)
    log("CYBER TREE — Dead Source Detector (Phase 8)")
    log("=" * 60)

    db = DBClient()
    job_id = db.log_job("dead_source_detector", datetime.utcnow(), status="running")

    # Fetch active sources
    sources = []
    if db.use_supabase:
        try:
            res = db.client.table("sources").select("*").eq("is_active", True).execute()
            sources = res.data or []
        except Exception as e:
            log(f"Error querying active sources from Supabase: {e}")
    else:
        try:
            conn = db._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sources WHERE is_active = 1")
            sources = [dict(r) for r in cursor.fetchall()]
            for s in sources:
                s["is_active"] = True
            conn.close()
        except Exception as e:
            log(f"Error querying active sources from SQLite: {e}")

    log(f"Found {len(sources)} active source(s) to verify.")

    checked_count = 0
    deactivated_count = 0
    updated_count = 0
    notes_list = []

    for src in sources:
        source_id = src["id"]
        name = src["name"]
        url = src["url"]
        
        log(f"Probing source '{name}' ({url})...")
        checked_count += 1
        
        # Parse notes field
        notes_str = src.get("notes") or ""
        try:
            notes_data = json.loads(notes_str) if notes_str.strip() else {}
            if not isinstance(notes_data, dict):
                notes_data = {"notes_raw": notes_str}
        except Exception:
            notes_data = {"notes_raw": notes_str}

        failures = notes_data.get("consecutive_failures", 0)
        now_str = datetime.utcnow().isoformat()

        # Probe the URL
        failed = False
        err_msg = ""
        try:
            # Try HEAD first for speed; fallback to GET
            r = httpx.head(url, timeout=5.0, follow_redirects=True)
            if r.status_code == 405:
                r = httpx.get(url, timeout=5.0, follow_redirects=True)
            if r.status_code == 404 or r.status_code >= 500:
                failed = True
                err_msg = f"HTTP Status {r.status_code}"
        except Exception as e:
            failed = True
            err_msg = str(e)

        if failed:
            failures += 1
            log(f"  [FAILED] Probe failed for {name}. Errors: {err_msg}. Consecutive failures: {failures}/3")
            notes_data["consecutive_failures"] = failures
            notes_data["last_failure_at"] = now_str
            notes_data["last_failure_reason"] = err_msg

            updates = {
                "notes": json.dumps(notes_data),
                "last_checked": now_str
            }

            if failures >= 3:
                log(f"  Source '{name}' reached 3 failures. Searching for replacement URL...")
                replacement_url = find_replacement_url(url)
                if replacement_url:
                    log(f"  [REPLACED] Updating feed URL to: {replacement_url}")
                    notes_data["consecutive_failures"] = 0
                    notes_data["url_replaced_from"] = url
                    notes_data["url_replaced_at"] = now_str
                    updates["url"] = replacement_url
                    updates["notes"] = json.dumps(notes_data)
                    updated_count += 1
                    notes_list.append(f"Source '{name}' URL updated to replacement: {replacement_url}")
                else:
                    log(f"  [DEACTIVATED] No replacement URL found. Marking source inactive.")
                    updates["is_active"] = False
                    deactivated_count += 1
                    notes_list.append(f"Deactivated source '{name}' (dead URL: {url})")

            update_source_record(db, source_id, updates)
        else:
            log(f"  [SUCCESS] Source '{name}' is active.")
            if failures > 0 or notes_data.get("consecutive_failures"):
                notes_data["consecutive_failures"] = 0
                
            updates = {
                "notes": json.dumps(notes_data),
                "last_checked": now_str
            }
            update_source_record(db, source_id, updates)

    summary_note = f"Checked {checked_count} sources. Deactivated {deactivated_count}. Updated {updated_count} URLs."
    if notes_list:
        summary_note += " Details: " + "; ".join(notes_list)

    log(f"Run summary: {summary_note}")
    db.update_job_log(
        job_id,
        datetime.utcnow(),
        status="success",
        notes=summary_note
    )

    log("=" * 60)
    log("Dead Source Detector complete.")
    log("=" * 60)

if __name__ == "__main__":
    main()
