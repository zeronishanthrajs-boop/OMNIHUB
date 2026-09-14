# ════════════════════════════════════════
# FILE: skills/common.py
# PURPOSE: Shared helpers for JARVIS modular skills.
# MODIFIES: skills/*.py
# ════════════════════════════════════════

from __future__ import annotations

import os
import sqlite3
from datetime import datetime

from config_loader import rel_path


def ensure_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


def cache_db() -> str:
    return rel_path(os.path.join("memory", "skills_cache.db"))


def connect_cache() -> sqlite3.Connection:
    path = cache_db()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path, timeout=30, check_same_thread=False)
    conn.execute("PRAGMA busy_timeout=30000")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


def resolve_user_path(path: str) -> str:
    candidates = [
        path,
        os.path.join(os.path.expanduser("~"), path),
        rel_path(path),
    ]
    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return os.path.abspath(candidate)
    return os.path.abspath(os.path.join(os.path.expanduser("~"), path))
