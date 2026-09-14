import os
import sys
import unittest
import tempfile
sys.path.insert(0, os.path.abspath("."))
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None
from glassmorphic_engine import synthesize_glassmorphic_app

class TestGlassmorphicVisualDOM(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if sync_playwright is None:
            raise unittest.SkipTest("Playwright not installed in environment")
        cls.artifact_dir = r"C:\Users\sakth\.gemini\antigravity\brain\38d2deb4-386f-4dfd-994a-4f6c936b14e0"
        os.makedirs(cls.artifact_dir, exist_ok=True)
        try:
            cls.playwright = sync_playwright().start()
            cls.browser = cls.playwright.chromium.launch(channel="chrome", headless=True)
        except Exception as e:
            cls.browser = None
            cls.skip_reason = str(e)

    @classmethod
    def tearDownClass(cls):
        if getattr(cls, 'browser', None):
            cls.browser.close()
        if getattr(cls, 'playwright', None):
            cls.playwright.stop()

    def setUp(self):
        if self.browser is None:
            self.skipTest(f"Playwright Chrome not available: {getattr(self, 'skip_reason', '')}")
        self.page = self.browser.new_page(viewport={"width": 1280, "height": 800})

    def tearDown(self):
        if hasattr(self, 'page'):
            self.page.close()

    def test_01_visual_dom_calculator(self):
        html_code = synthesize_glassmorphic_app("build a simple web calculator with glassmorphic ui")
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name
        try:
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")
            panel = self.page.locator(".glass-panel").first
            backdrop_filter = panel.evaluate("el => window.getComputedStyle(el).backdropFilter || window.getComputedStyle(el)['-webkit-backdrop-filter']")
            self.assertIn("blur", backdrop_filter)
            self.page.screenshot(path=os.path.join(self.artifact_dir, "glassmorphic_calc_verified.png"))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_02_visual_dom_flight_delay_predictor(self):
        html_code = synthesize_glassmorphic_app("build a flight delay predictor based on speed of wind")
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name
        try:
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")
            self.page.select_option("#shear-select", "severe")
            self.page.fill("#wind-slider", "60")
            self.page.click("#recalc-btn")
            status = self.page.text_content("#risk-status")
            self.assertIn("HIGH", status.upper())
            self.page.screenshot(path=os.path.join(self.artifact_dir, "glassmorphic_flight_verified.png"))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_03_visual_dom_automatic_pdf_studio(self):
        html_code = synthesize_glassmorphic_app("build an automatic pdf builder and invoice studio")
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name
        try:
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")
            subtotal = self.page.locator("#preview-subtotal").text_content()
            self.assertIn("$", subtotal)
            self.page.fill("#item-desc", "Quantum Cryptography Security Audit")
            self.page.fill("#item-price", "5000")
            self.page.click("button:has-text('+ Add Item')")
            new_subtotal = self.page.locator("#preview-subtotal").text_content()
            self.assertNotEqual(subtotal, new_subtotal)
            self.page.screenshot(path=os.path.join(self.artifact_dir, "glassmorphic_pdf_verified.png"))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_04_visual_dom_task_manager_kanban(self):
        html_code = synthesize_glassmorphic_app("build a task manager app with priority board")
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name
        try:
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")
            initial_count = self.page.locator(".task-item").count()
            self.page.fill("#task-input", "Automate E2E Regression")
            self.page.click("#btn-add-task")
            task_items = self.page.locator(".task-item").count()
            self.assertEqual(task_items, initial_count + 1)
            self.page.screenshot(path=os.path.join(self.artifact_dir, "glassmorphic_task_verified.png"))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_05_visual_dom_universal_waveform_matrix(self):
        html_code = synthesize_glassmorphic_app("build a high frequency trading risk matrix dashboard")
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name
        try:
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")
            canvas = self.page.locator("canvas")
            self.assertTrue(canvas.is_visible())
            self.page.screenshot(path=os.path.join(self.artifact_dir, "glassmorphic_universal_verified.png"))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_06_visual_dom_ultron_dashboard(self):
        from dashboard import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        html_code = res.text

        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name
        try:
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")
            if self.page.locator(".hud-frame").count() > 0:
                hud_frame = self.page.locator(".hud-frame").first
                backdrop_filter = hud_frame.evaluate("el => window.getComputedStyle(el).backdropFilter || window.getComputedStyle(el)['-webkit-backdrop-filter']")
                self.assertIn("blur", backdrop_filter)
                glow_orbs = self.page.locator(".ambient-glow")
                self.assertGreaterEqual(glow_orbs.count(), 2)
            else:
                # Antigravity Command Deck architecture
                self.assertGreaterEqual(self.page.locator(".top-app-bar").count(), 1)
                self.assertGreaterEqual(self.page.locator(".prompt-card").count(), 1)
                self.assertGreaterEqual(self.page.locator(".nav-rail").count(), 1)
                prompt_card = self.page.locator(".prompt-card").first
                border_style = prompt_card.evaluate("el => window.getComputedStyle(el).borderRadius")
                self.assertTrue(bool(border_style))

            # Capture verified screenshot of the upgraded ULTRON Dashboard
            screenshot_path = os.path.join(self.artifact_dir, "glassmorphic_ultron_dashboard_verified.png")
            self.page.screenshot(path=screenshot_path)
            self.assertTrue(os.path.isfile(screenshot_path))
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

if __name__ == "__main__":
    unittest.main()
