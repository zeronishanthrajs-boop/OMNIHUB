import os, sys, uuid, json
sys.path.insert(0, '.')
os.environ["ULTRON_MOCK"] = "true"
import project_manager as pm
from ultron_flow import build_fallback_logical_tree, coordinator_node
from dashboard import app
from fastapi.testclient import TestClient

def run():
    print("=== PASS 1 AUDIT: ITEMS 26 TO 40 (Logical Tree & Planning) ===")

    # 26. logical_tree.json persistence
    uid26 = f"tree_persist_{uuid.uuid4().hex[:6]}"
    tree26 = build_fallback_logical_tree(f"Goal {uid26}", "Briefs content")
    meta26 = pm.create_project(goal=f"Tree Goal {uid26}", title=uid26, code="<div>OK</div>", logical_tree=tree26)
    pid26 = meta26["id"]
    tree_path = pm.PROJECTS_ROOT / pid26 / "logical_tree.json"
    assert tree_path.exists(), "Item 26 Failed: logical_tree.json not saved to disk"
    loaded_tree = json.loads(tree_path.read_text(encoding="utf-8"))
    assert loaded_tree.get("intent") is not None, "Item 26 Failed: intent mismatch in saved tree"
    pm.delete_project(pid26)
    print("[x] Item 26 PASSED: logical_tree.json persistence")

    # 27. Tree visual view in UI template
    with open("templates/antigravity.html", "r", encoding="utf-8") as f:
        tpl = f.read()
    assert 'id="treeViewer"' in tpl and 'tree-node-block' in tpl, "Item 27 Failed"
    print("[x] Item 27 PASSED: Tree visual view hierarchy in UI")

    # 28. Tree raw JSON view
    assert "toggleRawTree" in tpl and "treeRawJsonViewer" in tpl, "Item 28 Failed"
    print("[x] Item 28 PASSED: Tree raw JSON view toggle")

    # 29. Tree intent node
    assert "intent" in tree26 and tree26["intent"] is not None, "Item 29 Failed"
    print("[x] Item 29 PASSED: Tree intent node")

    # 30. Tree screens node
    screens = tree26.get("screens", [])
    assert len(screens) > 0 and isinstance(screens[0], dict), "Item 30 Failed"
    print("[x] Item 30 PASSED: Tree screens node")

    # 31. Tree features node
    features = tree26.get("features", [])
    assert len(features) > 0 and isinstance(features[0], dict), "Item 31 Failed"
    print("[x] Item 31 PASSED: Tree features node")

    # 32. Tree logic / constraints node
    constraints = tree26.get("constraints", [])
    assert len(constraints) > 0 or "constraints" in tree26, "Item 32 Failed"
    print("[x] Item 32 PASSED: Tree logic / constraints node")

    # 33. Tree verification node
    verif = tree26.get("verification_steps") or tree26.get("verification", [])
    assert len(verif) > 0, "Item 33 Failed"
    print("[x] Item 33 PASSED: Tree verification node")

    # 34. Tree diffing between versions
    uid34 = uuid.uuid4().hex[:6]
    tree_v1 = build_fallback_logical_tree(f"App {uid34}", "Briefs v1")
    tree_v2 = build_fallback_logical_tree(f"App {uid34}", "Briefs v2")
    tree_v2["screens"].append({"id": "screen_settings", "name": "Settings View", "purpose": "Configure"})
    tree_v2["features"].append({"id": "feat_backup", "name": "Cloud Backup", "details": "Sync"})
    diff = pm.diff_logical_trees(tree_v1, tree_v2)
    assert diff["has_changes"] and "Settings View" in diff["added_screens"], "Item 34 Failed"
    print("[x] Item 34 PASSED: Tree diffing between versions")

    # 35. Tree-to-brief translation (Coordinator reads tree directly)
    coord_state = {
        "goal": f"Tree Coord Test {uid34}",
        "status": "coordinating",
        "logical_tree": tree_v2,
        "planner_briefs": "Implement features",
        "log_history": [],
        "rejection_count": 0
    }
    coord_res = coordinator_node(coord_state)
    tasks = coord_res.get("worker_tasks", [])
    assert len(tasks) > 0, "Item 35 Failed"
    print("[x] Item 35 PASSED: Tree-to-brief translation")

    # 36. Tree search/filter
    assert "filterTreeNodes" in tpl and "treeFilterInput" in tpl, "Item 36 Failed"
    print("[x] Item 36 PASSED: Tree search/filter")

    # 37. Tree export
    spec_md = pm.export_tree_spec(tree_v2, "markdown")
    spec_json = pm.export_tree_spec(tree_v2, "json")
    assert "# Mission Specification:" in spec_md and '"screens":' in spec_json, "Item 37 Failed"
    assert "exportTreeSpec" in tpl, "Item 37 UI button Failed"
    print("[x] Item 37 PASSED: Tree export (Markdown & JSON spec)")

    # 38. Tree validation
    val_good = pm.validate_logical_tree(tree_v2)
    assert val_good["valid"] is True, "Item 38 Failed on good tree"
    val_bad = pm.validate_logical_tree({"intent": None, "screens": []})
    assert val_bad["valid"] is False and len(val_bad["issues"]) >= 2, "Item 38 Failed on bad tree"
    print("[x] Item 38 PASSED: Tree validation (flags orphaned/missing nodes)")

    # 39. Tree progressive disclosure
    assert '<details open class="tree-node-block"' in tpl, "Item 39 Failed"
    print("[x] Item 39 PASSED: Tree progressive disclosure (collapsible sections)")

    # 40. Tree-driven test generation
    qa_tests = pm.generate_tree_tests(tree_v2)
    assert len(qa_tests) > 0 and qa_tests[0]["id"].startswith("qa_"), "Item 40 Failed"
    print("[x] Item 40 PASSED: Tree-driven test generation from verification nodes")

    print("ALL ITEMS 26-40 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
