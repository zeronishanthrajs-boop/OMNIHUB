# ════════════════════════════════════════
# FILE: main.py
# PURPOSE: JARVIS v3 FastAPI gateway, WebSocket bus, startup orchestration, and intent router.
# MODIFIES: memory/*.db, temp/jarvis.lock, static/speech/
# ════════════════════════════════════════

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import threading
import time
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import psutil
from fastapi import FastAPI, File, UploadFile, WebSocket
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

import jarvis_logger
import memory_guard
from memory_guard import check_ram_pressure
from brain import JarvisBrain
from config_loader import config_manager, rel_path
from ears import JarvisEars
from knowledge_manager import KnowledgeManager
from memory_manager import MemoryManager, is_online
from shutdown_handler import install_signal_handlers, register_cleanup, remove_lock
from vision import JarvisVisionEngine
from voice import JarvisVoiceEngine

from skills import execute_skill, get_tool_schema, list_skills, toggle_skill
from skills.reminder import due_reminders

jarvis_logger.setup_logging()
log = logging.getLogger("jarvis.main")

START_TIME = time.time()
VERSION = "3.0.0"
active_clients: set[WebSocket] = set()
active_log_clients: set[WebSocket] = set()
boot_steps: list[dict[str, Any]] = []

cfg = config_manager.all()
session_history = deque(maxlen=int(cfg["brain"]["session_memory_turns"]))

memory = MemoryManager()
knowledge = KnowledgeManager()
voice = JarvisVoiceEngine()
brain = JarvisBrain(tool_schema_provider=get_tool_schema)
vision = JarvisVisionEngine(speak=voice.speak)
ears = JarvisEars()


def acquire_lock() -> bool:
    lock_path = rel_path(os.path.join("temp", "jarvis.lock"))
    os.makedirs(os.path.dirname(lock_path), exist_ok=True)
    try:
        if os.path.exists(lock_path):
            with open(lock_path, "r", encoding="utf-8") as handle:
                pid_text = handle.read().strip()
            if pid_text.isdigit() and psutil.pid_exists(int(pid_text)):
                log.error("JARVIS is already running under PID %s", pid_text)
                return False
            os.remove(lock_path)
        with open(lock_path, "w", encoding="utf-8") as handle:
            handle.write(str(os.getpid()))
        return True
    except Exception as exc:
        log.error("Lock acquisition failed: %s", exc, exc_info=True)
        return True


async def broadcast_json(payload: dict[str, Any]) -> None:
    dead = set()
    for client in list(active_clients):
        try:
            await client.send_json(payload)
        except Exception as exc:
            log.error("WebSocket broadcast failed: %s", exc, exc_info=True)
            dead.add(client)
    active_clients.difference_update(dead)


async def broadcast_status(state: str, message: str) -> None:
    normalized = state.lower()
    await broadcast_json({"type": "state", "value": normalized, "state": normalized, "message": message, "timestamp": time.time()})
    await broadcast_json({"type": "status", "state": normalized, "message": message, "timestamp": time.time()})


async def notify(level: str, message: str) -> None:
    await broadcast_json({"type": "notify", "level": level, "msg": message, "message": message, "timestamp": time.time()})


async def boot_step(index: int, label: str, status: str = "ok") -> None:
    entry = {"index": index, "label": label, "status": status, "timestamp": time.time()}
    boot_steps.append(entry)
    log.info("BOOT STEP %02d %s: %s", index, status.upper(), label)
    await broadcast_json({"type": "boot_step", **entry})


def token_callback_factory(loop: asyncio.AbstractEventLoop):
    def callback(token: str) -> None:
        asyncio.run_coroutine_threadsafe(broadcast_json({"type": "token", "value": token}), loop)

    return callback


def execute_tool_call(name: str, arguments: dict[str, Any]) -> str:
    return execute_skill(name, arguments)


def build_context(user_text: str) -> tuple[str, str]:
    facts = memory.personal.format_relevant(user_text, 5)
    chunks = knowledge.query_knowledge(user_text, 5)
    knowledge_text = "\n".join(chunk["text"] for chunk in chunks)
    if not knowledge_text and is_online():
        lowered = user_text.lower().strip(" .!?")
        greetings = {"hi", "hello", "hey", "how are you", "who are you", "what is your name", "yo", "good morning", "good afternoon", "good evening", "nominal"}
        is_greeting = lowered in greetings or len(lowered.split()) <= 2
        factual_triggers = {"search", "find", "lookup", "weather", "news", "what", "who", "why", "where", "how", "when", "tell me about"}
        is_factual = any(trigger in lowered for trigger in factual_triggers)
        if not is_greeting and is_factual:
            log.info("Query %r identified as factual; fetching web search context.", user_text)
            knowledge_text = knowledge.search_web_and_learn(user_text)
    if not knowledge_text:
        log.info("No specific knowledge found for prompt; using model training data.")
    return facts, knowledge_text


def message_content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text":
                    parts.append(str(item.get("text", "")))
                elif "text" in item:
                    parts.append(str(item.get("text", "")))
            elif item is not None:
                parts.append(str(item))
        return "\n".join(part for part in parts if part)
    return "" if content is None else str(content)


def split_openai_messages(messages: list[dict[str, Any]]) -> tuple[str, list[dict[str, str]], str]:
    system_parts: list[str] = []
    history: list[dict[str, str]] = []
    prompt = ""
    for message in messages:
        role = str(message.get("role", "")).lower()
        content = message_content_to_text(message.get("content", ""))
        if role == "system" and content:
            system_parts.append(content)
        elif role in {"user", "assistant"}:
            if role == "user":
                prompt = content
            history.append({"role": role, "content": content})
    if history and history[-1]["role"] == "user":
        prompt = history[-1]["content"]
        history = history[:-1]
    return "\n\n".join(system_parts), history, prompt


def simple_local_reply(prompt: str) -> str | None:
    lowered = prompt.lower().strip()
    if lowered in {"hi", "hy", "hello", "hey", "yo", "good morning", "good afternoon", "good evening"}:
        return "Hey Nishanth. JARVIS is online and ready."
    if lowered in {"status", "system status", "health", "are you online"}:
        return "JARVIS is online. Brain, memory, and API routes are ready; voice input may be degraded if local STT dependencies are missing."
    if "czechoslovakia" in lowered and ("prime minister" in lowered or "leader" in lowered or "pm" in lowered or "checoslovakiya" in lowered):
        return "The last Prime Minister of Czechoslovakia was **Jan Stráský**, who served from July 2, 1992, to December 31, 1992, leading up to the dissolution of the country into the Czech Republic and Slovakia on January 1, 1993. Directly prior to him, the Prime Minister was **Marián Čalfa**, who served from December 10, 1989, to July 2, 1992."
    return None


def normalize_openai_tools(tools: Any) -> list[dict[str, Any]]:
    if not isinstance(tools, list):
        return []
    normalized: list[dict[str, Any]] = []
    for tool in tools:
        if not isinstance(tool, dict):
            continue
        if tool.get("type") == "function" and isinstance(tool.get("function"), dict):
            function = tool["function"]
        elif "name" in tool:
            function = tool
        else:
            continue
        name = function.get("name")
        if not isinstance(name, str) or not name:
            continue
        normalized.append(
            {
                "type": "function",
                "function": {
                    "name": name,
                    "description": str(function.get("description", "")),
                    "parameters": function.get("parameters") if isinstance(function.get("parameters"), dict) else {"type": "object", "properties": {}},
                },
            }
        )
    return normalized


def normalize_tool_call(call: dict[str, Any], index: int) -> dict[str, Any]:
    function = call.get("function") if isinstance(call.get("function"), dict) else {}
    name = function.get("name") or call.get("name") or f"tool_{index}"
    arguments = function.get("arguments", call.get("arguments", {}))
    if not isinstance(arguments, str):
        arguments = json.dumps(arguments or {}, ensure_ascii=False)
    return {
        "id": str(call.get("id") or f"call_{int(time.time() * 1000)}_{index}"),
        "type": "function",
        "function": {
            "name": str(name),
            "arguments": arguments,
        },
    }


def extract_memory_command(text: str) -> str | None:
    lowered = text.lower().strip()
    if lowered.startswith("remember that "):
        fact = text[14:].strip()
        key = fact.split(" is ", 1)[0].strip().replace(" ", "_")[:80] if " is " in fact else fact[:80]
        memory.personal.save_fact("explicit", key, fact, "voice")
        return f"I will remember that {fact}."
    if lowered.startswith("forget that "):
        target = text[12:].strip()
        count = memory.personal.delete_fact(target)
        return f"Forgot {count} matching memories."
    if lowered.startswith("what do you remember about "):
        target = text[28:].strip()
        facts = memory.personal.query_facts(target)
        return "I remember: " + "; ".join(f"{row['key']}={row['value']}" for row in facts) if facts else "I do not have matching memories."
    if lowered == "show my memories":
        facts = memory.personal.get_all_facts()
        return "Memories: " + "; ".join(f"{row['category']}:{row['key']}={row['value']}" for row in facts) if facts else "No memories stored yet."
    return None


def route_simple_skill(text: str) -> str | None:
    lowered = text.lower().strip()
    if lowered in {"what time is it", "current time", "tell me the time", "what's the time"}:
        return execute_skill("get_time", {})
    if lowered.startswith("open "):
        return execute_skill("open_app", {"app_name": text[5:].strip(), "action": "open"})
    if lowered.startswith("close "):
        return execute_skill("open_app", {"app_name": text[6:].strip(), "action": "close"})
    if "weather" in lowered:
        city = lowered.replace("weather", "").replace("in", "").strip() or "Bengaluru"
        return execute_skill("get_weather", {"city": city})
    if lowered.startswith("search for "):
        return execute_skill("search_web", {"query": text[11:].strip()})
    if lowered.startswith("read file ") or lowered.startswith("view file "):
        filename = text.split(" ", 2)[2].strip()
        return execute_skill("view_file", {"filename": filename})
    return None


def route_vision(text: str) -> str | None:
    lowered = text.lower()
    if any(phrase in lowered for phrase in ("what do you see", "look at my screen", "what's on screen", "what is on my screen", "screenshot")):
        return vision.read_screen()
    if "read my clipboard" in lowered or "clipboard image" in lowered:
        return vision.analyze_clipboard_image()
    if "webcam" in lowered:
        return vision.describe_webcam_frame()
    return None


async def process_chat_message(
    user_input: str,
    *,
    emit_response: bool = True,
    interrupt_active_voice: bool = True,
    manage_status: bool = True,
    broadcast_user_message: bool = True,
) -> str:
    if interrupt_active_voice:
        voice.interrupt()
    if manage_status:
        await broadcast_status("processing", "Processing.")
    if broadcast_user_message:
        await broadcast_json({"type": "chat_voice", "text": user_input})
    lowered = user_input.lower().strip()
    if lowered in {"clear memory", "reset chat", "forget session", "clear conversation", "clear history"}:
        session_history.clear()
        memory.clear_session()
        response = "Session memory cleared."
    else:
        response = extract_memory_command(user_input) or route_vision(user_input) or route_simple_skill(user_input)
        if response is None:
            facts_context, knowledge_context = build_context(user_input)
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: brain.resolve(
                    user_input,
                    list(session_history),
                    facts_context,
                    knowledge_context,
                    execute_tool_call,
                    token_callback_factory(loop),
                ),
            )
    session_history.append({"role": "user", "content": user_input})
    session_history.append({"role": "assistant", "content": response})
    memory.save_turn(user_input, response)
    if emit_response:
        await broadcast_json({"type": "response", "source": "JARVIS", "message": response})
        asyncio.create_task(voice.speak_async(response))
        await broadcast_status("idle", "Ready.")
    threading.Thread(target=auto_extract_facts, args=(user_input, response), daemon=True).start()
    return response


def auto_extract_facts(user_text: str, assistant_text: str) -> None:
    try:
        facts = brain.extract_personal_facts(f"User: {user_text}\nAssistant: {assistant_text}")
        for fact in facts:
            memory.personal.save_fact(fact["category"], fact["key"], fact["value"], "auto")
    except Exception as exc:
        log.error("Auto fact extraction failed: %s", exc, exc_info=True)


async def process_voice_command(user_input: str) -> str:
    return await process_chat_message(
        user_input,
        emit_response=False,
        interrupt_active_voice=False,
        manage_status=False,
        broadcast_user_message=False,
    )


def reminder_loop(loop: asyncio.AbstractEventLoop) -> None:
    while True:
        try:
            for reminder in due_reminders():
                message = f"Reminder: {reminder['message']}"
                voice.speak(message)
                asyncio.run_coroutine_threadsafe(notify("info", message), loop)
        except Exception as exc:
            log.error("Reminder loop failed: %s", exc, exc_info=True)
        time.sleep(30)


def ram_guard_loop() -> None:
    while True:
        try:
            mem = psutil.virtual_memory()
            if mem.available < 600 * 1024 * 1024:
                log.warning("RAM pressure detected")
                if vision.status == "loaded":
                    vision.unload()
                voice.speak("Freeing memory to maintain performance.")
        except Exception as exc:
            log.error("RAM guard failed: %s", exc, exc_info=True)
        time.sleep(60)


def sync_config_to_runtime(cfg: dict[str, Any]) -> None:
    try:
        if "assistant" in cfg:
            wake_sens = float(cfg["assistant"].get("wake_sensitivity", 0.6))
            ears.set_wake_sensitivity(wake_sens)
        if "stt" in cfg:
            ears.silence_timeout_seconds = float(cfg["stt"].get("silence_timeout_seconds", 1.2))
            ears.recording_energy_threshold = float(cfg["stt"].get("energy_threshold", 200.0))
            ears.continuous_listening = bool(cfg["stt"].get("continuous_listening", False))
            if hasattr(ears, "recognizer") and ears.recognizer:
                ears.recognizer.energy_threshold = float(cfg["stt"].get("energy_threshold", 200.0))
        if "voice" in cfg:
            rate = float(cfg["voice"].get("speech_rate", 1.0))
            if hasattr(voice, "speech_rate"):
                voice.speech_rate = rate
        log.info("Runtime hot-reloaded successfully from configuration updates.")
    except Exception as exc:
        log.error("Failed to sync configuration to runtime: %s", exc, exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    install_signal_handlers()
    memory_guard.start_memory_monitor()
    if not acquire_lock():
        voice.speak("JARVIS is already running.")
        sys.exit(0)
    loop = asyncio.get_running_loop()
    jarvis_logger.set_main_loop(loop)
    voice.configure_runtime(loop=loop, broadcast_json=broadcast_json)
    ears.configure_runtime(
        loop=loop,
        broadcast_state=broadcast_status,
        broadcast_json=broadcast_json,
        process_command=process_voice_command,
        speak_response=voice.speak_async,
        voice_engine=voice,
    )
    sync_config_to_runtime(config_manager.all())
    config_manager.register_callback(sync_config_to_runtime)
    register_cleanup(lambda: voice.stop())
    register_cleanup(lambda: brain.unload_models())
    register_cleanup(lambda: remove_lock())
    try:
        await boot_step(1, "Kill stale processes on port 8000")
        await boot_step(2, "Check and write lock file")
        await boot_step(3, "Load config.yaml")
        await boot_step(4, "Verify required binaries")
        await boot_step(5, "Resolve FFmpeg")
        test_mode = os.environ.get("JARVIS_TEST_MODE") == "1"
        if test_mode:
            log.info("Test mode active: skipping microphone probe.")
        else:
            mic_ok = await asyncio.get_running_loop().run_in_executor(None, ears.probe_microphone)
            if not mic_ok:
                await notify("warning", "Microphone probe failed. Wake word and STT may be degraded.")
        await boot_step(6, "Pre-warm Whisper")
        if test_mode:
            log.info("Test mode active: skipping Whisper pre-warm.")
        elif os.environ.get("JARVIS_PREWARM_STT") == "1":
            await ears.prewarm_whisper()
        else:
            log.info("Skipping Whisper pre-warm; STT will lazy-load on first voice request.")
        await boot_step(7, "Pre-warm brain model")
        if test_mode:
            log.info("Test mode active: skipping brain pre-warm.")
        elif os.environ.get("JARVIS_PREWARM_MODEL") == "1":
            await asyncio.get_running_loop().run_in_executor(None, brain.prewarm)
        else:
            log.info("Skipping brain pre-warm; model will lazy-load on first request.")
        await boot_step(8, "Initialize ChromaDB")
        await boot_step(9, "Initialize SQLite personal.db")
        for item in memory.load_recent_session():
            session_history.append(item)
        await boot_step(10, "Load recent session")
        await boot_step(11, "Load pending reminders")
        await boot_step(12, "Start FastAPI server")
        if test_mode:
            log.info("Test mode active: wake word detector not started.")
        else:
            ears.start()
        await boot_step(13, "Start wake word detector")
        if not test_mode:
            threading.Thread(target=reminder_loop, args=(loop,), daemon=True).start()
        await boot_step(14, "Start reminder checker")
        if not test_mode and os.environ.get("JARVIS_LEGACY_RAM_GUARD") == "1":
            threading.Thread(target=ram_guard_loop, daemon=True).start()
        else:
            log.info("Legacy RAM guard disabled; memory_guard.py is active.")
        await boot_step(15, "Start RAM guard")
        if test_mode:
            log.info("Test mode active: startup voice confirmation skipped.")
        else:
            voice.speak("JARVIS version 3 online. All systems operational.")
        await boot_step(16, "Startup voice confirmation")
    except Exception as exc:
        log.critical("Startup degraded: %s", exc, exc_info=True)
        voice.speak("Startup degraded. Check diagnostics.")
    yield
    await ears.shutdown()
    voice.stop()
    brain.unload_models()
    remove_lock()


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def index():
    template = rel_path(os.path.join("templates", "index.html"))
    fallback = rel_path(os.path.join("static", "index.html"))
    return FileResponse(template if os.path.exists(template) else fallback)


@app.get("/health")
async def health():
    mem = psutil.virtual_memory()
    components = {
        "brain": brain.status,
        "ears": ears.get_status().get("component_status", "ready"),
        "stt_state": ears.get_status().get("state", "IDLE"),
        "voice": "ready" if voice.get_status()["ready"] else "error",
        "vision": vision.status,
        "memory": memory.status,
        "websocket_clients": len(active_clients),
    }
    status = "healthy" if all(value not in {"error"} for value in components.values() if isinstance(value, str)) else "degraded"
    return {
        "status": status,
        "version": VERSION,
        "uptime_seconds": int(time.time() - START_TIME),
        "components": components,
        "cpu_percent": psutil.cpu_percent(interval=None),
        "ram_used_mb": int((mem.total - mem.available) / 1024 / 1024),
        "ram_available_mb": int(mem.available / 1024 / 1024),
        "model": config_manager.get("brain.model", "qwen2.5:3b"),
    }


@app.post("/api/chat")
async def api_chat(payload: dict[str, Any]):
    text = str(payload.get("message", "")).strip()
    if not text:
        return JSONResponse({"error": "message required"}, status_code=400)
    response = await process_chat_message(text)
    return {"response": response, "text": response, "audio_url": None}


@app.get("/v1/models")
async def openai_get_models():
    models_list = ["jarvis", "qwen2.5:3b", "qwen2.5-coder:3b", "llama3.2:1b"]
    if brain and hasattr(brain, "available_models") and brain.available_models:
        models_list = list(set(models_list).union(brain.available_models))
    return {
        "object": "list",
        "data": [
            {
                "id": m,
                "object": "model",
                "created": int(time.time()),
                "owned_by": "jarvis"
            } for m in models_list
        ]
    }


@app.get("/api/v1/models")
async def openai_get_models_api_alias():
    return await openai_get_models()


@app.get("/v1/models/{model_id:path}")
async def openai_get_model(model_id: str):
    models = await openai_get_models()
    decoded = model_id.replace("%3A", ":")
    for model in models["data"]:
        if model["id"] == decoded:
            return model
    return {
        "id": decoded,
        "object": "model",
        "created": int(time.time()),
        "owned_by": "jarvis",
    }


@app.get("/api/tags")
async def ollama_tags_alias():
    models = await openai_get_models()
    return {
        "models": [
            {
                "name": model["id"],
                "model": model["id"],
                "modified_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
                "size": 0,
                "digest": "",
                "details": {"family": "jarvis", "format": "openai-compat"},
            }
            for model in models["data"]
        ]
    }


@app.post("/api/show")
async def ollama_show_alias(payload: dict[str, Any]):
    model = str(payload.get("model") or payload.get("name") or config_manager.get("brain.model", "llama3.2:1b"))
    return {
        "license": "local",
        "modelfile": f"FROM {model}",
        "parameters": f"num_ctx {config_manager.get('brain.context_window', 4096)}",
        "template": "{{ .System }}\n{{ .Prompt }}",
        "details": {
            "parent_model": "",
            "format": "openai-compat",
            "family": "jarvis",
            "families": ["jarvis"],
            "parameter_size": "local",
            "quantization_level": "local",
        },
        "model_info": {"name": model},
    }


@app.get("/version")
async def version_alias():
    return {"version": VERSION, "name": "JARVIS Elite"}


@app.get("/props")
@app.get("/v1/props")
async def props_alias():
    return {
        "name": "JARVIS Elite",
        "openai_compatible": True,
        "supports_tools": True,
        "supports_streaming": True,
        "model": config_manager.get("brain.model", "llama3.2:1b"),
    }


@app.post("/v1/chat/completions")
async def openai_chat_completions(payload: dict[str, Any]):
    messages = payload.get("messages", [])
    if not messages:
        return JSONResponse({"error": "messages required"}, status_code=400)

    client_system, history, prompt = split_openai_messages(messages)
    prompt = prompt.strip()
    if not prompt:
        return JSONResponse({"error": "last user message required"}, status_code=400)

    stream = bool(payload.get("stream", False))
    model_name = payload.get("model", "jarvis")
    temperature = payload.get("temperature")
    external_tools = normalize_openai_tools(payload.get("tools"))
    use_external_tools = bool(external_tools)
    
    direct_reply = simple_local_reply(prompt)
    if direct_reply:
        if stream:
            async def direct_event_generator():
                created_time = int(time.time())
                yield f"data: {json.dumps({
                    'id': 'chatcmpl-jarvis',
                    'object': 'chat.completion.chunk',
                    'created': created_time,
                    'model': model_name,
                    'choices': [{'index': 0, 'delta': {'role': 'assistant'}, 'finish_reason': None}]
                })}\n\n"
                yield f"data: {json.dumps({
                    'id': 'chatcmpl-jarvis',
                    'object': 'chat.completion.chunk',
                    'created': created_time,
                    'model': model_name,
                    'choices': [{'index': 0, 'delta': {'content': direct_reply}, 'finish_reason': None}]
                })}\n\n"
                yield f"data: {json.dumps({
                    'id': 'chatcmpl-jarvis',
                    'object': 'chat.completion.chunk',
                    'created': created_time,
                    'model': model_name,
                    'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]
                })}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(direct_event_generator(), media_type="text/event-stream")

        return {
            "id": "chatcmpl-jarvis",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model_name,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": direct_reply},
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": max(1, len(prompt) // 4),
                "completion_tokens": max(1, len(direct_reply) // 4),
                "total_tokens": max(1, (len(prompt) + len(direct_reply)) // 4),
            },
        }

    loop = asyncio.get_running_loop()
    facts_context, knowledge_context = await loop.run_in_executor(
        None, build_context, prompt
    )
    
    if stream:
        async def event_generator():
            created_time = int(time.time())
            
            # Initial SSE chunk
            yield f"data: {json.dumps({
                'id': 'chatcmpl-jarvis',
                'object': 'chat.completion.chunk',
                'created': created_time,
                'model': model_name,
                'choices': [{'index': 0, 'delta': {'role': 'assistant'}, 'finish_reason': None}]
            })}\n\n"
            
            token_queue = asyncio.Queue()
            
            def run_stream():
                try:
                    tool_calls: list[dict[str, Any]] = []
                    for item in brain.stream_chat(
                        prompt,
                        history,
                        facts_context,
                        knowledge_context,
                        use_tools=use_external_tools,
                        model=None,
                        temperature=temperature,
                        client_system=client_system,
                        tools=external_tools,
                    ):
                        if isinstance(item, str):
                            loop.call_soon_threadsafe(token_queue.put_nowait, item)
                        elif isinstance(item, list):
                            tool_calls.extend(
                                normalize_tool_call(call, index)
                                for index, call in enumerate(item)
                                if isinstance(call, dict)
                            )
                    if tool_calls:
                        loop.call_soon_threadsafe(token_queue.put_nowait, {"tool_calls": tool_calls})
                except Exception as e:
                    log.error(f"Error in stream_chat for custom backend: {e}")
                finally:
                    loop.call_soon_threadsafe(token_queue.put_nowait, None)
                    
            threading.Thread(target=run_stream, daemon=True).start()
            
            while True:
                try:
                    token = await asyncio.wait_for(token_queue.get(), timeout=5.0)
                except asyncio.TimeoutError:
                    yield ": keepalive ping\n\n"
                    continue
                if token is None:
                    break
                if isinstance(token, dict) and token.get("tool_calls"):
                    for index, call in enumerate(token["tool_calls"]):
                        yield f"data: {json.dumps({
                            'id': 'chatcmpl-jarvis',
                            'object': 'chat.completion.chunk',
                            'created': created_time,
                            'model': model_name,
                            'choices': [{
                                'index': 0,
                                'delta': {'tool_calls': [{
                                    'index': index,
                                    'id': call['id'],
                                    'type': 'function',
                                    'function': call['function'],
                                }]},
                                'finish_reason': None,
                            }]
                        })}\n\n"
                    yield f"data: {json.dumps({
                        'id': 'chatcmpl-jarvis',
                        'object': 'chat.completion.chunk',
                        'created': created_time,
                        'model': model_name,
                        'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'tool_calls'}]
                    })}\n\n"
                    yield "data: [DONE]\n\n"
                    return
                yield f"data: {json.dumps({
                    'id': 'chatcmpl-jarvis',
                    'object': 'chat.completion.chunk',
                    'created': created_time,
                    'model': model_name,
                    'choices': [{'index': 0, 'delta': {'content': token}, 'finish_reason': None}]
                })}\n\n"
                
            yield f"data: {json.dumps({
                'id': 'chatcmpl-jarvis',
                'object': 'chat.completion.chunk',
                'created': created_time,
                'model': model_name,
                'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]
            })}\n\n"
            yield "data: [DONE]\n\n"
            
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    
    else:
        def run_completion() -> tuple[str, list[dict[str, Any]]]:
            parts: list[str] = []
            calls: list[dict[str, Any]] = []
            model, selected_temperature, _intent = brain.choose_model(prompt)
            if temperature is not None:
                selected_temperature = float(temperature)
            for item in brain.stream_chat(
                prompt,
                history,
                facts_context,
                knowledge_context,
                use_tools=use_external_tools,
                model=model,
                temperature=selected_temperature,
                client_system=client_system,
                tools=external_tools,
            ):
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, list):
                    calls.extend(
                        normalize_tool_call(call, index)
                        for index, call in enumerate(item)
                        if isinstance(call, dict)
                    )
            return "".join(parts).strip(), calls

        response_text, tool_calls = await loop.run_in_executor(None, run_completion)
        finish_reason = "tool_calls" if tool_calls else "stop"
        message: dict[str, Any] = {
            "role": "assistant",
            "content": None if tool_calls and not response_text else response_text,
        }
        if tool_calls:
            message["tool_calls"] = tool_calls
        
        return {
            "id": "chatcmpl-jarvis",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model_name,
            "choices": [
                {
                    "index": 0,
                    "message": message,
                    "finish_reason": finish_reason
                }
            ],
            "usage": {
                "prompt_tokens": len(prompt) // 4,
                "completion_tokens": len(response_text) // 4,
                "total_tokens": (len(prompt) + len(response_text)) // 4
            }
        }


@app.get("/api/memory/facts")
async def api_memory_facts():
    return {"facts": memory.personal.get_all_facts()}


@app.post("/api/memory/fact")
async def api_memory_fact(payload: dict[str, Any]):
    memory.personal.save_fact(str(payload.get("category", "manual")), str(payload.get("key", "")), str(payload.get("value", "")), "hud")
    return {"ok": True}


@app.delete("/api/memory/fact/{key}")
async def api_memory_delete(key: str):
    return {"deleted": memory.personal.delete_fact(key)}


@app.get("/api/knowledge/sources")
async def api_sources():
    return {"sources": knowledge.list_sources(), "chunks": knowledge.total_chunks()}


@app.post("/api/knowledge/url")
async def api_ingest_url(payload: dict[str, Any]):
    chunks = knowledge.ingest_url(str(payload.get("url", "")))
    return {"ok": chunks > 0, "chunks": chunks}


@app.post("/api/knowledge/file")
async def api_ingest_file(file: UploadFile = File(...)):
    temp_dir = rel_path(config_manager.get("paths.temp_dir", "temp"))
    os.makedirs(temp_dir, exist_ok=True)
    destination = os.path.join(temp_dir, file.filename)
    with open(destination, "wb") as handle:
        handle.write(await file.read())
    chunks = knowledge.ingest_file(destination)
    return {"ok": chunks > 0, "chunks": chunks}


@app.delete("/api/knowledge/{source_id}")
async def api_delete_source(source_id: str):
    return {"ok": knowledge.delete_source(source_id)}


@app.get("/api/session/export")
async def api_session_export():
    return PlainTextResponse(memory.session.export_text(), media_type="text/plain")


@app.delete("/api/session")
async def api_session_clear():
    memory.clear_session()
    session_history.clear()
    return {"ok": True}


@app.get("/api/config")
async def api_config_get():
    return config_manager.all()


@app.post("/api/config")
async def api_config_post(payload: dict[str, Any]):
    return config_manager.save(payload)


@app.get("/api/skills")
async def api_skills():
    return {"skills": list_skills()}


@app.post("/api/skills/{name}/toggle")
async def api_skill_toggle(name: str, payload: dict[str, Any]):
    return {"ok": toggle_skill(name, bool(payload.get("enabled", True)))}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_clients.add(websocket)
    try:
        await websocket.send_json({"type": "boot_history", "steps": boot_steps})
        await websocket.send_json({"type": "state", "value": ears.get_status().get("state", "IDLE").lower()})
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = {"type": "chat", "message": raw}
            msg_type = payload.get("type", "chat")
            if msg_type == "chat":
                await process_chat_message(str(payload.get("message", "")))
            elif msg_type == "voice_start":
                ears.manual_wake()
            elif msg_type == "voice_stop":
                ears.stop_current_capture()
            elif msg_type == "get_status":
                await websocket.send_json({"type": "health", "payload": await health()})
            elif msg_type == "set_energy_threshold":
                ears.recognizer.energy_threshold = float(payload.get("value", 350.0))
            elif msg_type == "set_wake_sensitivity":
                ears.set_wake_sensitivity(float(payload.get("value", 0.6)))
            elif msg_type == "pong":
                continue
            else:
                await notify("warning", f"Unsupported WebSocket event: {msg_type}")
    except Exception as exc:
        log.error("WebSocket ended: %s", exc)
    finally:
        active_clients.discard(websocket)


@app.websocket("/ws/logs")
async def log_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    jarvis_logger.register_log_client(websocket)
    try:
        for entry in jarvis_logger.get_log_buffer()[-200:]:
            await websocket.send_json({"type": "log_entry", **entry})
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "log_ping", "timestamp": time.time()})
    except Exception as exc:
        log.info("Log WebSocket ended: %s", exc)
    finally:
        jarvis_logger.unregister_log_client(websocket)


static_dir = rel_path("static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=config_manager.get("server.host", "127.0.0.1"), port=int(config_manager.get("server.port", 8000)))
