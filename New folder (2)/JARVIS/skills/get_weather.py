# ════════════════════════════════════════
# FILE: skills/get_weather.py
# PURPOSE: Weather lookup with SQLite offline cache.
# MODIFIES: memory/skills_cache.db
# ════════════════════════════════════════

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta

import requests

from .common import connect_cache, now_iso

SKILL_NAME = "get_weather"
SKILL_DESCRIPTION = "Get current weather with cached offline fallback."
SKILL_PARAMETERS = {"type": "object", "properties": {"city": {"type": "string"}}}


def _init(conn: sqlite3.Connection) -> None:
    conn.execute("CREATE TABLE IF NOT EXISTS weather(city TEXT PRIMARY KEY, report TEXT, timestamp TEXT)")
    conn.commit()


def execute(city: str = "Bengaluru") -> str:
    city = (city or "Bengaluru").strip()
    with connect_cache() as conn:
        _init(conn)
        try:
            response = requests.get(f"https://wttr.in/{city}?format=3", timeout=5)
            response.raise_for_status()
            report = response.text.strip()
            conn.execute("INSERT OR REPLACE INTO weather(city, report, timestamp) VALUES (?, ?, ?)", (city.lower(), report, now_iso()))
            conn.commit()
            return report
        except Exception:
            row = conn.execute("SELECT report, timestamp FROM weather WHERE city=?", (city.lower(),)).fetchone()
            if row:
                age = datetime.utcnow() - datetime.fromisoformat(row["timestamp"])
                age_text = "fresh" if age < timedelta(minutes=30) else f"last updated {row['timestamp']} UTC"
                return f"{row['report']} ({age_text}, offline cache)."
            return "Weather unavailable offline."

