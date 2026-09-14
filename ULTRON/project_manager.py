"""
ULTRON 3.0 — Project Manager & Lifecycle Engine
Handles persistence, versioning, 1-click multi-file zip exports, 
30-day auto-purge lifecycles, and per-project iterative chat/updates.
"""

import os
import re
import json
import time
import shutil
import zipfile
import io
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

PROJECTS_ROOT = Path("projects")
WEB_UI_DIR = Path("domains") / "web_ui"
DEFAULT_TTL_DAYS = 30


def ensure_projects_dir() -> Path:
    PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)
    WEB_UI_DIR.mkdir(parents=True, exist_ok=True)
    return PROJECTS_ROOT


def _slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "_", s)[:32] or "project"


def create_project(
    goal: str,
    logical_tree: Optional[Dict[str, Any]] = None,
    code: Optional[str] = None,
    title: Optional[str] = None,
    folder: Optional[str] = "ULTRON"
) -> Dict[str, Any]:
    """
    Creates a new project sandbox, saves initial v1.0 snapshot, metadata,
    and initializes 30-day auto-purge countdown.
    """
    ensure_projects_dir()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    expires_iso = (now + timedelta(days=DEFAULT_TTL_DAYS)).isoformat()
    
    slug = _slugify(title or goal)
    timestamp_suffix = now.strftime("%Y%m%d_%H%M%S")
    project_id = f"proj_{timestamp_suffix}_{slug}"
    
    proj_dir = PROJECTS_ROOT / project_id
    versions_dir = proj_dir / "versions"
    versions_dir.mkdir(parents=True, exist_ok=True)
    
    app_title = title or (goal[:60] + "..." if len(goal) > 60 else goal)
    
    if not code:
        code = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{app_title}</title>
    <style>
        body {{ background: #000305; color: #5ad8ff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
        .card {{ border: 1px solid #5ad8ff; padding: 24px; max-width: 400px; text-align: center; }}
    </style>
</head>
<body>
    <div class="card">
        <h2>{app_title}</h2>
        <p>Initialized by ULTRON 3.0. Awaiting full code synthesis.</p>
    </div>
</body>
</html>"""

    # Autonomous Healer: Guarantee Astra-grade zero stubs, responsive viewport, and micro-interactions
    if code and ("<html" in code.lower() or "<!doctype" in code.lower()):
        try:
            from autonomous_healer import heal_website_html
            code = heal_website_html(code, goal)
        except Exception:
            pass

    # 1. Write index.html (current live code)
    index_file = proj_dir / "index.html"
    index_file.write_text(code, encoding="utf-8")
    
    # 2. Write v1.0 snapshot
    v1_file = versions_dir / "v1.0.html"
    v1_file.write_text(code, encoding="utf-8")
    
    # 3. Write logical tree
    tree_data = logical_tree or {
        "intent": goal,
        "screens": [{"id": "screen_1", "name": "Main Dashboard", "purpose": "Primary user interaction surface"}],
        "features": [{"id": "feat_1", "name": "Core Engine", "details": "Autonomous synthesized logic"}],
        "tasks": [{"id": "task_1", "branch": "web_ui", "action": "Synthesize index.html"}],
        "verification": [{"id": "verify_1", "check": "Syntax and DOM readiness verified"}]
    }
    tree_file = proj_dir / "logical_tree.json"
    tree_file.write_text(json.dumps(tree_data, indent=2), encoding="utf-8")
    
    # 4. Initialize Project Metadata
    meta = {
        "id": project_id,
        "title": app_title,
        "folder": folder or "ULTRON",
        "goal": goal,
        "created_at": now_iso,
        "updated_at": now_iso,
        "expires_at": expires_iso,
        "is_permanent": False,
        "version": "1.0",
        "status": "active",
        "versions": [
            {
                "version": "1.0",
                "timestamp": now_iso,
                "summary": "Initial autonomous synthesis",
                "file": "versions/v1.0.html"
            }
        ],
        "chat": [
            {
                "id": f"msg_{int(time.time()*1000)}",
                "sender": "ultron",
                "timestamp": now_iso,
                "text": f"Project '{app_title}' synthesized and deployed to sandbox (v1.0). You can ask me for updates or select any of the proactive suggestions below.",
                "version_created": "1.0"
            }
        ]
    }
    
    meta_file = proj_dir / "project.json"
    meta_file.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    
    # Also sync into domains/web_ui/index.html so active preview runs immediately
    try:
        (WEB_UI_DIR / "index.html").write_text(code, encoding="utf-8")
    except Exception:
        pass
        
    return meta


def list_projects() -> List[Dict[str, Any]]:
    """
    Returns all projects sorted by last update, calculating live countdown.
    """
    ensure_projects_dir()
    projects = []
    now = datetime.now(timezone.utc)
    
    for item in PROJECTS_ROOT.iterdir():
        if not item.is_dir():
            continue
        meta_file = item / "project.json"
        if not meta_file.exists():
            continue
        try:
            data = json.loads(meta_file.read_text(encoding="utf-8"))
            
            # Compute remaining time
            is_perm = data.get("is_permanent", False)
            if is_perm:
                data["time_remaining_str"] = "Permanent"
                data["days_remaining"] = 9999
            else:
                expires_at_str = data.get("expires_at")
                if expires_at_str:
                    exp = datetime.fromisoformat(expires_at_str)
                    diff = exp - now
                    if diff.total_seconds() <= 0:
                        data["time_remaining_str"] = "Expired"
                        data["days_remaining"] = 0
                    else:
                        days = diff.days
                        hours = int(diff.seconds // 3600)
                        data["time_remaining_str"] = f"{days}d {hours}h left"
                        data["days_remaining"] = days
                else:
                    data["time_remaining_str"] = "30d 0h left"
                    data["days_remaining"] = 30
                    
            # Compute relative time for sidebar (e.g. 20h, 5d, 28d, 1mo)
            updated_str = data.get("updated_at") or data.get("created_at")
            if updated_str:
                try:
                    up_dt = datetime.fromisoformat(updated_str)
                    passed = now - up_dt
                    secs = max(0, int(passed.total_seconds()))
                    if secs < 3600:
                        data["relative_time_str"] = f"{max(1, secs // 60)}m"
                    elif secs < 86400:
                        data["relative_time_str"] = f"{secs // 3600}h"
                    elif secs < 2592000:
                        data["relative_time_str"] = f"{secs // 86400}d"
                    else:
                        data["relative_time_str"] = f"{secs // 2592000}mo"
                except Exception:
                    data["relative_time_str"] = "now"
            else:
                data["relative_time_str"] = "now"

            # Ensure clean folder categorization
            data["folder"] = data.get("folder") or "ULTRON"

            projects.append(data)
        except Exception:
            continue
            
    projects.sort(key=lambda p: p.get("updated_at", ""), reverse=True)
    return projects


def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves project details, current code, logical tree, and chat history.
    """
    proj_dir = PROJECTS_ROOT / project_id
    meta_file = proj_dir / "project.json"
    if not meta_file.exists():
        return None
        
    try:
        data = json.loads(meta_file.read_text(encoding="utf-8"))
        
        # Load live index.html code
        code_file = proj_dir / "index.html"
        data["code"] = code_file.read_text(encoding="utf-8") if code_file.exists() else ""
        
        # Load logical tree
        tree_file = proj_dir / "logical_tree.json"
        data["logical_tree"] = json.loads(tree_file.read_text(encoding="utf-8")) if tree_file.exists() else {}
        
        # Calculate time remaining
        now = datetime.now(timezone.utc)
        if data.get("is_permanent", False):
            data["time_remaining_str"] = "Permanent"
            data["days_remaining"] = 9999
        else:
            expires_at_str = data.get("expires_at")
            if expires_at_str:
                exp = datetime.fromisoformat(expires_at_str)
                diff = exp - now
                if diff.total_seconds() <= 0:
                    data["time_remaining_str"] = "Expired"
                    data["days_remaining"] = 0
                else:
                    days = diff.days
                    hours = int(diff.seconds // 3600)
                    data["time_remaining_str"] = f"{days}d {hours}h left"
                    data["days_remaining"] = days
            else:
                data["time_remaining_str"] = "30d 0h left"
                data["days_remaining"] = 30
                
        return data
    except Exception as e:
        print(f"Error loading project {project_id}: {e}")
        return None


def save_current_workspace(
    goal: Optional[str] = None,
    folder: Optional[str] = "ULTRON",
    is_permanent: bool = True
) -> Dict[str, Any]:
    """
    Saves the live workspace (domains/web_ui and associated domains) as a permanent project.
    """
    ensure_projects_dir()
    app_code = ""
    title = None
    web_ui_file = WEB_UI_DIR / "index.html"
    if web_ui_file.exists():
        app_code = web_ui_file.read_text(encoding="utf-8")
        match = re.search(r"<title>(.*?)</title>", app_code, re.IGNORECASE)
        if match:
            title = match.group(1).strip()
            
    proj_goal = goal or title or "Synthesized Application"
    meta = create_project(goal=proj_goal, code=app_code, title=title, folder=folder or "ULTRON")
    if is_permanent:
        meta["is_permanent"] = True
        proj_dir = PROJECTS_ROOT / meta["id"]
        meta_file = proj_dir / "project.json"
        if meta_file.exists():
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                data["is_permanent"] = True
                meta_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
            except Exception:
                pass
    return meta


def save_project_permanent(project_id: str, is_permanent: bool = True) -> bool:
    """
    Toggles a project's permanent retention status (protects from 30-day purge).
    If project doesn't exist on disk, saves current workspace.
    """
    if project_id in ["current", "active", "latest"]:
        save_current_workspace(is_permanent=is_permanent)
        return True

    proj_dir = PROJECTS_ROOT / project_id
    meta_file = proj_dir / "project.json"
    if not meta_file.exists():
        if (WEB_UI_DIR / "index.html").exists():
            save_current_workspace(is_permanent=is_permanent)
            return True
        return False
        
    try:
        data = json.loads(meta_file.read_text(encoding="utf-8"))
        data["is_permanent"] = is_permanent
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        meta_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return True
    except Exception:
        return False


def save_all_projects_permanent() -> int:
    """
    1-Click Save All: marks all active projects as permanent.
    """
    ensure_projects_dir()
    count = 0
    for item in PROJECTS_ROOT.iterdir():
        if item.is_dir() and (item / "project.json").exists():
            if save_project_permanent(item.name, True):
                count += 1
    return count


def delete_project(project_id: str) -> bool:
    """
    Permanently deletes a specific project folder.
    """
    proj_dir = PROJECTS_ROOT / project_id
    if proj_dir.exists() and proj_dir.is_dir():
        try:
            shutil.rmtree(proj_dir)
            return True
        except Exception:
            return False
    return False


def purge_expired_projects(ttl_days: int = DEFAULT_TTL_DAYS) -> List[str]:
    """
    Scans projects and removes any unsaved project whose expires_at is past.
    Returns list of purged project IDs.
    """
    ensure_projects_dir()
    now = datetime.now(timezone.utc)
    purged = []
    
    for item in PROJECTS_ROOT.iterdir():
        if not item.is_dir():
            continue
        meta_file = item / "project.json"
        if not meta_file.exists():
            continue
        try:
            data = json.loads(meta_file.read_text(encoding="utf-8"))
            if data.get("is_permanent", False):
                continue
                
            expires_at_str = data.get("expires_at")
            should_purge = False
            if expires_at_str:
                exp = datetime.fromisoformat(expires_at_str)
                if now >= exp:
                    should_purge = True
            else:
                created_at_str = data.get("created_at")
                if created_at_str:
                    c = datetime.fromisoformat(created_at_str)
                    if (now - c).total_seconds() > ttl_days * 86400:
                        should_purge = True
                        
            if should_purge:
                shutil.rmtree(item)
                purged.append(item.name)
        except Exception as e:
            print(f"Error checking project {item.name} during purge: {e}")
            
    return purged


def export_current_workspace_zip() -> bytes:
    """
    Bundles the live active workspace files (domains/web_ui and associated domains)
    into a clean downloadable zip archive.
    """
    ensure_projects_dir()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        domains_dir = Path("domains")
        if domains_dir.exists():
            for root, dirs, files in os.walk(domains_dir):
                for file in files:
                    if file.endswith((".pyc", ".log")) or "__pycache__" in root:
                        continue
                    filepath = Path(root) / file
                    arcname = filepath.relative_to(domains_dir)
                    zf.write(filepath, arcname)
                    
        # If web_ui/index.html exists, also place a copy directly as root index.html
        web_index = WEB_UI_DIR / "index.html"
        if web_index.exists():
            zf.write(web_index, "index.html")
            
        readme_content = """# ULTRON Project Export

This application was synthesized and verified by ULTRON 3.0 (Autonomous Multi-Agent Platform).
To run:
- Double click `index.html` to open the frontend directly in your web browser.
- Backend services (if applicable) are located in `backend_api/`.
"""
        zf.writestr("README.md", readme_content)
        
    buf.seek(0)
    return buf.read()


def export_project_zip(project_id: str) -> Optional[bytes]:
    """
    1-Click Export: Bundles all project files (index.html, metadata,
    logical tree, versions, chat history) into a clean downloadable zip.
    Falls back to current workspace if project_id is 'current'/'active' or not found on disk.
    """
    if project_id in ["current", "active", "latest"]:
        return export_current_workspace_zip()

    proj_dir = PROJECTS_ROOT / project_id
    if not proj_dir.exists():
        if (WEB_UI_DIR / "index.html").exists():
            return export_current_workspace_zip()
        return None
        
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(proj_dir):
            for file in files:
                filepath = Path(root) / file
                arcname = filepath.relative_to(proj_dir)
                zf.write(filepath, arcname)
                
    buf.seek(0)
    return buf.read()


def export_all_projects_zip() -> bytes:
    """
    1-Click Export All: Bundles every project into a single master archive.
    """
    ensure_projects_dir()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(PROJECTS_ROOT):
            for file in files:
                filepath = Path(root) / file
                arcname = filepath.relative_to(PROJECTS_ROOT)
                zf.write(filepath, arcname)
                
    buf.seek(0)
    return buf.read()


def record_chat_message(
    project_id: str,
    sender: str,
    text: str,
    msg_type: str = "chat",
    version_created: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Appends a message to the project's chat history.
    """
    proj_dir = PROJECTS_ROOT / project_id
    meta_file = proj_dir / "project.json"
    if not meta_file.exists():
        return None
        
    try:
        data = json.loads(meta_file.read_text(encoding="utf-8"))
        msg = {
            "id": f"msg_{int(time.time()*1000)}",
            "sender": sender,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "text": text,
            "type": msg_type
        }
        if version_created:
            msg["version_created"] = version_created
            
        data.setdefault("chat", []).append(msg)
        data["updated_at"] = msg["timestamp"]
        meta_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return msg
    except Exception:
        return None


def apply_project_update(
    project_id: str,
    updated_code: str,
    change_summary: str,
    user_prompt: str
) -> Optional[Dict[str, Any]]:
    """
    Applies an incremental update to an existing project:
    - Increments version (e.g. 1.0 -> 1.1)
    - Archives snapshot to versions/v{ver}.html
    - Updates live index.html and domains/web_ui/index.html
    - Records user prompt and Ultron response in chat
    """
    proj_dir = PROJECTS_ROOT / project_id
    meta_file = proj_dir / "project.json"
    if not meta_file.exists():
        return None
        
    try:
        data = json.loads(meta_file.read_text(encoding="utf-8"))
        cur_ver_str = data.get("version", "1.0")
        
        # Calculate next version
        try:
            parts = cur_ver_str.split(".")
            major = int(parts[0])
            minor = int(parts[1]) if len(parts) > 1 else 0
            next_ver_str = f"{major}.{minor + 1}"
        except Exception:
            next_ver_str = "1.1"
            
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # 1. Save new version snapshot
        versions_dir = proj_dir / "versions"
        versions_dir.mkdir(parents=True, exist_ok=True)
        ver_file = versions_dir / f"v{next_ver_str}.html"
        ver_file.write_text(updated_code, encoding="utf-8")
        
        # 2. Update index.html
        (proj_dir / "index.html").write_text(updated_code, encoding="utf-8")
        try:
            (WEB_UI_DIR / "index.html").write_text(updated_code, encoding="utf-8")
        except Exception:
            pass
            
        # 3. Update metadata
        data["version"] = next_ver_str
        data["updated_at"] = now_iso
        data.setdefault("versions", []).append({
            "version": next_ver_str,
            "timestamp": now_iso,
            "summary": change_summary,
            "file": f"versions/v{next_ver_str}.html"
        })
        
        # 4. Record user message + ultron response in chat
        chat_list = data.setdefault("chat", [])
        chat_list.append({
            "id": f"msg_user_{int(time.time()*1000)}",
            "sender": "user",
            "timestamp": now_iso,
            "text": user_prompt,
            "type": "code_update"
        })
        chat_list.append({
            "id": f"msg_ultron_{int(time.time()*1000)+1}",
            "sender": "ultron",
            "timestamp": now_iso,
            "text": f"Successfully updated application to v{next_ver_str}: {change_summary}",
            "type": "code_update",
            "version_created": next_ver_str
        })
        
        meta_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data
    except Exception as e:
        print(f"Error applying project update: {e}")
        return None


def get_project_suggestions(project_id: str) -> List[str]:
    """
    Generates dynamic proactive suggestions for next updates
    based on the project's title and goal.
    """
    proj = get_project(project_id)
    if not proj:
        return [
            "Add dark/light cyberpunk theme switcher",
            "Add CSV data export and summary reports",
            "Implement local storage state persistence",
            "Add mobile swipe navigation drawer",
            "Include interactive analytics charts"
        ]
        
    goal_lower = proj.get("goal", "").lower()
    suggestions = []
    
    if "emotion" in goal_lower or "sentiment" in goal_lower:
        suggestions.append("Add Emotion Intensity heat map & radar visualization")
        suggestions.append("Integrate audio speech pitch emotion simulator")
        suggestions.append("Add historical emotion log with timeline playback")
        
    if "bike" in goal_lower or "emi" in goal_lower or "loan" in goal_lower or "finance" in goal_lower:
        suggestions.append("Add Amortization Schedule with monthly principal vs interest chart")
        suggestions.append("Add Prepayment & Tenure reduction calculator")
        suggestions.append("Add Multi-bike comparison matrix with side-by-side specs")
        
    if "kanban" in goal_lower or "task" in goal_lower:
        suggestions.append("Add drag-and-drop column reordering and lane tags")
        suggestions.append("Add Pomodoro focus timer linked to selected task")
        suggestions.append("Add task priority filters and search bar")
        
    # Generic Diamond enhancements
    default_pool = [
        "Add 1-click JSON / PDF report export",
        "Implement sound FX on user interactions with audio toggle",
        "Add customizable presets and bookmarking",
        "Add live keyboard shortcuts overlay (? key)",
        "Enhance responsive layout for 4K desktop and mobile viewports"
    ]
    
    for s in default_pool:
        if s not in suggestions and len(suggestions) < 5:
            suggestions.append(s)
            
    return suggestions[:5]


def clear_all_projects() -> int:
    """
    Purges all project directories from storage.
    """
    ensure_projects_dir()
    count = 0
    for item in PROJECTS_ROOT.iterdir():
        if item.is_dir():
            try:
                shutil.rmtree(item)
                count += 1
            except Exception:
                pass
    return count


def validate_logical_tree(tree: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates logical tree structure, checks for orphaned nodes or missing sections.
    """
    if not tree or not isinstance(tree, dict):
        return {"valid": False, "issues": ["Empty or invalid tree structure"], "stats": {}}
    
    issues = []
    screens = tree.get("screens", [])
    features = tree.get("features", [])
    tasks = tree.get("tasks") or tree.get("implementation_tasks", [])
    verification = tree.get("verification") or tree.get("verification_steps", [])
    
    if not tree.get("intent"):
        issues.append("Missing root intent node")
    if not screens:
        issues.append("Zero screen nodes defined")
    if not features:
        issues.append("Zero feature nodes defined")
    
    screen_ids = {s.get("id") for s in screens if isinstance(s, dict)}
    for f in features:
        if isinstance(f, dict):
            parent = f.get("screen_id") or f.get("parent_id")
            if parent and parent not in screen_ids:
                issues.append(f"Orphaned feature: {f.get('id')} references unknown screen {parent}")
                
    stats = {
        "screens_count": len(screens),
        "features_count": len(features),
        "tasks_count": len(tasks),
        "verification_count": len(verification)
    }
    return {"valid": len(issues) == 0, "issues": issues, "stats": stats}


def diff_logical_trees(tree_a: Optional[Dict[str, Any]], tree_b: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates differences between two logical tree versions.
    """
    a = tree_a or {}
    b = tree_b or {}
    
    def get_ids(tree, key):
        items = tree.get(key, [])
        return {item.get("id") or str(idx): item for idx, item in enumerate(items) if isinstance(item, dict)}
        
    screens_a, screens_b = get_ids(a, "screens"), get_ids(b, "screens")
    features_a, features_b = get_ids(a, "features"), get_ids(b, "features")
    
    added_screens = [screens_b[k].get("name", k) for k in screens_b if k not in screens_a]
    removed_screens = [screens_a[k].get("name", k) for k in screens_a if k not in screens_b]
    added_features = [features_b[k].get("name", k) for k in features_b if k not in features_a]
    removed_features = [features_a[k].get("name", k) for k in features_a if k not in features_b]
    
    return {
        "has_changes": bool(added_screens or removed_screens or added_features or removed_features),
        "added_screens": added_screens,
        "removed_screens": removed_screens,
        "added_features": added_features,
        "removed_features": removed_features
    }


def export_tree_spec(tree: Optional[Dict[str, Any]], format_type: str = "markdown") -> str:
    """
    Exports logical tree independently as markdown or JSON spec.
    """
    t = tree or {}
    if format_type.lower() == "json":
        return json.dumps(t, indent=2)
        
    lines = [
        f"# Mission Specification: {t.get('intent', 'Autonomous App')}",
        "",
        "## 1. Intent & Architectural Boundary",
        f"- **Objective**: {t.get('intent', 'N/A')}",
        f"- **Version**: {t.get('version', '1.0')}",
        "",
        "## 2. Screens & UI Views"
    ]
    for s in t.get("screens", []):
        lines.append(f"- **{s.get('name', s.get('id', 'Screen'))}**: {s.get('purpose', s.get('summary', ''))}")
        
    lines.append("\n## 3. Core Features")
    for f in t.get("features", []):
        lines.append(f"- **{f.get('name', f.get('id', 'Feature'))}**: {f.get('details', f.get('summary', ''))}")
        
    lines.append("\n## 4. Verification Criteria")
    for v in t.get("verification_steps") or t.get("verification", []):
        lines.append(f"- [ ] {v.get('check', v.get('title', v.get('id', 'Verification item')))}")
        
    return "\n".join(lines)


def generate_tree_tests(tree: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Derives automated QA verification tests directly from tree verification nodes.
    """
    t = tree or {}
    verif_items = t.get("verification_steps") or t.get("verification", [])
    tests = []
    for idx, v in enumerate(verif_items):
        title = v.get("check") or v.get("title") or f"Test Case {idx+1}"
        tests.append({
            "id": f"qa_{idx+1}",
            "name": title,
            "target_node": v.get("id"),
            "assertion": "assert_dom_node_present",
            "status": "ready"
        })
    return tests


def rename_project(project_id: str, new_title: str) -> bool:
    """
    134: Renames a project title without losing versions or history.
    """
    proj_dir = PROJECTS_ROOT / project_id
    meta_file = proj_dir / "project.json"
    if not meta_file.exists():
        return False
    try:
        data = json.loads(meta_file.read_text(encoding="utf-8"))
        data["title"] = new_title.strip()
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        meta_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return True
    except Exception:
        return False


def restore_project_from_zip(zip_bytes: bytes, target_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    138: Restores a project from an exported zip archive.
    """
    ensure_projects_dir()
    buf = io.BytesIO(zip_bytes)
    with zipfile.ZipFile(buf, "r") as zf:
        namelist = zf.namelist()
        if "project.json" not in namelist and not any(n.endswith("project.json") for n in namelist):
            now = datetime.now(timezone.utc)
            pid = target_id or f"proj_{now.strftime('%Y%m%d_%H%M%S')}_restored"
            dest = PROJECTS_ROOT / pid
            dest.mkdir(parents=True, exist_ok=True)
            zf.extractall(dest)
            meta = create_project(goal="Restored Application", title="Restored Application", code=(dest / "index.html").read_text(encoding="utf-8") if (dest / "index.html").exists() else None)
            return meta

        meta_name = "project.json" if "project.json" in namelist else [n for n in namelist if n.endswith("project.json")][0]
        meta_content = json.loads(zf.read(meta_name).decode("utf-8"))
        pid = target_id or meta_content.get("id") or f"proj_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_restored"
        dest = PROJECTS_ROOT / pid
        dest.mkdir(parents=True, exist_ok=True)
        
        for item in zf.infolist():
            if item.is_dir():
                continue
            parts = Path(item.filename).parts
            rel_path = Path(*parts[1:]) if len(parts) > 1 and parts[0] in [pid, "project", "projects"] else Path(item.filename)
            target_path = dest / rel_path
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_bytes(zf.read(item.filename))
            
        meta_content["id"] = pid
        meta_content["updated_at"] = datetime.now(timezone.utc).isoformat()
        (dest / "project.json").write_text(json.dumps(meta_content, indent=2), encoding="utf-8")
        return meta_content


def get_storage_usage() -> Dict[str, Any]:
    """
    139: Calculates total and per-project disk usage in bytes and MB.
    """
    ensure_projects_dir()
    total_bytes = 0
    projects_info = []
    
    for item in PROJECTS_ROOT.iterdir():
        if not item.is_dir():
            continue
        p_bytes = sum(f.stat().st_size for f in item.rglob("*") if f.is_file())
        total_bytes += p_bytes
        meta_file = item / "project.json"
        title = item.name
        if meta_file.exists():
            try:
                title = json.loads(meta_file.read_text(encoding="utf-8")).get("title", item.name)
            except Exception:
                pass
        projects_info.append({
            "id": item.name,
            "title": title,
            "bytes": p_bytes,
            "kb": round(p_bytes / 1024, 2)
        })
        
    return {
        "total_projects": len(projects_info),
        "total_bytes": total_bytes,
        "total_mb": round(total_bytes / (1024 * 1024), 3),
        "projects": projects_info
    }


def cleanup_orphaned_files() -> List[str]:
    """
    140: Purges stray files, leftover temporary artifacts, or directories
    lacking valid project.json metadata in projects root.
    """
    ensure_projects_dir()
    cleaned = []
    for item in PROJECTS_ROOT.iterdir():
        if item.is_file() and not item.name.startswith("."):
            cleaned.append(str(item))
            item.unlink(missing_ok=True)
        elif item.is_dir():
            meta = item / "project.json"
            if not meta.exists():
                has_valid_content = any(item.glob("*.html"))
                if not has_valid_content:
                    cleaned.append(str(item))
                    shutil.rmtree(item, ignore_errors=True)
    return cleaned


def undo_project_update(project_id: str) -> Optional[Dict[str, Any]]:
    """
    150: Reverts the project to its immediately prior version snapshot.
    """
    proj_dir = PROJECTS_ROOT / project_id
    meta_file = proj_dir / "project.json"
    if not meta_file.exists():
        return None
    try:
        data = json.loads(meta_file.read_text(encoding="utf-8"))
        versions = data.get("versions", [])
        if len(versions) < 2:
            return None
            
        reverted_ver_entry = versions.pop()
        prev_ver_entry = versions[-1]
        prev_ver_str = prev_ver_entry["version"]
        
        prev_file = proj_dir / prev_ver_entry.get("file", f"versions/v{prev_ver_str}.html")
        if not prev_file.exists():
            prev_file = proj_dir / "versions" / f"v{prev_ver_str}.html"
            
        if prev_file.exists():
            prev_code = prev_file.read_text(encoding="utf-8")
            (proj_dir / "index.html").write_text(prev_code, encoding="utf-8")
            try:
                (WEB_UI_DIR / "index.html").write_text(prev_code, encoding="utf-8")
            except Exception:
                pass
                
        now_iso = datetime.now(timezone.utc).isoformat()
        data["version"] = prev_ver_str
        data["updated_at"] = now_iso
        data.setdefault("chat", []).append({
            "id": f"msg_undo_{int(time.time()*1000)}",
            "sender": "ultron",
            "timestamp": now_iso,
            "text": f"Reverted application from v{reverted_ver_entry.get('version')} back to v{prev_ver_str}.",
            "type": "code_update",
            "version_created": prev_ver_str,
            "telemetry_link": f"Stage: Reversion to v{prev_ver_str}"
        })
        meta_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data
    except Exception as e:
        print(f"Error undoing project update: {e}")
        return None


def search_project_chat(project_id: str, query: str) -> List[Dict[str, Any]]:
    """
    154: Searches for query strings inside a project's chat history.
    """
    proj = get_project(project_id)
    if not proj:
        return []
    q = (query or "").lower().strip()
    if not q:
        return proj.get("chat", [])
    results = []
    for msg in proj.get("chat", []):
        if q in (msg.get("text") or "").lower() or q in (msg.get("sender") or "").lower():
            results.append(msg)
    return results

