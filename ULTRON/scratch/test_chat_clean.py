import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page()
    
    logs = []
    page.on('console', lambda m: logs.append(f"[{m.type}] {m.text}"))
    page.on('response', lambda r: logs.append(f"{r.request.method} {r.url} -> {r.status}"))

    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    
    inp = page.locator('input[aria-label="Ask JARVIS"]')
    inp.fill('hello')
    
    # Click the send button (the plane icon next to input)
    send_btn = page.locator('button:has(svg)').filter(has_not_text="Voice")
    print("Found buttons:", send_btn.count())
    # Click the last button in the input bar
    send_btn.last.click()
    
    page.wait_for_timeout(6000)
    
    screenshot_path = os.path.abspath('scratch/jarvis_reply.png')
    page.screenshot(path=screenshot_path)
    print("Screenshot saved to:", screenshot_path)
    
    for l in logs[-15:]:
        print("LOG:", l)
        
    browser.close()
