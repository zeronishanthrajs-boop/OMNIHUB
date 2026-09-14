import os
import sys
import time
import json
import urllib.request
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(line_buffering=True, encoding='utf-8')

def wait_for_project():
    print("Waiting for active ULTRON execution to finish...")
    while True:
        try:
            req = urllib.request.urlopen("http://127.0.0.1:8000/api/state", timeout=5)
            data = json.loads(req.read().decode("utf-8"))
            is_running = data.get("is_running")
            status = data.get("status")
            proj_id = data.get("active_project_id")
            print(f"[STATE] running={is_running} | status={status} | proj_id={proj_id}")
            if not is_running:
                return proj_id
        except Exception as e:
            print(f"Error checking state: {e}")
        time.sleep(5)

def run_app_test(proj_id):
    pdf_path = r"C:\Users\sakth\OneDrive\Documents\final sem result.pdf"
    if not os.path.exists(pdf_path):
        print(f"ERROR: Target PDF does not exist at {pdf_path}")
        return

    if proj_id:
        app_url = f"http://127.0.0.1:8000/projects/{proj_id}/app"
    else:
        app_url = "http://127.0.0.1:8000/web_ui/index.html"

    print(f"\n--- Opening App at: {app_url} ---")
    app_console = []
    app_network = []
    alert_messages = []

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()

        page.on("console", lambda msg: app_console.append(f"[{msg.type.upper()}] {msg.text}"))
        page.on("response", lambda r: app_network.append(f"{r.request.method} {r.url} -> {r.status}"))
        page.on("dialog", lambda d: (alert_messages.append(d.message), d.accept()))

        page.goto(app_url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        # Print page HTML structure briefly
        print("\n--- Inspecting Upload Inputs ---")
        file_inputs = page.locator('input[type="file"]')
        count = file_inputs.count()
        print(f"Found {count} input[type='file'] element(s).")
        for i in range(count):
            accept = file_inputs.nth(i).get_attribute("accept")
            name = file_inputs.nth(i).get_attribute("id") or file_inputs.nth(i).get_attribute("name")
            print(f"  Input {i}: id/name='{name}', accept='{accept}'")

        if count == 0:
            print("ERROR: No input[type='file'] element found in synthesized app!")
            browser.close()
            return

        # Upload file
        print(f"\n--- STEP 2: Uploading PDF: {pdf_path} ---")
        file_inputs.first.set_input_files(pdf_path)
        page.wait_for_timeout(1500)

        # Locate convert button
        print("\n--- STEP 3: Locating and clicking Convert button ---")
        buttons = page.locator("button")
        btn_count = buttons.count()
        print(f"Found {btn_count} buttons:")
        target_btn = None
        for i in range(btn_count):
            txt = buttons.nth(i).inner_text().strip()
            id_ = buttons.nth(i).get_attribute("id") or ""
            print(f"  Button {i}: text='{txt}', id='{id_}'")
            if any(k in txt.lower() for k in ["convert", "docx", "download", "transform"]) or "convert" in id_.lower():
                if target_btn is None:
                    target_btn = buttons.nth(i)

        if target_btn is None and btn_count > 0:
            target_btn = buttons.first

        download_dest = os.path.abspath("scratch/downloaded_converted.docx")
        if os.path.exists(download_dest):
            os.remove(download_dest)

        download_occurred = False
        if target_btn:
            btn_txt = target_btn.inner_text().strip()
            print(f"\nClicking button: '{btn_txt}'...")
            try:
                with page.expect_download(timeout=10000) as download_info:
                    target_btn.click()
                dl = download_info.value
                dl.save_as(download_dest)
                print(f"[DOWNLOAD SUCCESS] File saved to: {download_dest}")
                download_occurred = True
            except Exception as e:
                print(f"[DOWNLOAD EVENT ERROR / TIMEOUT]: {e}")
                # check if button was clicked anyway
                try:
                    target_btn.click()
                except:
                    pass

        page.wait_for_timeout(3000)

        print("\n--- LITERAL BROWSER CONSOLE OUTPUT ---")
        if not app_console:
            print("(No console messages logged)")
        for msg in app_console:
            print(msg)

        print("\n--- LITERAL DIALOG / ALERT MESSAGES ---")
        if not alert_messages:
            print("(No alert dialogs triggered)")
        for alert in alert_messages:
            print(f"ALERT: {alert}")

        print("\n--- LITERAL NETWORK REQUESTS ---")
        if not app_network:
            print("(No network requests made by app)")
        for net in app_network:
            print(net)

        browser.close()

if __name__ == "__main__":
    proj_id = wait_for_project()
    print(f"\nActive project ready: {proj_id}")
    run_app_test(proj_id)
