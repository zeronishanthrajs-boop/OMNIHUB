import os
import sys
import time
import zipfile
import docx
from playwright.sync_api import sync_playwright

def run_reproduction():
    pdf_path = r"C:\Users\sakth\OneDrive\Documents\final sem result.pdf"
    print(f"Target PDF: {pdf_path}")
    if not os.path.exists(pdf_path):
        print("ERROR: PDF file does not exist!")
        return

    console_logs = []
    network_logs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()

        def on_console(msg):
            log_str = f"[{msg.type.upper()}] {msg.text}"
            console_logs.append(log_str)
            print(f"[BROWSER CONSOLE] {log_str}")

        def on_response(response):
            if not response.url.endswith(('.png', '.svg', '.ico', '.css')):
                net_str = f"{response.request.method} {response.url} -> {response.status}"
                network_logs.append(net_str)

        page.on("console", on_console)
        page.on("response", on_response)

        print("\n--- STEP 1: Navigate to ULTRON and prompt 'build a PDF to DOCX converter' ---")
        page.goto("http://127.0.0.1:8000", wait_until="domcontentloaded", timeout=20000)
        
        # Click New Conversation if available
        new_conv_btn = page.locator("button:has-text('New Conversation')")
        if new_conv_btn.count() > 0 and new_conv_btn.first.is_visible():
            new_conv_btn.first.click()
            page.wait_for_timeout(500)

        prompt = "build a PDF to DOCX converter"
        page.fill("#mainPromptInput", prompt)
        page.click("#sendPromptBtn")
        print(f"Submitted prompt: '{prompt}'")

        # Wait for project generation
        print("Waiting for synthesis to complete...")
        start_t = time.time()
        completed = False
        while time.time() - start_t < 180:
            badge_loc = page.locator("#convStatusBadge")
            badge = badge_loc.inner_text().strip() if badge_loc.count() > 0 else ""
            step_loc = page.locator("#activeStepBadge")
            step = step_loc.inner_text().strip() if step_loc.count() > 0 else ""
            elapsed = int(time.time() - start_t)
            print(f"[{elapsed}s] Status: {badge} | Step: {step}")
            if badge in ["APPROVED", "COMPLETED", "SUCCESS", "READY"]:
                completed = True
                break
            page.wait_for_timeout(3000)

        if not completed:
            print("FAILED: Synthesis did not complete within timeout!")
            browser.close()
            return

        page.wait_for_timeout(3000)
        # Check iframe src
        iframe = page.locator("#sandboxIframe")
        iframe_src = iframe.get_attribute("src")
        print(f"Sandbox Iframe src: {iframe_src}")

        # Open the generated app directly in a new page to isolate console & network
        app_url = f"http://127.0.0.1:8000{iframe_src}" if iframe_src.startswith("/") else iframe_src
        print(f"\n--- STEP 2: Opening synthesized App at {app_url} ---")
        app_page = context.new_page()
        app_console = []
        app_network = []
        app_page.on("console", lambda msg: app_console.append(f"[{msg.type.upper()}] {msg.text}"))
        app_page.on("response", lambda r: app_network.append(f"{r.request.method} {r.url} -> {r.status}"))
        app_page.goto(app_url, wait_until="domcontentloaded")

        print("Page loaded. Inspecting upload elements...")
        file_inputs = app_page.locator('input[type="file"]')
        print(f"Found {file_inputs.count()} file inputs.")
        accept_types = []
        for i in range(file_inputs.count()):
            accept_types.append(file_inputs.nth(i).get_attribute("accept") or "*")
        print(f"File input accept attributes: {accept_types}")

        # Upload the PDF
        print(f"\n--- STEP 2: Uploading PDF: {pdf_path} ---")
        if file_inputs.count() > 0:
            file_inputs.first.set_input_files(pdf_path)
            print("File set on file input.")
        else:
            print("ERROR: No file input found!")

        app_page.wait_for_timeout(2000)

        # Look for Convert / Download button
        print("\n--- STEP 3: Locating and clicking Convert button ---")
        convert_btn = app_page.locator("button:has-text('Convert'), #btn1ClickConvert, #convertBtn, button:has-text('DOCX')")
        print(f"Found {convert_btn.count()} convert buttons.")
        if convert_btn.count() == 0:
            convert_btn = app_page.locator("button")
            for i in range(convert_btn.count()):
                print(f"Button {i}: '{convert_btn.nth(i).inner_text().strip()}'")

        download_file_path = os.path.abspath("scratch/downloaded_result.docx")
        if os.path.exists(download_file_path):
            os.remove(download_file_path)

        # Listen for dialog/alert
        alert_messages = []
        app_page.on("dialog", lambda d: (alert_messages.append(d.message), d.accept()))

        # Click convert and wait for download or errors
        clicked = False
        try:
            with app_page.expect_download(timeout=10000) as download_info:
                convert_btn.first.click()
                clicked = True
            download = download_info.value
            download.save_as(download_file_path)
            print(f"Downloaded file saved to: {download_file_path}")
        except Exception as ex:
            print(f"Download wait exception: {ex}")
            if not clicked and convert_btn.count() > 0:
                convert_btn.first.click()

        app_page.wait_for_timeout(3000)

        print("\n--- Literal Console Output from App ---")
        for log in app_console:
            print(log)

        print("\n--- Dialog / Alert Messages ---")
        for alert in alert_messages:
            print(f"[ALERT] {alert}")

        print("\n--- Literal Network Requests from App ---")
        for net in app_network:
            print(net)

        browser.close()

if __name__ == "__main__":
    run_reproduction()
