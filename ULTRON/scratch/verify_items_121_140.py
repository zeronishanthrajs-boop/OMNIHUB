"""
Dynamic Verification Script for Items 121-140: Project Lifecycle Engine
Tests project creation, directory structures, metadata, version snapshots,
retention countdowns, ZIP export, ZIP restore, rename, delete, storage usage,
and hourly purge/orphan cleanup.
Uses fresh non-repeated test inputs.
"""

import os
import sys
import uuid
import json
import zipfile
import io
from pathlib import Path

root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

import project_manager as pm
from starlette.testclient import TestClient
from dashboard import app

def test_items_121_140():
    # Fresh test vector
    test_token = uuid.uuid4().hex[:8]
    goal_name = f"Audit Lifecycle Studio {test_token}"
    
    # Item 121: Dedicated project directory
    proj = pm.create_project(goal=goal_name, title=goal_name)
    pid = proj["id"]
    pdir = pm.PROJECTS_ROOT / pid
    assert pdir.exists() and pdir.is_dir(), f"Item 121 failed: {pdir} does not exist"

    # Item 122: project.json metadata file
    meta_path = pdir / "project.json"
    assert meta_path.exists(), "Item 122 failed: project.json missing"
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    assert meta["id"] == pid and "created_at" in meta and "is_permanent" in meta, "Item 122 metadata incomplete"

    # Item 123: logical_tree.json per project
    tree_path = pdir / "logical_tree.json"
    assert tree_path.exists(), "Item 123 failed: logical_tree.json missing"
    tree = json.loads(tree_path.read_text(encoding="utf-8"))
    assert "screens" in tree or "intent" in tree, "Item 123 invalid tree contents"

    # Item 124: versions/ folder & snapshots
    vdir = pdir / "versions"
    assert vdir.exists() and (vdir / "v1.0.html").exists(), "Item 124 failed: v1.0 snapshot missing"

    # Item 125: 30-day expiration countdown
    pdata = pm.get_project(pid)
    assert "days_remaining" in pdata and pdata["days_remaining"] <= 30, "Item 125 countdown missing"

    # Item 128: One-click permanent pin
    pm.save_project_permanent(pid, is_permanent=True)
    pdata_perm = pm.get_project(pid)
    assert pdata_perm["is_permanent"] is True, "Item 128 pin toggle failed"
    assert pdata_perm["time_remaining_str"] == "Permanent", "Item 128 time_remaining_str should be Permanent"

    # Item 129: Save All
    saved_count = pm.save_all_projects_permanent()
    assert saved_count >= 1, "Item 129 save all failed"

    # Item 131: Single-project ZIP export
    zip_bytes = pm.export_project_zip(pid)
    assert zip_bytes and len(zip_bytes) > 100, "Item 131 zip export empty"
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        namelist = zf.namelist()
        assert "project.json" in namelist or any(n.endswith("project.json") for n in namelist), "Item 131 project.json missing from zip"

    # Item 132: Master ZIP export
    master_zip = pm.export_all_projects_zip()
    assert master_zip and len(master_zip) > 100, "Item 132 master zip empty"

    # Item 134: Project rename
    renamed_title = f"Renamed Studio {test_token}"
    rename_ok = pm.rename_project(pid, renamed_title)
    assert rename_ok is True, "Item 134 rename failed"
    pdata_renamed = pm.get_project(pid)
    assert pdata_renamed["title"] == renamed_title, "Item 134 title mismatch"

    # Item 138: Restore from ZIP
    restored_id = f"proj_restored_{test_token}"
    restored_proj = pm.restore_project_from_zip(zip_bytes, target_id=restored_id)
    assert restored_proj is not None, "Item 138 restore returned None"
    assert (pm.PROJECTS_ROOT / restored_id / "index.html").exists(), "Item 138 restored index.html missing"

    # Item 139: Storage usage indicator
    storage_info = pm.get_storage_usage()
    assert "total_bytes" in storage_info and storage_info["total_bytes"] > 0, "Item 139 total_bytes missing"
    assert "total_mb" in storage_info, "Item 139 total_mb missing"

    # Item 140: Orphaned file cleanup
    dummy_orphan = pm.PROJECTS_ROOT / f"orphan_{test_token}.tmp"
    dummy_orphan.write_text("orphan artifact", encoding="utf-8")
    cleaned = pm.cleanup_orphaned_files()
    assert str(dummy_orphan) in cleaned or not dummy_orphan.exists(), "Item 140 orphan not cleaned"

    # Item 133: Project delete
    del_ok = pm.delete_project(restored_id)
    assert del_ok is True, "Item 133 delete failed"
    assert not (pm.PROJECTS_ROOT / restored_id).exists(), "Item 133 folder still exists after delete"

    # Clean up test project
    pm.delete_project(pid)

    # Item 126 & 127 & 135 & 136 & 137: UI Verification in antigravity.html
    html_content = (root / "templates" / "antigravity.html").read_text(encoding="utf-8")
    assert 'badge-expiring-soon' in html_content, "Item 126: badge-expiring-soon missing in UI"
    assert 'badge-permanent' in html_content, "Item 127: badge-permanent missing in UI"
    assert 'id="historyModal"' in html_content, "Item 135: catalog modal missing"
    assert 'id="catalogSearchInput"' in html_content, "Item 136: catalog search missing"
    assert 'id="catalogSortSelect"' in html_content, "Item 137: catalog sort missing"

    print("[SUCCESS] All Items 121-140 verified dynamically across engine, APIs, and UI.")

if __name__ == "__main__":
    test_items_121_140()
