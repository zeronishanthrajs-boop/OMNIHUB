# ════════════════════════════════════════
# FILE: watchdog.py
# PURPOSE: Restart JARVIS if health checks fail repeatedly.
# MODIFIES: logs/watchdog.log
# ════════════════════════════════════════

from __future__ import annotations

import logging
import os
import subprocess
import sys
import time

import requests

from config_loader import config_manager, rel_path

log_path = rel_path(os.path.join("logs", "watchdog.log"))
os.makedirs(os.path.dirname(log_path), exist_ok=True)
logging.basicConfig(filename=log_path, level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("jarvis.watchdog")


def notify(message: str) -> None:
    try:
        subprocess.Popen(
            ["powershell", "-NoProfile", "-Command", f"[console]::beep(880,120); Write-Output {message!r}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as exc:
        log.error("Notification failed: %s", exc, exc_info=True)


def start_main() -> None:
    python = sys.executable
    main_path = rel_path("main.py")
    subprocess.Popen([python, main_path], cwd=os.path.dirname(main_path), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    notify("JARVIS auto-restarted")


def main() -> None:
    host = config_manager.get("server.host", "127.0.0.1")
    port = int(config_manager.get("server.port", 8000))
    url = f"http://{host}:{port}/health"
    failures = 0
    restarts = 0
    while True:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                failures = 0
            else:
                failures += 1
                log.error("Health returned status %s", response.status_code)
        except Exception as exc:
            failures += 1
            log.error("Health ping failed: %s", exc)
        if failures >= 3:
            if restarts >= 3:
                log.critical("Maximum restart attempts reached.")
                return
            start_main()
            restarts += 1
            failures = 0
        time.sleep(30)


if __name__ == "__main__":
    main()

