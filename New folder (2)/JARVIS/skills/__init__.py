# ════════════════════════════════════════
# FILE: skills/__init__.py
# PURPOSE: Auto-discover JARVIS skill plugins and expose tool schemas.
# MODIFIES: brain.py, main.py
# ════════════════════════════════════════

from __future__ import annotations

import importlib
import logging
import os
import pkgutil
from typing import Any

log = logging.getLogger("jarvis.skills")

_REGISTRY: dict[str, Any] = {}
_ENABLED: dict[str, bool] = {}


def discover_skills() -> dict[str, Any]:
    global _REGISTRY
    package_dir = os.path.dirname(__file__)
    discovered: dict[str, Any] = {}
    for module_info in pkgutil.iter_modules([package_dir]):
        if module_info.name.startswith("_") or module_info.name == "common":
            continue
        try:
            module = importlib.import_module(f"{__name__}.{module_info.name}")
            name = getattr(module, "SKILL_NAME", module_info.name)
            if hasattr(module, "execute"):
                discovered[name] = module
                _ENABLED.setdefault(name, True)
        except Exception as exc:
            log.error("Skill load failed for %s: %s", module_info.name, exc, exc_info=True)
    _REGISTRY = discovered
    return _REGISTRY


def get_registry() -> dict[str, Any]:
    if not _REGISTRY:
        discover_skills()
    return _REGISTRY


def get_tool_schema() -> list[dict[str, Any]]:
    tools = []
    for name, module in get_registry().items():
        if not _ENABLED.get(name, True):
            continue
        tools.append(
            {
                "type": "function",
                "function": {
                    "name": name,
                    "description": getattr(module, "SKILL_DESCRIPTION", name),
                    "parameters": getattr(module, "SKILL_PARAMETERS", {"type": "object", "properties": {}}),
                },
            }
        )
    return tools


def execute_skill(name: str, arguments: dict[str, Any] | None = None) -> str:
    arguments = arguments or {}
    module = get_registry().get(name)
    if not module:
        return f"Skill {name} is not registered."
    if not _ENABLED.get(name, True):
        return f"Skill {name} is disabled."
    try:
        return str(module.execute(**arguments))
    except TypeError:
        return str(module.execute(arguments))
    except Exception as exc:
        log.error("Skill execution failed for %s: %s", name, exc, exc_info=True)
        return f"Skill {name} failed: {exc}"


def toggle_skill(name: str, enabled: bool) -> bool:
    if name not in get_registry():
        return False
    _ENABLED[name] = bool(enabled)
    log.info("Skill %s enabled=%s", name, enabled)
    return True


def list_skills() -> list[dict[str, Any]]:
    return [
        {
            "name": name,
            "description": getattr(module, "SKILL_DESCRIPTION", name),
            "enabled": _ENABLED.get(name, True),
            "parameters": getattr(module, "SKILL_PARAMETERS", {}),
        }
        for name, module in get_registry().items()
    ]


discover_skills()

