"""
JARVIS Central Logger
- Captures all log output with timestamps and log levels
- Writes to logs/jarvis.log (rolling file)
- Maintains an in-memory ring buffer of last 500 entries
- Broadcasts new log entries to all connected WebSocket clients in real-time
"""

import logging
import os
import sys
import json
import time
import asyncio
from collections import deque
from pathlib import Path
from logging.handlers import RotatingFileHandler

# Ensure logs directory exists
LOGS_DIR = Path(__file__).resolve().parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)
LOG_FILE = LOGS_DIR / "jarvis.log"

# In-memory ring buffer for last 500 log lines
_log_buffer: deque = deque(maxlen=500)

# Set of active WebSocket clients subscribed to live logs
_log_ws_clients: set = set()

# Main asyncio event loop reference (set from startup)
_main_loop: asyncio.AbstractEventLoop = None


def set_main_loop(loop: asyncio.AbstractEventLoop):
    """Called from startup_event to register the running event loop."""
    global _main_loop
    _main_loop = loop


def register_log_client(ws):
    """Add a WebSocket client to live log subscribers."""
    _log_ws_clients.add(ws)


def unregister_log_client(ws):
    """Remove a WebSocket client from live log subscribers."""
    _log_ws_clients.discard(ws)


def get_log_buffer() -> list:
    """Return the full in-memory log buffer (list of dicts)."""
    return list(_log_buffer)


class _WebSocketLogHandler(logging.Handler):
    """
    Custom logging.Handler that:
    1. Appends each log record to the ring buffer
    2. Schedules a WebSocket broadcast to all connected log clients
    """

    def emit(self, record: logging.LogRecord):
        try:
            entry = {
                "ts": time.time(),
                "level": record.levelname,
                "module": record.module,
                "msg": self.format(record),
            }
            _log_buffer.append(entry)

            # Schedule broadcast on the main asyncio loop (thread-safe)
            if _main_loop and _main_loop.is_running():
                asyncio.run_coroutine_threadsafe(_broadcast_log(entry), _main_loop)
        except Exception:
            pass  # Never raise from a log handler


async def _broadcast_log(entry: dict):
    """Broadcast a single log entry to all subscribed WebSocket clients."""
    if not _log_ws_clients:
        return
    payload = json.dumps({"type": "log_entry", **entry})
    dead = set()
    for client in _log_ws_clients:
        try:
            await client.send_text(payload)
        except Exception:
            dead.add(client)
    _log_ws_clients.difference_update(dead)


class _StdoutCaptureHandler(logging.Handler):
    """
    Intercepts Python print() calls by redirecting sys.stdout so
    they also appear as log records (level=INFO) and get broadcast.
    """
    pass


class _TeeStream:
    """
    Replaces sys.stdout so every print() both:
      - writes to the original stdout (console still works)
      - fires through the JARVIS logger as INFO
    """

    def __init__(self, original_stream, logger_name="stdout"):
        self._original = original_stream
        self._logger = logging.getLogger(logger_name)
        self._buf = ""

    @property
    def buffer(self):
        """Allows access to original stream buffer if requested (e.g. by io.TextIOWrapper)"""
        return getattr(self._original, "buffer", None)

    @property
    def encoding(self):
        """Allows access to original stream encoding."""
        return getattr(self._original, "encoding", "utf-8")

    @property
    def closed(self):
        """Allows checking if original stream is closed."""
        return getattr(self._original, "closed", False)

    def isatty(self):
        """Allows third-party libraries (like uvicorn) to check if stream is a terminal."""
        return getattr(self._original, "isatty", lambda: False)()

    def write(self, text):
        self._original.write(text)
        self._buf += text
        # Emit complete lines
        while "\n" in self._buf:
            line, self._buf = self._buf.split("\n", 1)
            line = line.strip()
            if line:
                self._logger.info(line)

    def flush(self):
        self._original.flush()

    def fileno(self):
        return self._original.fileno()


def setup_logging() -> logging.Logger:
    """
    Configure the root logger with:
    - Console output (StreamHandler) — same as before
    - Rolling file handler — writes to logs/jarvis.log
    - WebSocket broadcast handler — streams to HUD
    - Stdout tee — captures all print() calls
    """
    # Enforce UTF-8 output encoding on Windows stdout/stderr first so the original
    # stream inside _TeeStream is already configured for UTF-8 character maps.
    if sys.platform == "win32":
        import io
        try:
            if getattr(sys.stdout, "encoding", "").lower() != "utf-8":
                if hasattr(sys.stdout, "detach"):
                    sys.stdout.flush()
                    sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")
        except Exception:
            pass
        try:
            if getattr(sys.stderr, "encoding", "").lower() != "utf-8":
                if hasattr(sys.stderr, "detach"):
                    sys.stderr.flush()
                    sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding="utf-8")
        except Exception:
            pass

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)

    fmt = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(module)s: %(message)s",
        datefmt="%H:%M:%S"
    )

    # 1. Rolling file (5 MB × 3 backups)
    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    file_handler.setFormatter(fmt)
    file_handler.setLevel(logging.DEBUG)
    root.addHandler(file_handler)

    # 2. WebSocket broadcast handler
    ws_handler = _WebSocketLogHandler()
    ws_handler.setFormatter(fmt)
    ws_handler.setLevel(logging.DEBUG)
    root.addHandler(ws_handler)

    # 3. Tee sys.stdout so all print() calls get logged too
    sys.stdout = _TeeStream(sys.stdout, logger_name="stdout")

    main_logger = logging.getLogger("jarvis")
    main_logger.info("=== JARVIS Logger initialized. Log file: %s ===", LOG_FILE)
    return main_logger


# Module-level convenience logger
logger = logging.getLogger("jarvis")
