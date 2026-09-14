import os
import unittest
import tempfile
from playwright.sync_api import sync_playwright
import astra_engine as bat

class TestAstraInteractivityCompleteness(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        try:
            cls.browser = cls.playwright.chromium.launch(channel="chrome", headless=True)
        except Exception:
            cls.browser = cls.playwright.chromium.launch(channel="msedge", headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1280, "height": 800})
        self.page = self.context.new_page()
        self.console_errors = []
        self.page.on("console", lambda msg: self.console_errors.append(msg.text) if msg.type == "error" else None)

    def tearDown(self):
        self.context.close()

    def test_01_hero_customizer_and_cart(self):
        prompt = "create a website for selling a single table fan worth 200$ we have 300 peice on stock after discount price will be 277$ make sure high quality"
        html_code = bat.get_astra_ecommerce_html(prompt)
        
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name

        try:
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")
            
            # Verify Title & Price
            self.assertIn("Table Fan", self.page.title())
            price_text = self.page.locator("#heroPriceDisplay").text_content()
            self.assertIn("277", price_text)
            
            # Step quantity up
            self.page.click("button:has-text('+')")
            qty = self.page.locator("#heroQtyInput").input_value()
            self.assertEqual(qty, "2")

            # Click variant
            self.page.click("button:has-text('Cyber Cyan')")
            var_label = self.page.locator("#selectedVariantLabel").text_content()
            self.assertIn("Cyber Cyan", var_label)

            # Add to cart
            self.page.click("#heroAddToCartBtn")
            self.page.wait_for_timeout(300)
            badge_count = self.page.locator("#cartBadgeCount").text_content()
            self.assertEqual(badge_count, "2")

            # Open cart drawer
            self.page.click("#openCartBtn")
            self.page.wait_for_selector("#cartDrawer.open")
            self.assertTrue(self.page.locator(".cart-item-row").count() >= 1)

            # Apply coupon
            self.page.fill("#couponInput", "ASTRA20")
            self.page.click("button:has-text('Apply')")
            self.page.wait_for_timeout(200)
            notice = self.page.locator("#couponNotice").text_content()
            self.assertIn("ASTRA20 applied", notice)

            # Proceed to checkout modal
            self.page.click("button:has-text('Proceed to Checkout')")
            self.page.wait_for_selector("#checkoutModal.open")

            # Step 1 to Step 2
            self.page.click("button:has-text('Continue to Payment')")
            self.page.wait_for_selector("#checkoutStep2", state="visible")

            # Step 2 to Step 3 (Order Complete)
            self.page.click("button:has-text('Confirm & Pay Order')")
            self.page.wait_for_selector("#checkoutStep3", state="visible")
            order_id = self.page.locator("#confirmedOrderId").text_content()
            self.assertTrue(order_id.startswith("#ASTRA-"))

            # Close checkout modal
            self.page.click("button:has-text('Continue Shopping')")
            self.page.wait_for_timeout(200)

            # Test Review submission
            self.page.fill("#reviewerName", "Jordan Prime")
            self.page.fill("#reviewerTitle", "Flawless Performance")
            self.page.fill("#reviewerComment", "Top-tier table fan. Perfectly balanced and silent.")
            self.page.click("button:has-text('Submit Verified Review')")
            self.page.wait_for_timeout(300)
            first_review = self.page.locator(".review-card").first.text_content()
            self.assertIn("Jordan Prime", first_review)

            # Test Theme Toggle
            self.page.click("#themeToggleBtn")
            theme_attr = self.page.locator("html").get_attribute("data-theme")
            self.assertEqual(theme_attr, "light")

            # Zero console errors
            self.assertEqual(len(self.console_errors), 0, f"Console errors: {self.console_errors}")

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_02_mobile_responsiveness_and_drawer(self):
        prompt = "create a website for selling a single table fan worth 200$ we have 300 peice on stock after discount price will be 277$ make sure high quality"
        html_code = bat.get_astra_ecommerce_html(prompt)
        
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
            f.write(html_code)
            temp_path = f.name

        try:
            # Set to mobile viewport (iPhone 390x844)
            self.page.set_viewport_size({"width": 390, "height": 844})
            self.page.goto(f"file:///{temp_path.replace(os.sep, '/')}", wait_until="load")

            # Hamburger should be visible on mobile
            hamburger = self.page.locator("#mobileMenuBtn")
            self.assertTrue(hamburger.is_visible())

            # Open mobile drawer
            hamburger.click()
            self.page.wait_for_selector("#mobileDrawer.open")

            # Close drawer
            self.page.click("#mobileDrawerCloseBtn")
            self.page.wait_for_timeout(300)
            is_open = self.page.locator("#mobileDrawer").evaluate("el => el.classList.contains('open')")
            self.assertFalse(is_open)

            # Zero console errors
            self.assertEqual(len(self.console_errors), 0)

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

if __name__ == "__main__":
    unittest.main()
