# ════════════════════════════════════════
# FILE: skills.py
# PURPOSE: Compatibility shim for the modular skills/ registry.
# MODIFIES: skills/
# ════════════════════════════════════════

from __future__ import annotations

import importlib.util
import os

_PACKAGE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "skills", "__init__.py")
_SPEC = importlib.util.spec_from_file_location("jarvis_skill_package", _PACKAGE_PATH, submodule_search_locations=[os.path.dirname(_PACKAGE_PATH)])
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError("Modular skills package could not be loaded.")
_SKILL_PACKAGE = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_SKILL_PACKAGE)

discover_skills = _SKILL_PACKAGE.discover_skills
execute_skill = _SKILL_PACKAGE.execute_skill
get_registry = _SKILL_PACKAGE.get_registry
get_tool_schema = _SKILL_PACKAGE.get_tool_schema
list_skills = _SKILL_PACKAGE.list_skills
toggle_skill = _SKILL_PACKAGE.toggle_skill


class JarvisSkills:
    def __init__(self):
        discover_skills()

    def execute(self, name: str, arguments: dict | None = None) -> str:
        return execute_skill(name, arguments or {})

    def tool_schema(self) -> list[dict]:
        return get_tool_schema()

    def list(self) -> list[dict]:
        return list_skills()

    def toggle(self, name: str, enabled: bool) -> bool:
        return toggle_skill(name, enabled)

    def open_app(self, app_name: str) -> str:
        return execute_skill("open_app", {"app_name": app_name})

    def get_weather(self, city: str | None = None) -> str:
        return execute_skill("get_weather", {"city": city or "Bengaluru"})

    def get_current_time_and_date(self) -> str:
        return execute_skill("get_time", {})

    def view_file_contents(self, filename: str) -> str:
        return execute_skill("view_file", {"filename": filename})

    def search_google(self, query: str) -> str:
        return execute_skill("search_web", {"query": query})
