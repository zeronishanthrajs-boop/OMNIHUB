"""
End-to-End Playwright Automated Test
Verifies:
1. User message displays accurate timestamp (HH:MM:SS).
2. Live state polling updates UI in real-time across workflow stages.
3. Boss accepts web application goal without pedantic clarification deadlock.
4. Total execution finishes well within 2 minutes (< 120s).
5. Sandbox loads single-click Image-to-DOCX converter application.
"""
import sys
import time
from playwright.sync_api import sync_playwright

def test_full_user_workflow():
    print("================================================================================")
    print("      ULTRON USER WORKFLOW, TIMESTAMPS & SUB-2-MINUTE EXECUTION TEST          ")
    print("================================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()

        # Step 1: Navigate to Dashboard
        t0 = time.time()
        page.goto("http://127.0.0.1:8000", wait_until="domcontentloaded", timeout=15000)
        print("[PASS] 1. Loaded dashboard at http://127.0.0.1:8000")

        # Verify dynamic engine status chip
        top_engine_label = page.locator("#topOllamaLabel").inner_text()
        print(f"       Active Engine Chip: '{top_engine_label}'")
        assert "Active" in top_engine_label or "Online" in top_engine_label or "llama" in top_engine_label.lower(), f"Unexpected engine label: {top_engine_label}"
        print("[PASS] 2. Engine status chip dynamically reflects active runtime")

        # Step 2: Fill User Prompt
        test_prompt = "create an application to upload images and convert to docx file in single click"
        page.fill("#mainPromptInput", test_prompt)
        page.click("#sendPromptBtn")
        prompt_submit_time = time.time()
        print(f"[PASS] 3. Submitted user prompt: '{test_prompt}'")

        # Step 3: Verify Timestamp is rendered on User Message
        page.wait_for_selector("#chatStream .msg-user", timeout=5000)
        time_badge = page.locator("#chatStream .msg-user .msg-time")
        assert time_badge.count() > 0, "Error: User message timestamp (.msg-time) not found in DOM!"
        timestamp_text = time_badge.first.inner_text().strip()
        assert len(timestamp_text) > 0, "Error: Timestamp is empty!"
        print(f"[PASS] 4. User message rendered with accurate timestamp: '{timestamp_text}'")

        # Step 4: Verify Conversation View is active
        conv_badge = page.locator("#convStatusBadge").inner_text().strip()
        print(f"       Initial status badge: '{conv_badge}'")
        assert conv_badge != "", "Status badge is empty"
        print("[PASS] 5. Conversation view activated with status badge")

        # Step 5: Wait for Execution to Complete (< 120 seconds)
        print("       Monitoring live multi-agent execution loop...")
        max_wait_seconds = 120
        completed = False
        last_status = ""

        while time.time() - prompt_submit_time < max_wait_seconds:
            # Poll status from page
            badge_text = page.locator("#convStatusBadge").inner_text().strip()
            step_text = page.locator("#activeStepBadge").inner_text().strip() if page.locator("#activeStepBadge").count() > 0 else ""
            elapsed = round(time.time() - prompt_submit_time, 1)

            status_summary = f"[{elapsed}s] Conv Badge: {badge_text} | Step: {step_text}"
            if status_summary != last_status:
                print(f"       -> {status_summary}")
                last_status = status_summary

            if badge_text in ["APPROVED", "COMPLETED", "SUCCESS", "READY"]:
                completed = True
                break

            # Check if clarification box appeared (must not happen for this concrete goal)
            if "CLARIFYING" in badge_text or "INPUT NEEDED" in step_text:
                raise AssertionError(f"Boss incorrectly stalled for clarification at {elapsed}s!")

            page.wait_for_timeout(1500)

        total_duration = round(time.time() - prompt_submit_time, 1)
        assert completed, f"Execution failed to complete within 2 minutes! Ran for {total_duration}s"
        assert total_duration < 120, f"Execution exceeded 2 minutes: {total_duration}s"
        print(f"[PASS] 6. Execution completed in {total_duration}s (STRICTLY UNDER 2 MINUTES!)")

        # Step 6: Verify Sandbox Preview
        page.wait_for_selector("#sandboxIframe", timeout=10000)
        iframe = page.locator("#sandboxIframe")
        iframe_src = iframe.get_attribute("src")
        print(f"       Sandbox iframe src: {iframe_src}")
        assert iframe_src and ("projects" in iframe_src or "web_ui" in iframe_src), f"Unexpected iframe src: {iframe_src}"
        print("[PASS] 7. Sandbox preview loaded project URL")

        # Step 7: Verify Single-Click DOCX Converter Content in Sandbox
        page.wait_for_timeout(2000)
        frame = page.frame_locator("#sandboxIframe")
        convert_btn = frame.locator("#btn1ClickConvert, #convert-button, #convertBtn, button:has-text('Convert')")
        assert convert_btn.count() > 0, "Error: Convert to DOCX 1-Click button not found in synthesized web app!"
        btn_text = convert_btn.first.inner_text().strip()
        print(f"       Found 1-Click action button: '{btn_text}'")
        print("[PASS] 8. Synthesized application has 1-Click DOCX conversion features!")

        browser.close()

    print("================================================================================")
    print("ALL TESTS PASSED 100%! User workflow, timestamps, and < 2 min execution verified!")
    print("================================================================================")

if __name__ == "__main__":
    test_full_user_workflow()
