"""
ULTRON Collaboration & Multi-User Engine (Items 261-272)
Provides multi-user RBAC, project ownership, share links, inline commenting,
concurrent edit locking, activity feeds, team templates, notifications, and quotas.
"""

import os
import sys
import time
import json
import uuid
from typing import Dict, List, Any, Optional, Tuple

COLLAB_DATA_FILE = "collaboration_data.json"

class CollaborationEngine:
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {
            "admin": {"username": "admin", "role": "admin", "name": "Lead Architect"},
            "operator": {"username": "operator", "role": "operator", "name": "Mission Operator"},
            "collaborator": {"username": "collaborator", "role": "editor", "name": "Peer Engineer"}
        }
        self.project_ownership: Dict[str, str] = {} # proj_id -> username
        self.share_links: Dict[str, Dict[str, Any]] = {} # share_token -> metadata
        self.comments: Dict[str, List[Dict[str, Any]]] = {} # proj_id -> list of comments
        self.active_editors: Dict[str, Dict[str, float]] = {} # proj_id -> {username: last_ping}
        self.activity_feed: List[Dict[str, Any]] = []
        self.templates: Dict[str, Dict[str, Any]] = {}
        self.notifications: Dict[str, List[Dict[str, Any]]] = {}
        self.team_quota_mb: float = 5000.0 # 5GB team quota

    # 261: Multi-user support
    def create_user(self, username: str, role: str = "editor", name: str = "") -> Dict[str, Any]:
        user = {"username": username, "role": role, "name": name or username, "created_at": time.time()}
        self.users[username] = user
        self.log_activity("USER_JOINED", username, f"Added team member {name or username} ({role})")
        return user

    def list_users(self) -> List[Dict[str, Any]]:
        return list(self.users.values())

    # 262: Per-user project ownership and visibility
    def set_project_owner(self, project_id: str, username: str):
        self.project_ownership[project_id] = username

    def get_project_owner(self, project_id: str) -> str:
        return self.project_ownership.get(project_id, "admin")

    # 263: Shareable read-only project links
    def create_share_link(self, project_id: str, ttl_hours: int = 48) -> str:
        token = f"share_{uuid.uuid4().hex[:12]}"
        self.share_links[token] = {
            "token": token,
            "project_id": project_id,
            "created_at": time.time(),
            "expires_at": time.time() + (ttl_hours * 3600),
            "access_level": "read_only"
        }
        return token

    def resolve_share_link(self, token: str) -> Optional[str]:
        data = self.share_links.get(token)
        if not data or time.time() > data["expires_at"]:
            return None
        return data["project_id"]

    # 264: Node/line commenting
    def add_comment(self, project_id: str, author: str, text: str, node_id: Optional[str] = None, line_number: Optional[int] = None) -> Dict[str, Any]:
        comment = {
            "id": f"comm_{uuid.uuid4().hex[:6]}",
            "author": author,
            "text": text,
            "node_id": node_id,
            "line_number": line_number,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.comments.setdefault(project_id, []).append(comment)
        self.notify_teammates(project_id, author, f"New comment on {project_id}: '{text[:40]}...'")
        return comment

    def get_comments(self, project_id: str) -> List[Dict[str, Any]]:
        return self.comments.get(project_id, [])

    # 265: Concurrent-edit awareness
    def ping_editor(self, project_id: str, username: str) -> Tuple[bool, List[str]]:
        now = time.time()
        self.active_editors.setdefault(project_id, {})[username] = now
        # Clean expired editors (> 30s inactive)
        active = [u for u, ts in self.active_editors[project_id].items() if now - ts < 30.0]
        has_conflict = len(active) > 1
        other_editors = [u for u in active if u != username]
        return has_conflict, other_editors

    # 266: Activity feed
    def log_activity(self, action: str, user: str, details: str):
        entry = {
            "id": f"act_{uuid.uuid4().hex[:6]}",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": action,
            "user": user,
            "details": details
        }
        self.activity_feed.append(entry)
        if len(self.activity_feed) > 100:
            self.activity_feed.pop(0)

    def get_activity_feed(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.activity_feed[-limit:][::-1]

    # 267: Team-wide vs personal rule overrides
    def get_effective_rules(self, base_rules: List[Dict[str, Any]], user_overrides: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        combined = list(base_rules)
        if user_overrides:
            combined.extend(user_overrides)
        return combined

    # 268: Invite/permission management
    def invite_team_member(self, email: str, role: str = "editor") -> str:
        invite_code = f"INV-{uuid.uuid4().hex[:8].upper()}"
        self.log_activity("USER_INVITED", "admin", f"Invited {email} with role {role}")
        return invite_code

    # 269: Shareable project templates
    def create_template(self, project_id: str, title: str, code: str) -> str:
        tmpl_id = f"tmpl_{uuid.uuid4().hex[:6]}"
        self.templates[tmpl_id] = {
            "id": tmpl_id,
            "title": title,
            "source_project_id": project_id,
            "code": code,
            "created_at": time.time()
        }
        self.log_activity("TEMPLATE_CREATED", "operator", f"Published template: '{title}'")
        return tmpl_id

    def list_templates(self) -> List[Dict[str, Any]]:
        return list(self.templates.values())

    # 270: Cross-project search
    def cross_project_search(self, query: str) -> List[Dict[str, Any]]:
        import project_manager as pm
        all_projs = pm.list_projects()
        q_lower = query.lower()
        results = []
        for p in all_projs:
            if q_lower in p.get("title", "").lower() or q_lower in p.get("goal", "").lower():
                results.append(p)
        return results

    # 271: Teammate-update notifications
    def notify_teammates(self, project_id: str, actor: str, message: str):
        owner = self.get_project_owner(project_id)
        recipients = [u for u in self.users if u != actor]
        entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "actor": actor,
            "project_id": project_id,
            "message": message
        }
        for u in recipients:
            self.notifications.setdefault(u, []).append(entry)

    def get_notifications(self, username: str) -> List[Dict[str, Any]]:
        return self.notifications.get(username, [])

    # 272: Team usage/storage quota visibility
    def get_team_quota_visibility(self) -> Dict[str, Any]:
        import project_manager as pm
        storage = pm.get_storage_usage()
        used_mb = storage.get("storage_mb", 0.5)
        return {
            "used_storage_mb": used_mb,
            "team_quota_mb": self.team_quota_mb,
            "quota_usage_percent": round((used_mb / self.team_quota_mb) * 100, 2),
            "total_users": len(self.users),
            "quota_status": "NORMAL" if used_mb < self.team_quota_mb else "EXCEEDED"
        }

collab = CollaborationEngine()
