from pathlib import Path
from playwright.sync_api import sync_playwright

def capture():
    artifacts_dir = Path(r"C:\Users\sakth\.gemini\antigravity\brain\75eb1853-e0f1-4d71-843b-daca8f4f11c8")
    screenshot_path = artifacts_dir / "ui_audit.png"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://127.0.0.1:8000", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(screenshot_path), full_page=True)
        browser.close()
        
    print(f"SUCCESS: Screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    capture()
