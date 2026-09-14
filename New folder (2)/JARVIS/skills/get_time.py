# ════════════════════════════════════════
# FILE: skills/get_time.py
# PURPOSE: Offline local date and time skill.
# MODIFIES: none
# ════════════════════════════════════════

from datetime import datetime

SKILL_NAME = "get_time"
SKILL_DESCRIPTION = "Return the current local time and date."
SKILL_PARAMETERS = {"type": "object", "properties": {}}


def execute() -> str:
    return datetime.now().strftime("It is %I:%M %p on %A, %B %d, %Y.").replace(" 0", " ")

