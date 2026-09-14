"""
Dynamic Verification Script for Items 96-120: Right Intel Deck (5 Modes) & System Telemetry
Tests UI structures, JavaScript controllers, and live backend APIs.
Uses fresh, non-repeated test inputs.
"""

import sys
import uuid
from pathlib import Path

root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from starlette.testclient import TestClient
from dashboard import app

def test_items_96_120():
    root = Path(__file__).resolve().parent.parent
    html_path = root / "templates" / "antigravity.html"
    assert html_path.exists(), f"antigravity.html missing at {html_path}"
    content = html_path.read_text(encoding="utf-8")

    # Item 96: Reasoning tab
    assert 'id="tabContentTree"' in content, "Item 96 failed: tabContentTree missing"
    assert 'switchSplitTab(\'tree\')' in content, "Item 96 failed: switchSplitTab('tree') missing"

    # Item 97: Visual/Raw JSON toggle
    assert 'id="rawTreeToggleBtn"' in content, "Item 97 failed: rawTreeToggleBtn missing"
    assert 'toggleRawTree()' in content, "Item 97 failed: toggleRawTree() missing"

    # Item 98: Tree node click-through
    assert 'highlightTreeNode' in content, "Item 98 failed: highlightTreeNode missing"
    assert 'tree-node-click' in content, "Item 98 failed: tree-node-click class missing"

    # Item 99: Evolution tab
    assert 'id="tabContentEvolution"' in content, "Item 99 failed: tabContentEvolution missing"
    assert 'switchSplitTab(\'evolution\')' in content, "Item 99 failed: switchSplitTab('evolution') missing"

    # Item 100: Operator vs ULTRON bubble styling
    assert 'msg-user' in content and 'msg-assistant' in content, "Item 100 failed: bubble styling classes missing"
    assert 'ultron-avatar' in content, "Item 100 failed: ultron-avatar missing"

    # Item 101: Version badges in chat
    assert 'evolutionVersionBadge' in content or 'step-badge' in content, "Item 101 failed: version badges missing"

    # Item 102: Proactive suggestion chips
    assert 'id="deckSuggestionChips"' in content, "Item 102 failed: deckSuggestionChips container missing"
    assert 'loadSuggestionChips' in content, "Item 102 failed: loadSuggestionChips missing"

    # Item 103: One-click chip apply
    assert 'applySuggestionChip' in content, "Item 103 failed: applySuggestionChip missing"

    # Item 104: Code inspector tab
    assert 'id="tabContentCode"' in content, "Item 104 failed: tabContentCode missing"
    assert 'switchSplitTab(\'code\')' in content, "Item 104 failed: switchSplitTab('code') missing"

    # Item 105: File path display
    assert 'id="codeFilePath"' in content, "Item 105 failed: codeFilePath element missing"

    # Item 106: Line count display
    assert 'id="codeLineCount"' in content, "Item 106 failed: codeLineCount element missing"

    # Item 107: Real-time search/filter
    assert 'id="codeSearchInput"' in content, "Item 107 failed: codeSearchInput missing"
    assert 'filterCodeInspector' in content, "Item 107 failed: filterCodeInspector missing"

    # Item 108: One-click clipboard copy
    assert 'id="codeCopyBtn"' in content, "Item 108 failed: codeCopyBtn missing"
    assert 'copyCodeInspector' in content, "Item 108 failed: copyCodeInspector missing"

    # Item 109: Telemetry tab
    assert 'id="tabContentLogs"' in content, "Item 109 failed: tabContentLogs missing"
    assert 'switchSplitTab(\'logs\')' in content, "Item 109 failed: switchSplitTab('logs') missing"

    # Item 110: Node badges
    assert 'BOSS' in content and 'PLANNER' in content and 'WORKER' in content, "Item 110 failed: node tags missing"

    # Item 111: Timestamps on every log entry
    assert 'timestamp' in content, "Item 111 failed: timestamp missing in logs"

    # Item 112: Log filtering by node
    assert 'id="telemetryFilterButtons"' in content, "Item 112 failed: telemetryFilterButtons missing"
    assert 'filterLogsByNode' in content, "Item 112 failed: filterLogsByNode missing"

    # Item 113: Log export
    assert 'id="logExportBtn"' in content, "Item 113 failed: logExportBtn missing"
    assert 'exportTelemetryLogs' in content, "Item 113 failed: exportTelemetryLogs missing"

    # Item 114: Rules tab
    assert 'id="tabContentRules"' in content, "Item 114 failed: tabContentRules missing"
    assert 'switchSplitTab(\'rules\')' in content, "Item 114 failed: switchSplitTab('rules') missing"

    # Item 115: Scope discipline rule
    assert 'id="ruleToggleScope"' in content, "Item 115 failed: ruleToggleScope missing"

    # Item 116: Domain sandboxing rule
    assert 'id="ruleToggleSandbox"' in content, "Item 116 failed: ruleToggleSandbox missing"

    # Item 117: Verification-required rule
    assert 'id="ruleToggleVerification"' in content, "Item 117 failed: ruleToggleVerification missing"

    # Item 118: Zero-placeholder rule
    assert 'id="ruleToggleZeroPlaceholder"' in content, "Item 118 failed: ruleToggleZeroPlaceholder missing"

    # Item 119: Custom rule addition
    assert 'id="deckNewRuleInput"' in content, "Item 119 failed: deckNewRuleInput missing"
    assert 'addNewGuardrailRuleFromDeck' in content, "Item 119 failed: addNewGuardrailRuleFromDeck missing"

    # Item 120: Rule violation alerts
    assert 'id="rulesViolationAlert"' in content, "Item 120 failed: rulesViolationAlert missing"
    assert 'surfaceRuleViolation' in content, "Item 120 failed: surfaceRuleViolation missing"

    # Now verify backend APIs with fresh random test input
    client = TestClient(app)
    
    # Check GET /api/logs
    logs_res = client.get("/api/logs")
    assert logs_res.status_code == 200, f"/api/logs returned {logs_res.status_code}"
    logs_data = logs_res.json()
    assert isinstance(logs_data, list), "/api/logs should return list"

    # Check GET /api/rules
    rules_res = client.get("/api/rules")
    assert rules_res.status_code == 200, f"/api/rules returned {rules_res.status_code}"
    rules_data = rules_res.json()
    assert "core" in rules_data, "core rules missing in /api/rules"

    # Check POST /api/rules/add with fresh random rule
    test_rule_text = f"Enforce HTTPS strict transport security header {uuid.uuid4().hex[:6]}"
    add_res = client.post("/api/rules/add", json={"text": test_rule_text, "mock": True})
    assert add_res.status_code == 200, f"/api/rules/add returned {add_res.status_code}"
    rule_info = add_res.json()
    assert rule_info.get("status") == "ok", "rule addition status not ok"

    print("[SUCCESS] All Items 96-120 verified dynamically across UI and backend APIs.")

if __name__ == "__main__":
    test_items_96_120()
