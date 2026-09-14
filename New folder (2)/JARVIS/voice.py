# ════════════════════════════════════════
# FILE: voice.py
# PURPOSE: Offline Piper TTS primary engine with SAPI5 fallback and interruption.
# MODIFIES: static/speech/
# ════════════════════════════════════════

from __future__ import annotations

import asyncio
import logging
import os
import queue
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from typing import Awaitable, Callable, Iterable, Optional

from config_loader import config_manager, rel_path

log = logging.getLogger("jarvis.voice")


def resolve_ffmpeg_path() -> Optional[str]:
    candidates = [
        rel_path(os.path.join("venv", "Scripts", "ffmpeg.bat")),
        rel_path(os.path.join("venv", "Scripts", "ffmpeg.exe")),
        shutil.which("ffmpeg") or "",
        os.path.join("C:\\", "ffmpeg", "bin", "ffmpeg.exe"),
        rel_path(config_manager.get("paths.ffmpeg_binary", os.path.join("bin", "ffmpeg", "ffmpeg.exe"))),
    ]
    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return candidate
    log.critical("FFmpeg missing; MP3 voice output disabled.")
    return None


FFMPEG_PATH = resolve_ffmpeg_path()


class JarvisVoiceEngine:
    def __init__(self):
        self.config = config_manager.all()
        self.tts_interrupt_event = threading.Event()
        self.is_speaking = False
        self.queue: "queue.Queue[Optional[str]]" = queue.Queue()
        self.should_stop = threading.Event()
        self.current_process: Optional[subprocess.Popen] = None
        self.broadcast_json: Optional[Callable[[dict], Awaitable[None]]] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.on_start_speaking: Optional[Callable[[], None]] = None
        self.on_stop_speaking: Optional[Callable[[], None]] = None
        self.boot_time = time.time()
        self.speech_dir = rel_path(self.config["paths"]["speech_dir"])
        self.piper_exe = rel_path(self.config["paths"]["piper_binary"])
        self.piper_model = rel_path(self.config["paths"]["piper_voice_model"])
        os.makedirs(self.speech_dir, exist_ok=True)
        self.cleanup_old_speech_files()
        self.worker = threading.Thread(target=self._worker_loop, name="JarvisVoiceWorker", daemon=True)
        self.worker.start()
        config_manager.register_callback(self.apply_config)
        log.info("Voice engine initialized.")

    def apply_config(self, cfg: dict) -> None:
        try:
            self.config = cfg
            self.speech_dir = rel_path(cfg["paths"]["speech_dir"])
            self.piper_exe = rel_path(cfg["paths"]["piper_binary"])
            self.piper_model = rel_path(cfg["paths"]["piper_voice_model"])
            os.makedirs(self.speech_dir, exist_ok=True)
            log.info("Voice config reloaded.")
        except Exception as exc:
            log.error("Voice config reload failed: %s", exc, exc_info=True)

    def configure_runtime(
        self,
        *,
        loop: asyncio.AbstractEventLoop,
        broadcast_json: Callable[[dict], Awaitable[None]],
    ) -> None:
        self.loop = loop
        self.broadcast_json = broadcast_json

    def cleanup_old_speech_files(self) -> None:
        try:
            os.makedirs(self.speech_dir, exist_ok=True)
            for name in os.listdir(self.speech_dir):
                path = os.path.join(self.speech_dir, name)
                if (name.lower().endswith(".mp3") or name.lower().endswith(".wav")) and os.path.isfile(path):
                    if os.path.getmtime(path) < self.boot_time:
                        os.remove(path)
            log.info("Old speech files cleaned.")
        except Exception as exc:
            log.error("Speech cleanup failed: %s", exc, exc_info=True)

    def speak(self, text: str, wait: bool = False) -> bool:
        try:
            clean = self.clean_text(text)
            if not clean:
                return False
            self.queue.put(clean)
            if wait:
                while not self.queue.empty() or self.is_speaking:
                    time.sleep(0.05)
            return True
        except Exception as exc:
            log.error("Voice enqueue failed: %s", exc, exc_info=True)
            return False

    async def speak_async(self, text: str) -> Optional[str]:
        sentences = self.split_complete_sentences(text)
        if not sentences:
            return None
        loop = asyncio.get_running_loop()
        first_url = None
        for sentence in sentences:
            if self.tts_interrupt_event.is_set():
                break
            url = await loop.run_in_executor(None, self.synthesize_and_broadcast, sentence)
            if not first_url:
                first_url = url
            while self.is_speaking and not self.tts_interrupt_event.is_set():
                await asyncio.sleep(0.05)
        return first_url

    async def speak_streaming(self, token_iterable: Iterable[str]) -> None:
        buffer = ""
        for token in token_iterable:
            if self.tts_interrupt_event.is_set():
                await self.stop_async()
                return
            buffer += token
            sentences = self.split_complete_sentences(buffer)
            for sentence in sentences[:-1]:
                await self.speak_async(sentence)
                buffer = buffer.replace(sentence, "", 1).lstrip()
        tail = buffer.strip()
        if tail and not self.tts_interrupt_event.is_set():
            await self.speak_async(tail)

    def synthesize_and_broadcast(self, sentence: str) -> Optional[str]:
        clean = self.clean_text(sentence)
        if not clean:
            return None
        self.is_speaking = True
        self._safe_callback(self.on_start_speaking)
        try:
            wav_path = os.path.join(self.speech_dir, f"speech_{uuid.uuid4().hex}.wav")
            piper_ok = self._piper_to_wav(clean, wav_path)
            if not piper_ok:
                piper_ok = self._sapi_to_wav(clean, wav_path)
            if piper_ok and os.path.exists(wav_path):
                url = "/static/speech/" + os.path.basename(wav_path)
                self._threadsafe_json({"type": "tts_play", "url": url, "text": clean})
                self._threadsafe_json({"type": "play_audio", "url": url, "text": clean})
                return url
            self._sapi_speak(clean)
            return None
        except Exception as exc:
            log.error("TTS synthesis failed: %s", exc, exc_info=True)
            self._sapi_speak("Voice synthesis failed. I am using the fallback voice.")
            return None
        finally:
            self.is_speaking = False
            self._safe_callback(self.on_stop_speaking)

    def synthesize_to_mp3(self, text: str) -> Optional[str]:
        if self.tts_interrupt_event.is_set():
            return None
        wav_path = os.path.join(self.speech_dir, f"speech_{uuid.uuid4().hex}.wav")
        mp3_path = wav_path[:-4] + ".mp3"
        piper_ok = self._piper_to_wav(text, wav_path)
        if not piper_ok:
            piper_ok = self._sapi_to_wav(text, wav_path)
        if not piper_ok or not os.path.exists(wav_path):
            return None
        if not FFMPEG_PATH:
            return None
        try:
            subprocess.run(
                [FFMPEG_PATH, "-y", "-loglevel", "error", "-i", wav_path, mp3_path],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                timeout=20,
            )
            os.remove(wav_path)
            if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 0:
                return mp3_path
        except Exception as exc:
            log.error("FFmpeg conversion failed: %s", exc, exc_info=True)
        return None

    def _piper_to_wav(self, text: str, wav_path: str) -> bool:
        piper = self.piper_exe
        voice_model = self.piper_model
        if not os.path.exists(piper) or not os.path.exists(voice_model):
            log.info("Piper unavailable; falling back to SAPI5.")
            return False
        try:
            process = subprocess.run(
                [piper, "--model", voice_model, "--output_file", wav_path],
                input=text,
                text=True,
                capture_output=True,
                timeout=20,
            )
            if process.returncode != 0:
                log.error("Piper failed: %s", process.stderr)
                return False
            return os.path.exists(wav_path) and os.path.getsize(wav_path) > 0
        except Exception as exc:
            log.error("Piper execution failed: %s", exc, exc_info=True)
            return False

    def _sapi_to_wav(self, text: str, wav_path: str) -> bool:
        try:
            code = (
                "import pyttsx3;"
                "engine=pyttsx3.init();"
                "engine.setProperty('rate', 155);"
                f"engine.save_to_file({text!r}, {wav_path!r});"
                "engine.runAndWait()"
            )
            flags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if sys.platform == "win32" else 0
            proc = subprocess.run(
                [sys.executable, "-c", code],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                timeout=20,
                creationflags=flags,
            )
            if proc.returncode != 0:
                log.error("SAPI WAV synthesis failed: %s", proc.stderr.decode(errors="ignore"))
                return False
            return os.path.exists(wav_path) and os.path.getsize(wav_path) > 0
        except Exception as exc:
            log.error("SAPI WAV synthesis error: %s", exc, exc_info=True)
            return False

    def _sapi_speak(self, text: str) -> None:
        try:
            code = (
                "import pyttsx3;"
                "engine=pyttsx3.init();"
                "engine.setProperty('rate', 155);"
                f"engine.say({text!r});"
                "engine.runAndWait()"
            )
            flags = getattr(subprocess, "CREATE_NO_WINDOW", 0) if sys.platform == "win32" else 0
            self.current_process = subprocess.Popen(
                [sys.executable, "-c", code],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=flags,
            )
            self.current_process.wait(timeout=30)
        except Exception as exc:
            log.error("SAPI speech failed: %s", exc, exc_info=True)
        finally:
            self.current_process = None

    def interrupt(self) -> None:
        try:
            self.tts_interrupt_event.set()
            while not self.queue.empty():
                self.queue.get_nowait()
            if self.current_process:
                self.current_process.terminate()
                try:
                    self.current_process.wait(timeout=1)
                except subprocess.TimeoutExpired:
                    self.current_process.kill()
            for name in os.listdir(self.speech_dir):
                if name.endswith(".tmp.mp3"):
                    os.remove(os.path.join(self.speech_dir, name))
            self._threadsafe_json({"type": "tts_stop"})
            self.is_speaking = False
        except Exception as exc:
            log.error("TTS interrupt failed: %s", exc, exc_info=True)
        finally:
            self.tts_interrupt_event.clear()

    async def stop_async(self) -> None:
        await asyncio.get_running_loop().run_in_executor(None, self.interrupt)

    def stop(self) -> None:
        self.should_stop.set()
        self.queue.put(None)
        self.interrupt()
        self.worker.join(timeout=3)

    def _worker_loop(self) -> None:
        while not self.should_stop.is_set():
            try:
                text = self.queue.get(timeout=0.5)
                if text is None:
                    return
                self.synthesize_and_broadcast(text)
            except queue.Empty:
                continue
            except Exception as exc:
                log.error("Voice worker failed: %s", exc, exc_info=True)

    def _threadsafe_json(self, payload: dict) -> None:
        if self.loop and self.broadcast_json:
            try:
                asyncio.run_coroutine_threadsafe(self.broadcast_json(payload), self.loop)
            except Exception as exc:
                log.error("Voice broadcast scheduling failed: %s", exc, exc_info=True)

    @staticmethod
    def split_complete_sentences(text: str) -> list[str]:
        matches = re.findall(r"[^.!?]+[.!?]+", text)
        if not matches:
            return [text] if text.strip() else []
        remainder = text
        for match in matches:
            remainder = remainder.replace(match, "", 1)
        return matches + ([remainder] if remainder.strip() else [])

    @staticmethod
    def clean_text(text: str) -> str:
        return re.sub(r"\s+", " ", str(text).replace("[LEARNED]", "")).strip()

    @staticmethod
    def _safe_callback(callback: Optional[Callable[[], None]]) -> None:
        if callback:
            try:
                callback()
            except Exception as exc:
                log.error("Voice callback failed: %s", exc, exc_info=True)

    def get_status(self) -> dict:
        return {
            "ready": True,
            "is_speaking": self.is_speaking,
            "queue_size": self.queue.qsize(),
            "engine": self.config["voice"]["tts_engine"],
            "piper_available": os.path.exists(rel_path(self.config["paths"]["piper_binary"])),
            "ffmpeg": FFMPEG_PATH,
        }


async def generate_edge_tts(text: str, voice_name: Optional[str] = None) -> Optional[str]:
    engine = JarvisVoiceEngine()
    return await engine.speak_async(text)
