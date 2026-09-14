"""
End-to-end API test for dashboard.py and project management endpoints
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from dashboard import app
import project_manager as pm

def test_api():
    client = TestClient(app)
    
    # 1. Test GET /
    res = client.get("/")
    assert res.status_code == 200
    assert "ULTRON" in res.text
    assert "PROJECTS DIRECTORY" in res.text
    print("GET / passed (Holographic UI loaded).")
    
    # 2. Test GET /api/projects
    res = client.get("/api/projects")
    assert res.status_code == 200
    projects = res.json()
    print(f"GET /api/projects returned {len(projects)} projects.")
    
    # 3. Create a test project through project_manager
    p = pm.create_project(
        goal="Test Emotion Matrix with Bike EMI",
        title="Emotion AI & Bike EMI",
        code="<!DOCTYPE html><html><body><h1>Emotion Matrix</h1></body></html>"
    )
    pid = p["id"]
    print(f"Created project {pid}")
    
    # 4. Test GET /api/projects/{id}
    res = client.get(f"/api/projects/{pid}")
    assert res.status_code == 200
    p_data = res.json()
    assert p_data["title"] == "Emotion AI & Bike EMI"
    assert "Emotion Matrix" in p_data["code"]
    print("GET /api/projects/{id} passed.")
    
    # 5. Test POST /api/projects/{id}/save
    res = client.post(f"/api/projects/{pid}/save")
    assert res.status_code == 200
    save_data = res.json()
    assert save_data["is_permanent"] is True
    print("POST /api/projects/{id}/save passed (Marked Permanent).")
    
    # 6. Test GET /api/projects/{id}/export (ZIP download)
    res = client.get(f"/api/projects/{pid}/export")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    assert len(res.content) > 0
    print(f"GET /api/projects/{id}/export passed ({len(res.content)} bytes).")
    
    # 7. Test GET /api/projects/export-all (Master ZIP)
    res = client.get("/api/projects/export-all")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    assert len(res.content) > 0
    print(f"GET /api/projects/export-all passed ({len(res.content)} bytes).")
    
    # 8. Test GET /api/projects/{id}/suggestions
    res = client.get(f"/api/projects/{pid}/suggestions")
    assert res.status_code == 200
    sugg_data = res.json()
    assert len(sugg_data["suggestions"]) > 0
    print(f"GET suggestions passed: {sugg_data['suggestions'][:2]}")
    
    # 9. Test POST /api/projects/{id}/chat (Mock mode update)
    res = client.post(f"/api/projects/{pid}/chat", json={
        "prompt": "Add amortization schedule table",
        "mock": True
    })
    assert res.status_code == 200
    chat_resp = res.json()
    updated_p = chat_resp["project"]
    assert updated_p["version"] == "1.1"
    assert len(updated_p["versions"]) == 2
    assert len(updated_p["chat"]) >= 3
    print(f"POST chat passed (Incremented to v{updated_p['version']}).")
    
    # 10. Test GET /projects/{id}/app
    res = client.get(f"/projects/{pid}/app")
    assert res.status_code == 200
    assert "Emotion Matrix" in res.text
    print("GET /projects/{id}/app passed.")
    
    # 11. Clean up
    pm.delete_project(pid)
    print("Cleaned up test project. ALL API TESTS PASSED!")

if __name__ == "__main__":
    test_api()
