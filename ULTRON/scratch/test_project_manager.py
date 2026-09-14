import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import zipfile
import io
from datetime import datetime, timezone, timedelta

import project_manager as pm

def test_all():
    print("--- Running project_manager tests ---")
    
    # 1. Create project
    meta = pm.create_project(
        goal="Build an Emotion Matrix with Bike EMI Calculator",
        title="Emotion AI & Bike EMI Studio",
        code="<!DOCTYPE html><html><body><h1>Emotion & Bike EMI</h1></body></html>"
    )
    proj_id = meta["id"]
    print(f"Created project: {proj_id}, version={meta['version']}")
    assert meta["version"] == "1.0"
    assert (pm.PROJECTS_ROOT / proj_id / "index.html").exists()
    assert (pm.PROJECTS_ROOT / proj_id / "versions" / "v1.0.html").exists()
    
    # 2. List projects
    projs = pm.list_projects()
    assert len(projs) >= 1
    found = next((p for p in projs if p["id"] == proj_id), None)
    assert found is not None
    assert "left" in found["time_remaining_str"] or "Permanent" in found["time_remaining_str"]
    print(f"Time remaining: {found['time_remaining_str']}")
    
    # 3. Permanent Save
    assert not found["is_permanent"]
    saved = pm.save_project_permanent(proj_id, True)
    assert saved
    updated_proj = pm.get_project(proj_id)
    assert updated_proj["is_permanent"] is True
    assert updated_proj["time_remaining_str"] == "Permanent"
    print("Project saved permanently verified.")
    
    # 4. Zip Export
    zip_bytes = pm.export_project_zip(proj_id)
    assert zip_bytes is not None and len(zip_bytes) > 0
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        namelist = zf.namelist()
        print(f"Exported zip contains: {namelist}")
        assert "index.html" in namelist
        assert "project.json" in namelist
        assert "logical_tree.json" in namelist
    print("Zip export verified.")
    
    # 5. Apply project update via chat
    updated = pm.apply_project_update(
        project_id=proj_id,
        updated_code="<!DOCTYPE html><html><body><h1>Emotion & Bike EMI v1.1</h1><p>Amortization table added</p></body></html>",
        change_summary="Added amortization table and prepayment calculator",
        user_prompt="Add an amortization table to this bike EMI tool"
    )
    assert updated["version"] == "1.1"
    assert len(updated["versions"]) == 2
    assert len(updated["chat"]) >= 3
    print(f"Project updated to v{updated['version']}, chat count={len(updated['chat'])}")
    
    # 6. Suggestions
    suggestions = pm.get_project_suggestions(proj_id)
    assert len(suggestions) > 0
    print(f"Proactive suggestions: {suggestions}")
    
    # 7. Test 30-day purge
    # Create an artificially expired project
    expired_meta = pm.create_project(
        goal="Temporary Expired App",
        code="<html></html>"
    )
    expired_id = expired_meta["id"]
    # Manually backdate expires_at
    meta_file = pm.PROJECTS_ROOT / expired_id / "project.json"
    data = json.loads(meta_file.read_text())
    data["expires_at"] = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    meta_file.write_text(json.dumps(data))
    
    purged = pm.purge_expired_projects()
    print(f"Purged expired projects: {purged}")
    assert expired_id in purged
    assert not (pm.PROJECTS_ROOT / expired_id).exists()
    
    # Clean up test project
    pm.delete_project(proj_id)
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
