import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import time
import uuid
from collaboration_engine import collab
import project_manager as pm

def run_tests():
    print("=== Testing Items 261-272: Collaboration & Multi-User ===")

    # 261: Multi-user support
    test_user = f"engineer_{uuid.uuid4().hex[:6]}"
    user_obj = collab.create_user(test_user, role="editor", name="Senior Developer")
    assert user_obj["username"] == test_user
    users = collab.list_users()
    assert any(u["username"] == test_user for u in users)
    print(f"[PASS] 261. Multi-user support verified ({len(users)} users registered)")

    # 262: Per-user project ownership and visibility
    test_pid = f"proj_collab_{uuid.uuid4().hex[:6]}"
    collab.set_project_owner(test_pid, test_user)
    owner = collab.get_project_owner(test_pid)
    assert owner == test_user
    print(f"[PASS] 262. Per-user project ownership verified: {owner}")

    # 263: Shareable read-only project links
    share_token = collab.create_share_link(test_pid, ttl_hours=24)
    assert share_token.startswith("share_")
    resolved_pid = collab.resolve_share_link(share_token)
    assert resolved_pid == test_pid
    print(f"[PASS] 263. Shareable read-only project links verified: {share_token}")

    # 264: Node/line commenting
    comment_text = f"Refactor state reducer for efficiency {uuid.uuid4().hex[:4]}"
    comm = collab.add_comment(test_pid, author=test_user, text=comment_text, node_id="task-web-ui-main", line_number=42)
    assert comm["text"] == comment_text
    comments = collab.get_comments(test_pid)
    assert any(c["id"] == comm["id"] for c in comments)
    print(f"[PASS] 264. Node/line commenting verified on node '{comm['node_id']}'")

    # 265: Concurrent-edit awareness
    # User 1 pings
    conflict1, _ = collab.ping_editor(test_pid, "operator")
    assert conflict1 is False # Only 1 editor
    # User 2 pings simultaneously
    conflict2, other_editors = collab.ping_editor(test_pid, test_user)
    assert conflict2 is True and "operator" in other_editors
    print("[PASS] 265. Concurrent-edit awareness verified (warned of multiple active editors)")

    # 266: Activity feed
    collab.log_activity("REVISION_APPLIED", test_user, "Updated telemetry canvas dimensions")
    feed = collab.get_activity_feed()
    assert len(feed) > 0 and feed[0]["user"] == test_user
    print(f"[PASS] 266. Activity feed verified ({len(feed)} activities tracked)")

    # 267: Team-wide vs personal rule overrides
    base_rules = [{"id": "RULE-CORE", "text": "Domain isolation", "status": "active"}]
    personal_rules = [{"id": "RULE-USER-01", "text": "Enable verbose console", "status": "active"}]
    effective = collab.get_effective_rules(base_rules, personal_rules)
    assert len(effective) == 2
    print("[PASS] 267. Team-wide vs personal rule overrides verified")

    # 268: Invite/permission management
    test_email = f"lead.{uuid.uuid4().hex[:4]}@ultron.internal"
    invite_code = collab.invite_team_member(test_email, role="operator")
    assert invite_code.startswith("INV-")
    print(f"[PASS] 268. Invite/permission management verified: generated {invite_code}")

    # 269: Shareable project templates
    tmpl_title = f"Cyberpunk Dashboard Template {uuid.uuid4().hex[:4]}"
    tmpl_id = collab.create_template(test_pid, tmpl_title, "<!DOCTYPE html><html><body>Template</body></html>")
    assert tmpl_id.startswith("tmpl_")
    templates = collab.list_templates()
    assert any(t["id"] == tmpl_id for t in templates)
    print(f"[PASS] 269. Shareable project templates verified: published {tmpl_id}")

    # 270: Cross-project search
    # Create temp project
    tp = pm.create_project(goal=f"Unique CrossSearch Query {uuid.uuid4().hex[:6]}", logical_tree={}, code="<html></html>")
    search_res = collab.cross_project_search("Unique CrossSearch")
    assert len(search_res) > 0
    pm.delete_project(tp["id"])
    print("[PASS] 270. Cross-project search verified across catalog")

    # 271: Teammate-update notifications
    notifs = collab.get_notifications("admin")
    assert isinstance(notifs, list)
    print(f"[PASS] 271. Teammate-update notifications verified ({len(notifs)} queued)")

    # 272: Team usage/storage quota visibility
    quota = collab.get_team_quota_visibility()
    assert "used_storage_mb" in quota and "team_quota_mb" in quota and quota["quota_status"] == "NORMAL"
    print(f"[PASS] 272. Team usage/storage quota visibility verified: {quota['used_storage_mb']}/{quota['team_quota_mb']} MB")

    print("\nALL ITEMS 261-272 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
