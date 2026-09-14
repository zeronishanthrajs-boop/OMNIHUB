# ════════════════════════════════════════
# FILE: config_loader.py
# PURPOSE: Load, validate, hot-reload, and save JARVIS YAML configuration.
# MODIFIES: config.yaml
# ════════════════════════════════════════

from __future__ import annotations

import copy
import logging
import os
import threading
from typing import Any, Callable

import yaml

log = logging.getLogger("jarvis.config")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT_DIR, "config.yaml")

DEFAULT_CONFIG: dict[str, Any] = {
    "assistant": {
        "name": "JARVIS",
        "wake_word": "hey jarvis",
        "wake_sensitivity": 0.6,
        "language": "en",
        "version": "3.0.0",
        "operator": "Nishanth",
    },
    "voice": {
        "tts_engine": "piper",
        "piper_voice": "en_US-ryan-high",
        "tts_fallback": "sapi5",
        "speech_rate": 1.0,
    },
    "brain": {
        "model": "qwen2.5-coder:7b",
        "code_model": "qwen2.5-coder:7b",
        "fallback_model": "llama3.1:8b",
        "temperature": 0.7,
        "code_temperature": 0.2,
        "ollama_timeout": 300,
        "context_window": 4096,
        "keep_alive_minutes": 15,
        "session_memory_turns": 20,
        "ollama_host": "http://127.0.0.1:11434",
    },
    "stt": {
        "whisper_model": "tiny.en",
        "device": "cpu",
        "compute_type": "int8",
        "min_recording_seconds": 1.5,
        "silence_timeout_seconds": 1.2,
        "max_recording_seconds": 15,
        "no_speech_timeout_seconds": 8,
        "energy_threshold": 200.0,
        "continuous_listening": False,
    },
    "vision": {
        "model": "moondream",
        "lazy_load": True,
        "unload_after_seconds": 60,
    },
    "memory": {
        "session_db": "memory/session.db",
        "personal_db": "memory/personal.db",
        "knowledge_dir": "memory/knowledge",
        "sources_db": "memory/sources.db",
        "cloud_sync": False,
        "ram_safety_threshold": 600,
        "max_model_memory": 1800,
    },
    "monitoring": {
        "check_interval": 30,
        "ollama_probe_timeout": 1.5,
        "websites": [
            {"name": "ZeroOps", "url": "https://zeroops.in", "check_interval_minutes": 5},
            {"name": "UniGate", "url": "https://unigateadmission.online", "check_interval_minutes": 5},
        ],
        "venom": {"check_interval_hours": 24},
    },
    "offline_dms": {
        "enabled": True,
        "channels": ["discord", "whatsapp", "instagram", "telegram"],
        "response_with_knowledge": True,
    },
    "server": {
        "host": "127.0.0.1",
        "port": 8000,
    },
    "paths": {
        "temp_dir": "temp",
        "logs_dir": "logs",
        "speech_dir": "static/speech",
        "piper_binary": "bin/piper/piper.exe",
        "piper_voice_model": "models/tts/en_US-ryan-high.onnx",
        "whisper_dir": "models/whisper/tiny.en",
        "ffmpeg_binary": "bin/ffmpeg/ffmpeg.exe",
    },
}


def deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    merged = copy.deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


class ConfigManager:
    def __init__(self, path: str = CONFIG_PATH):
        self.path = path
        self._lock = threading.RLock()
        self._config = copy.deepcopy(DEFAULT_CONFIG)
        self._callbacks: list[Callable[[dict[str, Any]], None]] = []
        self.load()

    def load(self) -> dict[str, Any]:
        with self._lock:
            try:
                if not os.path.exists(self.path):
                    self._write_unlocked(DEFAULT_CONFIG)
                with open(self.path, "r", encoding="utf-8") as handle:
                    loaded = yaml.safe_load(handle) or {}
                self._config = deep_merge(DEFAULT_CONFIG, loaded)
                log.info("Config loaded from %s", self.path)
            except Exception as exc:
                log.error("Config load failed, using defaults: %s", exc, exc_info=True)
                self._config = copy.deepcopy(DEFAULT_CONFIG)
            return copy.deepcopy(self._config)

    def save(self, new_config: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            try:
                self._config = deep_merge(DEFAULT_CONFIG, new_config)
                self._write_unlocked(self._config)
                log.info("Config saved to %s", self.path)
                for callback in list(self._callbacks):
                    try:
                        callback(copy.deepcopy(self._config))
                    except Exception as exc:
                        log.error("Config callback failed: %s", exc, exc_info=True)
            except Exception as exc:
                log.error("Config save failed: %s", exc, exc_info=True)
            return copy.deepcopy(self._config)

    def _write_unlocked(self, payload: dict[str, Any]) -> None:
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as handle:
            yaml.safe_dump(payload, handle, sort_keys=False, allow_unicode=False)

    def get(self, dotted_key: str, default: Any = None) -> Any:
        with self._lock:
            current: Any = self._config
            for part in dotted_key.split("."):
                if not isinstance(current, dict) or part not in current:
                    return default
                current = current[part]
            return copy.deepcopy(current)

    def all(self) -> dict[str, Any]:
        with self._lock:
            return copy.deepcopy(self._config)

    def register_callback(self, callback: Callable[[dict[str, Any]], None]) -> None:
        with self._lock:
            self._callbacks.append(callback)


config_manager = ConfigManager()


def rel_path(relative_path: str) -> str:
    normalized = relative_path.replace("/", os.sep).replace("\\", os.sep)
    return os.path.join(ROOT_DIR, normalized)
