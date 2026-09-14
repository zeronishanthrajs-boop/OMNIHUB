from __future__ import annotations

import gc
import logging
import threading
from typing import Any

import psutil
import requests

from config_loader import config_manager

log = logging.getLogger("jarvis.memory_guard")

_stop_event = threading.Event()
_monitor_lock = threading.Lock()
_monitor_started = False
_active_model_calls = 0
_active_model_lock = threading.Lock()


def _cfg() -> dict[str, Any]:
    return config_manager.all()


def free_ram_mb() -> float:
    return psutil.virtual_memory().available / (1024 * 1024)


def begin_model_call() -> None:
    global _active_model_calls
    with _active_model_lock:
        _active_model_calls += 1


def end_model_call() -> None:
    global _active_model_calls
    with _active_model_lock:
        _active_model_calls = max(0, _active_model_calls - 1)


def has_active_model_calls() -> bool:
    with _active_model_lock:
        return _active_model_calls > 0


def trigger_ollama_unload() -> None:
    cfg = _cfg()
    ollama_host = cfg["brain"].get("ollama_host", "http://127.0.0.1:11434").rstrip("/")
    probe_timeout = float(cfg.get("monitoring", {}).get("ollama_probe_timeout", 1.5))
    try:
        ps_response = requests.get(f"{ollama_host}/api/ps", timeout=max(1.0, probe_timeout))
        if ps_response.status_code == 200:
            loaded_models = ps_response.json().get("models", [])
            if not loaded_models:
                log.info("[OLLAMA] No active models currently loaded in memory.")
                return
            for model_info in loaded_models:
                model_name = model_info.get("name")
                if model_name:
                    requests.post(
                        f"{ollama_host}/api/generate",
                        json={"model": model_name, "prompt": "", "keep_alive": 0, "stream": False},
                        timeout=max(1.0, probe_timeout),
                    )
                    log.info("[OLLAMA] Unload requested for loaded model: %s", model_name)
        else:
            # Fallback to configured model unload
            model = cfg["brain"].get("model", "llama3.2:1b")
            requests.post(
                f"{ollama_host}/api/generate",
                json={"model": model, "prompt": "", "keep_alive": 0, "stream": False},
                timeout=max(1.0, probe_timeout),
            )
            log.info("[OLLAMA] Fallback unload requested for configured model: %s", model)
    except Exception as exc:
        log.warning("[OLLAMA] Unload request failed: %s", exc)


def trigger_python_gc() -> None:
    collected = gc.collect()
    log.info("[GC] Python garbage collection complete: %s objects", collected)


def check_ram_pressure() -> bool:
    cfg = _cfg()
    threshold = float(cfg["memory"].get("ram_safety_threshold", 600))
    available = free_ram_mb()
    if available >= threshold:
        return False

    log.warning("[RAM PRESSURE] Free RAM: %.0fMB, threshold: %.0fMB", available, threshold)
    if has_active_model_calls():
        log.warning("[RAM PRESSURE] Active model call detected; skipping Ollama unload")
        trigger_python_gc()
        return True
    trigger_ollama_unload()
    trigger_python_gc()
    log.info("[RAM CLEANUP] Free RAM after cleanup: %.0fMB", free_ram_mb())
    return True


def memory_monitor_loop() -> None:
    while not _stop_event.is_set():
        try:
            check_ram_pressure()
        except Exception as exc:
            log.error("[RAM GUARD] Monitor check failed: %s", exc, exc_info=True)
        interval = float(_cfg().get("monitoring", {}).get("check_interval", 30))
        _stop_event.wait(max(5.0, interval))


def start_memory_monitor() -> None:
    global _monitor_started
    with _monitor_lock:
        if _monitor_started:
            return
        thread = threading.Thread(target=memory_monitor_loop, name="jarvis-memory-guard", daemon=True)
        thread.start()
        _monitor_started = True
        log.info("[RAM GUARD] Memory monitoring thread started")


def stop_memory_monitor() -> None:
    _stop_event.set()
