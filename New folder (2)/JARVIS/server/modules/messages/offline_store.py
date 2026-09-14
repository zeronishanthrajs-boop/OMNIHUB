from __future__ import annotations

import json
import sqlite3
import sys
import time
from pathlib import Path


def connect(db_path: str) -> sqlite3.Connection:
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=30, check_same_thread=False)
    conn.execute("PRAGMA busy_timeout=30000")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS offline_messages (
            id TEXT PRIMARY KEY,
            from_user TEXT NOT NULL,
            channel TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            jarvis_response TEXT,
            responded INTEGER DEFAULT 0
        )
        """
    )
    conn.commit()
    return conn


def read_payload() -> dict:
    raw = sys.stdin.read().strip()
    return json.loads(raw) if raw else {}


def row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "from": row["from_user"],
        "channel": row["channel"],
        "text": row["text"],
        "timestamp": row["timestamp"],
        "jarvis_response": row["jarvis_response"],
        "responded": bool(row["responded"]),
    }


def main() -> int:
    if len(sys.argv) < 3:
        print(json.dumps({"error": "usage: offline_store.py <action> <db_path>"}))
        return 2

    action = sys.argv[1]
    db_path = sys.argv[2]
    payload = read_payload()

    with connect(db_path) as conn:
        if action == "init":
            print(json.dumps({"ok": True}))
            return 0

        if action == "queue":
            conn.execute(
                """
                INSERT INTO offline_messages
                (id, from_user, channel, text, timestamp, responded)
                VALUES (?, ?, ?, ?, ?, 0)
                """,
                [
                    payload["id"],
                    payload["from"],
                    payload["channel"],
                    payload["text"],
                    int(payload.get("timestamp", time.time() * 1000)),
                ],
            )
            conn.commit()
            print(json.dumps({"id": payload["id"]}))
            return 0

        if action == "pending":
            rows = conn.execute(
                "SELECT * FROM offline_messages WHERE responded = 0 ORDER BY timestamp ASC"
            ).fetchall()
            print(json.dumps({"messages": [row_to_dict(row) for row in rows]}))
            return 0

        if action == "mark":
            conn.execute(
                "UPDATE offline_messages SET responded = 1, jarvis_response = ? WHERE id = ?",
                [payload["jarvis_response"], payload["id"]],
            )
            conn.commit()
            print(json.dumps({"ok": True}))
            return 0

        if action == "clear":
            conn.execute("DELETE FROM offline_messages")
            conn.commit()
            print(json.dumps({"ok": True}))
            return 0

    print(json.dumps({"error": f"unknown action: {action}"}))
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
