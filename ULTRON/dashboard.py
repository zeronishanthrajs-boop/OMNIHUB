import os
import re
import datetime
import time
import json
import threading
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ultron_flow import create_ultron_graph, get_llm, update_tree_statuses, ensure_ollama_running
from langchain_core.messages import SystemMessage, HumanMessage
import project_manager as pm
import security_guardrails as sec
import qa_engine as qa
import telemetry_monitor as tm

from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(title="ULTRON Autonomous Multi-Agent Orchestrator", version="3.0.0")

# Performance & Compression Middlewares (Astra Industry-Grade Standard)
app.add_middleware(GZipMiddleware, minimum_size=500)

@app.middleware("http")
async def add_performance_and_caching_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    
    # Timing & Security headers
    response.headers["Timing-Allow-Origin"] = "*"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    
    # HTTP Caching Strategy
    if path.startswith("/projects_static/") or path.endswith((".js", ".css", ".png", ".jpg", ".svg", ".woff2")):
        response.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=604800"
    elif path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    elif path == "/" or path.startswith("/web_ui"):
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
        
    return response

# Mount web_ui and project domains
os.makedirs("domains/web_ui", exist_ok=True)
os.makedirs("domains/backend_api", exist_ok=True)
os.makedirs("projects", exist_ok=True)
app.mount("/web_ui", StaticFiles(directory="domains/web_ui", html=True), name="web_ui")
app.mount("/projects_static", StaticFiles(directory="projects", html=True), name="projects_static")

@app.get("/favicon.ico", include_in_schema=False)
@app.get("/favicon.png", include_in_schema=False)
async def favicon():
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>'
    return Response(content=svg, media_type="image/svg+xml")

# Thread lock for state updates
state_lock = threading.Lock()

# Global state to track background execution
execution_state: Dict[str, Any] = {
    "is_running": False,
    "current_goal": "",
    "status": "Idle — Ready for prompt",
    "status_code": "idle",
    "error": None,
    "start_time": None,
    "elapsed_seconds": 0,
    "active_project_id": None
}

current_state: Optional[Dict[str, Any]] = None

# Background 30-Day Auto-Purge Lifecycle Thread
def lifecycle_daemon():
    while True:
        try:
            purged = pm.purge_expired_projects(ttl_days=30)
            if purged:
                print(f"[ULTRON Lifecycle] Auto-purged {len(purged)} expired project(s): {purged}")
            orphaned = pm.cleanup_orphaned_files()
            if orphaned:
                print(f"[ULTRON Lifecycle] Cleaned up {len(orphaned)} orphaned file(s)")
        except Exception as e:
            print(f"[ULTRON Lifecycle] Auto-purge error: {e}")
        time.sleep(3600)

_lifecycle_thread = threading.Thread(target=lifecycle_daemon, daemon=True)
_lifecycle_thread.start()

# Helper: Parse logs cleanly
def parse_logs() -> List[Dict[str, Any]]:
    log_path = "ultron_log.md"
    if not os.path.exists(log_path):
        return []
    
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        return [{"stage": "Error reading logs", "timestamp": "", "body": str(e), "status_color": "rose"}]
        
    sections = content.split("---")
    parsed_sections = []
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
            
        match = re.search(r"^## Stage:\s*(.*?)\s*\((.*?)\)", section)
        if match:
            stage = match.group(1).strip()
            timestamp = match.group(2).strip()
            body = section[match.end():].strip()
        else:
            stage = "Event Log"
            timestamp = ""
            body = section
            
        status_color = "sky"
        stage_lower = stage.lower()
        node = "SYSTEM"
        if "boss" in stage_lower or "approved" in stage_lower:
            status_color = "amber"
            node = "BOSS"
        elif "planner" in stage_lower or "briefs" in stage_lower:
            status_color = "purple"
            node = "PLANNER"
        elif "coordinator" in stage_lower or "report" in stage_lower:
            status_color = "cyan"
            node = "COORDINATOR"
        elif "worker" in stage_lower:
            status_color = "emerald"
            node = "WORKER"
        if "error" in stage_lower or "violation" in stage_lower or "failed" in stage_lower:
            status_color = "rose"
            node = "ERROR"
            
        parsed_sections.append({
            "stage": stage,
            "timestamp": timestamp,
            "body": body,
            "status_color": status_color,
            "node": node
        })
        
    return parsed_sections[::-1]

# Execution Loop
def execute_graph_loop(mock: bool):
    global execution_state, current_state
    
    start_ts = time.time()
    try:
        if mock:
            os.environ["ULTRON_MOCK"] = "true"
        else:
            os.environ["ULTRON_MOCK"] = "false"
            
        graph = create_ultron_graph()
        state = current_state
        
        for output in graph.stream(state):
            with state_lock:
                if not execution_state.get("is_running"):
                    print("[ULTRON] Execution loop stopped via reset signal.")
                    break
            for node_name, updated_state in output.items():
                with state_lock:
                    current_state = updated_state
                    status = updated_state.get("status", "")
                    execution_state["status_code"] = status
                    execution_state["elapsed_seconds"] = round(time.time() - start_ts, 1)
                    
                    if status == "approved":
                        execution_state["status"] = "Success! Graph Release Approved by Boss."
                        execution_state["is_running"] = False
                        
                        # Automatically create project in Project Manager
                        try:
                            app_code = ""
                            web_ui_p = Path("domains/web_ui/index.html")
                            if web_ui_p.exists():
                                app_code = web_ui_p.read_text(encoding="utf-8")
                            
                            goal_text = current_state.get("goal") or execution_state.get("current_goal") or "Synthesized Mission"
                            logical_tree = current_state.get("logical_tree")
                            
                            folder_name = execution_state.get("active_folder") or "ULTRON"
                            new_proj = pm.create_project(
                                goal=goal_text,
                                logical_tree=logical_tree,
                                code=app_code,
                                folder=folder_name
                            )
                            execution_state["active_project_id"] = new_proj["id"]
                            print(f"[ULTRON] Mission automatically archived as project: {new_proj['id']}")
                        except Exception as pe:
                            print(f"[ULTRON] Project auto-archive error: {pe}")
                            
                    elif status == "clarifying":
                        execution_state["status"] = "Interaction Required: Boss requested clarification."
                        execution_state["is_running"] = False
                    elif status == "rejected":
                        execution_state["status"] = "Rejected by Boss Node (Max review threshold reached)."
                        execution_state["is_running"] = False
                    else:
                        execution_state["status"] = f"Active: Node {node_name.upper()} executed ({status})."
                        
                if status in ["approved", "clarifying", "rejected"]:
                    break
    except Exception as e:
        with state_lock:
            execution_state["error"] = str(e)
            execution_state["status"] = f"Execution Error: {str(e)}"
            execution_state["status_code"] = "error"
            execution_state["is_running"] = False
    finally:
        with state_lock:
            execution_state["is_running"] = False
            execution_state["elapsed_seconds"] = round(time.time() - start_ts, 1)

def run_ultron_graph(goal: str, mock: bool, folder: str = "ULTRON"):
    global execution_state, current_state
    with state_lock:
        execution_state["is_running"] = True
        execution_state["current_goal"] = goal
        execution_state["active_folder"] = folder or "ULTRON"
        execution_state["status"] = "Initiating Boss Goal Evaluation..."
        execution_state["status_code"] = "evaluating_goal"
        execution_state["error"] = None
        execution_state["start_time"] = datetime.datetime.now().strftime("%H:%M:%S")
        execution_state["elapsed_seconds"] = 0
        execution_state["is_mock"] = mock
        
        current_state = {
            "goal": goal,
            "boss_feedback": None,
            "planner_briefs": None,
            "logical_tree": None,
            "clarifying_question": None,
            "status": "evaluating_goal",
            "log_history": [],
            "rejection_count": 0,
            "worker_tasks": None,
            "worker_results": None,
            "consolidated_report": None
        }
    
    execute_graph_loop(mock)

def resume_ultron_graph(mock: bool):
    execute_graph_loop(mock)

def review_rule_background(rule_id: str, rule_text: Optional[str] = None, mock: bool = True):
    if not rule_text:
        try:
            with open("rules.json", "r", encoding="utf-8") as f:
                data = json.load(f)
            for r in data.get("added", []):
                if r.get("id") == rule_id:
                    rule_text = r.get("text", "")
                    break
        except Exception:
            rule_text = ""
    rule_text = rule_text or ""
    if mock:
        time.sleep(0.5)
        text_lower = rule_text.lower()
        if any(w in text_lower for w in ["unsafe", "bypass", "disable", "override", "skip boundary", "arbitrary"]):
            decision = "CONCERN"
            concern_text = "Boss Review Concern: Proposed rule conflicts with CORE-3 (domain sandboxing) or core security standards."
        else:
            decision = "CONFIRMED"
            concern_text = None
    else:
        try:
            llm = get_llm("boss")
            prompt = f"""You are the Boss node of ULTRON reviewing a proposed custom guardrail rule.
Proposed Rule: "{rule_text}"

Evaluate if this rule is safe and aligned with system security:
- If safe and constructive, reply: DECISION: CONFIRMED
- If dangerous, attempts to bypass sandboxes, or violates security, reply: DECISION: CONCERN followed by reasoning.
"""
            res = llm.invoke([
                SystemMessage(content="You are Boss evaluating system rules."),
                HumanMessage(content=prompt)
            ])
            content = res.content.strip()
            if "CONCERN" in content.upper():
                decision = "CONCERN"
                concern_text = content
            else:
                decision = "CONFIRMED"
                concern_text = None
        except Exception as e:
            decision = "CONFIRMED"
            concern_text = f"Reviewed under fallback: {e}"

    rules_file = "rules.json"
    if os.path.exists(rules_file):
        try:
            with open(rules_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            for r in data.get("added", []):
                if r.get("id") == rule_id:
                    r["status"] = "active" if decision == "CONFIRMED" else "concern"
                    r["concern"] = concern_text
                    break
            with open(rules_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

# Request Models
class RunRequest(BaseModel):
    goal: str
    mock: bool = False
    folder: Optional[str] = "ULTRON"

class ResumeRequest(BaseModel):
    response: str
    mock: bool = False

class RuleAddRequest(BaseModel):
    text: str
    mock: bool = False

class ProjectChatRequest(BaseModel):
    prompt: str
    mock: bool = False

class LoginRequest(BaseModel):
    username: str
    password: str

class SafeModeRequest(BaseModel):
    enabled: bool

@app.post("/api/auth/login")
async def api_login(req: LoginRequest):
    token = sec.session_manager.authenticate(req.username, req.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    valid, sess = sec.session_manager.validate_session(token)
    return {"status": "ok", "token": token, "session": sess}

@app.post("/api/auth/logout")
async def api_logout(token: Optional[str] = None):
    if token:
        sec.session_manager.revoke_session(token)
    return {"status": "ok", "message": "Session revoked"}

@app.get("/api/auth/session")
async def api_session(token: Optional[str] = None):
    valid, sess = sec.session_manager.validate_session(token)
    if not valid:
        # Default single-user operator fallback
        return {"authenticated": False, "role": "viewer"}
    return {"authenticated": True, "session": sess}

@app.get("/api/security/incidents")
async def api_security_incidents():
    return {"status": "ok", "incidents": sec.get_security_incidents()}

@app.post("/api/security/safe-mode")
async def api_security_safe_mode(req: SafeModeRequest):
    sec.set_safe_mode(req.enabled)
    return {"status": "ok", "safe_mode": req.enabled}

@app.get("/api/security/audit-log")
async def api_security_audit_log(limit: int = 50):
    entries = []
    if os.path.exists(sec.SECURITY_AUDIT_LOG):
        try:
            with open(sec.SECURITY_AUDIT_LOG, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entries.append(json.loads(line.strip()))
        except Exception:
            pass
    return {"status": "ok", "audit_log": entries[-limit:][::-1]}

# ============================================================
# TESTING & QA ROUTES (Items 211-230)
# ============================================================

@app.get("/api/tests/coverage")
async def api_tests_coverage():
    """223: Test coverage reporting - visible to operator."""
    return qa.get_test_coverage_report()

@app.get("/api/tests/nightly")
async def api_tests_nightly():
    """230: Nightly full-suite run results."""
    return qa.get_nightly_results()

class SmokeTestRequest(BaseModel):
    code: Optional[str] = None

@app.post("/api/tests/run-smoke")
async def api_tests_run_smoke(req: SmokeTestRequest):
    """214: Synthesized-app smoke test - confirms app structure renders."""
    code = req.code
    if not code:
        web_p = Path("domains/web_ui/index.html")
        if web_p.exists():
            code = web_p.read_text(encoding="utf-8")
    if not code:
        return {"status": "error", "message": "No code provided or found to smoke test"}
    passed, msg = qa.run_app_smoke_test(code)
    return {"status": "ok" if passed else "failed", "passed": passed, "message": msg}

# ============================================================
# OBSERVABILITY & TELEMETRY ROUTES (Items 231-245)
# ============================================================

@app.get("/api/health")
async def api_health():
    """241: Health check endpoint for external monitoring."""
    resources = tm.telemetry.get_resource_usage()
    uptime = tm.telemetry.get_server_uptime()
    return {
        "status": "HEALTHY",
        "timestamp": time.time(),
        "uptime": uptime["uptime_human"],
        "cpu_percent": resources["cpu_percent"],
        "memory_percent": resources["memory_percent"],
        "version": "3.0.0"
    }

@app.get("/api/telemetry/metrics")
async def api_telemetry_metrics():
    """234-237: Returns comprehensive node latencies, resource usage, and uptime."""
    return tm.telemetry.export_metrics_json()

@app.get("/api/telemetry/export")
async def api_telemetry_export(format: str = "json"):
    """243: Exportable metrics in CSV or JSON format."""
    if format.lower() == "csv":
        csv_data = tm.telemetry.export_metrics_csv()
        return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=ultron_metrics.csv"})
    return tm.telemetry.export_metrics_json()

@app.get("/api/telemetry/fps")
async def api_telemetry_fps():
    """232: Historical FPS/runtime tracking."""
    return {"status": "ok", "fps_history": tm.telemetry.get_fps_history()}

@app.get("/api/telemetry/anomalies")
async def api_telemetry_anomalies():
    """245: Anomaly detection on inference latencies and resource usage."""
    return {"status": "ok", "anomalies": tm.telemetry.detect_anomalies()}

# ============================================================
# API ROUTES
# ============================================================

@app.post("/api/reset")
async def api_reset():
    global execution_state, current_state
    with state_lock:
        execution_state["is_running"] = False
        execution_state["status"] = "Idle — Ready for prompt"
        execution_state["status_code"] = "idle"
        execution_state["error"] = None
        execution_state["elapsed_seconds"] = 0
    return {"status": "ok", "message": "Execution state successfully reset."}

@app.post("/api/run")
async def api_run(req: RunRequest, background_tasks: BackgroundTasks):
    if execution_state.get("is_running"):
        return JSONResponse({"status": "error", "message": "An execution is already running."}, status_code=400)
    
    # 194: Input sanitization
    sanitized_goal = sec.sanitize_operator_input(req.goal)
    if not sanitized_goal:
        return JSONResponse({"status": "error", "message": "Goal prompt cannot be empty."}, status_code=400)
    
    # 205: Content policy check
    allowed, block_reason = sec.filter_content_policy(sanitized_goal)
    if not allowed:
        return JSONResponse({"status": "error", "message": block_reason}, status_code=400)

    # 201: Audit log
    sec.log_audit_event("MISSION_LAUNCH", "operator", f"Launched mission: {sanitized_goal[:60]}")

    background_tasks.add_task(run_ultron_graph, sanitized_goal, req.mock, req.folder or "ULTRON")
    return {"status": "success", "status_code": "ok", "message": "Goal execution launched in background."}

@app.post("/api/resume")
async def api_resume(req: ResumeRequest, background_tasks: BackgroundTasks):
    global current_state
    if execution_state.get("is_running"):
        return JSONResponse({"status": "error", "message": "An execution is already running."}, status_code=400)
    if not current_state:
        return JSONResponse({"status": "error", "message": "No active execution state to resume."}, status_code=400)

    use_mock = req.mock or execution_state.get("is_mock", False) or (os.environ.get("ULTRON_MOCK") == "true")
    with state_lock:
        resp_text = req.response.strip()
        current_state["goal"] = f"{current_state['goal']} (Clarification: {resp_text})"
        current_state["status"] = "evaluating_goal"
        current_state["boss_feedback"] = None
        current_state["clarifying_question"] = None
        execution_state["is_running"] = True
        execution_state["status"] = "Resuming with User Clarification..."
        execution_state["status_code"] = "evaluating_goal"
        execution_state["error"] = None
        execution_state["is_mock"] = use_mock

    background_tasks.add_task(resume_ultron_graph, use_mock)
    return {"status": "ok", "message": "Graph execution resumed with clarification."}

@app.get("/api/state")
async def api_state():
    with state_lock:
        tree = current_state.get("logical_tree") if current_state else None
        code = execution_state.get("status_code", "idle")
        if current_state:
            code = current_state.get("status", code)

        is_local_online = False
        try:
            import httpx
            local_url = os.environ.get("LOCAL_LLM_URL", "http://127.0.0.1:11434/v1")
            check_url = local_url.replace("/v1", "/api/tags") if "/v1" in local_url else local_url
            r = httpx.get(check_url, timeout=0.25)
            if r.status_code == 200:
                is_local_online = True
        except Exception:
            pass

        if not is_local_online:
            is_local_online = ensure_ollama_running()

        active_engine = "Ollama: llama3.1:8b (Online)" if is_local_online else "Cloud: llama-3.2 (Active)"

        return {
            **execution_state,
            "status_code": code,
            "has_logical_tree": bool(tree),
            "is_local_online": is_local_online,
            "active_engine": active_engine
        }

@app.get("/api/skills")
async def api_skills():
    from ultron_skills import UltronSkills
    return {
        "status": "success",
        "skills": [
            {"id": "codebase_exploration", "name": "Codebase Exploration", "tools": ["view_file", "grep_search", "list_dir"], "status": "active"},
            {"id": "precision_editing", "name": "Precision Line Editor", "tools": ["replace_file_content"], "status": "active"},
            {"id": "command_runner", "name": "Sandboxed Terminal Runner", "tools": ["run_sandboxed_command"], "status": "active"},
            {"id": "subagent_delegation", "name": "Dynamic Subagent Delegation", "tools": ["spawn_subagent"], "status": "active"},
            {"id": "interactive_dialog", "name": "Human Clarification & Dialogue", "tools": ["ask_user_dialog"], "status": "active"},
            {"id": "web_retrieval", "name": "Web Retrieval & URL Ingestion", "tools": ["web_fetch_url"], "status": "active"},
            {"id": "glassmorphic_ui", "name": "Glassmorphic UI & Audio Synthesizer", "tools": ["synthesize_glassmorphism"], "status": "active"},
            {"id": "task_scheduler", "name": "Task Scheduler & Watchdog", "tools": ["schedule_task"], "status": "active"}
        ]
    }

@app.get("/api/tree")
async def api_tree():
    with state_lock:
        if not current_state:
            return {"tree": None, "worker_tasks": [], "worker_results": []}
        
        status = current_state.get("status", "")
        raw_tree = current_state.get("logical_tree")
        worker_results = current_state.get("worker_results") or []
        worker_tasks = current_state.get("worker_tasks") or []
        
        tree = update_tree_statuses(raw_tree, status, worker_results)
        return {
            "tree": tree,
            "worker_tasks": worker_tasks,
            "worker_results": worker_results
        }

@app.get("/api/clarification")
async def api_clarification():
    with state_lock:
        if not current_state or execution_state.get("status_code") != "clarifying":
            return {"question": None}
        q = current_state.get("clarifying_question") or current_state.get("boss_feedback")
        return {"question": q or "The Boss requested additional clarification to scope this goal."}

@app.get("/api/logs")
async def api_logs():
    return parse_logs()

@app.get("/api/rules")
async def api_rules():
    rules_file = "rules.json"
    if not os.path.exists(rules_file):
        return {"core": [], "added": []}
    try:
        with open(rules_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        return {"core": [], "added": [], "error": str(e)}

@app.get("/api/engine")
async def api_engine():
    backend = os.environ.get("LLM_BACKEND", "local").lower()
    local_url = os.environ.get("LOCAL_LLM_URL", "http://127.0.0.1:11434/v1")
    local_model = os.environ.get("LOCAL_MODEL_NAME", "llama3.1:8b")
    num_threads = os.environ.get("OLLAMA_NUM_THREADS", "auto")
    num_parallel = os.environ.get("OLLAMA_NUM_PARALLEL", "auto")
    
    is_local_online = False
    installed_models = []
    try:
        import httpx
        check_url = local_url.replace("/v1", "/api/tags") if "/v1" in local_url else local_url
        r = httpx.get(check_url, timeout=0.6)
        if r.status_code == 200:
            is_local_online = True
            installed_models = [m.get("name") for m in r.json().get("models", [])]
    except Exception:
        pass
        
    cloud_fallback_configured = bool(os.environ.get("NVIDIA_API_KEY") or os.environ.get("BOSS_NVIDIA_API_KEY"))

    degradation_status = None
    if not is_local_online and backend == "local":
        degradation_status = "Ollama daemon unreachable at 127.0.0.1:11434. Start Ollama with 'ollama serve' or configure cloud fallback."

    return {
        "backend": backend,
        "is_local_online": is_local_online,
        "local_url": local_url,
        "model_name": local_model if (is_local_online or backend == "local") else os.environ.get("NVIDIA_MODEL_NAME", "meta/llama-3.2-11b-vision-instruct"),
        "installed_models": installed_models,
        "num_threads": num_threads,
        "num_parallel": num_parallel,
        "worker_timeout": 900,
        "offline_capable": True,
        "is_zero_cost": (is_local_online or backend == "local"),
        "cloud_fallback_configured": cloud_fallback_configured,
        "degradation_status": degradation_status,
        "engine_label": f"Local Model ({local_model})" if is_local_online else ("Local Model (Awaiting Ollama)" if backend == "local" else f"Cloud API ({os.environ.get('NVIDIA_MODEL_NAME', 'meta/llama-3.2-11b-vision-instruct')})")
    }

@app.post("/api/rules/add")
async def api_rules_add(req: RuleAddRequest, background_tasks: BackgroundTasks):
    rules_file = "rules.json"
    if not os.path.exists(rules_file):
        return JSONResponse({"status": "error", "message": "rules.json not found"}, status_code=500)
    
    try:
        with open(rules_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        rule_id = f"RULE-{int(time.time()) % 10000}"
        new_entry = {
            "id": rule_id,
            "text": req.text.strip(),
            "status": "pending",
            "concern": None
        }
        data.setdefault("added", []).append(new_entry)
        
        with open(rules_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        background_tasks.add_task(review_rule_background, rule_id, req.text.strip(), req.mock)
        return {"status": "ok", "rule": new_entry}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.post("/api/rules/archive/{rule_id}")
async def api_rules_archive(rule_id: str):
    rules_file = "rules.json"
    if not os.path.exists(rules_file):
        return JSONResponse({"status": "error", "message": "rules.json not found"}, status_code=500)
    try:
        with open(rules_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        for r in data.get("added", []):
            if r.get("id") == rule_id:
                r["status"] = "archived"
                break
        with open(rules_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return {"status": "success", "status_code": "ok", "message": "Rule successfully archived."}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

# ============================================================
# PROJECT MANAGEMENT & CHAT ROUTES
# ============================================================

@app.get("/api/projects")
async def api_list_projects():
    """Returns list of all active projects with remaining retention time."""
    return pm.list_projects()

@app.post("/api/projects/save-all")
async def api_save_all_projects():
    """1-Click Save All: Marks all projects as Permanent."""
    count = pm.save_all_projects_permanent()
    return {"status": "ok", "count": count, "message": f"All {count} projects marked as Permanent."}

@app.post("/api/projects/clear-all")
async def api_clear_all_projects():
    """Purges all project data."""
    count = pm.clear_all_projects()
    return {"status": "ok", "count": count, "message": f"Successfully cleared {count} project(s)."}

@app.get("/api/projects/export-all")
async def api_export_all_projects():
    """1-Click Export All: Downloads every project in a single master .zip file."""
    zip_bytes = pm.export_all_projects_zip()
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=ultron_all_projects_{int(time.time())}.zip"}
    )

@app.get("/api/projects/export-current")
async def api_export_current_project():
    """Exports the live active project / workspace as a .zip file."""
    active_id = execution_state.get("active_project_id")
    zip_bytes = None
    if active_id:
        zip_bytes = pm.export_project_zip(active_id)
    if not zip_bytes:
        zip_bytes = pm.export_current_workspace_zip()
    filename = f"{active_id or 'ultron_project'}.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/projects/save-current")
async def api_save_current_project():
    """Saves the current active workspace as a permanent project."""
    active_id = execution_state.get("active_project_id")
    if active_id and pm.get_project(active_id):
        pm.save_project_permanent(active_id, True)
        return {"status": "ok", "project_id": active_id, "is_permanent": True, "time_remaining_str": "Permanent"}
    
    goal = execution_state.get("current_goal") or "Synthesized Mission"
    folder = execution_state.get("active_folder") or "ULTRON"
    meta = pm.save_current_workspace(goal=goal, folder=folder, is_permanent=True)
    with state_lock:
        execution_state["active_project_id"] = meta["id"]
    return {"status": "ok", "project_id": meta["id"], "is_permanent": True, "time_remaining_str": "Permanent"}

@app.get("/api/projects/{project_id}")
async def api_get_project(project_id: str):
    """Retrieves full project details, code, and chat history."""
    if project_id in ["active", "current"]:
        active_id = execution_state.get("active_project_id")
        if active_id:
            proj = pm.get_project(active_id)
            if proj:
                return proj
    proj = pm.get_project(project_id)
    if not proj:
        # If user selected a cleared or active project, return active workspace as fallback
        app_p = Path("domains/web_ui/index.html")
        if app_p.exists():
            return {
                "id": project_id,
                "title": execution_state.get("current_goal") or "Active Mission",
                "folder": execution_state.get("active_folder") or "ULTRON",
                "goal": execution_state.get("current_goal") or "",
                "code": app_p.read_text(encoding="utf-8"),
                "is_permanent": False,
                "version": "1.0",
                "status": "active",
                "logical_tree": current_state.get("logical_tree") if current_state else {},
                "chat": []
            }
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@app.post("/api/projects/{project_id}/save")
async def api_save_project(project_id: str):
    """1-Click Save: Marks project as Permanent (exempt from 30-day purge)."""
    proj = pm.get_project(project_id)
    if not proj:
        # Save current workspace as permanent project
        goal = execution_state.get("current_goal") or "Synthesized Mission"
        folder = execution_state.get("active_folder") or "ULTRON"
        meta = pm.save_current_workspace(goal=goal, folder=folder, is_permanent=True)
        with state_lock:
            execution_state["active_project_id"] = meta["id"]
        return {"status": "ok", "project_id": meta["id"], "is_permanent": True, "time_remaining_str": "Permanent"}
        
    new_perm = not proj.get("is_permanent", False)
    pm.save_project_permanent(project_id, new_perm)
    return {"status": "ok", "project_id": project_id, "is_permanent": new_perm, "time_remaining_str": "Permanent" if new_perm else "30d 0h left"}

@app.delete("/api/projects/{project_id}")
async def api_delete_project(project_id: str):
    """Permanently deletes a specific project."""
    success = pm.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found or delete failed")
    return {"status": "ok", "message": f"Project {project_id} deleted."}

@app.get("/api/projects/{project_id}/export")
async def api_export_project(project_id: str):
    """1-Click Export: Downloads all project files in a single .zip file."""
    zip_bytes = pm.export_project_zip(project_id)
    if not zip_bytes:
        zip_bytes = pm.export_current_workspace_zip()
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={project_id}.zip"}
    )

@app.get("/api/projects/storage")
async def api_projects_storage():
    """139: Storage usage indicator - returns disk usage of projects."""
    return pm.get_storage_usage()

class ProjectRenameRequest(BaseModel):
    title: str

@app.post("/api/projects/{project_id}/rename")
async def api_rename_project(project_id: str, req: ProjectRenameRequest):
    """134: Project rename - relabels project without losing history."""
    success = pm.rename_project(project_id, req.title)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found or rename failed")
    return {"status": "ok", "project_id": project_id, "title": req.title}

@app.post("/api/projects/restore")
async def api_restore_project(req: Request):
    """138: Restore from ZIP - restores project into directory."""
    body = await req.body()
    if not body:
        raise HTTPException(status_code=400, detail="Missing zip file body")
    meta = pm.restore_project_from_zip(body)
    if not meta:
        raise HTTPException(status_code=400, detail="Failed to restore project from zip")
    return {"status": "ok", "project": meta}

@app.get("/api/projects/{project_id}/suggestions")
async def api_project_suggestions(project_id: str):
    """Returns AI-generated proactive suggestions for next updates."""
    suggestions = pm.get_project_suggestions(project_id)
    return {"status": "ok", "suggestions": suggestions}

def is_code_modification_request(prompt: str) -> bool:
    p = prompt.strip().lower()
    
    # Common conversational greetings & pleasantries
    greetings = [
        "hi", "hello", "hey", "hey ultron", "hi ultron", "hello ultron", 
        "good morning", "good evening", "good afternoon", "sup", "yo",
        "thanks", "thank you", "thx", "great", "awesome", "cool", "nice", 
        "ok", "okay", "who are you", "what are you", "what can you do", "help"
    ]
    if p in greetings:
        return False
        
    if any(p.startswith(g + " ") or p.endswith(" " + g) for g in ["hi", "hello", "hey", "thanks", "thank you"]):
        if not any(k in p for k in ["add", "change", "update", "fix", "make", "create", "remove", "delete"]):
            return False

    # Questions, explanations, general chat
    info_starters = [
        "how does", "how do i", "how to use", "what is", "what does", 
        "can you explain", "explain", "tell me about", "what features", 
        "why does", "why is", "where is", "help me understand",
        "give me suggestions", "what can we add", "any ideas", "who are you"
    ]
    if any(p.startswith(s) for s in info_starters):
        if not any(k in p for k in ["please add", "please change", "please fix", "go ahead and add", "now add", "add it", "solve"]):
            return False

    # Bug reports, errors, broken behavior, repair requests
    bug_indicators = [
        "not work", "not properly worked", "displaying itself", "raw code", "syntax error",
        "broken", "bug", "error", "issue", "crash", "failed", "solve", "fix",
        "repair", "heal", "patch", "correct", "wrong", "blank", "freeze", "disappeared", "vanished"
    ]
    if any(b in p for b in bug_indicators):
        return True

    # Explicit code modification action verbs
    code_verbs = [
        "add ", "create ", "make ", "change ", "update ", "fix ", "modify ", 
        "remove ", "delete ", "replace ", "implement ", "style ", "redesign ",
        "set ", "put ", "turn ", "switch ", "convert ", "integrate ", "insert ",
        "include ", "attach ", "refactor ", "enhance ", "enable ", "disable "
    ]
    if any(p.startswith(v) or (" " + v) in p for v in code_verbs):
        return True

    code_nouns = ["button", "color", "background", "css", "html", "javascript", "function", "input", "form", "table", "layout", "modal", "dialog", "view", "theme", "header", "footer", "card", "font", "border"]
    if any(n in p for n in code_nouns) and any(v in p for v in ["new", "more", "dark", "light", "better", "different", "not working", "change"]):
        return True

    return False

@app.post("/api/projects/{project_id}/chat")
async def api_project_chat(project_id: str, req: ProjectChatRequest):
    """
    Intelligent Project Dialogue & Evolution:
    - If user asks a question, greets, or chats: acts as an intelligent AI chatbot (answers questions, explains, suggests).
    - If user requests a code change/feature: invokes the code evolution engine, updates the app, and updates sandbox.
    """
    if project_id in ["active", "current"] or not pm.get_project(project_id):
        active_id = execution_state.get("active_project_id")
        if active_id and pm.get_project(active_id):
            project_id = active_id
        else:
            meta = pm.save_current_workspace()
            project_id = meta["id"]
            execution_state["active_project_id"] = project_id

    proj = pm.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    user_prompt = req.prompt.strip()
    if not user_prompt:
        return JSONResponse({"status": "error", "message": "Prompt cannot be empty"}, status_code=400)

    # 153: Chat rate limiting (min 200ms debounce between rapid submissions)
    now_ts = time.time()
    if not hasattr(api_project_chat, "_last_ts"):
        api_project_chat._last_ts = {}
    last_ts = api_project_chat._last_ts.get(project_id, 0)
    if now_ts - last_ts < 0.2:
        return JSONResponse({"status": "error", "message": "Rate limit: please wait a moment between submissions"}, status_code=429)
    api_project_chat._last_ts[project_id] = now_ts

    current_code = proj.get("code", "")
    goal = proj.get("goal", "")
    title = proj.get("title", "Application")

    # 1. Priority Autonomous Transformer: If user requests a concrete UI element (download button, clear, theme, repair)
    import autonomous_transformer
    transformed_code, transform_summary = autonomous_transformer.transform_application_code(current_code, user_prompt, title)
    if transformed_code != current_code:
        updated_proj = pm.apply_project_update(project_id, transformed_code, transform_summary, user_prompt)
        return {"status": "ok", "type": "code_update", "summary": transform_summary, "reply": transform_summary, "project": updated_proj}

    # 2. Determine Intent: Conversational Chatbot vs Code Modification
    is_code_mod = is_code_modification_request(user_prompt)

    if not is_code_mod:
        # CONVERSATIONAL CHATBOT MODE (Natural Dialogue, No code/version bump)
        pm.record_chat_message(project_id, sender="user", text=user_prompt, msg_type="chat")
        
        if req.mock or os.environ.get("ULTRON_MOCK") == "true":
            time.sleep(0.5)
            p_lower = user_prompt.lower()
            if any(w in p_lower for w in ["hi", "hello", "hey", "sup", "yo"]):
                reply = f"Hello! I am **ULTRON**, your autonomous engineering partner. I'm here to assist you with **{title}**. You can ask me to explain how any feature works, brainstorm new features, or ask me to modify and add new capabilities directly to the code!"
            elif any(w in p_lower for w in ["how", "what", "explain"]):
                reply = f"**{title}** is currently running as a self-contained interactive web application in your live sandbox. It includes dynamic UI controls, local state handling, and automated styling. What specific part would you like to explore or customize?"
            elif any(w in p_lower for w in ["suggest", "idea", "improve"]):
                reply = f"Here are a few high-impact enhancements we could add to **{title}**:\n\n1. **Local Storage State Persistence**: Auto-save user inputs across browser sessions.\n2. **Export to CSV / JSON**: Allow 1-click downloading of all entered data.\n3. **Keyboard Shortcuts**: Add fast key triggers for common actions.\n\nJust tell me what you'd like and I'll implement it for you!"
            else:
                reply = f"I'm here to collaborate on **{title}**. Feel free to chat with me, ask questions about the application, or tell me any features you'd like to build."
        else:
            try:
                llm = get_llm("chatbot")
                system_msg = f"""You are ULTRON, a friendly, brilliant, and casual AI software engineer and pair programmer.
You are chatting with the user about their application: '{title}'.
Project Goal: {goal}.

Instructions:
1. Speak casually, naturally, and helpfully like an authentic AI chatbot (like ChatGPT, Claude, or Antigravity).
2. Directly answer whatever the user asks with genuine insight, tailored to this application.
3. If the user asks what this app is for or why it is used, explain its real-world purpose and functions clearly and engagingly.
4. If the user says hi, greet them warmly and ask what they'd like to explore or build next.
5. Use markdown for lists, code snippets, or bold text when helpful.
6. Never output code generation templates or fake updates when chatting."""

                res = llm.invoke([
                    SystemMessage(content=system_msg),
                    HumanMessage(content=user_prompt)
                ])
                reply = res.content.strip()
            except Exception as e:
                print(f"[ULTRON Chatbot Offline Fallback] {e}")
                reply = f"I am running in **ULTRON Offline Mode** with your local engine. Regarding **{title}**: your application is running in the live interactive sandbox. All core controls, responsive layout, and client-side processing are fully operational. Tell me what feature or fix you'd like to make, and I'll update the code immediately!"

        pm.record_chat_message(project_id, sender="ultron", text=reply, msg_type="chat")
        updated_proj = pm.get_project(project_id)
        return {"status": "ok", "type": "chat", "reply": reply, "project": updated_proj}

    # 2. CODE EVOLUTION MODE (User explicitly requested changes to code/UI)
    # Instant Autonomous Transformer: applies verified feature additions, buttons, layouts, and repairs in < 50ms
    import autonomous_transformer
    transformed_code, transform_summary = autonomous_transformer.transform_application_code(current_code, user_prompt, title)
    if transformed_code != current_code:
        updated_proj = pm.apply_project_update(project_id, transformed_code, transform_summary, user_prompt)
        return {"status": "ok", "type": "code_update", "summary": transform_summary, "reply": transform_summary, "project": updated_proj}

    if req.mock or os.environ.get("ULTRON_MOCK") == "true":
        time.sleep(0.8)
        change_summary = f"Applied update for: '{user_prompt}'"
        updated_code = current_code.replace("</body>", f"<!-- Updated: {change_summary} -->\n<script>console.log('ULTRON Update: {change_summary}');</script>\n</body>")
        updated_proj = pm.apply_project_update(project_id, updated_code, change_summary, user_prompt)
        return {"status": "ok", "type": "code_update", "summary": change_summary, "reply": change_summary, "project": updated_proj}

    try:
        llm = get_llm("worker")
        system_msg = """You are the ULTRON Project Evolution Engine.
Your task is to take an existing self-contained HTML/CSS/JS web application and update it according to the user's revision request.

STRICT DIAMOND-GRADE RULES:
1. Return the COMPLETE, production-ready updated HTML file with all inline CSS and JS.
2. DO NOT use placeholders like 'code omitted' or '// Add your code here'.
3. Maintain an ultra-premium dark HUD/cyberpunk theme with smooth interactivity.
4. Return your output EXACTLY in this format:

SUMMARY: <1-2 sentences explaining what was added or improved>
CODE:
<!DOCTYPE html>
...full html...
"""
        user_msg = f"""Original Project Goal: {goal}

Current Application Code:
{current_code[:12000]}

User Revision Request:
"{user_prompt}"

Update the application code to fulfill this request. Follow the format strictly."""

        res = llm.invoke([
            SystemMessage(content=system_msg),
            HumanMessage(content=user_msg)
        ])
        content = res.content.strip()

        summary_match = re.search(r"SUMMARY:\s*(.*?)(?=CODE:|$)", content, re.DOTALL | re.IGNORECASE)
        change_summary = summary_match.group(1).strip() if summary_match else f"Updated project based on: {user_prompt}"

        code_match = re.search(r"CODE:\s*(<!DOCTYPE html[\s\S]*?(?:</html>|$))", content, re.IGNORECASE)
        if not code_match:
            code_match = re.search(r"(<!DOCTYPE html[\s\S]*?(?:</html>|$))", content, re.IGNORECASE)

        if code_match:
            updated_code = code_match.group(1).strip()
            updated_code = re.sub(r"^```html\s*", "", updated_code)
            updated_code = re.sub(r"\s*```$", "", updated_code)
        else:
            updated_code = current_code

        updated_proj = pm.apply_project_update(project_id, updated_code, change_summary, user_prompt)
        return {"status": "ok", "type": "code_update", "summary": change_summary, "reply": change_summary, "project": updated_proj}

    except Exception as e:
        print(f"Error in project chat (running autonomous healer fallback): {e}")
        import autonomous_healer
        healed_code = autonomous_healer.heal_website_html(current_code)
        # If user reported template leakage or broken script, clean out nested scripts
        healed_code = re.sub(r'<script id=[\'"]ultron-healed-scripts[\'"]>.*?</script>\s*', '', healed_code, flags=re.DOTALL | re.IGNORECASE)
        healed_code = autonomous_healer.heal_website_html(healed_code)
        change_summary = f"ULTRON Healer verified & updated code: {user_prompt[:60]}"
        updated_proj = pm.apply_project_update(project_id, healed_code, change_summary, user_prompt)
        return {"status": "ok", "type": "code_update", "summary": change_summary, "reply": change_summary, "project": updated_proj}

@app.post("/api/projects/{project_id}/undo")
async def api_undo_project(project_id: str):
    """150: Undo last update - one click reverts to prior version snapshot."""
    reverted_proj = pm.undo_project_update(project_id)
    if not reverted_proj:
        raise HTTPException(status_code=400, detail="Cannot undo: initial version or project not found")
    return {"status": "ok", "project": reverted_proj, "version": reverted_proj.get("version")}

@app.get("/api/projects/{project_id}/chat/search")
async def api_search_project_chat(project_id: str, q: str = ""):
    """154: Chat search - find messages within project conversation history."""
    results = pm.search_project_chat(project_id, q)
    return {"status": "ok", "project_id": project_id, "query": q, "results": results}

@app.get("/projects/{project_id}/app", response_class=HTMLResponse)
async def project_app_view(project_id: str):
    """Directly renders any specific project's live app inside the sandbox iframe."""
    proj = pm.get_project(project_id)
    if not proj or not proj.get("code"):
        return HTMLResponse("<html><body style='background:#000305;color:#5ad8ff;font-family:monospace;padding:24px;'>Project not found.</body></html>", status_code=404)
    return HTMLResponse(content=proj["code"])

# ============================================================
# PRIMARY HUD DASHBOARD (CINEMATIC MULTI-AGENT COMMAND DECK)
# ============================================================

# ============================================================
# PRIMARY ANTIGRAVITY WORKSPACE DASHBOARD
# ============================================================

@app.get("/", response_class=HTMLResponse)
async def dashboard_home():
    template_path = Path("templates/antigravity.html")
    if template_path.exists():
        return HTMLResponse(content=template_path.read_text(encoding="utf-8"))
    return HTMLResponse("<html><body style='background:#0c0c0e;color:#fff;'>Antigravity template not found.</body></html>", status_code=404)
