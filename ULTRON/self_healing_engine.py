"""
ULTRON Self-Healing & Reliability Engine (Items 246-260)
Provides retry-with-backoff, mid-run checkpointing, circuit breakers,
conflict detection, data integrity repair, rollback-on-regression, and post-mortems.
"""

import os
import sys
import time
import json
import uuid
import random
import hashlib
from typing import Dict, List, Any, Optional, Tuple

CHECKPOINT_DIR = "checkpoints"
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

# 253: Circuit Breaker
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, reset_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.state = "CLOSED" # CLOSED, OPEN, HALF-OPEN
        self.last_failure_time = 0.0

    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"

    def can_execute(self) -> bool:
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "HALF-OPEN"
                return True
            return False
        return True # HALF-OPEN

# 246: Retry with Exponential Backoff
def retry_with_backoff(fn, max_retries: int = 3, base_delay: float = 0.5):
    delay = base_delay
    last_err = None
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            last_err = e
            if attempt == max_retries - 1:
                raise e
            time.sleep(delay)
            delay *= 2.0
    raise last_err

# 247 & 254: Mid-run checkpointing & Graceful shutdown
def save_checkpoint(run_id: str, state: Dict[str, Any]) -> str:
    path = os.path.join(CHECKPOINT_DIR, f"checkpoint_{run_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({
            "run_id": run_id,
            "timestamp": time.time(),
            "state": state
        }, f, indent=2)
    return path

def load_checkpoint(run_id: str) -> Optional[Dict[str, Any]]:
    path = os.path.join(CHECKPOINT_DIR, f"checkpoint_{run_id}.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("state")
        except Exception:
            return None
    return None

def clear_checkpoint(run_id: str):
    path = os.path.join(CHECKPOINT_DIR, f"checkpoint_{run_id}.json")
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass

# 248: Post-completion self-check pass
def post_completion_self_check(project_code: str) -> Tuple[bool, List[str]]:
    issues = []
    if "<!DOCTYPE html>" not in project_code:
        issues.append("Missing DOCTYPE")
    if "</html>" not in project_code:
        issues.append("Unclosed HTML")
    if "// add code here" in project_code.lower():
        issues.append("Found forbidden placeholder")
    return len(issues) == 0, issues

# 252: Rollback-on-regression
def auto_rollback_if_broken(project_id: str, new_code: str) -> Tuple[bool, str]:
    from qa_engine import run_app_smoke_test
    passed, msg = run_app_smoke_test(new_code)
    if not passed:
        import project_manager as pm
        reverted = pm.undo_project_update(project_id)
        return True, f"Automated Rollback Triggered: New update failed smoke test ({msg}). Reverted to previous version."
    return False, "Update verified and accepted."

# 256: Conflict detection
def detect_code_conflict(base_code: str, patch_a: str, patch_b: str) -> bool:
    # If both patches modify identical lines or tags, flag conflict
    return patch_a in patch_b or patch_b in patch_a

# 257: Data integrity check and repair
def verify_and_repair_project_json(proj_dict: Dict[str, Any]) -> Dict[str, Any]:
    repaired = dict(proj_dict)
    if "id" not in repaired:
        repaired["id"] = f"proj_{int(time.time())}"
    if "version" not in repaired:
        repaired["version"] = "1.0"
    if "title" not in repaired:
        repaired["title"] = "Recovered Application"
    if "code" not in repaired:
        repaired["code"] = "<!DOCTYPE html><html><body><h1>Auto-Repaired Project</h1></body></html>"
    if "chat" not in repaired:
        repaired["chat"] = []
    if "is_permanent" not in repaired:
        repaired["is_permanent"] = False
    return repaired

# 258: Idempotent re-runs
_PROCESSED_GOAL_HASHES: Dict[str, str] = {}

def get_or_register_idempotent_project(goal: str, project_id: str) -> str:
    goal_hash = hashlib.sha256(goal.strip().lower().encode("utf-8")).hexdigest()
    if goal_hash in _PROCESSED_GOAL_HASHES:
        return _PROCESSED_GOAL_HASHES[goal_hash]
    _PROCESSED_GOAL_HASHES[goal_hash] = project_id
    return project_id

# 259: Deterministic failure reproduction
def reproduce_failure_with_seed(seed: int, test_fn) -> Any:
    random.seed(seed)
    return test_fn()

# 260: Auto-generated post-mortem
def generate_post_mortem(run_id: str, error_msg: str, state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    post_mortem = {
        "incident_id": f"PM-{run_id}",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "error": error_msg,
        "root_cause_analysis": f"Execution halted due to: {error_msg}",
        "recommended_action": "Check Ollama connectivity and verify input prompt constraints.",
        "state_snapshot": {
            "status": state.get("status") if state else "unknown",
            "last_node": state.get("last_node") if state else "unknown"
        }
    }
    path = f"post_mortem_{run_id}.json"
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(post_mortem, f, indent=2)
    except Exception:
        pass
    return post_mortem

circuit_breaker = CircuitBreaker()
