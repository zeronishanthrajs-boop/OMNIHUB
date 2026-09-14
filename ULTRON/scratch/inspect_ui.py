import sys
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome')
    page = browser.new_page()
    page.goto('http://127.0.0.1:8000')
    page.wait_for_timeout(2000)
    print("PAGE TITLE:", page.title())
    elements = page.query_selector_all('input, textarea, button')
    for el in elements:
        tag = el.evaluate('el => el.tagName')
        id_ = el.get_attribute('id') or ''
        placeholder = el.get_attribute('placeholder') or ''
        text = el.inner_text().strip().replace('\n', ' ')[:30] if tag == 'BUTTON' else ''
        print(f'{tag:8} id="{id_}" placeholder="{placeholder}" text="{text}"')
    browser.close()
