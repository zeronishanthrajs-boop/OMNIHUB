# ════════════════════════════════════════
# FILE: skills/reminder.py
# PURPOSE: SQLite reminder creation, listing, cancellation, and due polling.
# MODIFIES: memory/reminders.db
# ════════════════════════════════════════

from __future__ import annotations

import os
import sqlite3
import re
from datetime import datetime, timedelta
from difflib import SequenceMatcher

try:
    import dateparser
except Exception:
    dateparser = None

try:
    from fuzzywuzzy import process
except Exception:
    process = None

from config_loader import rel_path

SKILL_NAME = "reminder"
SKILL_DESCRIPTION = "Set, list, and cancel reminders."
SKILL_PARAMETERS = {
    "type": "object",
    "properties": {
        "action": {"type": "string"},
        "message": {"type": "string"},
        "time_expression": {"type": "string"},
        "description": {"type": "string"},
    },
    "required": ["action"],
}

DB_PATH = rel_path(os.path.join("memory", "reminders.db"))


def _conn() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.execute("PRAGMA busy_timeout=30000")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reminders(id INTEGER PRIMARY KEY, message TEXT, trigger_time TEXT, created_at TEXT, fired INTEGER DEFAULT 0)"
    )
    conn.commit()
    return conn


def execute(action: str, message: str = "", time_expression: str = "", description: str = "") -> str:
    action = action.lower().strip()
    if action in {"set", "set_reminder", "create", "add"}:
        return set_reminder(message, time_expression)
    if action in {"list", "list_reminders", "show"}:
        return list_reminders()
    if action in {"cancel", "cancel_reminder", "delete"}:
        return cancel_reminder(description or message)
    return "Unknown reminder action."


def _parse_time_expression(time_expression: str) -> datetime | None:
    expression = (time_expression or "").strip().lower()
    if not expression:
        return None
    if dateparser:
        parsed = dateparser.parse(expression, settings={"PREFER_DATES_FROM": "future"})
        if parsed:
            return parsed
    relative = re.match(r"^in\s+(\d+)\s*(second|seconds|minute|minutes|hour|hours|day|days)$", expression)
    if relative:
        value = int(relative.group(1))
        unit = relative.group(2)
        if unit.startswith("second"):
            return datetime.now() + timedelta(seconds=value)
        if unit.startswith("minute"):
            return datetime.now() + timedelta(minutes=value)
        if unit.startswith("hour"):
            return datetime.now() + timedelta(hours=value)
        return datetime.now() + timedelta(days=value)
    at_time = re.match(r"^at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$", expression)
    if at_time:
        hour = int(at_time.group(1))
        minute = int(at_time.group(2) or "0")
        meridian = at_time.group(3)
        if meridian == "pm" and hour < 12:
            hour += 12
        if meridian == "am" and hour == 12:
            hour = 0
        candidate = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= datetime.now():
            candidate += timedelta(days=1)
        return candidate
    try:
        return datetime.fromisoformat(time_expression)
    except Exception:
        return None


def set_reminder(message: str, time_expression: str) -> str:
    parsed = _parse_time_expression(time_expression)
    if not parsed:
        return "I could not parse that reminder time."
    with _conn() as conn:
        conn.execute(
            "INSERT INTO reminders(message, trigger_time, created_at, fired) VALUES (?, ?, ?, 0)",
            (message, parsed.isoformat(timespec="seconds"), datetime.utcnow().isoformat(timespec="seconds")),
        )
        conn.commit()
    return f"Reminder set for {parsed.strftime('%Y-%m-%d %H:%M')}: {message}"


def list_reminders() -> str:
    with _conn() as conn:
        rows = conn.execute("SELECT id, message, trigger_time FROM reminders WHERE fired=0 ORDER BY trigger_time").fetchall()
    if not rows:
        return "No pending reminders."
    return "\n".join(f"{row['id']}: {row['message']} at {row['trigger_time']}" for row in rows)


def cancel_reminder(description: str) -> str:
    with _conn() as conn:
        rows = conn.execute("SELECT id, message FROM reminders WHERE fired=0").fetchall()
        if not rows:
            return "No pending reminders to cancel."
        choices = {row["message"]: row["id"] for row in rows}
        if process:
            match = process.extractOne(description, list(choices.keys()))
        else:
            scored = sorted(
                ((choice, int(SequenceMatcher(None, description, choice).ratio() * 100)) for choice in choices.keys()),
                key=lambda item: item[1],
                reverse=True,
            )
            match = scored[0] if scored else None
        if not match:
            return "No matching reminder found."
        conn.execute("UPDATE reminders SET fired=1 WHERE id=?", (choices[match[0]],))
        conn.commit()
    return f"Cancelled reminder: {match[0]}"


def due_reminders() -> list[dict]:
    now = datetime.now().isoformat(timespec="seconds")
    with _conn() as conn:
        rows = conn.execute("SELECT id, message FROM reminders WHERE fired=0 AND trigger_time<=?", (now,)).fetchall()
        conn.executemany("UPDATE reminders SET fired=1 WHERE id=?", [(row["id"],) for row in rows])
        conn.commit()
    return [dict(row) for row in rows]
