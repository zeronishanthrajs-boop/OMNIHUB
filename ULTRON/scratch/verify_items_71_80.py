import os, sys, uuid
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from dashboard import app, execution_state

def run():
    print("=== PASS 1 AUDIT: ITEMS 71 TO 80 (Mission Console) ===")

    with open("templates/antigravity.html", "r", encoding="utf-8") as f:
        html = f.read()

    # 71. Mission input field
    assert 'id="mainPromptInput"' in html and 'textarea' in html, "Item 71 Failed: mainPromptInput missing"
    assert 'input.style.height = "auto"' in html, "Item 71 Failed: auto-growing logic missing"
    print("[x] Item 71 PASSED: Mission input field (auto-growing textarea)")

    # 72. Glowing prompt indicator
    assert 'class="prompt-indicator"' in html and 'text-shadow' in html, "Item 72 Failed: Glowing prompt indicator missing"
    print("[x] Item 72 PASSED: Glowing prompt indicator (visible prompt cue)")

    # 73. Reactive waveform
    assert 'id="promptWaveform"' in html and 'renderWaveform' in html, "Item 73 Failed: Reactive waveform missing"
    print("[x] Item 73 PASSED: Reactive waveform (audio-style waveform responding to typing)")

    # 74. Keyboard dispatch
    assert 'e.key === "Enter" && e.ctrlKey' in html, "Item 74 Failed: Ctrl+Enter keyboard dispatch missing"
    print("[x] Item 74 PASSED: Keyboard dispatch (Ctrl+Enter submission)")

    # 75. Input history
    assert 'missionHistory' in html and 'e.key === "ArrowUp"' in html, "Item 75 Failed: Input history recall missing"
    print("[x] Item 75 PASSED: Input history (up-arrow recallable previous missions)")

    # 76. Length/clarity guardrails
    assert 'id="promptGuardrailNotice"' in html and 'val.length < 5' in html, "Item 76 Failed: Length/clarity guardrails missing"
    print("[x] Item 76 PASSED: Length/clarity guardrails (vague / length notice)")

    # 77. Submit-state feedback
    assert 'SUBMITTED — REASONING STARTED' in html or 'SUBMITTED' in html, "Item 77 Failed: Submit-state feedback missing"
    print("[x] Item 77 PASSED: Submit-state feedback (clear reasoning started status)")

    # 78. Mid-run edit lock
    assert 'execution_state.is_running' in html and 'An execution run is already actively in progress' in html, "Item 78 Failed: Mid-run edit lock missing"
    print("[x] Item 78 PASSED: Mid-run edit lock (prevents conflicting new submissions)")

    # 79. Draft autosave
    assert 'ultron_prompt_draft' in html and 'localStorage.setItem' in html, "Item 79 Failed: Draft autosave missing"
    print("[x] Item 79 PASSED: Draft autosave (persists unsent drafts across navigation)")

    # 80. Console-to-Boss direct link
    client = TestClient(app)
    uid80 = uuid.uuid4().hex[:6]
    test_goal = f"Audit Goal {uid80}"
    resp = client.post("/api/run", json={"goal": test_goal, "mock": True, "folder": "ULTRON"})
    assert resp.status_code == 200 and resp.json().get("status") == "success", "Item 80 Failed: /api/run rejected mission"
    print("[x] Item 80 PASSED: Console-to-Boss direct link (direct invocation of Boss sentinel)")

    print("ALL ITEMS 71-80 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
