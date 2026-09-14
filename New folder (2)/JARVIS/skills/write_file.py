# ════════════════════════════════════════
# FILE: skills/write_file.py
# PURPOSE: Write user-approved files into Documents/JARVIS_Files.
# MODIFIES: %USERPROFILE%/Documents/JARVIS_Files/
# ════════════════════════════════════════

import os

SKILL_NAME = "write_file"
SKILL_DESCRIPTION = "Write content to Documents/JARVIS_Files."
SKILL_PARAMETERS = {
    "type": "object",
    "properties": {"filename": {"type": "string"}, "content": {"type": "string"}},
    "required": ["filename", "content"],
}


def execute(filename: str, content: str) -> str:
    base = os.path.join(os.path.expanduser("~"), "Documents", "JARVIS_Files")
    os.makedirs(base, exist_ok=True)
    safe_name = os.path.basename(filename)
    path = os.path.join(base, safe_name)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)
    return f"Wrote file: {path}"

