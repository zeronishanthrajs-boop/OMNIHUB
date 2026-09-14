"""
JARVIS auditory cortex.

Phase 1 rebuild:
- Single server-side STT pipeline.
- Explicit seven-state audio state machine.
- openWakeWord wake detection in a dedicated microphone stream.
- faster-whisper tiny.en transcription with startup pre-warm.
- Explicit FFmpeg resolution at module load time.
"""

from __future__ import annotations

import asyncio
import logging
import math
import os
import queue
import shutil
import subprocess
import sys
import threading
import time
import traceback
import wave
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Awaitable, Callable, Optional

import config

log = logging.getLogger("jarvis.ears")

BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

WHISPER_CACHE_DIR = BASE_DIR / "models" / "whisper" / "tiny.en"
WHISPER_CACHE_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH_BYTES = 2
WAKE_BLOCK_SIZE = 1280
RECORD_BLOCK_SIZE = 1600


def _sapi_speak_system_message(text: str, wait: bool = False) -> None:
    """Speak a short system message without importing voice.py."""
    clean_text = " ".join(str(text).split())
    if not clean_text:
        return

    try:
        cmd = (
            "import pyttsx3; "
            "engine=pyttsx3.init(); "
            "engine.setProperty('rate', 155); "
            "engine.setProperty('volume', 0.9); "
            f"engine.say({clean_text!r}); "
            "engine.runAndWait()"
        )
        creationflags = 0
        if sys.platform == "win32":
            creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        proc = subprocess.Popen(
            [sys.executable, "-c", cmd],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=creationflags,
        )
        if wait:
            proc.wait(timeout=12)
    except Exception as exc:
        log.error("System speech fallback failed: %s", exc, exc_info=True)


def resolve_ffmpeg_path() -> Optional[str]:
    """Resolve FFmpeg using the fixed Phase 1 priority order."""
    candidates = [
        BASE_DIR / "venv" / "Scripts" / "ffmpeg.bat",
        BASE_DIR / "venv" / "Scripts" / "ffmpeg.exe",
    ]

    for candidate in candidates:
        try:
            if candidate.exists():
                return str(candidate)
        except OSError as exc:
            log.error("Failed while checking FFmpeg candidate %s: %s", candidate, exc, exc_info=True)

    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    windows_ffmpeg = Path(r"C:\ffmpeg\bin\ffmpeg.exe")
    try:
        if windows_ffmpeg.exists():
            return str(windows_ffmpeg)
    except OSError as exc:
        log.error("Failed while checking FFmpeg candidate %s: %s", windows_ffmpeg, exc, exc_info=True)

    bundled_ffmpeg = BASE_DIR / "bin" / "ffmpeg" / "ffmpeg.exe"
    try:
        if bundled_ffmpeg.exists():
            return str(bundled_ffmpeg)
    except OSError as exc:
        log.error("Failed while checking FFmpeg candidate %s: %s", bundled_ffmpeg, exc, exc_info=True)

    return None


FFMPEG_PATH = resolve_ffmpeg_path()
if FFMPEG_PATH:
    ffmpeg_parent = str(Path(FFMPEG_PATH).parent)
    os.environ["PATH"] = ffmpeg_parent + os.pathsep + os.environ.get("PATH", "")
    log.info("FFmpeg resolved for audio processing: %s", FFMPEG_PATH)
else:
    log.critical("FFmpeg is missing. Voice input is disabled until setup.bat installs it.")
    _sapi_speak_system_message("FFmpeg is missing. Voice input is disabled. Please run setup.bat.")


class AudioState(str, Enum):
    IDLE = "idle"
    WAKE_DETECTED = "wake_detected"
    LISTENING = "listening"
    TRANSCRIBING = "transcribing"
    PROCESSING = "processing"
    RESPONDING = "responding"
    ERROR = "error"


@dataclass
class TranscriptionResult:
    text: str
    confidence: float
    wav_path: Path


class AudioRuntimeConfig:
    """Compatibility surface for existing HUD sensitivity controls."""

    def __init__(self, owner: "JarvisEars"):
        self._owner = owner
        self.dynamic_energy_threshold = False

    @property
    def energy_threshold(self) -> float:
        return self._owner.recording_energy_threshold

    @energy_threshold.setter
    def energy_threshold(self, value: float) -> None:
        self._owner.set_recording_energy_threshold(value)


class JarvisEars:
    """Single source of truth for wake detection, recording, STT, and voice command routing."""

    filter_patterns = {
        "",
        "you",
        "thank you",
        "thanks",
        "thanks for watching",
        "thank you for watching",
        "[music]",
        "[silence]",
        "bye",
        "goodbye",
        "the end",
        "subscribe",
        "like and subscribe",
    }

    def __init__(self) -> None:
        self.state = AudioState.IDLE
        self.state_lock = threading.RLock()
        self.stop_event = threading.Event()
        self.wake_event = threading.Event()
        self.cancel_recording_event = threading.Event()
        self.tts_interrupt = threading.Event()

        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.broadcast_state: Optional[Callable[[str, str], Awaitable[None]]] = None
        self.broadcast_json: Optional[Callable[[dict], Awaitable[None]]] = None
        self.process_command: Optional[Callable[[str], Awaitable[str]]] = None
        self.speak_response: Optional[Callable[[str], Awaitable[None]]] = None
        self.voice_engine: Any = None

        self.main_task: Optional[asyncio.Task] = None
        self.wake_thread: Optional[threading.Thread] = None
        self.whisper_model: Any = None
        self.whisper_model_lock = threading.RLock()

        self.wake_model_name = os.getenv("OPENWAKEWORD_MODEL", "hey_jarvis").strip() or "hey_jarvis"
        self.display_wake_word = os.getenv("WAKE_WORD", getattr(config, "WAKE_WORD", "hey jarvis")).strip().lower()
        if self.display_wake_word == "jarvis":
            self.display_wake_word = "hey jarvis"

        self.wake_sensitivity = self._clamp_float(os.getenv("WAKE_SENSITIVITY", "0.6"), 0.3, 0.9, 0.6)
        self.recording_energy_threshold = self._clamp_float(
            os.getenv("MIC_ENERGY_THRESHOLD", "350.0"), 30.0, 2000.0, 350.0
        )
        self.min_recording_seconds = self._clamp_float(
            os.getenv("MIN_RECORDING_SECONDS", "1.5"), 0.5, 5.0, 1.5
        )
        self.silence_timeout_seconds = self._clamp_float(
            os.getenv("SILENCE_TIMEOUT_SECONDS", "1.2"), 0.4, 5.0, 1.2
        )
        self.max_recording_seconds = self._clamp_float(
            os.getenv("MAX_RECORDING_SECONDS", "15.0"), 3.0, 30.0, 15.0
        )
        self.mic_index: Optional[int] = None
        mic_override = os.getenv("MIC_INDEX", "").strip()
        if mic_override:
            try:
                self.mic_index = int(mic_override)
                log.info("Microphone index override configured: %d", self.mic_index)
            except ValueError:
                log.warning("Invalid MIC_INDEX env override (must be an integer): %r", mic_override)

        self.continuous_listening = False
        self.last_wake_timestamp: Optional[float] = None
        self.last_transcript_confidence = 0.0
        self.last_rms = 0.0
        self.last_transcript = ""
        self.last_error = ""
        self.message_queue_depth = 0
        self.component_status = "ready" if FFMPEG_PATH else "error"

        self.recognizer = AudioRuntimeConfig(self)

        log.info(
            "JarvisEars initialized: state=%s wake=%s sensitivity=%.2f rms_threshold=%.1f",
            self.state.value,
            self.display_wake_word,
            self.wake_sensitivity,
            self.recording_energy_threshold,
        )

    @staticmethod
    def _clamp_float(raw_value: Any, minimum: float, maximum: float, fallback: float) -> float:
        try:
            value = float(raw_value)
            return max(minimum, min(maximum, value))
        except (TypeError, ValueError):
            return fallback

    def configure_runtime(
        self,
        *,
        loop: asyncio.AbstractEventLoop,
        broadcast_state: Callable[[str, str], Awaitable[None]],
        broadcast_json: Callable[[dict], Awaitable[None]],
        process_command: Callable[[str], Awaitable[str]],
        speak_response: Callable[[str], Awaitable[None]],
        voice_engine: Any,
    ) -> None:
        self.loop = loop
        self.broadcast_state = broadcast_state
        self.broadcast_json = broadcast_json
        self.process_command = process_command
        self.speak_response = speak_response
        self.voice_engine = voice_engine
        log.info("JarvisEars runtime callbacks configured.")

    def set_recording_energy_threshold(self, value: float) -> None:
        self.recording_energy_threshold = self._clamp_float(value, 30.0, 2000.0, self.recording_energy_threshold)
        log.info("Recording RMS threshold updated to %.1f", self.recording_energy_threshold)

    def set_wake_sensitivity(self, value: float) -> None:
        self.wake_sensitivity = self._clamp_float(value, 0.3, 0.9, self.wake_sensitivity)
        log.info("Wake sensitivity updated to %.2f", self.wake_sensitivity)

    def probe_microphone(self) -> bool:
        """Open the default input once so startup verifies audio before STT warms."""
        try:
            import sounddevice as sd

            devices = sd.query_devices()
            device_count = len(devices) if devices is not None else 0
            with sd.InputStream(
                device=self.mic_index,
                samplerate=SAMPLE_RATE,
                channels=CHANNELS,
                dtype="int16",
                blocksize=WAKE_BLOCK_SIZE,
            ):
                pass
            log.info("Microphone probe passed. devices=%d selected=%s", device_count, self.mic_index)
            return True
        except Exception as exc:
            self.component_status = "error"
            log.error("Microphone probe failed: %s", exc, exc_info=True)
            return False

    def manual_wake(self) -> None:
        """Trigger the same path as a real wake-word detection from the HUD microphone button."""
        self.last_wake_timestamp = time.time()
        self.wake_event.set()
        log.info("Manual wake event queued from HUD.")

    def stop_current_capture(self) -> None:
        self.cancel_recording_event.set()
        log.info("Audio capture cancellation requested.")

    def start(self) -> None:
        if not self.loop:
            raise RuntimeError("JarvisEars runtime is not configured.")
        if self.main_task and not self.main_task.done():
            log.info("JarvisEars state machine already running.")
            return

        self.stop_event.clear()
        self.cancel_recording_event.clear()
        self.main_task = self.loop.create_task(self._state_machine_loop())
        self._start_wake_word_thread()
        log.info("JarvisEars state machine started.")

    async def shutdown(self) -> None:
        self.stop_event.set()
        self.cancel_recording_event.set()
        self.wake_event.set()
        if self.main_task:
            self.main_task.cancel()
            try:
                await self.main_task
            except asyncio.CancelledError:
                log.info("JarvisEars state machine task cancelled during shutdown.")
            except Exception as exc:
                log.error("JarvisEars shutdown encountered a task error: %s", exc, exc_info=True)
        if self.wake_thread and self.wake_thread.is_alive():
            self.wake_thread.join(timeout=2.0)
        log.info("JarvisEars shutdown complete.")

    async def prewarm_whisper(self) -> bool:
        """Load faster-whisper and run a silent clip through it before the first command."""
        if not FFMPEG_PATH:
            self.component_status = "error"
            await self._notify_error("FFmpeg is missing. Voice input is disabled. Please run setup.bat.")
            return False

        try:
            if not self._whisper_cache_has_model_files():
                await self._notify_info("Downloading speech model, one moment.")
                self._speak("Downloading speech model, one moment.")

            await self._run_blocking(self._load_whisper_model)
            silent_path = TEMP_DIR / "whisper_prewarm_silence.wav"
            self._write_wav(silent_path, self._silent_samples(int(SAMPLE_RATE * 0.5)))
            await self._run_blocking(self._transcribe_wav, silent_path)
            self.component_status = "ready"
            await self._notify_success("Speech model warmed and ready.")
            log.info("faster-whisper tiny.en pre-warm complete.")
            return True
        except Exception as exc:
            self.component_status = "error"
            log.error("Whisper pre-warm failed: %s", exc, exc_info=True)
            await self._notify_error("Speech model failed to warm. Voice input is degraded.")
            self._speak("Speech model failed to warm. Voice input is degraded.")
            return False

    def get_status(self) -> dict:
        with self.state_lock:
            state_value = self.state.value
        return {
            "state": state_value,
            "wake_word": self.display_wake_word,
            "wake_sensitivity": self.wake_sensitivity,
            "energy_threshold": self.recording_energy_threshold,
            "last_rms": round(self.last_rms, 1),
            "last_wake_timestamp": self.last_wake_timestamp,
            "last_transcript_confidence": round(self.last_transcript_confidence, 3),
            "last_transcript": self.last_transcript,
            "message_queue_depth": self.message_queue_depth,
            "component_status": self.component_status,
            "ffmpeg_path": FFMPEG_PATH,
        }

    async def _state_machine_loop(self) -> None:
        await self._transition(AudioState.IDLE, "Wake word detector armed.")
        while not self.stop_event.is_set():
            try:
                if self.continuous_listening:
                    with self.state_lock:
                        if self.state == AudioState.IDLE:
                            self.state = AudioState.WAKE_DETECTED

                if self.state is AudioState.IDLE:
                    await self._wait_for_wake()
                    continue

                if self.state is AudioState.WAKE_DETECTED:
                    samples = await self._record_until_silence()
                    if samples is None:
                        if self.continuous_listening:
                            await asyncio.sleep(0.5)
                        else:
                            await self._transition(AudioState.IDLE, "Ready for wake word.")
                    else:
                        await self._transcribe_process_and_respond(samples)
                    continue

                await asyncio.sleep(0.05)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                await self._enter_error_state(exc)

    async def _wait_for_wake(self) -> None:
        while not self.stop_event.is_set():
            if self.wake_event.is_set():
                self.wake_event.clear()
                await self._transition(AudioState.WAKE_DETECTED, "Wake word detected.")
                return
            await asyncio.sleep(0.05)

    async def _record_until_silence(self) -> Optional[Any]:
        self.cancel_recording_event.clear()
        self.tts_interrupt.set()
        self._interrupt_voice()
        await self._send_json({"type": "tts_stop"})
        self._play_confirmation_chime()
        await self._send_json({"type": "wake_detected", "wake_word": self.display_wake_word, "timestamp": time.time()})

        if not FFMPEG_PATH:
            await self._notify_error("FFmpeg is missing. Voice input is disabled. Please run setup.bat.")
            self._speak("FFmpeg is missing. Voice input is disabled. Please run setup.bat.")
            return None

        try:
            import numpy as np
            import sounddevice as sd
        except Exception as exc:
            log.error("Recording backend unavailable: %s", exc, exc_info=True)
            self._speak("Microphone recording is unavailable. Please run setup.bat.")
            await self._notify_error("Microphone recording backend unavailable.")
            return None

        chunks: list[Any] = []
        chunk_queue: "queue.Queue[Any]" = queue.Queue(maxsize=120)

        def audio_callback(indata: Any, frames: int, callback_time: Any, status: Any) -> None:
            if status:
                log.warning("Recording stream status: %s", status)
            try:
                chunk_queue.put_nowait(indata.copy())
            except queue.Full:
                log.error("Recording queue overflow. Oldest speech audio may be lost.")

        wake_started = time.monotonic()
        speech_started_at: Optional[float] = None
        last_sound_at: Optional[float] = None
        latest_rms = 0.0

        try:
            with sd.InputStream(
                device=self.mic_index,
                samplerate=SAMPLE_RATE,
                channels=CHANNELS,
                dtype="int16",
                blocksize=RECORD_BLOCK_SIZE,
                callback=audio_callback,
            ):
                while not self.stop_event.is_set() and not self.cancel_recording_event.is_set():
                    drained = False
                    while True:
                        try:
                            chunk = chunk_queue.get_nowait()
                        except queue.Empty:
                            break
                        drained = True
                        flattened = np.asarray(chunk, dtype=np.int16).reshape(-1)
                        chunks.append(flattened)
                        latest_rms = self._calculate_rms(flattened)
                        self.last_rms = latest_rms

                    now = time.monotonic()
                    if speech_started_at is None:
                        if latest_rms >= self.recording_energy_threshold:
                            speech_started_at = now
                            last_sound_at = now
                            await self._transition(AudioState.LISTENING, "Listening.")
                        elif now - wake_started >= 8.0:
                            self._speak("I didn't catch that. Say Hey Jarvis again.")
                            log.info("Wake detected but no command audio arrived within 8 seconds.")
                            return None
                    else:
                        if latest_rms >= self.recording_energy_threshold:
                            last_sound_at = now
                        recording_duration = now - speech_started_at
                        trailing_silence = now - (last_sound_at or speech_started_at)
                        if recording_duration >= self.max_recording_seconds:
                            log.info("Maximum recording duration reached; forcing transcription.")
                            return self._concat_audio_chunks(np, chunks)
                        if (
                            recording_duration >= self.min_recording_seconds
                            and trailing_silence >= self.silence_timeout_seconds
                        ):
                            log.info(
                                "Trailing silence detected after %.2fs of speech; moving to transcription.",
                                recording_duration,
                            )
                            return self._concat_audio_chunks(np, chunks)

                    if not drained:
                        await asyncio.sleep(0.02)
                    else:
                        await asyncio.sleep(0.005)
        except Exception as exc:
            log.error("Command recording failed: %s", exc, exc_info=True)
            self._speak("Microphone capture failed. Let me reset.")
            await self._notify_error("Microphone capture failed. Check the selected input device.")
            return None

        return None

    async def _transcribe_process_and_respond(self, samples: Any) -> None:
        await self._transition(AudioState.TRANSCRIBING, "Transcribing.")

        wav_path = TEMP_DIR / f"jarvis_command_{int(time.time() * 1000)}.wav"
        try:
            self._write_wav(wav_path, samples)
        except Exception as exc:
            log.error("Failed to write command WAV file %s: %s", wav_path, exc, exc_info=True)
            self._speak("I could not save the microphone recording. Please try again.")
            await self._transition(AudioState.IDLE, "Ready for wake word.")
            return

        transcription_future = asyncio.create_task(self._transcribe_with_feedback(wav_path))
        try:
            result = await transcription_future
        except Exception as exc:
            log.error("Transcription failed: %s", exc, exc_info=True)
            self._speak("Sorry, I could not transcribe that. Try again.")
            await self._transition(AudioState.IDLE, "Ready for wake word.")
            return

        cleaned = self._clean_transcript(result.text)
        self.last_transcript = cleaned
        self.last_transcript_confidence = result.confidence

        if not cleaned:
            log.info("Transcription was empty or filtered as noise. Raw text: %r", result.text)
            self._speak("Sorry, I couldn't make that out. Try again.")
            await self._transition(AudioState.IDLE, "Ready for wake word.")
            return

        await self._transition(AudioState.PROCESSING, "Processing command.")
        log.info("Voice transcript: %s", cleaned)
        await self._send_json({"type": "chat_voice", "text": cleaned, "confidence": result.confidence})

        if not self.process_command:
            self._speak("My command processor is not connected. Please restart JARVIS.")
            await self._notify_error("Command processor callback is missing.")
            await self._transition(AudioState.IDLE, "Ready for wake word.")
            return

        try:
            response_text = await asyncio.wait_for(self.process_command(cleaned), timeout=30.0)
        except asyncio.TimeoutError:
            log.error("Brain processing timed out after 30 seconds for transcript: %s", cleaned)
            self._speak("My brain took too long. Please try again.")
            await self._transition(AudioState.IDLE, "Ready for wake word.")
            return
        except Exception as exc:
            log.error("Brain processing failed for transcript %r: %s", cleaned, exc, exc_info=True)
            self._speak("I hit an error while thinking. Let me reset.")
            await self._transition(AudioState.IDLE, "Ready for wake word.")
            return

        await self._respond(response_text or "")

    async def _transcribe_with_feedback(self, wav_path: Path) -> TranscriptionResult:
        transcribe_task = asyncio.create_task(self._run_blocking(self._transcribe_wav, wav_path))
        done, _pending = await asyncio.wait({transcribe_task}, timeout=3.0)
        if not done:
            self._speak("Processing what you said...")
            await self._notify_info("Processing what you said...")
        return await transcribe_task

    async def _respond(self, response_text: str) -> None:
        clean_response = response_text.replace("[LEARNED]", "").strip()
        if not clean_response:
            clean_response = "I completed the request, Nishanth."

        await self._transition(AudioState.RESPONDING, "Responding.")

        stream_task = asyncio.create_task(self._stream_response_words(clean_response))
        speak_task: Optional[asyncio.Task] = None
        if self.speak_response:
            speak_task = asyncio.create_task(self.speak_response(clean_response))

        tasks = [stream_task]
        if speak_task:
            tasks.append(speak_task)

        try:
            while tasks:
                if self.wake_event.is_set():
                    self.wake_event.clear()
                    self._interrupt_voice()
                    await self._send_json({"type": "tts_stop"})
                    for task in tasks:
                        task.cancel()
                    await self._transition(AudioState.WAKE_DETECTED, "Wake word detected.")
                    return

                remaining = []
                for task in tasks:
                    if task.done():
                        try:
                            await task
                        except asyncio.CancelledError:
                            log.info("Response task cancelled after wake interruption.")
                        except Exception as exc:
                            log.error("Response task failed: %s", exc, exc_info=True)
                    else:
                        remaining.append(task)
                tasks = remaining
                await asyncio.sleep(0.05)
        finally:
            self.tts_interrupt.clear()

        await self._transition(AudioState.IDLE, "Ready for wake word.")

    async def _stream_response_words(self, text: str) -> None:
        stream_id = f"voice_{int(time.time() * 1000)}"
        await self._send_json({"type": "response_stream_start", "id": stream_id, "source": "JARVIS"})
        words = text.split()
        for index, word in enumerate(words):
            if self.wake_event.is_set() or self.stop_event.is_set():
                await self._send_json({"type": "response_stream_end", "id": stream_id, "interrupted": True})
                return
            separator = "" if index == 0 else " "
            await self._send_json({"type": "response_stream_delta", "id": stream_id, "text": f"{separator}{word}"})
            await asyncio.sleep(0.035)
        await self._send_json({"type": "response_stream_end", "id": stream_id, "interrupted": False})

    def _start_wake_word_thread(self) -> None:
        if self.wake_thread and self.wake_thread.is_alive():
            return
        self.wake_thread = threading.Thread(
            target=self._wake_word_worker,
            name="JarvisWakeWord",
            daemon=True,
        )
        self.wake_thread.start()

    def _wake_word_worker(self) -> None:
        try:
            import numpy as np
            import sounddevice as sd
            from openwakeword.model import Model
        except Exception as exc:
            self.component_status = "error"
            log.error("Wake word backend unavailable: %s", exc, exc_info=True)
            _sapi_speak_system_message("Wake word engine is unavailable. Please run setup.bat.")
            self._threadsafe_json({"type": "notify", "level": "error", "message": "Wake word engine unavailable."})
            return

        model = None
        active_model_name = self.wake_model_name
        try:
            self._download_openwakeword_models()
            model = Model(wakeword_models=[active_model_name], inference_framework="onnx")
            log.info("openWakeWord model loaded: %s", active_model_name)
        except Exception as primary_exc:
            log.error("Failed to load openWakeWord model %s: %s", active_model_name, primary_exc, exc_info=True)
            active_model_name = "hey_mycroft"
            try:
                model = Model(wakeword_models=[active_model_name], inference_framework="onnx")
                log.info("openWakeWord fallback model loaded: %s", active_model_name)
            except Exception as fallback_exc:
                self.component_status = "error"
                log.error("Failed to load openWakeWord fallback model: %s", fallback_exc, exc_info=True)
                _sapi_speak_system_message("Wake word model is missing. Please run setup.bat.")
                self._threadsafe_json({"type": "notify", "level": "error", "message": "Wake word model missing."})
                return

        while not self.stop_event.is_set():
            try:
                with sd.InputStream(
                    device=self.mic_index,
                    samplerate=SAMPLE_RATE,
                    channels=CHANNELS,
                    dtype="int16",
                    blocksize=WAKE_BLOCK_SIZE,
                ) as stream:
                    log.info("Wake word stream active using model %s.", active_model_name)
                    while not self.stop_event.is_set():
                        audio, overflowed = stream.read(WAKE_BLOCK_SIZE)
                        if overflowed:
                            log.warning("Wake word stream overflowed; continuing.")
                        frame = np.asarray(audio, dtype=np.int16).reshape(-1)
                        rms = self._calculate_rms(frame)
                        self.last_rms = rms
                        prediction = model.predict(frame)
                        score = self._extract_wake_score(prediction)
                        log.debug(
                            "Wake frame rms=%.1f score=%.3f threshold=%.3f state_allowed=%s",
                            rms,
                            score,
                            self.wake_sensitivity,
                            self._state_allows_wake_detection(),
                        )
                        if score >= self.wake_sensitivity and self._state_allows_wake_detection():
                            self.last_wake_timestamp = time.time()
                            log.info(
                                "Wake word detected as Hey Jarvis. model=%s score=%.3f threshold=%.3f",
                                active_model_name,
                                score,
                                self.wake_sensitivity,
                            )
                            self.wake_event.set()
                            self._threadsafe_json(
                                {
                                    "type": "wake_detected",
                                    "wake_word": self.display_wake_word,
                                    "score": score,
                                    "timestamp": self.last_wake_timestamp,
                                }
                            )
                            # Break inner loop to close InputStream and release microphone device completely
                            break
                
                # Wait until the state machine transitions back to IDLE before looping and reopening the stream
                while not self.stop_event.is_set():
                    with self.state_lock:
                        is_idle = self.state == AudioState.IDLE
                    if is_idle:
                        break
                    time.sleep(0.15)
            except Exception as exc:
                self.component_status = "error"
                log.error("Wake word stream error: %s", exc, exc_info=True)
                _sapi_speak_system_message("Wake word listening failed. I will retry.")
                time.sleep(2.0)

    def _download_openwakeword_models(self) -> None:
        try:
            from openwakeword.utils import download_models

            download_models(model_names=[self.wake_model_name, "hey_mycroft"])
        except Exception as exc:
            log.warning("openWakeWord model download helper failed or was unavailable: %s", exc)

    def _extract_wake_score(self, prediction: Any) -> float:
        try:
            if isinstance(prediction, dict):
                scores = []
                for value in prediction.values():
                    try:
                        scores.append(float(value))
                    except (TypeError, ValueError):
                        log.debug("Ignoring non-numeric wake score value: %r", value)
                return max(scores) if scores else 0.0
        except Exception as exc:
            log.error("Failed to parse wake prediction %r: %s", prediction, exc, exc_info=True)
        return 0.0

    def _state_allows_wake_detection(self) -> bool:
        with self.state_lock:
            return self.state in {AudioState.IDLE, AudioState.RESPONDING}

    async def _transition(self, new_state: AudioState, message: str) -> None:
        with self.state_lock:
            old_state = self.state
            self.state = new_state
        log.info("Audio state transition: %s -> %s | %s", old_state.value, new_state.value, message)
        await self._send_json({"type": "stt_state", "state": new_state.value, "message": message, "status": self.get_status()})
        if self.broadcast_state:
            await self.broadcast_state(new_state.value, message)

    async def _enter_error_state(self, exc: Exception) -> None:
        self.last_error = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        log.error("Unhandled audio state machine error: %s", exc, exc_info=True)
        await self._transition(AudioState.ERROR, "Audio pipeline error.")
        self._speak("I hit an error. Let me reset.")
        await self._send_json({"type": "error", "message": "Audio pipeline error. Resetting voice input."})
        self.cancel_recording_event.set()
        self.wake_event.clear()
        self.last_rms = 0.0
        await asyncio.sleep(2.0)
        await self._transition(AudioState.IDLE, "Ready for wake word.")

    async def _send_json(self, payload: dict) -> None:
        if not self.broadcast_json:
            return
        try:
            await self.broadcast_json(payload)
        except Exception as exc:
            log.error("Failed to broadcast audio payload %s: %s", payload, exc, exc_info=True)

    def _threadsafe_json(self, payload: dict) -> None:
        if not self.loop or not self.broadcast_json:
            return
        try:
            asyncio.run_coroutine_threadsafe(self._send_json(payload), self.loop)
        except Exception as exc:
            log.error("Failed to schedule audio payload broadcast: %s", exc, exc_info=True)

    async def _notify_info(self, message: str) -> None:
        await self._send_json({"type": "notify", "level": "info", "message": message})

    async def _notify_success(self, message: str) -> None:
        await self._send_json({"type": "notify", "level": "success", "message": message})

    async def _notify_error(self, message: str) -> None:
        await self._send_json({"type": "notify", "level": "error", "message": message})

    def _speak(self, text: str) -> None:
        if self.voice_engine:
            try:
                self.voice_engine.speak(text)
                return
            except Exception as exc:
                log.error("Voice engine failed while speaking audio message: %s", exc, exc_info=True)
        _sapi_speak_system_message(text)

    def _interrupt_voice(self) -> None:
        if self.voice_engine:
            try:
                self.voice_engine.interrupt()
            except Exception as exc:
                log.error("Voice interrupt failed: %s", exc, exc_info=True)

    def _play_confirmation_chime(self) -> None:
        def chime_worker() -> None:
            try:
                if sys.platform == "win32":
                    import winsound

                    winsound.Beep(880, 90)
                    winsound.Beep(1320, 120)
                    return
                self._play_chime_with_sounddevice()
            except Exception as exc:
                log.error("Confirmation chime failed: %s", exc, exc_info=True)

        threading.Thread(target=chime_worker, name="JarvisWakeChime", daemon=True).start()

    def _play_chime_with_sounddevice(self) -> None:
        try:
            import numpy as np
            import sounddevice as sd

            duration = 0.12
            t = np.linspace(0.0, duration, int(SAMPLE_RATE * duration), False)
            tone = 0.18 * np.sin(2.0 * math.pi * 1046.5 * t)
            sd.play(tone, SAMPLE_RATE)
            sd.wait()
        except Exception as exc:
            log.error("Portable chime playback failed: %s", exc, exc_info=True)

    async def _run_blocking(self, func: Callable[..., Any], *args: Any) -> Any:
        loop = self.loop or asyncio.get_running_loop()
        return await loop.run_in_executor(None, func, *args)

    def _whisper_cache_has_model_files(self) -> bool:
        return self._find_whisper_model_dir() is not None

    def _find_whisper_model_dir(self) -> Optional[Path]:
        try:
            for model_bin in WHISPER_CACHE_DIR.rglob("model.bin"):
                candidate = model_bin.parent
                if (candidate / "config.json").exists():
                    return candidate
            return None
        except OSError as exc:
            log.error("Failed to inspect Whisper cache directory: %s", exc, exc_info=True)
            return None

    def _load_whisper_model(self) -> Any:
        with self.whisper_model_lock:
            if self.whisper_model is not None:
                return self.whisper_model
            try:
                from faster_whisper import WhisperModel
            except Exception as exc:
                raise RuntimeError("faster-whisper is not installed. Run setup.bat.") from exc

            local_model_path = self._find_whisper_model_dir()
            if local_model_path is not None:
                model_ref = str(local_model_path)
                download_root = None
            else:
                model_ref = "tiny.en"
                download_root = str(WHISPER_CACHE_DIR)

            log.info("Loading faster-whisper model %s on CPU int8.", model_ref)
            if download_root:
                self.whisper_model = WhisperModel(
                    model_ref,
                    device="cpu",
                    compute_type="int8",
                    download_root=download_root,
                )
            else:
                self.whisper_model = WhisperModel(
                    model_ref,
                    device="cpu",
                    compute_type="int8",
                )
            return self.whisper_model

    def _transcribe_wav(self, wav_path: Path) -> TranscriptionResult:
        model = self._load_whisper_model()
        segments, info = model.transcribe(
            str(wav_path),
            language="en",
            beam_size=3,
            vad_filter=True,
            condition_on_previous_text=False,
        )

        parts: list[str] = []
        confidences: list[float] = []
        for segment in segments:
            segment_text = getattr(segment, "text", "")
            if segment_text:
                parts.append(segment_text.strip())
            avg_logprob = getattr(segment, "avg_logprob", None)
            if avg_logprob is not None:
                try:
                    confidences.append(max(0.0, min(1.0, math.exp(float(avg_logprob)))))
                except (TypeError, ValueError, OverflowError):
                    log.debug("Unable to convert avg_logprob to confidence: %r", avg_logprob)

        text = " ".join(part for part in parts if part).strip()
        language_probability = float(getattr(info, "language_probability", 0.0) or 0.0)
        if confidences:
            confidence = sum(confidences) / len(confidences)
        else:
            confidence = language_probability

        log.info("Transcription complete: text=%r confidence=%.3f", text, confidence)
        return TranscriptionResult(text=text, confidence=confidence, wav_path=wav_path)

    def _write_wav(self, wav_path: Path, samples: Any) -> None:
        wav_path.parent.mkdir(parents=True, exist_ok=True)
        frames = self._samples_to_bytes(samples)
        with wave.open(str(wav_path), "wb") as wav_file:
            wav_file.setnchannels(CHANNELS)
            wav_file.setsampwidth(SAMPLE_WIDTH_BYTES)
            wav_file.setframerate(SAMPLE_RATE)
            wav_file.writeframes(frames)
        log.info("Saved command audio buffer to %s (%d bytes).", wav_path, len(frames))

    def _samples_to_bytes(self, samples: Any) -> bytes:
        if isinstance(samples, bytes):
            return samples
        try:
            import numpy as np

            return np.asarray(samples, dtype=np.int16).reshape(-1).tobytes()
        except Exception as exc:
            log.error("Failed converting samples to PCM bytes: %s", exc, exc_info=True)
            raise

    def _silent_samples(self, count: int) -> Any:
        try:
            import numpy as np

            return np.zeros(count, dtype=np.int16)
        except Exception as exc:
            log.error("Failed creating silent audio samples: %s", exc, exc_info=True)
            raise

    def _concat_audio_chunks(self, np_module: Any, chunks: list[Any]) -> Any:
        if not chunks:
            return np_module.zeros(int(SAMPLE_RATE * self.min_recording_seconds), dtype=np.int16)
        return np_module.concatenate(chunks).astype(np_module.int16)

    def _calculate_rms(self, samples: Any) -> float:
        try:
            import numpy as np

            arr = np.asarray(samples, dtype=np.float32).reshape(-1)
            if arr.size == 0:
                return 0.0
            return float(np.sqrt(np.mean(arr * arr)))
        except Exception as exc:
            log.error("RMS calculation failed: %s", exc, exc_info=True)
            return 0.0

    def _clean_transcript(self, text: str) -> str:
        cleaned = " ".join((text or "").strip().split())
        lowered = cleaned.lower().strip(" .!?")
        if lowered in self.filter_patterns:
            return ""
        for pattern in self.filter_patterns:
            if pattern and lowered.endswith(pattern):
                lowered = lowered[: -len(pattern)].strip(" .!?")
        if len(lowered) <= 1:
            return ""
        return cleaned
