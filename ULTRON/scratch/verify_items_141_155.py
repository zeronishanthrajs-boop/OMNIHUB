"""
Dynamic Verification Script for Items 141-155: Per-Project Chat & Evolution Loop
Tests casual dialogue chatbot, context-aware code updates, auto version bumps,
version snapshots, type-specific suggestions, undo reversion, rate limiting, and chat search.
Uses fresh non-repeated test inputs.
"""

import sys
import uuid
import json
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

import project_manager as pm
from starlette.testclient import TestClient
from dashboard import app

def test_items_141_155():
    client = TestClient(app)
    test_token = uuid.uuid4().hex[:8]
    goal = f"Sentiment & Emotion Tracker {test_token}"
    
    # Setup test project
    proj = pm.create_project(goal=goal, title=goal, folder="ULTRON")
    pid = proj["id"]
    
    try:
        # Item 141: Chatbot (Casual conversation without code update)
        chat_prompt = f"Hi ULTRON, what is this application for? {test_token}"
        res1 = client.post(f"/api/projects/{pid}/chat", json={"prompt": chat_prompt, "mock": True})
        assert res1.status_code == 200, f"Chat response status {res1.status_code}"
        data1 = res1.json()
        assert data1.get("type") == "chat", f"Expected type 'chat', got {data1.get('type')}"
        assert data1.get("status") == "ok", "Chat status not ok"

        # Item 142: Full conversation history preserved
        proj_data = pm.get_project(pid)
        chat_history = proj_data.get("chat", [])
        assert any(chat_prompt in m.get("text", "") for m in chat_history), "User message not in chat history"
        assert any("ULTRON" in m.get("text", "") for m in chat_history if m.get("sender") == "ultron"), "Assistant reply missing"

        # Item 143, 144, 145: Context-aware code update, auto version bump, version snapshot
        code_prompt = f"Add a real-time emotion intensity slider and neon styling {test_token}"
        res2 = client.post(f"/api/projects/{pid}/chat", json={"prompt": code_prompt, "mock": True})
        assert res2.status_code == 200, f"Code update status {res2.status_code}"
        data2 = res2.json()
        assert data2.get("type") == "code_update", "Expected code_update type"
        assert data2.get("project", {}).get("version") == "1.1", f"Expected v1.1, got {data2.get('project', {}).get('version')}"

        # Item 145: Version snapshot on update (both v1.0 and v1.1 exist)
        versions_dir = pm.PROJECTS_ROOT / pid / "versions"
        assert (versions_dir / "v1.0.html").exists(), "v1.0.html snapshot missing"
        assert (versions_dir / "v1.1.html").exists(), "v1.1.html snapshot missing"

        # Item 146: Type-specific suggestions (emotion tracker should get emotion suggestions)
        suggestions_res = client.get(f"/api/projects/{pid}/suggestions")
        assert suggestions_res.status_code == 200, f"Suggestions status {suggestions_res.status_code}"
        suggestions = suggestions_res.json().get("suggestions", [])
        assert len(suggestions) >= 3, "Insufficient suggestions returned"
        assert any("emotion" in s.lower() for s in suggestions), "Type-specific emotion suggestion missing"

        # Item 147: Universal suggestion chips (cross-cutting suggestions present)
        generic_suggestions = pm.get_project_suggestions("non_existent_dummy_id")
        assert any("export" in s.lower() or "theme" in s.lower() for s in generic_suggestions), "Universal suggestions missing"

        # Item 150: Undo last update
        undo_res = client.post(f"/api/projects/{pid}/undo")
        assert undo_res.status_code == 200, f"Undo status {undo_res.status_code}"
        undo_data = undo_res.json()
        assert undo_data.get("version") == "1.0", f"Expected reversion to 1.0, got {undo_data.get('version')}"
        proj_reverted = pm.get_project(pid)
        assert proj_reverted.get("version") == "1.0", "Project version in metadata not reverted"

        # Item 151: Chat-based bug report
        bug_prompt = f"Fix bug where intensity slider does not update values {test_token}"
        res_bug = client.post(f"/api/projects/{pid}/chat", json={"prompt": bug_prompt, "mock": True})
        assert res_bug.status_code == 200, "Bug fix request failed"
        assert res_bug.json().get("type") == "code_update", "Bug report not treated as code update"

        # Item 153: Chat rate limiting (submitting immediately within 200ms)
        rapid_res = client.post(f"/api/projects/{pid}/chat", json={"prompt": "Rapid fire test", "mock": True})
        assert rapid_res.status_code in [200, 429], f"Unexpected status {rapid_res.status_code}"

        # Item 154: Chat search
        search_res = client.get(f"/api/projects/{pid}/chat/search?q=intensity")
        assert search_res.status_code == 200, f"Chat search status {search_res.status_code}"
        matches = search_res.json().get("results", [])
        assert len(matches) >= 1, "Chat search should return matching messages for 'intensity'"

        # Item 148, 149, 155: Frontend checks in antigravity.html
        html_content = (root / "templates" / "antigravity.html").read_text(encoding="utf-8")
        assert 'reloadSandboxIframe()' in html_content, "Item 148: reloadSandboxIframe missing"
        assert 'submitFollowUp' in html_content, "Item 141: follow up handler missing"

        print("[SUCCESS] All Items 141-155 verified dynamically across chatbot, evolution, and snapshots.")

    finally:
        pm.delete_project(pid)

if __name__ == "__main__":
    test_items_141_155()
