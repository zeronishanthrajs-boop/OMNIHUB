import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from dashboard import app
import project_manager as pm

def test():
    client = TestClient(app)
    # Get any project or create one
    projects = pm.list_projects()
    if not projects:
        meta = pm.save_current_workspace(goal="PDF Studio & Invoice System", is_permanent=True)
        pid = meta["id"]
    else:
        pid = projects[0]["id"]

    print(f"Testing live Ollama chatbot dialogue on project: {pid}")

    print("\nSending prompt: 'why this app is used' (mock=False)...")
    res = client.post(f"/api/projects/{pid}/chat", json={"prompt": "why this app is used", "mock": False})
    print("Status code:", res.status_code)
    data = res.json()
    print("Response type:", data.get("type"))
    print("\n--- OLLAMA CHATBOT REPLY ---")
    print(data.get("reply"))
    print("----------------------------\n")
    assert data.get("type") == "chat"
    assert "Hello! I'm ULTRON. How can I assist" not in data.get("reply"), "Should NOT be fallback!"

if __name__ == "__main__":
    test()
