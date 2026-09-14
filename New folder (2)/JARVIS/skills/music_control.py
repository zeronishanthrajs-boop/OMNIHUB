# ════════════════════════════════════════
# FILE: skills/music_control.py
# PURPOSE: Control Spotify/VLC media playback through media keys.
# MODIFIES: media playback state
# ════════════════════════════════════════

import pyautogui

SKILL_NAME = "music_control"
SKILL_DESCRIPTION = "Control music playback: play, pause, next, previous, volume."
SKILL_PARAMETERS = {"type": "object", "properties": {"action": {"type": "string"}}, "required": ["action"]}

KEYS = {
    "play": "playpause",
    "pause": "playpause",
    "next": "nexttrack",
    "previous": "prevtrack",
    "volume_up": "volumeup",
    "volume_down": "volumedown",
}


def execute(action: str) -> str:
    key = KEYS.get(action.lower())
    if not key:
        return f"Unknown music action: {action}"
    pyautogui.press(key)
    return f"Music command sent: {action}"

