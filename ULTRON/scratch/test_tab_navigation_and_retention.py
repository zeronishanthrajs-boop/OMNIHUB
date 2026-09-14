"""
End-to-end Playwright Test: Verify Project Retention Across Tab Navigation
Tests the exact user bug report:
- Submitting a project
- Navigating to "Projects" or other tabs while preparing/completed
- Returning to "Command" tab
- Verifying the project does NOT vanish
- Verifying prompt input is cleanly cleared and no lockout occurs
"""

import sys
import time
from playwright.sync_api import sync_playwright

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.on("dialog", lambda d: d.accept())

        print("[Test 1] Loading Antigravity Dashboard at http://127.0.0.1:8000/ ...")
        page.goto("http://127.0.0.1:8000/", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # 1. Verify existing projects appear in the sidebar
        sidebar_tree = page.inner_text("#projectsTreeRoot")
        print("[Test 1] Sidebar content:\n", sidebar_tree.strip())
        assert "ULTRON" in sidebar_tree, "ULTRON folder must be present in sidebar"

        # 2. Click on the image-to-pdf project in sidebar if present
        proj_item = page.query_selector(".tree-item")
        if proj_item:
            print("[Test 2] Clicking project item in sidebar...")
            proj_item.click()
            page.wait_for_timeout(1000)
            
            # Verify conversation view is active
            is_conv_active = page.evaluate("() => document.querySelector('#conversationView').classList.contains('active')")
            print("[Test 2] Conversation view active after click:", is_conv_active)
            assert is_conv_active, "Conversation view should be active after clicking project"

            # Verify sandbox iframe is visible
            sandbox = page.query_selector("#sandboxIframe")
            print("[Test 2] Sandbox iframe exists:", sandbox is not None)
            assert sandbox is not None, "Sandbox iframe must exist"

        # 3. Navigate away to "Projects"
        print("[Test 3] Navigating to 'Projects' tab...")
        nav_proj = page.query_selector("#navBtnProjects")
        assert nav_proj is not None, "Projects nav button must exist"
        nav_proj.click()
        page.wait_for_timeout(500)

        # Close history modal if open
        close_btn = page.query_selector("#historyModal .modal-close")
        if close_btn and close_btn.is_visible():
            close_btn.click()
            page.wait_for_timeout(300)

        # 4. Navigate back to "Command" tab
        print("[Test 4] Navigating back to 'Command' tab...")
        nav_cmd = page.query_selector("#navBtnCommand")
        assert nav_cmd is not None, "Command nav button must exist"
        nav_cmd.click()
        page.wait_for_timeout(500)

        # 5. CRITICAL CHECK: Conversation view MUST NOT have vanished!
        is_conv_active = page.evaluate("() => document.querySelector('#conversationView').classList.contains('active')")
        print("[Test 5] Conversation view retained after returning to Command:", is_conv_active)
        assert is_conv_active, "BUG DETECTED: Conversation view vanished when returning to Command!"

        # 6. Test New Conversation button
        print("[Test 6] Testing + New Conversation...")
        page.click(".btn-new-conv")
        page.wait_for_timeout(500)

        # Verify home view is now visible and prompt input is empty
        is_home_visible = page.evaluate("() => document.querySelector('#homeView').style.display !== 'none'")
        prompt_val = page.evaluate("() => document.querySelector('#mainPromptInput').value")
        print("[Test 6] Home view visible:", is_home_visible, "| Prompt textarea value:", repr(prompt_val))
        assert is_home_visible, "Home view must be visible after New Conversation"
        assert prompt_val == "", f"Prompt textarea should be empty, got {repr(prompt_val)}"

        # 7. Test prompt submission and input clearing
        print("[Test 7] Submitting prompt in Mock mode...")
        # Select Mock mode to avoid waiting for LLM
        page.evaluate("() => { if (window.ultronState) window.ultronState.selectedContext = 'Mock Mode'; }")
        page.fill("#mainPromptInput", "Build a high-speed currency arbitrage matrix")
        page.wait_for_timeout(300)
        
        # Click send
        page.click("#sendPromptBtn")
        page.wait_for_timeout(800)

        # Check that input was cleared
        input_after_send = page.evaluate("() => document.querySelector('#mainPromptInput').value")
        print("[Test 7] Prompt input cleared after submission:", repr(input_after_send))
        assert input_after_send == "", "Prompt input should be cleared immediately after submission!"

        # Check conversation view is active
        is_conv_now = page.evaluate("() => document.querySelector('#conversationView').classList.contains('active')")
        print("[Test 7] Conversation view opened for new prompt:", is_conv_now)
        assert is_conv_now, "Conversation view must be active after prompt submission"

        # 8. While project is preparing, navigate to Projects and back to Command
        print("[Test 8] Navigating to Projects while project is building...")
        nav_proj.click()
        page.wait_for_timeout(500)
        close_btn2 = page.query_selector("#historyModal .modal-close")
        if close_btn2 and close_btn2.is_visible():
            close_btn2.click()
            page.wait_for_timeout(300)

        print("[Test 8] Returning to Command tab while project is building...")
        nav_cmd.click()
        page.wait_for_timeout(500)

        # Verify project did NOT vanish
        is_conv_still_active = page.evaluate("() => document.querySelector('#conversationView').classList.contains('active')")
        print("[Test 8] Conversation view STILL active while building after tab switch:", is_conv_still_active)
        assert is_conv_still_active, "BUG: Building project vanished when switching tabs!"

        # 9. Test active project chip in top bar
        print("[Test 9] Testing top bar active project chip click...")
        chip = page.query_selector("#activeProjectChip")
        assert chip is not None, "Top active project chip must exist"
        chip_text = chip.inner_text().strip()
        print("[Test 9] Top active project chip text:", repr(chip_text))
        assert len(chip_text) > 0, "Chip text should display active mission"

        # Switch to home view manually and click chip to restore
        page.evaluate("() => { document.querySelector('#homeView').style.display = 'flex'; document.querySelector('#conversationView').classList.remove('active'); }")
        page.wait_for_timeout(300)
        chip.click()
        page.wait_for_timeout(500)
        restored = page.evaluate("() => document.querySelector('#conversationView').classList.contains('active')")
        print("[Test 9] Clicking activeProjectChip successfully restored conversation view:", restored)
        assert restored, "Clicking top chip must restore active conversation view"

        browser.close()
        print("\n" + "=" * 70)
        print("ALL TAB NAVIGATION & PROJECT RETENTION TESTS PASSED 100%!")
        print("=" * 70)

if __name__ == "__main__":
    run_test()
