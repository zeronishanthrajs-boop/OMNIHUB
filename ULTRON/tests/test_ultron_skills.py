import os
import sys
import time
import unittest
import tempfile
sys.path.insert(0, os.path.abspath("."))
from ultron_skills import UltronSkills

class TestUltronSkills(unittest.TestCase):
    def setUp(self):
        self.skills = UltronSkills(workspace_root=".")

    # -------------------------------------------------------------------------
    # Skill 1: Codebase Exploration & Semantic Inspection
    # -------------------------------------------------------------------------
    def test_01_skill_codebase_exploration(self):
        print("\n[Skill 1/8] Testing Codebase Exploration & Search...")
        # 1. view_file
        res = self.skills.view_file("run_tests.py", start_line=1, end_line=10)
        self.assertEqual(res["status"], "success")
        self.assertIn("1: import os", res["content"])
        self.assertEqual(res["end_line"], 10)

        # 2. grep_search (single file)
        matches = self.skills.grep_search("run_suite", search_path="run_tests.py")
        self.assertGreaterEqual(len(matches), 1)
        self.assertEqual(matches[0]["file"], "run_tests.py")

        # 3. list_dir
        entries = self.skills.list_dir(".", pattern="*.py")
        names = [e["name"] for e in entries]
        self.assertIn("run_tests.py", names)
        self.assertIn("ultron_skills.py", names)
        print("  --> Skill 1: PASSED")

    # -------------------------------------------------------------------------
    # Skill 2: Precision Code Editing
    # -------------------------------------------------------------------------
    def test_02_skill_precision_line_editor(self):
        print("\n[Skill 2/8] Testing Precision Line & Block Editor...")
        # Keep temp file inside workspace
        with tempfile.NamedTemporaryFile(dir=".", suffix=".py", delete=False, mode="w", encoding="utf-8") as f:
            f.write("def alpha():\n    return 42\n\ndef beta():\n    return 100\n")
            temp_path = f.name
        try:
            rel_temp = os.path.relpath(temp_path, ".")
            # Precision replacement
            res = self.skills.replace_file_content(rel_temp, "return 42", "return 99")
            self.assertEqual(res["status"], "success")
            with open(temp_path, 'r', encoding='utf-8') as f:
                content = f.read()
            self.assertIn("return 99", content)
            self.assertNotIn("return 42", content)
            self.assertIn("def beta():", content) # preserved untouched

            # Mismatch error check
            with self.assertRaises(ValueError):
                self.skills.replace_file_content(rel_temp, "non_existent_anchor", "new_code")
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        print("  --> Skill 2: PASSED")

    # -------------------------------------------------------------------------
    # Skill 3: Sandboxed Command & Test Runner
    # -------------------------------------------------------------------------
    def test_03_skill_sandboxed_command_runner(self):
        print("\n[Skill 3/8] Testing Sandboxed Command Execution...")
        res = self.skills.run_sandboxed_command('python -c "print(10 + 20)"')
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["exit_code"], 0)
        self.assertIn("30", res["stdout"].strip())

        with self.assertRaises(PermissionError):
            self.skills.run_sandboxed_command('format c:')
        print("  --> Skill 3: PASSED")

    # -------------------------------------------------------------------------
    # Skill 4: Dynamic Subagent Delegation
    # -------------------------------------------------------------------------
    def test_04_skill_subagent_delegation(self):
        print("\n[Skill 4/8] Testing Dynamic Subagent Delegation...")
        res = self.skills.spawn_subagent(
            role="Security Auditor",
            goal="Scan domain handlers for parameter sanitization",
            domain="backend_api"
        )
        self.assertEqual(res["status"], "success")
        self.assertTrue(os.path.isfile(res["output_artifact"]))
        self.assertEqual(res["data"]["role"], "Security Auditor")
        if os.path.exists(res["output_artifact"]):
            os.unlink(res["output_artifact"])
        print("  --> Skill 4: PASSED")

    # -------------------------------------------------------------------------
    # Skill 5: Interactive Clarification & Dialogue
    # -------------------------------------------------------------------------
    def test_05_skill_interactive_clarification(self):
        print("\n[Skill 5/8] Testing Interactive Clarification Dialogue...")
        res = self.skills.ask_user_dialog(
            question="Select deployment target for quantum compute matrix",
            options=["Edge Cluster", "Local GPU", "NVIDIA NIM Cloud"]
        )
        self.assertEqual(res["status"], "dialog_prompt_rendered")
        dialog = res["dialog"]
        self.assertEqual(dialog["options"][0], "Edge Cluster")
        self.assertEqual(dialog["status"], "waiting_for_user")
        print("  --> Skill 5: PASSED")

    # -------------------------------------------------------------------------
    # Skill 6: Web Retrieval & URL Ingestion
    # -------------------------------------------------------------------------
    def test_06_skill_web_retrieval(self):
        print("\n[Skill 6/8] Testing Web Retrieval...")
        res = self.skills.web_fetch_url("http://127.0.0.1:9999/non-existent")
        self.assertIn("status", res)
        print("  --> Skill 6: PASSED")

    # -------------------------------------------------------------------------
    # Skill 7: Glassmorphic UI & Visual Asset Synthesis
    # -------------------------------------------------------------------------
    def test_07_skill_glassmorphic_synthesis(self):
        print("\n[Skill 7/8] Testing Glassmorphic UI & Visual Styling...")
        res = self.skills.synthesize_glassmorphism("build a flight delay predictor based on speed of wind")
        self.assertEqual(res["status"], "success")
        self.assertTrue(os.path.isfile(res["output_path"]))
        with open(res["output_path"], 'r', encoding='utf-8') as f:
            code = f.read()
        self.assertIn("backdrop-filter: blur(20px)", code)
        self.assertIn("SoundEngine", code)
        print("  --> Skill 7: PASSED")

    # -------------------------------------------------------------------------
    # Skill 8: Task Scheduler & Background Watchdog
    # -------------------------------------------------------------------------
    def test_08_skill_task_scheduler(self):
        print("\n[Skill 8/8] Testing Asynchronous Task Scheduler...")
        fired_flag = []
        def on_fire():
            fired_flag.append(True)

        res = self.skills.schedule_task(delay_seconds=1, prompt="Heartbeat ping", callback=on_fire)
        self.assertEqual(res["status"], "success")
        task_id = res["task_id"]
        
        time.sleep(1.2)
        self.assertEqual(self.skills.scheduled_tasks[task_id]["status"], "fired")
        self.assertTrue(len(fired_flag) > 0)
        print("  --> Skill 8: PASSED")

if __name__ == "__main__":
    unittest.main()
