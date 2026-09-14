"""
source_discoverer.py — Cyber Tree Phase 8: Source Auto-Discovery
========================================================================
Queries existing nodes for external domains referenced, checks if they
have RSS feeds, validates feed quality (cybersecurity-related topics),
and inserts new unique sources into the database.

Usage:
    python scripts/source_discoverer.py
"""

import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import httpx
import feedparser
from datetime import datetime
from dotenv import load_dotenv

# Add scripts directory to path to load local modules
sys.path.append(os.path.dirname(__file__))
from db_client import DBClient
from classify import predict

load_dotenv()

COMMON_DOMAINS = {
    "github.com", "githubusercontent.com", "raw.githubusercontent.com",
    "microsoft.com", "mitre.org", "twitter.com", "linkedin.com", "nvd.nist.gov",
    "cisa.gov", "capec.mitre.org", "cwe.mitre.org", "youtube.com", "google.com",
    "facebook.com", "medium.com", "reddit.com", "wikipedia.org", "en.wikipedia.org",
    "owasp.org", "gmail.com", "outlook.com", "apple.com", "adobe.com",
    "oracle.com", "apache.org", "kernel.org", "ubuntu.com", "debian.org",
    "redhat.com", "npmtrends.com", "npmjs.com", "pypi.org", "docker.com",
    "amazon.com", "aws.amazon.com", "cloudflare.com", "localhost", "127.0.0.1",
    "t.co", "bit.ly", "tinyurl.com", "feedburner.com"
}

def log(msg: str):
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] {msg}", flush=True)

def get_referenced_domains(db, limit=1000):
    log("Fetching nodes to extract external referenced domains...")
    urls = []
    if db.use_supabase:
        try:
            # Select latest nodes
            res = db.client.table("nodes").select("source_url, content").limit(limit).execute()
            data = res.data or []
            for row in data:
                if row.get("source_url"):
                    urls.append(row["source_url"])
                if row.get("content"):
                    urls.append(row["content"])
        except Exception as e:
            log(f"Error querying nodes from Supabase: {e}")
    else:
        try:
            conn = db._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT source_url, content FROM nodes ORDER BY created_at DESC LIMIT ?", (limit,))
            for row in cursor.fetchall():
                if row[0]:
                    urls.append(row[0])
                if row[1]:
                    urls.append(row[1])
            conn.close()
        except Exception as e:
            log(f"Error querying nodes from SQLite: {e}")

    domains = set()
    domain_pattern = re.compile(r"https?://([^/\s?#]+)")
    for text in urls:
        if not text:
            continue
        found = domain_pattern.findall(text)
        for d in found:
            d = d.lower()
            if ":" in d:
                d = d.split(":")[0]
            if d.startswith("www."):
                d = d[4:]
            if len(d) > 3 and "." in d:
                domains.add(d)

    return list(domains)

def get_existing_source_domains(db):
    urls = []
    if db.use_supabase:
        try:
            res = db.client.table("sources").select("url").execute()
            urls = [row["url"] for row in res.data] if res.data else []
        except Exception as e:
            log(f"Error fetching sources from Supabase: {e}")
    else:
        try:
            conn = db._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT url FROM sources")
            urls = [row[0] for row in cursor.fetchall()]
            conn.close()
        except Exception as e:
            log(f"Error fetching sources from SQLite: {e}")

    existing_domains = set()
    domain_pattern = re.compile(r"https?://([^/\s?#]+)")
    for url in urls:
        found = domain_pattern.search(url)
        if found:
            d = found.group(1).lower()
            if ":" in d:
                d = d.split(":")[0]
            if d.startswith("www."):
                d = d[4:]
            existing_domains.add(d)
    return existing_domains

def probe_rss_feed(domain: str) -> tuple[str, list] | None:
    """Probes a domain for a valid feed. Returns (feed_url, entries) if found."""
    paths = ["/feed", "/rss", "/rss.xml", "/feed/", "/rss/"]
    for path in paths:
        url = f"https://{domain}{path}"
        try:
            log(f"  Probing feed URL: {url}")
            r = httpx.get(url, timeout=5.0, follow_redirects=True)
            if r.status_code == 200 and ("xml" in r.headers.get("content-type", "") or "rss" in r.text.lower() or "xml" in r.text[:100]):
                parsed = feedparser.parse(r.text)
                if parsed.entries and len(parsed.entries) > 0:
                    return url, parsed.entries
        except Exception:
            pass
    return None

def validate_feed_quality(entries: list) -> bool:
    """Validates feed quality: >5 entries and >= 40% cybersecurity-related titles."""
    if len(entries) <= 5:
        log(f"    Feed rejected: only has {len(entries)} entries (must have > 5).")
        return False

    security_count = 0
    checked_count = 0
    for entry in entries[:15]:  # test up to 15 entries
        title = entry.get("title", "")
        if not title:
            continue
        checked_count += 1
        # Classify the title
        pred = predict(title)
        # Check if the title classified as a security class with reasonable confidence
        is_security_class = pred.get("node_type") in ["malware", "technique", "threat_actor", "vulnerability", "weakness"]
        is_high_conf = pred.get("confidence", 0.0) >= 0.5
        
        # Or check common security terms directly as backup
        has_keywords = any(kw in title.lower() for kw in [
            "cve", "cyber", "security", "exploit", "hack", "vulnerability", "malware",
            "ransomware", "phishing", "threat actor", "zero-day", "breach", "patch", "cisa"
        ])

        if (is_security_class and is_high_conf) or has_keywords:
            security_count += 1

    if checked_count == 0:
        return False

    ratio = security_count / checked_count
    log(f"    Feed quality assessment: {security_count}/{checked_count} security-related titles ({ratio:.1%}).")
    return ratio >= 0.4

def insert_source(db, name: str, url: str) -> bool:
    import uuid
    source_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()
    notes = json.dumps({"discovered_by": "source_discoverer", "discovered_at": now_str})

    if db.use_supabase:
        try:
            db.client.table("sources").insert({
                "id": source_id,
                "name": name,
                "url": url,
                "category": "feed",
                "reliability": 0.3,
                "is_active": True,
                "notes": notes
            }).execute()
            return True
        except Exception as e:
            if "duplicate" in str(e) or "unique" in str(e):
                return False
            log(f"    Error inserting to Supabase: {e}")
            return False
    else:
        try:
            conn = db._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO sources (id, name, url, category, reliability, total_articles, last_checked, is_active, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (source_id, name, url, "feed", 0.3, 0, now_str, 1, notes)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            if "IntegrityError" in type(e).__name__:
                return False
            log(f"    Error inserting to SQLite: {e}")
            return False

def main():
    log("=" * 60)
    log("CYBER TREE — Source Auto-Discoverer (Phase 8)")
    log("=" * 60)

    db = DBClient()
    job_id = db.log_job("source_discoverer", datetime.utcnow(), status="running")

    try:
        # Get existing domains to avoid adding duplicates
        existing_domains = get_existing_source_domains(db)
        log(f"Loaded {len(existing_domains)} existing source domain(s) from database.")

        # Extract domains from referenced nodes
        candidates = get_referenced_domains(db, limit=1000)
        log(f"Extracted {len(candidates)} unique domain(s) from node history.")

        discovered_count = 0
        for domain in candidates:
            # Skip if common domain or already exists
            if domain in COMMON_DOMAINS or any(ext in domain for ext in ["google.", "apple.", "github.", "twitter.", "linkedin."]):
                continue
            if domain in existing_domains:
                continue

            log(f"Evaluating candidate domain: {domain}")
            feed_info = probe_rss_feed(domain)
            if feed_info:
                feed_url, entries = feed_info
                log(f"  Found RSS feed: {feed_url} ({len(entries)} entries)")
                
                # Validate feed quality
                if validate_feed_quality(entries):
                    name = domain.split(".")[0].capitalize() + " Blog"
                    if insert_source(db, name, feed_url):
                        discovered_count += 1
                        log(f"  [SUCCESS] Registered new source: {name} -> {feed_url}")
                        existing_domains.add(domain)  # Prevent dup within same run
                else:
                    log(f"  [SKIPPED] Quality checks failed for feed: {feed_url}")
            else:
                log(f"  [FAILED] No valid RSS feed found for domain: {domain}")

        log(f"Discovery run finished. Registered {discovered_count} new source(s).")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            notes=f"Scanned domains, discovered and added {discovered_count} new intelligence sources."
        )

    except Exception as e:
        log(f"FATAL error in source discoverer: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        sys.exit(1)

    log("=" * 60)
    log("Source Auto-Discoverer complete.")
    log("=" * 60)

if __name__ == "__main__":
    main()
