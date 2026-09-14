# ════════════════════════════════════════
# FILE: skills/run_python.py
# PURPOSE: Safely run simple Python snippets in an isolated subprocess.
# MODIFIES: temp/
# ════════════════════════════════════════

from __future__ import annotations

import os
import subprocess
import sys
import uuid

from config_loader import rel_path

SKILL_NAME = "run_python"
SKILL_DESCRIPTION = "Run a safe Python code snippet with timeout and captured output."
SKILL_PARAMETERS = {"type": "object", "properties": {"code": {"type": "string"}}, "required": ["code"]}

BLOCKED = ("os.system", "subprocess.", "shutil.rmtree", "open(", "Path(", "unlink(", "remove(", "rmdir(")


def execute(code: str) -> str:
    lowered = code.lower()
    for pattern in BLOCKED:
        if pattern.lower() in lowered:
            return f"Blocked unsafe Python pattern: {pattern}"
    temp_dir = rel_path("temp")
    os.makedirs(temp_dir, exist_ok=True)
    script = os.path.join(temp_dir, f"jarvis_code_{uuid.uuid4().hex}.py")
    with open(script, "w", encoding="utf-8") as handle:
        handle.write(code)
    try:
        proc = subprocess.run([sys.executable, script], cwd=temp_dir, capture_output=True, text=True, timeout=30)
        output = (proc.stdout + proc.stderr).strip()
        return output[:2000] if output else "Python completed with no output."
    except subprocess.TimeoutExpired:
        return "Python execution timed out after 30 seconds."
    except Exception as exc:
        return f"Python execution failed: {exc}"

