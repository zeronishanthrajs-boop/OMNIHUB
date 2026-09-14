# ════════════════════════════════════════
# FILE: skills/system_control.py
# PURPOSE: Windows system controls and telemetry.
# MODIFIES: volume, lock state, Desktop screenshots
# ════════════════════════════════════════

from __future__ import annotations

import ctypes
import os
import time

import psutil

SKILL_NAME = "system_control"
SKILL_DESCRIPTION = "Control volume, get stats, screenshot, or lock screen."
SKILL_PARAMETERS = {
    "type": "object",
    "properties": {"action": {"type": "string"}, "level": {"type": "integer"}},
    "required": ["action"],
}


def execute(action: str, level: int = 50) -> str:
    action = action.lower().strip()
    if action == "set_volume":
        return set_volume(level)
    if action == "get_system_stats":
        return get_system_stats()
    if action == "take_screenshot":
        return take_screenshot()
    if action == "lock_screen":
        ctypes.windll.user32.LockWorkStation()
        return "Screen locked."
    return f"Unknown system action: {action}"


def set_volume(level_0_to_100: int) -> str:
    try:
        from ctypes import POINTER, cast
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume

        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = cast(interface, POINTER(IAudioEndpointVolume))
        volume.SetMasterVolumeLevelScalar(max(0, min(100, level_0_to_100)) / 100.0, None)
        return f"Volume set to {level_0_to_100}%."
    except Exception as exc:
        return f"Volume control failed: {exc}"


def get_system_stats() -> str:
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(os.path.abspath(os.sep))
    return (
        f"CPU {psutil.cpu_percent()}%, RAM {mem.used / 1024**3:.1f} of {mem.total / 1024**3:.1f} GB, "
        f"Disk {disk.percent}% used."
    )


def take_screenshot() -> str:
    import mss

    desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    path = os.path.join(desktop, f"jarvis_{int(time.time())}.png")
    with mss.mss() as capture:
        capture.shot(output=path)
    return f"Screenshot saved to {path}"

