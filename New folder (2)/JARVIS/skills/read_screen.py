# ════════════════════════════════════════
# FILE: skills/read_screen.py
# PURPOSE: Describe the current screen via JarvisVisionEngine.
# MODIFIES: temp/screenshot_*.png
# ════════════════════════════════════════

from vision import JarvisVisionEngine

SKILL_NAME = "read_screen"
SKILL_DESCRIPTION = "Capture and describe the current screen."
SKILL_PARAMETERS = {"type": "object", "properties": {}}


def execute() -> str:
    return JarvisVisionEngine().read_screen()

