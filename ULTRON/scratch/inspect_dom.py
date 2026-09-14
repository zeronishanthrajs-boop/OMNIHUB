from playwright.sync_api import sync_playwright

def inspect_dom():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://127.0.0.1:8000", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Inspect mission-console and buttons
        console_box = page.locator(".mission-console").bounding_box()
        launch_box = page.locator("#launchBtn").bounding_box()
        input_box = page.locator("#goalInput").bounding_box()
        sandbox_box = page.locator(".sandbox-panel").bounding_box()
        reactor_box = page.locator(".reactor-hero").bounding_box()

        print("--- BOUNDING BOXES ---")
        print("Reactor:", reactor_box)
        print("Console:", console_box)
        print("LaunchBtn:", launch_box)
        print("Input:", input_box)
        print("Sandbox:", sandbox_box)

        # Check if launchBtn is inside console_box
        if console_box and launch_box:
            console_bottom = console_box['y'] + console_box['height']
            launch_bottom = launch_box['y'] + launch_box['height']
            print(f"Console bottom: {console_bottom}, LaunchBtn bottom: {launch_bottom}")
            if launch_bottom > console_bottom:
                print(f"CLIPPING DETECTED! Button overflows console by {launch_bottom - console_bottom}px")

        browser.close()

if __name__ == "__main__":
    inspect_dom()
