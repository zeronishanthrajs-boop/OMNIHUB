# ════════════════════════════════════════
# FILE: skills/get_calendar.py
# PURPOSE: Cached offline calendar event reporting.
# MODIFIES: memory/skills_cache.db
# ════════════════════════════════════════

from .common import connect_cache, now_iso

SKILL_NAME = "get_calendar"
SKILL_DESCRIPTION = "Return cached calendar events with offline fallback."
SKILL_PARAMETERS = {"type": "object", "properties": {}}


def execute() -> str:
    with connect_cache() as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS calendar_events(id INTEGER PRIMARY KEY, summary TEXT, start_time TEXT, last_synced TEXT)")
        rows = conn.execute("SELECT summary, start_time FROM calendar_events ORDER BY start_time LIMIT 5").fetchall()
        if rows:
            return "Upcoming calendar events: " + "; ".join(f"{row['summary']} at {row['start_time']}" for row in rows)
        conn.execute("INSERT INTO calendar_events(summary, start_time, last_synced) VALUES (?, ?, ?)", ("No cached events", "offline", now_iso()))
        conn.commit()
        return "No calendar events are cached for offline use."

