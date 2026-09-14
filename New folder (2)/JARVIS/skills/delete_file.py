# ════════════════════════════════════════
# FILE: skills/delete_file.py
# PURPOSE: Delete files only after explicit confirmation.
# MODIFIES: user-selected files
# ════════════════════════════════════════

import os
import time

from .common import resolve_user_path

SKILL_NAME = "delete_file"
SKILL_DESCRIPTION = "Request confirmation and delete a file."
SKILL_PARAMETERS = {
    "type": "object",
    "properties": {"filename": {"type": "string"}, "confirmation": {"type": "string"}},
    "required": ["filename"],
}

_PENDING = {"path": "", "expires": 0.0}


def execute(filename: str, confirmation: str = "") -> str:
    path = resolve_user_path(filename)
    if confirmation.lower().strip() == "confirm" and _PENDING["path"] == path and time.time() < _PENDING["expires"]:
        if os.path.isfile(path):
            os.remove(path)
            _PENDING.update({"path": "", "expires": 0.0})
            return f"Deleted {path}"
        return "Pending file no longer exists."
    if not os.path.isfile(path):
        return f"File not found: {filename}"
    _PENDING.update({"path": path, "expires": time.time() + 30})
    return f"Say confirm to delete {path}. Confirmation expires in 30 seconds."

