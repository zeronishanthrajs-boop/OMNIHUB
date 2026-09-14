# ════════════════════════════════════════
# FILE: memory_manager.py
# PURPOSE: Offline session memory, personal facts, and cloud-sync failsafes.
# MODIFIES: memory/session.db, memory/personal.db
# ════════════════════════════════════════

from __future__ import annotations

import logging
import os
import sqlite3
import threading
from datetime import datetime, timedelta
from typing import Any

import requests

from config_loader import config_manager, rel_path

log = logging.getLogger("jarvis.memory")


def utc_now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


def is_online() -> bool:
    try:
        requests.get("https://1.1.1.1", timeout=2)
        return True
    except Exception:
        return False


class SQLiteBase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._lock = threading.RLock()

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=30, check_same_thread=False)
        conn.execute("PRAGMA busy_timeout=30000")
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn


class SessionMemory(SQLiteBase):
    def __init__(self):
        super().__init__(rel_path(config_manager.get("memory.session_db", "memory/session.db")))
        self.init_db()

    def init_db(self) -> None:
        with self._lock, self.connect() as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS sessions "
                "(id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, content TEXT NOT NULL, timestamp TEXT NOT NULL)"
            )
            conn.commit()

    def append(self, role: str, content: str) -> None:
        with self._lock, self.connect() as conn:
            conn.execute(
                "INSERT INTO sessions(role, content, timestamp) VALUES (?, ?, ?)",
                (role, content, utc_now()),
            )
            conn.commit()

    def load_recent(self, max_age_hours: int = 2, limit: int = 20) -> list[dict[str, str]]:
        cutoff = (datetime.utcnow() - timedelta(hours=max_age_hours)).isoformat(timespec="seconds")
        with self._lock, self.connect() as conn:
            rows = conn.execute(
                "SELECT role, content, timestamp FROM sessions WHERE timestamp >= ? ORDER BY id DESC LIMIT ?",
                (cutoff, limit),
            ).fetchall()
        return [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]

    def clear(self) -> None:
        with self._lock, self.connect() as conn:
            conn.execute("DELETE FROM sessions")
            conn.commit()

    def export_text(self) -> str:
        with self._lock, self.connect() as conn:
            rows = conn.execute("SELECT role, content, timestamp FROM sessions ORDER BY id").fetchall()
        return "\n".join(f"[{row['timestamp']}] {row['role']}: {row['content']}" for row in rows)


class PersonalMemory(SQLiteBase):
    def __init__(self, db_path: str | None = None):
        super().__init__(db_path or rel_path(config_manager.get("memory.personal_db", "memory/personal.db")))
        self.init_db()

    def init_db(self) -> None:
        with self._lock, self.connect() as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS facts "
                "(id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, key TEXT, value TEXT, timestamp TEXT, source TEXT)"
            )
            conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_facts_category_key ON facts(category, key)")
            conn.execute(
                "CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts USING fts5(category, key, value, content='facts', content_rowid='id')"
            )
            conn.executescript(
                """
                CREATE TRIGGER IF NOT EXISTS facts_ai AFTER INSERT ON facts BEGIN
                    INSERT INTO facts_fts(rowid, category, key, value) VALUES (new.id, new.category, new.key, new.value);
                END;
                CREATE TRIGGER IF NOT EXISTS facts_ad AFTER DELETE ON facts BEGIN
                    INSERT INTO facts_fts(facts_fts, rowid, category, key, value)
                    VALUES('delete', old.id, old.category, old.key, old.value);
                END;
                CREATE TRIGGER IF NOT EXISTS facts_au AFTER UPDATE ON facts BEGIN
                    INSERT INTO facts_fts(facts_fts, rowid, category, key, value)
                    VALUES('delete', old.id, old.category, old.key, old.value);
                    INSERT INTO facts_fts(rowid, category, key, value) VALUES (new.id, new.category, new.key, new.value);
                END;
                """
            )
            conn.commit()

    def save_fact(self, category: str, key: str, value: str, source: str = "conversation") -> None:
        with self._lock, self.connect() as conn:
            conn.execute(
                "INSERT INTO facts(category, key, value, timestamp, source) VALUES (?, ?, ?, ?, ?) "
                "ON CONFLICT(category, key) DO UPDATE SET value=excluded.value, timestamp=excluded.timestamp, source=excluded.source",
                (category, key, value, utc_now(), source),
            )
            conn.commit()
        log.info("Saved personal fact %s:%s", category, key)

    def delete_fact(self, key: str) -> int:
        with self._lock, self.connect() as conn:
            cursor = conn.execute(
                "UPDATE facts SET value=NULL, timestamp=? WHERE key LIKE ? OR value LIKE ?",
                (utc_now(), f"%{key}%", f"%{key}%"),
            )
            conn.commit()
            return cursor.rowcount

    def query_facts(self, search_term: str) -> list[dict[str, Any]]:
        term = (search_term or "").strip()
        with self._lock, self.connect() as conn:
            try:
                rows = conn.execute(
                    "SELECT f.* FROM facts_fts JOIN facts f ON facts_fts.rowid=f.id "
                    "WHERE facts_fts MATCH ? AND f.value IS NOT NULL ORDER BY f.timestamp DESC LIMIT 20",
                    (term,),
                ).fetchall()
            except sqlite3.OperationalError:
                rows = conn.execute(
                    "SELECT * FROM facts WHERE value IS NOT NULL AND (key LIKE ? OR value LIKE ? OR category LIKE ?) "
                    "ORDER BY timestamp DESC LIMIT 20",
                    (f"%{term}%", f"%{term}%", f"%{term}%"),
                ).fetchall()
        return [dict(row) for row in rows]

    def get_all_facts(self) -> list[dict[str, Any]]:
        with self._lock, self.connect() as conn:
            rows = conn.execute("SELECT * FROM facts WHERE value IS NOT NULL ORDER BY timestamp DESC").fetchall()
        return [dict(row) for row in rows]

    def get_relevant_facts(self, topic: str, limit: int = 5) -> list[dict[str, Any]]:
        facts = self.query_facts(topic)
        return facts[:limit]

    def format_relevant(self, topic: str, limit: int = 5) -> str:
        facts = self.get_relevant_facts(topic, limit)
        return "; ".join(f"{fact['key']}={fact['value']}" for fact in facts)


class CloudSyncGuard:
    def __init__(self):
        self.enabled = bool(config_manager.get("memory.cloud_sync", True))

    def run_background(self, target, *args, **kwargs) -> None:
        def worker() -> None:
            if not self.enabled or not is_online():
                log.info("Cloud sync skipped (offline)")
                return
            try:
                target(*args, **kwargs)
            except Exception as exc:
                log.error("Cloud sync failed safely: %s", exc, exc_info=True)

        threading.Thread(target=worker, name="JarvisCloudSync", daemon=True).start()


class MemoryManager:
    def __init__(self):
        self.session = SessionMemory()
        self.personal = PersonalMemory()
        self.cloud = CloudSyncGuard()
        self.status = "ready"

    def save_turn(self, user_text: str, assistant_text: str) -> None:
        try:
            self.session.append("user", user_text)
            self.session.append("assistant", assistant_text)
        except Exception as exc:
            self.status = "error"
            log.error("Session save failed: %s", exc, exc_info=True)

    async def save_conversation_async(self, user_text: str, assistant_text: str) -> None:
        self.save_turn(user_text, assistant_text)

    def load_recent_session(self) -> list[dict[str, str]]:
        return self.session.load_recent(limit=int(config_manager.get("brain.session_memory_turns", 20)))

    def clear_session(self) -> None:
        self.session.clear()

    def close(self) -> None:
        log.info("Memory manager closed.")
