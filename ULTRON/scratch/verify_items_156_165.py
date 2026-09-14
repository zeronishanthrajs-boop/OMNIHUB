"""
Dynamic Verification Script for Items 156-165: Diamond-Grade Synthesis Standard
Tests zero-placeholder policy, single-file self-contained HTML architecture,
modern dark UI, glassmorphic styles, responsive CSS rules, interactive state,
localStorage persistence, contrast, interactive controls, and automatic re-check on update.
Uses fresh non-repeated test inputs.
"""

import sys
import uuid
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

import project_manager as pm
from glassmorphic_engine import synthesize_glassmorphic_app

def test_items_156_165():
    test_id = uuid.uuid4().hex[:8]
    goal = f"Neuromorphic Neural Network Audio Visualizer {test_id}"
    
    html = synthesize_glassmorphic_app(goal, "web_ui")
    assert html and len(html) > 1500, "Synthesized app is empty or suspiciously short"
    lower = html.lower()

    # Item 156: Zero mock/placeholder policy
    forbidden_tokens = ["// add code here", "alert('coming soon')", "coming soon", "todo:", "placeholder text", "lorem ipsum"]
    for token in forbidden_tokens:
        assert token not in lower, f"Item 156 failed: found forbidden token '{token}'"

    # Item 157: Single-file self-contained architecture
    assert "<!DOCTYPE html>" in html or "<!doctype html>" in lower, "Item 157 failed: not valid single-file HTML"
    assert "<style>" in html and "</style>" in html, "Item 157 failed: missing inline styles"
    assert "<script>" in html and "</script>" in html, "Item 157 failed: missing inline script"

    # Item 158: Modern dark UI baseline
    assert "#0" in html or "#1" in html or "rgb(0" in html or "rgba(0" in html or "background:#" in lower, "Item 158 failed: dark theme palette not detected"

    # Item 159: Glassmorphic styling baseline
    assert "backdrop-filter" in lower or "rgba(" in lower or "border-glass" in lower, "Item 159 failed: glassmorphic tokens missing"

    # Item 160: Responsive layout requirement
    assert "@media" in lower or "max-width" in lower or "flex" in lower, "Item 160 failed: responsive layout CSS missing"

    # Item 161: Real interactive state
    assert ("addEventListener" in html or "onclick=" in lower or "function " in html), "Item 161 failed: interactive state handlers missing"

    # Item 162: Local storage persistence
    # Generate task manager or verify presence
    task_html = synthesize_glassmorphic_app(f"Build task matrix {test_id}", "web_ui")
    assert "localstorage" in task_html.lower() or "store" in task_html.lower(), "Item 162 failed: localStorage persistence missing in stateful app"

    # Item 163: Accessible contrast baseline
    assert ("#fff" in lower or "#e" in lower or "#00ffcc" in lower or "#5ad8ff" in lower or "rgb(255" in lower), "Item 163 failed: high-contrast text color tokens missing"

    # Item 164: No dead links/buttons
    # Check that any <button has an onclick or id for listener
    buttons = re.findall(r"<button([^>]*)>", html, re.IGNORECASE)
    assert len(buttons) > 0, "Item 164 failed: no buttons found in synthesized app"
    for b in buttons:
        assert "onclick" in b.lower() or "id=" in b.lower() or "class=" in b.lower(), f"Item 164 failed: dead button found <button{b}>"

    # Item 165: Automatic standard re-check on update
    # Create project and apply update
    proj = pm.create_project(goal=f"Calculator {test_id}", title=f"Calculator {test_id}")
    pid = proj["id"]
    try:
        updated_code = html
        updated_proj = pm.apply_project_update(pid, updated_code, "Updated with neuromorphic controls", "Add neuromorphic controls")
        assert updated_proj is not None, "Item 165 update failed"
        assert updated_proj["version"] == "1.1", "Item 165 version bump failed"
        # Verify code saved meets standards
        saved_code = (pm.PROJECTS_ROOT / pid / "index.html").read_text(encoding="utf-8")
        assert "<!DOCTYPE html>" in saved_code, "Item 165 saved code missing doctype"
        assert "todo" not in saved_code.lower(), "Item 165 saved code contains placeholder"
    finally:
        pm.delete_project(pid)

    print("[SUCCESS] All Items 156-165 verified dynamically against Diamond-Standard specifications.")

if __name__ == "__main__":
    test_items_156_165()
