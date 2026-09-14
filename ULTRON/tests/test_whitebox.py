import os
import sys
import json
import unittest

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from ultron_flow import (
    is_path_safe,
    write_worker_file,
    create_ultron_graph,
    MockLLM
)

class TestWhiteBoxSecurityAndFlow(unittest.TestCase):
    """
    White-Box Unit Test Suite for ULTRON Multi-Agent Orchestrator.
    Tests internal path security, domain sandboxing, LangGraph nodes, and Mock LLM.
    """

    def setUp(self):
        self.domain_dir = os.path.abspath("domains/web_ui")
        os.makedirs(self.domain_dir, exist_ok=True)
        os.environ["ULTRON_MOCK"] = "true"

    def test_01_path_safety_valid_paths(self):
        """White-box test: Verify valid relative & absolute paths inside domain directory."""
        valid_paths = [
            os.path.join(self.domain_dir, "index.html"),
            os.path.join(self.domain_dir, "assets", "style.css"),
            os.path.join(self.domain_dir, "js", "app.js"),
            "domains/web_ui/index.html",
            "domains/web_ui/components/header.html"
        ]
        for path in valid_paths:
            self.assertTrue(
                is_path_safe(path, self.domain_dir),
                f"White-box security assertion failed for valid path: {path}"
            )

    def test_02_path_safety_traversal_attempts(self):
        """White-box test: Verify rejection of path traversal security attacks."""
        malicious_paths = [
            "../../hacked.txt",
            os.path.join(self.domain_dir, "..", "..", "secrets.json"),
            "domains/web_ui/../../etc/passwd",
            "domains/web_ui_fake/index.html",
            "C:\\Windows\\System32\\cmd.exe"
        ]
        for path in malicious_paths:
            self.assertFalse(
                is_path_safe(path, self.domain_dir),
                f"White-box security check failed! Malicious path allowed: {path}"
            )

    def test_03_restricted_file_writer_success(self):
        """White-box test: Verify write_worker_file succeeds within sandbox boundary."""
        test_file = os.path.join(self.domain_dir, "test_file.html")
        test_content = "<div>Unit Test Content</div>"
        
        result = write_worker_file(test_file, test_content, self.domain_dir)
        self.assertIn("File successfully written", result)
        self.assertTrue(os.path.exists(test_file))
        
        with open(test_file, "r", encoding="utf-8") as f:
            self.assertEqual(f.read(), test_content)

    def test_04_restricted_file_writer_boundary_violation(self):
        """White-box test: Verify write_worker_file raises PermissionError on boundary breach."""
        forbidden_file = os.path.abspath("hacked_boundary.txt")
        with self.assertRaises(PermissionError):
            write_worker_file(forbidden_file, "hack content", self.domain_dir)

    def test_05_mock_llm_calculator_branch(self):
        """White-box test: Verify MockLLM prompt parsing for calculator goal."""
        mock = MockLLM()
        msg_boss = [type('msg', (), {'content': 'Evaluate the User\'s goal: "Build a simple web calculator"'})()]
        res_boss = mock.invoke(msg_boss)
        self.assertIn("DECISION: PLANNING", res_boss.content)

        msg_planner = [type('msg', (), {'content': 'You are the Planner. Goal: "Build a simple web calculator"'})()]
        res_planner = mock.invoke(msg_planner)
        self.assertIn("DECISION: BRIEFS", res_planner.content)
        self.assertIn("Calculator UI Layout", res_planner.content)

    def test_06_mock_llm_pdf_builder_branch(self):
        """White-box test: Verify MockLLM prompt parsing for PDF builder goal."""
        mock = MockLLM()
        msg_planner = [type('msg', (), {'content': 'You are the Planner. Goal: "Build an automatic PDF builder app"'})()]
        res_planner = mock.invoke(msg_planner)
        self.assertIn("DECISION: BRIEFS", res_planner.content)
        self.assertIn("Automatic PDF Builder", res_planner.content)

    def test_07_mock_llm_vague_goal_clarification(self):
        """White-box test: Verify MockLLM triggers clarification decision on vague goals."""
        mock = MockLLM()
        msg_boss = [type('msg', (), {'content': 'Evaluate the User\'s goal: "Make something cool"' })()]
        res_boss = mock.invoke(msg_boss)
        self.assertIn("DECISION: CLARIFY", res_boss.content)

    def test_08_mock_llm_boundary_violation_rejection(self):
        """White-box test: Verify MockLLM worker emits boundary violation code on attack goal."""
        mock = MockLLM()
        msg_worker = [type('msg', (), {'content': 'You are the Domain Worker. Task: trigger boundary violation hack'})()]
        res_worker = mock.invoke(msg_worker)
        self.assertIn("TARGET_FILE: ../../hacked.txt", res_worker.content)

    def test_09_langgraph_instantiation(self):
        """White-box test: Verify LangGraph graph compiles without errors."""
        graph = create_ultron_graph()
        self.assertIsNotNone(graph)

if __name__ == "__main__":
    unittest.main()
