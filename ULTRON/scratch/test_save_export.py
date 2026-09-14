import sys
sys.path.insert(0, ".")
from fastapi.testclient import TestClient
from dashboard import app
import project_manager as pm
import zipfile
import io

def run_tests():
    client = TestClient(app)
    
    print("1. Testing GET /api/projects/export-current...")
    r = client.get("/api/projects/export-current")
    assert r.status_code == 200, f"export-current failed: {r.status_code}"
    assert "application/zip" in r.headers.get("content-type", "")
    zf = zipfile.ZipFile(io.BytesIO(r.content))
    namelist = zf.namelist()
    print(f"   [OK] Received zip with {len(namelist)} files: {namelist[:5]}")
    assert any("index.html" in n for n in namelist), "index.html not found in exported zip"

    print("2. Testing POST /api/projects/save-current...")
    r = client.post("/api/projects/save-current")
    assert r.status_code == 200, f"save-current failed: {r.status_code}"
    data = r.json()
    assert data["status"] == "ok"
    assert data["is_permanent"] is True
    pid = data["project_id"]
    print(f"   [OK] Saved current workspace as project: {pid}")

    print(f"3. Testing GET /api/projects/{pid}/export...")
    r = client.get(f"/api/projects/{pid}/export")
    assert r.status_code == 200, f"project export failed: {r.status_code}"
    assert "application/zip" in r.headers.get("content-type", "")
    zf = zipfile.ZipFile(io.BytesIO(r.content))
    print(f"   [OK] Exported project zip with {len(zf.namelist())} files.")

    print(f"4. Testing POST /api/projects/{pid}/save (toggle)...")
    r = client.post(f"/api/projects/{pid}/save")
    assert r.status_code == 200
    d = r.json()
    print(f"   [OK] Save toggle: is_permanent={d['is_permanent']}")

    print("5. Testing GET /api/projects/export-all...")
    r = client.get("/api/projects/export-all")
    assert r.status_code == 200
    zf = zipfile.ZipFile(io.BytesIO(r.content))
    print(f"   [OK] Master export all zip contains {len(zf.namelist())} files.")

    print("6. Testing fallback export on non-existent project id...")
    r = client.get("/api/projects/non_existent_fake_id_123/export")
    assert r.status_code == 200, f"Fallback export failed: {r.status_code}"
    assert "application/zip" in r.headers.get("content-type", "")
    print("   [OK] Non-existent project id cleanly fell back to current workspace zip.")

    print("7. Testing fallback save on non-existent project id...")
    r = client.post("/api/projects/non_existent_fake_id_123/save")
    assert r.status_code == 200, f"Fallback save failed: {r.status_code}"
    print("   [OK] Non-existent project id cleanly saved current workspace.")

    print("\nALL SAVE & EXPORT INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
