# ════════════════════════════════════════
# FILE: skills/clipboard.py
# PURPOSE: Read/write clipboard text and route image clipboard to vision.
# MODIFIES: system clipboard
# ════════════════════════════════════════

import pyperclip

SKILL_NAME = "clipboard"
SKILL_DESCRIPTION = "Read or write clipboard text."
SKILL_PARAMETERS = {"type": "object", "properties": {"action": {"type": "string"}, "text": {"type": "string"}}, "required": ["action"]}


def execute(action: str, text: str = "") -> str:
    if action == "read_clipboard":
        value = pyperclip.paste()
        return value if value else "Clipboard is empty."
    if action == "write_clipboard":
        pyperclip.copy(text)
        return "Clipboard updated."
    if action == "analyze_clipboard_image":
        from vision import JarvisVisionEngine

        return JarvisVisionEngine().analyze_clipboard_image()
    return "Unknown clipboard action."

