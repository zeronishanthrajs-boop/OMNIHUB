import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from dashboard import app

client = TestClient(app)

print("1. Testing GET / (Antigravity Dashboard UI)...")
res = client.get("/")
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
html = res.text
assert "Antigravity" in html, "Antigravity title missing in HTML"
assert "New Conversation" in html, "New Conversation missing"
assert "Ask anything, @ to mention, / for actions" in html, "Prompt placeholder missing"
assert "ULTRON" in html, "ULTRON model selector missing"
assert "Conversation History" in html, "History link missing"
assert "Scheduled Tasks" in html, "Scheduled tasks link missing"
print("[OK] GET / passed! UI contains all Antigravity elements.")

print("\n2. Testing GET /api/projects...")
res = client.get("/api/projects")
assert res.status_code == 200
projects = res.json()
print(f"[OK] GET /api/projects returned {len(projects)} projects.")
if len(projects) > 0:
    p0 = projects[0]
    print(f"Sample project: id={p0.get('id')}, folder={p0.get('folder')}, relative_time={p0.get('relative_time_str')}")
    assert "relative_time_str" in p0, "relative_time_str missing"
    assert "folder" in p0, "folder missing"

print("\n3. Testing GET /api/engine...")
res = client.get("/api/engine")
assert res.status_code == 200
engine_data = res.json()
print("[OK] GET /api/engine:", engine_data)

print("\n4. Testing GET /api/state...")
res = client.get("/api/state")
assert res.status_code == 200
state_data = res.json()
print("[OK] GET /api/state:", state_data.get("status"))

print("\n5. Testing GET /api/rules...")
res = client.get("/api/rules")
assert res.status_code == 200
rules_data = res.json()
print(f"[OK] GET /api/rules: {len(rules_data.get('core', []))} core rules.")

print("\nALL VERIFICATION CHECKS PASSED!")
