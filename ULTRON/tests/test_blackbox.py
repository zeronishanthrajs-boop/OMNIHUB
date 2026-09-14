import os
import sys
import time
import unittest
from fastapi.testclient import TestClient

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from dashboard import app, execution_state, current_state

class TestBlackBoxDashboardAndApps(unittest.TestCase):
    """
    Black-Box Integration Test Suite for ULTRON Multi-Agent Dashboard & Apps.
    Simulates human user operations via FastAPI TestClient (HTTP requests to localhost APIs).
    """

    @classmethod
    def setUpClass(cls):
        os.environ["ULTRON_MOCK"] = "true"
        cls.client = TestClient(app)

    def setUp(self):
        # Reset execution state before each test case
        os.environ["ULTRON_MOCK"] = "true"
        execution_state["is_running"] = False
        execution_state["current_goal"] = ""
        execution_state["status"] = "Idle"
        execution_state["error"] = None
        import dashboard
        dashboard.current_state = None

    def test_01_blackbox_dashboard_home_render(self):
        """Black-box test: Verify dashboard console loads at GET /"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue("Antigravity" in response.text or "ULTRON" in response.text)
        self.assertTrue("Ask anything" in response.text or "Goal Launcher" in response.text)

    def test_02_blackbox_calculator_app_generation(self):
        """Black-box test: Submit Calculator goal, wait for execution, verify web app UI."""
        payload = {"goal": "Build a simple web calculator", "mock": True}
        run_res = self.client.post("/api/run", json=payload)
        self.assertEqual(run_res.status_code, 200)
        self.assertEqual(run_res.json()["status"], "success")

        # Wait for background task loop to complete
        for _ in range(15):
            time.sleep(0.3)
            state_res = self.client.get("/api/state")
            data = state_res.json()
            if not data.get("is_running") and data.get("status_code") in ["approved", "rejected"]:
                break

        # Verify graph approved status
        state_data = self.client.get("/api/state").json()
        if state_data.get("status_code") != "approved":
            print("\n[DIAGNOSTIC] Calculator goal failed with state:", state_data)
        self.assertEqual(state_data.get("status_code"), "approved")

        # Access generated Calculator app at /web_ui/
        app_res = self.client.get("/web_ui/")
        self.assertEqual(app_res.status_code, 200)
        html = app_res.text
        self.assertIn("ULTRON Calc", html)
        self.assertIn('id="display"', html)
        self.assertIn('id="expression"', html)
        self.assertIn('id="btn-equals"', html)
        self.assertIn('calculate()', html)

    def test_03_blackbox_pdf_builder_app_generation(self):
        """Black-box test: Submit Automatic PDF Builder goal, wait for execution, verify web app UI."""
        payload = {"goal": "Build an automatic PDF builder app", "mock": True}
        run_res = self.client.post("/api/run", json=payload)
        self.assertEqual(run_res.status_code, 200)

        # Wait for background task loop to complete
        for _ in range(15):
            time.sleep(0.3)
            state_res = self.client.get("/api/state")
            data = state_res.json()
            if not data.get("is_running") and data.get("status_code") in ["approved", "rejected"]:
                break

        state_data = self.client.get("/api/state").json()
        self.assertEqual(state_data.get("status_code"), "approved")

        # Access generated PDF Builder app at /web_ui/
        app_res = self.client.get("/web_ui/")
        self.assertEqual(app_res.status_code, 200)
        html = app_res.text
        self.assertIn("Automatic PDF Studio", html)
        self.assertIn('id="pdf-title"', html)
        self.assertIn('id="pdf-preview-box"', html)
        self.assertIn('id="btn-generate-pdf"', html)
        self.assertIn('window.print()', html)

    def test_04_blackbox_task_manager_app_generation(self):
        """Black-box test: Submit Task Manager goal, wait for execution, verify web app UI."""
        payload = {"goal": "Build a task manager app", "mock": True}
        run_res = self.client.post("/api/run", json=payload)
        self.assertEqual(run_res.status_code, 200)

        for _ in range(15):
            time.sleep(0.3)
            state_res = self.client.get("/api/state")
            data = state_res.json()
            if not data.get("is_running") and data.get("status_code") in ["approved", "rejected"]:
                break

        state_data = self.client.get("/api/state").json()
        self.assertEqual(state_data.get("status_code"), "approved")

        app_res = self.client.get("/web_ui/")
        self.assertEqual(app_res.status_code, 200)
        html = app_res.text
        self.assertIn("ULTRON Task Manager", html)
        self.assertIn('id="task-input"', html)
        self.assertIn('id="btn-add-task"', html)

    def test_05_blackbox_vague_goal_clarification_dialog(self):
        """Black-box test: Submit vague goal, handle clarification dialog via API, verify resume."""
        payload = {"goal": "Make something cool", "mock": True}
        run_res = self.client.post("/api/run", json=payload)
        self.assertEqual(run_res.status_code, 200)

        # Wait for state to reach clarifying
        for _ in range(15):
            time.sleep(0.3)
            state_res = self.client.get("/api/state")
            if state_res.json().get("status_code") == "clarifying":
                break

        # Check clarification question endpoint
        clarify_res = self.client.get("/api/clarification")
        self.assertEqual(clarify_res.status_code, 200)
        self.assertIsNotNone(clarify_res.json().get("question"))

        # Submit user response to resume execution
        resume_payload = {"response": "Target platform Web UI, counter application"}
        resume_res = self.client.post("/api/resume", json=resume_payload)
        self.assertEqual(resume_res.status_code, 200)

        # Wait for graph to complete
        for _ in range(15):
            time.sleep(0.3)
            state_res = self.client.get("/api/state")
            data = state_res.json()
            if not data.get("is_running") and data.get("status_code") in ["approved", "rejected"]:
                break

        state_data = self.client.get("/api/state").json()
        self.assertEqual(state_data.get("status_code"), "approved")

    def test_06_blackbox_sandbox_violation_rejection(self):
        """Black-box test: Submit boundary violation goal, verify rejection by Boss."""
        payload = {"goal": "Trigger boundary violation hack", "mock": True}
        run_res = self.client.post("/api/run", json=payload)
        self.assertEqual(run_res.status_code, 200)

        for _ in range(15):
            time.sleep(0.3)
            state_res = self.client.get("/api/state")
            data = state_res.json()
            if not data.get("is_running") and data.get("status_code") in ["approved", "rejected"]:
                break

        state_data = self.client.get("/api/state").json()
        self.assertEqual(state_data.get("status_code"), "rejected")

    def test_07_blackbox_rules_api_endpoints(self):
        """Black-box test: Test GET /api/rules, POST /api/rules/add, POST /api/rules/archive"""
        rules_res = self.client.get("/api/rules")
        self.assertEqual(rules_res.status_code, 200)
        self.assertIn("core", rules_res.json())

        add_res = self.client.post("/api/rules/add", json={"text": "Test rule validation"})
        self.assertEqual(add_res.status_code, 200)
        rule_data = add_res.json()["rule"]
        rule_id = rule_data["id"]

        archive_res = self.client.post(f"/api/rules/archive/{rule_id}")
        self.assertEqual(archive_res.status_code, 200)
        self.assertEqual(archive_res.json()["status"], "success")

    def test_08_blackbox_skills_api_endpoint(self):
        """Black-box test: Test GET /api/skills returns all 8 active Antigravity skills"""
        res = self.client.get("/api/skills")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(len(data["skills"]), 8)
        skill_ids = [s["id"] for s in data["skills"]]
        self.assertIn("codebase_exploration", skill_ids)
        self.assertIn("precision_editing", skill_ids)
        self.assertIn("glassmorphic_ui", skill_ids)

if __name__ == "__main__":
    unittest.main()
