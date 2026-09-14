# ════════════════════════════════════════
# FILE: shutdown_handler.py
# PURPOSE: Central graceful shutdown sequence for JARVIS services.
# MODIFIES: temp/, static/speech/
# ════════════════════════════════════════

from __future__ import annotations

import atexit
import logging
import os
import signal
import sys
import threading
from typing import Callable

import requests

from config_loader import config_manager, rel_path

log = logging.getLogger("jarvis.shutdown")
shutdown_event = threading.Event()
_callbacks: list[Callable[[], None]] = []


def register_cleanup(callback: Callable[[], None]) -> None:
    _callbacks.append(callback)


def cleanup_files() -> None:
    for folder_key, pattern_prefix, suffixes in [
        ("paths.speech_dir", "speech_", (".mp3", ".wav")),
        ("paths.temp_dir", "screenshot_", (".png",)),
        ("paths.temp_dir", "webcam_", (".png",)),
        ("paths.temp_dir", "capture_", (".wav",)),
        ("paths.temp_dir", "jarvis_command_", (".wav",)),
    ]:
        folder = rel_path(config_manager.get(folder_key, "temp"))
        if not os.path.isdir(folder):
            continue
        for name in os.listdir(folder):
            if name.startswith(pattern_prefix) and name.endswith(suffixes):
                try:
                    os.remove(os.path.join(folder, name))
                except Exception as exc:
                    log.error("Cleanup failed for %s: %s", name, exc, exc_info=True)


def unload_ollama_models() -> None:
    host = config_manager.get("brain.ollama_host", "http://127.0.0.1:11434").rstrip("/")
    models = {
        config_manager.get("brain.model", "qwen2.5:3b"),
        config_manager.get("brain.code_model", "qwen2.5-coder:3b"),
        config_manager.get("vision.model", "moondream"),
    }
    for model in models:
        try:
            requests.post(
                f"{host}/api/generate",
                json={"model": model, "prompt": "", "stream": False, "keep_alive": 0},
                timeout=5,
            )
        except Exception as exc:
            log.error("Model unload failed for %s: %s", model, exc, exc_info=True)


def remove_lock() -> None:
    path = rel_path(os.path.join("temp", "jarvis.lock"))
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as exc:
        log.error("Lock removal failed: %s", exc, exc_info=True)


def shutdown(signum: int | None = None, _frame=None) -> None:
    if shutdown_event.is_set():
        return
    shutdown_event.set()
    log.info("Shutdown requested: %s", signum)
    for callback in list(_callbacks):
        try:
            callback()
        except Exception as exc:
            log.error("Shutdown callback failed: %s", exc, exc_info=True)
    cleanup_files()
    unload_ollama_models()
    remove_lock()
    logging.shutdown()
    if signum is not None:
        sys.exit(0)


def install_signal_handlers() -> None:
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, shutdown)
        except Exception as exc:
            log.error("Signal handler registration failed: %s", exc, exc_info=True)
    atexit.register(shutdown)
