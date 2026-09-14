import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from dashboard import app
import project_manager as pm

def test():
    client = TestClient(app)
    
    # Ensure there is an active project
    meta = pm.save_current_workspace(goal="Test PDF Studio App", is_permanent=False)
    pid = meta["id"]
    print(f"Testing with project: {pid} (Initial version: {meta.get('version', '1.0')})")

    # 1. Test conversational greeting
    print("\n1. Testing conversational greeting: 'hi ultron'...")
    res = client.post(f"/api/projects/{pid}/chat", json={"prompt": "hi ultron", "mock": True})
    assert res.status_code == 200, f"Chat failed: {res.text}"
    d = res.json()
    print("   Response type:", d.get("type"))
    print("   Reply:", d.get("reply"))
    assert d.get("type") == "chat", f"Expected type 'chat', got {d.get('type')}"
    assert d["project"]["version"] == "1.0", f"Version should NOT increment on chat! Got {d['project']['version']}"
    print("   [OK] Chat greeting handled conversationally without code change.")

    # 2. Test informational question
    print("\n2. Testing informational question: 'what features does this app have?'...")
    res = client.post(f"/api/projects/{pid}/chat", json={"prompt": "what features does this app have?", "mock": True})
    assert res.status_code == 200
    d = res.json()
    assert d.get("type") == "chat", f"Expected type 'chat', got {d.get('type')}"
    assert d["project"]["version"] == "1.0", f"Version should NOT increment! Got {d['project']['version']}"
    print("   [OK] Question answered conversationally.")

    # 3. Test code modification
    print("\n3. Testing code update: 'add a dark mode button'...")
    res = client.post(f"/api/projects/{pid}/chat", json={"prompt": "add a dark mode button", "mock": True})
    assert res.status_code == 200
    d = res.json()
    print("   Response type:", d.get("type"))
    print("   Summary:", d.get("summary"))
    print("   New Version:", d["project"]["version"])
    assert d.get("type") == "code_update", f"Expected type 'code_update', got {d.get('type')}"
    assert d["project"]["version"] == "1.1", f"Version should increment to 1.1! Got {d['project']['version']}"
    print("   [OK] Code modification correctly evolved app to v1.1.")

    print("\nALL CHATBOT & EVOLUTION FLOW TESTS PASSED!")

if __name__ == "__main__":
    test()
