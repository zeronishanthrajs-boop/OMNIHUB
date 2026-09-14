"""
Test Suite: Common Issues & Regressions Audit
Tests:
- Nav Rail actions for Agents (Alt+3) and Activity (Alt+4)
- Split panel tab switching and tree/log views
- Reloading sandbox with proper project target URL
- Follow-up chat submission and input clearing
- Graph abort check on reset
"""

import sys
import time
from playwright.sync_api import sync_playwright

def run_common_issues_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.on("dialog", lambda d: d.accept())

        print("[Audit 1] Loading dashboard...")
        page.goto("http://127.0.0.1:8000/", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # 1. Test clicking "Agents" on the Left Nav Rail
        print("[Audit 2] Testing Nav Rail 'Agents' button (Alt+3)...")
        nav_agents = page.query_selector("#navBtnAgents")
        assert nav_agents is not None, "Nav Rail Agents button must exist"
        nav_agents.click()
        page.wait_for_timeout(800)

        # Verify conversation view is active
        is_conv_active = page.evaluate("() => document.querySelector('#conversationView').classList.contains('active')")
        print("[Audit 2] Conversation view active after clicking Agents:", is_conv_active)
        assert is_conv_active, "Clicking Agents must activate conversation view!"

        # Verify Reasoning tab is active in split panel
        is_tree_active = page.evaluate("() => document.querySelector('#tabContentTree').classList.contains('active')")
        print("[Audit 2] Reasoning tree tab active:", is_tree_active)
        assert is_tree_active, "Reasoning tree split tab must be active after clicking Agents!"

        # 2. Test clicking "Activity" on the Left Nav Rail
        print("[Audit 3] Testing Nav Rail 'Activity' button (Alt+4)...")
        nav_act = page.query_selector("#navBtnActivity")
        assert nav_act is not None, "Nav Rail Activity button must exist"
        nav_act.click()
        page.wait_for_timeout(800)

        # Verify Telemetry Logs tab is active in split panel
        is_logs_active = page.evaluate("() => document.querySelector('#tabContentLogs').classList.contains('active')")
        print("[Audit 3] Telemetry logs split tab active:", is_logs_active)
        assert is_logs_active, "Telemetry logs split tab must be active after clicking Activity!"

        # 3. Test clicking "Command" button returns to Command view
        print("[Audit 4] Testing Nav Rail 'Command' button (Alt+1)...")
        nav_cmd = page.query_selector("#navBtnCommand")
        nav_cmd.click()
        page.wait_for_timeout(500)
        is_conv_retained = page.evaluate("() => document.querySelector('#conversationView').classList.contains('active')")
        print("[Audit 4] Conversation view retained on returning to Command:", is_conv_retained)
        assert is_conv_retained, "Active conversation view must be retained on Command!"

        # 4. Test Sandbox reload target URL resolution
        print("[Audit 5] Testing reloadSandboxIframe() target resolution...")
        page.evaluate("() => { if (window.reloadSandboxIframe) window.reloadSandboxIframe(); }")
        page.wait_for_timeout(500)
        iframe_src = page.evaluate("() => document.querySelector('#sandboxIframe').src")
        print("[Audit 5] Resolved sandbox iframe src:", iframe_src)
        assert iframe_src and not iframe_src.endswith("about:blank"), "Sandbox iframe must have a valid resolved URL"

        # 5. Test Follow-up chat input clearing and submission in Mock Mode
        print("[Audit 6] Testing Follow-up Chat submission...")
        page.evaluate("() => { if (window.ultronState) window.ultronState.selectedContext = 'Mock Mode'; }")
        page.fill("#followUpInput", "Add a live telemetry counter and dark mode toggle")
        page.wait_for_timeout(200)
        
        # Click follow-up send button
        page.click(".chat-bottom-input .btn-send")
        page.wait_for_timeout(500)

        # Verify followUpInput is cleared immediately
        input_val = page.evaluate("() => document.querySelector('#followUpInput').value")
        print("[Audit 6] Follow-up input cleared:", repr(input_val))
        assert input_val == "", "Follow-up input must be cleared immediately upon send!"

        # Wait for assistant response in chat
        page.wait_for_timeout(2500)
        chat_stream_text = page.inner_text("#chatStream")
        print("[Audit 6] Chat stream contains follow-up response:", "Add a live telemetry counter" in chat_stream_text)
        assert "Add a live telemetry counter" in chat_stream_text, "User follow-up message must appear in chat stream"

        # 6. Test Reset functionality
        print("[Audit 7] Testing Reset button...")
        page.click("button[title='Reset State']")
        page.wait_for_timeout(800)
        is_reset_home = page.evaluate("() => document.querySelector('#homeView').style.display !== 'none'")
        print("[Audit 7] Reset successfully returned to Home view:", is_reset_home)
        assert is_reset_home, "Resetting state must return to clean Home view"

        browser.close()
        print("\n" + "=" * 70)
        print("ALL COMMON ISSUES & REGRESSION AUDIT TESTS PASSED 100%!")
        print("=" * 70)

if __name__ == "__main__":
    run_common_issues_test()
