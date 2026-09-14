# ════════════════════════════════════════
# FILE: skills/list_directory.py
# PURPOSE: List files and folders with size and modified time.
# MODIFIES: none
# ════════════════════════════════════════

import os
from datetime import datetime

from .common import resolve_user_path

SKILL_NAME = "list_directory"
SKILL_DESCRIPTION = "List files and folders in a directory."
SKILL_PARAMETERS = {"type": "object", "properties": {"path": {"type": "string"}}}


def execute(path: str = "") -> str:
    target = resolve_user_path(path or os.path.expanduser("~"))
    if not os.path.isdir(target):
        return f"Directory not found: {target}"
    lines = []
    for name in sorted(os.listdir(target))[:80]:
        full = os.path.join(target, name)
        stat = os.stat(full)
        kind = "DIR" if os.path.isdir(full) else "FILE"
        modified = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
        lines.append(f"{kind} {name} {stat.st_size} bytes {modified}")
    return "\n".join(lines) or "Directory is empty."

