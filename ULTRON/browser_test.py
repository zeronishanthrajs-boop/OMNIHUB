import time
from playwright.sync_api import sync_playwright

def run_browser_automation():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=False)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        artifact_dir = r"C:\Users\sakth\.gemini\antigravity\brain\75eb1853-e0f1-4d71-843b-daca8f4f11c8"
        import os
        
        print("1. Navigating to http://127.0.0.1:8000...")
        page.goto("http://127.0.0.1:8000", wait_until="networkidle")
        page.screenshot(path="screenshot_01_dashboard.png")
        page.screenshot(path=os.path.join(artifact_dir, "screenshot_01_dashboard.png"))
        print("Saved screenshot_01_dashboard.png")
        
        goal_text = "build a flight delay predictor based on speed of wind"
        print(f"2. Typing goal: '{goal_text}'...")
        page.fill("#goal-input", goal_text)
        page.screenshot(path="screenshot_02_typed_goal.png")
        page.screenshot(path=os.path.join(artifact_dir, "screenshot_02_typed_goal.png"))
        print("Saved screenshot_02_typed_goal.png")
        
        print("3. Clicking LAUNCH GOAL button...")
        page.click("#submit-btn")
        
        time.sleep(1.2)
        page.screenshot(path="screenshot_03_in_flight.png")
        page.screenshot(path=os.path.join(artifact_dir, "screenshot_03_in_flight.png"))
        print("Saved screenshot_03_in_flight.png")
        
        print("4. Waiting for graph release approval...")
        time.sleep(4.5)
        page.screenshot(path="screenshot_04_approved.png")
        page.screenshot(path=os.path.join(artifact_dir, "screenshot_04_approved.png"))
        print("Saved screenshot_04_approved.png")
        
        print("5. Opening generated Flight Delay Predictor at http://127.0.0.1:8000/web_ui/...")
        page.goto("http://127.0.0.1:8000/web_ui/", wait_until="networkidle")
        page.screenshot(path="screenshot_05_generated_app.png")
        page.screenshot(path=os.path.join(artifact_dir, "screenshot_05_generated_app.png"))
        print("Saved screenshot_05_generated_app.png")
        
        print("6. Testing wind speed slider & shear severity recalculation...")
        page.select_option("#shear-select", "severe")
        page.fill("#wind-slider", "55")
        page.click("#recalc-btn")
        time.sleep(0.4)
        
        risk_text = page.text_content("#risk-display")
        status_text = page.text_content("#risk-status")
        print(f"Recalculated Delay Risk: {risk_text} | Status: '{status_text}'")
        assert "HIGH DELAY RISK" in status_text, f"Expected 'HIGH DELAY RISK', got '{status_text}'"
        
        page.screenshot(path="screenshot_08_flight_predictor_recalc.png")
        page.screenshot(path=os.path.join(artifact_dir, "screenshot_08_flight_predictor_recalc.png"))
        print("Saved screenshot_08_flight_predictor_recalc.png - Asserted High Delay Risk!")
        
        browser.close()
        print("Browser automation complete!")

if __name__ == "__main__":
    run_browser_automation()
