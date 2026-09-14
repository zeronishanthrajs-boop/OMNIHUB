# ════════════════════════════════════════
# FILE: skills/open_app.py
# PURPOSE: Fuzzy open and close Windows applications.
# MODIFIES: running Windows processes
# ════════════════════════════════════════

from __future__ import annotations

import os
import subprocess
from difflib import SequenceMatcher

import psutil

try:
    from fuzzywuzzy import process
except Exception:
    process = None

SKILL_NAME = "open_app"
SKILL_DESCRIPTION = "Open or close a Windows desktop application by fuzzy name."
SKILL_PARAMETERS = {
    "type": "object",
    "properties": {
        "app_name": {"type": "string"},
        "action": {"type": "string", "enum": ["open", "close"]},
    },
    "required": ["app_name"],
}


def _shortcuts() -> dict[str, str]:
    roots = [
        os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs"),
        os.path.join(os.environ.get("PROGRAMDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs"),
    ]
    found = {}
    for root in roots:
        if not root or not os.path.exists(root):
            continue
        for current, _dirs, files in os.walk(root):
            for name in files:
                if name.lower().endswith((".lnk", ".exe")):
                    found[os.path.splitext(name)[0].lower()] = os.path.join(current, name)
    return found


def _close_app(app_name: str) -> str:
    target = app_name.lower().replace(".exe", "")
    matches = []
    for proc in psutil.process_iter(["name"]):
        try:
            pname = (proc.info.get("name") or "").lower()
            if target in pname.replace(".exe", ""):
                proc.terminate()
                matches.append(pname)
        except Exception:
            continue
    return f"Closed {', '.join(matches)}." if matches else f"No running process matched {app_name}."


def _best_match(query: str, choices: list[str]) -> tuple[str, int] | None:
    if not choices:
        return None
    if process:
        return process.extractOne(query, choices)
    scored = sorted(
        ((choice, int(SequenceMatcher(None, query, choice).ratio() * 100)) for choice in choices),
        key=lambda item: item[1],
        reverse=True,
    )
    return scored[0] if scored else None


def execute(app_name: str, action: str = "open") -> str:
    if action == "close" or app_name.lower().startswith("close "):
        return _close_app(app_name.replace("close ", "", 1).strip())
    shortcuts = _shortcuts()
    if not shortcuts:
        return "No Start Menu shortcuts were found."
    match = _best_match(app_name.lower(), list(shortcuts.keys()))
    if not match or match[1] < 55:
        return f"Could not find {app_name}."
    path = shortcuts[match[0]]
    subprocess.Popen(["cmd", "/c", "start", "", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return f"Opened {match[0]}."
