# ════════════════════════════════════════
# FILE: vision.py
# PURPOSE: Lazy-loaded Moondream vision engine for screen, image, clipboard, and webcam analysis.
# MODIFIES: temp/
# ════════════════════════════════════════

from __future__ import annotations

import base64
import logging
import os
import threading
import time
from typing import Awaitable, Callable, Optional

import psutil
import requests

from config_loader import config_manager, rel_path

log = logging.getLogger("jarvis.vision")


class JarvisVisionEngine:
    def __init__(
        self,
        speak: Optional[Callable[[str], None]] = None,
        notify: Optional[Callable[[dict], Awaitable[None]]] = None,
    ):
        cfg = config_manager.all()
        self._loaded = False
        self._model_name = cfg["vision"]["model"]
        self._ollama_host = cfg["brain"]["ollama_host"].rstrip("/")
        self._unload_after = int(cfg["vision"]["unload_after_seconds"])
        self._timer: Optional[threading.Timer] = None
        self._lock = threading.RLock()
        self._speak = speak
        self._notify = notify
        self.status = "unloaded"
        config_manager.register_callback(self.apply_config)

    def apply_config(self, cfg: dict) -> None:
        try:
            self._model_name = cfg["vision"]["model"]
            self._ollama_host = cfg["brain"]["ollama_host"].rstrip("/")
            self._unload_after = int(cfg["vision"]["unload_after_seconds"])
            log.info("Vision config reloaded.")
        except Exception as exc:
            log.error("Vision config reload failed: %s", exc, exc_info=True)

    def _say(self, text: str) -> None:
        try:
            if self._speak:
                self._speak(text)
        except Exception as exc:
            log.error("Vision speech failed: %s", exc, exc_info=True)

    def _load(self) -> bool:
        with self._lock:
            if self._loaded:
                self._schedule_unload()
                return True
            memory = psutil.virtual_memory()
            if memory.available < int(2.2 * 1024 * 1024 * 1024):
                self.status = "error"
                log.warning("Not enough available RAM for vision: %s MB", int(memory.available / 1024 / 1024))
                self._say("Not enough memory for vision right now.")
                return False
            self._say("Loading vision system.")
            try:
                requests.post(
                    f"{self._ollama_host}/api/generate",
                    json={"model": self._model_name, "prompt": "ready", "stream": False, "keep_alive": f"{self._unload_after}s"},
                    timeout=60,
                )
                self._loaded = True
                self.status = "loaded"
                self._schedule_unload()
                log.info("Vision model loaded: %s", self._model_name)
                return True
            except Exception as exc:
                self.status = "error"
                log.error("Vision load failed: %s", exc, exc_info=True)
                self._say("Vision system failed to load.")
                return False

    def _schedule_unload(self) -> None:
        if self._timer:
            self._timer.cancel()
        self._timer = threading.Timer(self._unload_after, self.unload)
        self._timer.daemon = True
        self._timer.start()

    def unload(self) -> None:
        with self._lock:
            try:
                requests.post(
                    f"{self._ollama_host}/api/generate",
                    json={"model": self._model_name, "prompt": "", "stream": False, "keep_alive": 0},
                    timeout=10,
                )
                self._loaded = False
                self.status = "unloaded"
                log.info("Vision model unloaded.")
            except Exception as exc:
                log.error("Vision unload failed: %s", exc, exc_info=True)

    def describe_image(self, image_path: str) -> str:
        try:
            if not os.path.exists(image_path):
                return "Image file not found."
            if not self._load():
                return "Vision system is unavailable right now."
            with open(image_path, "rb") as handle:
                encoded = base64.b64encode(handle.read()).decode("ascii")
            response = requests.post(
                f"{self._ollama_host}/api/generate",
                json={
                    "model": self._model_name,
                    "prompt": "Describe this image in detail.",
                    "images": [encoded],
                    "stream": False,
                    "keep_alive": f"{self._unload_after}s",
                },
                timeout=120,
            )
            response.raise_for_status()
            description = response.json().get("response", "").strip()
            self._schedule_unload()
            return description or "I could not identify meaningful visual details."
        except Exception as exc:
            self.status = "error"
            log.error("Image description failed: %s", exc, exc_info=True)
            self._say("Vision analysis failed.")
            return "Vision analysis failed. I logged the error."

    def read_screen(self) -> str:
        try:
            import mss

            temp_dir = rel_path(config_manager.get("paths.temp_dir", "temp"))
            os.makedirs(temp_dir, exist_ok=True)
            path = os.path.join(temp_dir, f"screenshot_{int(time.time())}.png")
            with mss.mss() as capture:
                capture.shot(output=path)
            result = self.describe_image(path)
            self._say(result)
            return result
        except Exception as exc:
            log.error("Screen capture failed: %s", exc, exc_info=True)
            self._say("I could not read the screen.")
            return "Screen capture failed."

    def analyze_clipboard_image(self) -> str:
        try:
            from PIL import ImageGrab

            image = ImageGrab.grabclipboard()
            if image is None:
                self._say("No image found in clipboard.")
                return "No image found in clipboard."
            temp_dir = rel_path(config_manager.get("paths.temp_dir", "temp"))
            os.makedirs(temp_dir, exist_ok=True)
            path = os.path.join(temp_dir, f"clipboard_{int(time.time())}.png")
            image.save(path)
            result = self.describe_image(path)
            self._say(result)
            return result
        except Exception as exc:
            log.error("Clipboard image analysis failed: %s", exc, exc_info=True)
            self._say("Clipboard image analysis failed.")
            return "Clipboard image analysis failed."

    def describe_webcam_frame(self) -> str:
        try:
            import cv2

            camera = cv2.VideoCapture(0)
            ok, frame = camera.read()
            camera.release()
            if not ok:
                self._say("Webcam frame capture failed.")
                return "Webcam frame capture failed."
            temp_dir = rel_path(config_manager.get("paths.temp_dir", "temp"))
            os.makedirs(temp_dir, exist_ok=True)
            path = os.path.join(temp_dir, f"webcam_{int(time.time())}.png")
            cv2.imwrite(path, frame)
            result = self.describe_image(path)
            self._say(result)
            return result
        except Exception as exc:
            log.error("Webcam analysis failed: %s", exc, exc_info=True)
            self._say("Webcam analysis failed.")
            return "Webcam analysis failed."

    def read_document_image(self, path: str) -> str:
        try:
            if not os.path.exists(path):
                return "Document image file not found."
            if not self._load():
                return "Vision system is unavailable right now."
            with open(path, "rb") as handle:
                encoded = base64.b64encode(handle.read()).decode("ascii")
            response = requests.post(
                f"{self._ollama_host}/api/generate",
                json={
                    "model": self._model_name,
                    "prompt": "Read the document image. Extract visible text first, then summarize it.",
                    "images": [encoded],
                    "stream": False,
                    "keep_alive": f"{self._unload_after}s",
                },
                timeout=120,
            )
            response.raise_for_status()
            return response.json().get("response", "").strip() or "No readable text found."
        except Exception as exc:
            log.error("Document image read failed: %s", exc, exc_info=True)
            self._say("Document image reading failed.")
            return "Document image reading failed."
