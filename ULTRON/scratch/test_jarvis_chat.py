from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page()
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    input_box = page.locator('input[placeholder*="Ask JARVIS anything"]')
    input_box.fill('hello')
    page.keyboard.press('Enter')
    page.wait_for_timeout(4000)
    page.screenshot(path='scratch/jarvis_reply.png')
    for el in page.locator('div[class*="message"], .conversation, p').all():
        t = el.inner_text().strip()
        if t:
            print("TEXT:", t[:100])
    browser.close()
