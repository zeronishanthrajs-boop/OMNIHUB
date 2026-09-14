import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import time
import uuid
import zipfile
import io
from fastapi.testclient import TestClient
import project_manager as pm
from dashboard import app

client = TestClient(app)

def run_tests():
    print("=== Testing Items 166-180: API Reference / Backend ===")
    
    # 166: GET / — serves the Command Deck HUD
    r166 = client.get("/")
    assert r166.status_code == 200, f"Item 166 failed: {r166.status_code}"
    assert "text/html" in r166.headers["content-type"]
    assert "Antigravity" in r166.text or "ULTRON" in r166.text
    print("[PASS] 166. GET / serves Command Deck HUD")

    # 167: GET /api/state — current LangGraph execution state
    r167 = client.get("/api/state")
    assert r167.status_code == 200, f"Item 167 failed: {r167.status_code}"
    state = r167.json()
    assert "is_running" in state and "status_code" in state
    print(f"[PASS] 167. GET /api/state returns state (status_code: {state['status_code']})")

    # 168: POST /api/run — triggers a new 4-agent execution with a goal
    unique_goal = f"Synthesize quantum metric tensor dashboard {uuid.uuid4().hex[:6]}"
    r168 = client.post("/api/run", json={"goal": unique_goal, "mock": True})
    assert r168.status_code == 200, f"Item 168 failed: {r168.status_code}"
    res168 = r168.json()
    assert res168.get("status") in ["success", "ok"]
    print(f"[PASS] 168. POST /api/run successfully launched execution for: {unique_goal}")

    # 169: POST /api/reset — aborts active run and resets to idle
    r169 = client.post("/api/reset")
    assert r169.status_code == 200, f"Item 169 failed: {r169.status_code}"
    res169 = r169.json()
    assert res169.get("status") == "ok"
    r167_check = client.get("/api/state").json()
    assert r167_check["is_running"] is False
    print("[PASS] 169. POST /api/reset successfully resets execution to idle")

    # 170: GET /api/tree — returns the latest logical_tree artifact
    r170 = client.get("/api/tree")
    assert r170.status_code == 200, f"Item 170 failed: {r170.status_code}"
    tree_data = r170.json()
    assert "tree" in tree_data and "worker_tasks" in tree_data
    print("[PASS] 170. GET /api/tree returns logical tree structure")

    # 171: GET /api/rules — retrieves active governance rules
    r171 = client.get("/api/rules")
    assert r171.status_code == 200, f"Item 171 failed: {r171.status_code}"
    rules_data = r171.json()
    assert "core" in rules_data or "added" in rules_data
    print(f"[PASS] 171. GET /api/rules returns rules: {len(rules_data.get('core', []))} core rules")

    # 172: POST /api/rules/add — adds and validates a new custom rule
    unique_rule = f"Mandate cryptographic signature checks for module {uuid.uuid4().hex[:6]}"
    r172 = client.post("/api/rules/add", json={"text": unique_rule, "mock": True})
    assert r172.status_code == 200, f"Item 172 failed: {r172.status_code}"
    rule_res = r172.json()
    assert rule_res.get("status") == "ok" and "rule" in rule_res
    print(f"[PASS] 172. POST /api/rules/add added rule: {rule_res['rule']['id']}")

    # 173: GET /api/logs — real-time reasoning/execution logs
    r173 = client.get("/api/logs")
    assert r173.status_code == 200, f"Item 173 failed: {r173.status_code}"
    logs = r173.json()
    assert isinstance(logs, list)
    print(f"[PASS] 173. GET /api/logs returns execution logs ({len(logs)} entries)")

    # 174: GET /api/projects — lists all projects with metadata and countdowns
    r174 = client.get("/api/projects")
    assert r174.status_code == 200, f"Item 174 failed: {r174.status_code}"
    projects = r174.json()
    assert isinstance(projects, list)
    print(f"[PASS] 174. GET /api/projects lists projects ({len(projects)} total)")

    # 175: POST /api/projects/save-all — marks every project permanent
    r175 = client.post("/api/projects/save-all")
    assert r175.status_code == 200, f"Item 175 failed: {r175.status_code}"
    save_all_res = r175.json()
    assert save_all_res.get("status") == "ok"
    print(f"[PASS] 175. POST /api/projects/save-all marked {save_all_res.get('count')} projects permanent")

    # 176: GET /api/projects/export-all — downloads the master ZIP
    r176 = client.get("/api/projects/export-all")
    assert r176.status_code == 200, f"Item 176 failed: {r176.status_code}"
    assert "application/zip" in r176.headers["content-type"]
    with zipfile.ZipFile(io.BytesIO(r176.content)) as z:
        print(f"[PASS] 176. GET /api/projects/export-all returns valid ZIP ({len(z.namelist())} files in archive)")

    # Create a dedicated temporary project for testing 177, 178, 179, 180
    test_proj = pm.create_project(
        goal=f"API Test Project {uuid.uuid4().hex[:6]}",
        logical_tree={"goal": "Test API"},
        code="<!DOCTYPE html><html><body><h1>API Test</h1></body></html>"
    )
    p_id = test_proj["id"]

    # 177: GET /api/projects/{id} — full project detail, code, tree, and chat history
    r177 = client.get(f"/api/projects/{p_id}")
    assert r177.status_code == 200, f"Item 177 failed: {r177.status_code}"
    proj_detail = r177.json()
    assert proj_detail["id"] == p_id and "code" in proj_detail and "chat" in proj_detail
    print(f"[PASS] 177. GET /api/projects/{p_id} returns full project details")

    # 178: POST /api/projects/{id}/save — toggles permanent retention
    r178 = client.post(f"/api/projects/{p_id}/save")
    assert r178.status_code == 200, f"Item 178 failed: {r178.status_code}"
    save_res = r178.json()
    assert save_res.get("status") == "ok" and "is_permanent" in save_res
    print(f"[PASS] 178. POST /api/projects/{p_id}/save toggled permanent status to {save_res['is_permanent']}")

    # 180: POST /api/projects/{id}/chat — submits a revision prompt and evolves code
    chat_prompt = f"Add telemetry diagnostic sensor panel {uuid.uuid4().hex[:4]}"
    r180 = client.post(f"/api/projects/{p_id}/chat", json={"prompt": chat_prompt, "mock": True})
    assert r180.status_code == 200, f"Item 180 failed: {r180.status_code}"
    chat_res = r180.json()
    assert chat_res.get("status") == "ok"
    print(f"[PASS] 180. POST /api/projects/{p_id}/chat evolved project with response type: {chat_res.get('type')}")

    # 179: DELETE /api/projects/{id} — permanently deletes a project
    r179 = client.delete(f"/api/projects/{p_id}")
    assert r179.status_code == 200, f"Item 179 failed: {r179.status_code}"
    del_res = r179.json()
    assert del_res.get("status") == "ok"
    print(f"[PASS] 179. DELETE /api/projects/{p_id} deleted project successfully")

    print("\nALL ITEMS 166-180 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
