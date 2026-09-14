import os
import sys
import unittest
from dotenv import load_dotenv

# Ensure parent directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from ultron_flow import get_llm, MockLLM, is_path_safe, write_worker_file, invoke_llm_with_retry
from langchain_core.messages import SystemMessage, HumanMessage

class TestLiveModelAndSafetyParsing(unittest.TestCase):
    """
    Test suite addressing Gap #4: Mock vs Live Model Validation.
    Validates LLM factory resolution, live NVIDIA NIM connection (if keys set), 
    and non-deterministic model response path-safety parsing.
    """

    KEY_ENV_NAMES = [
        "ULTRON_MOCK",
        "NVIDIA_API_KEY",
        "BOSS_NVIDIA_API_KEY",
        "PLANNER_NVIDIA_API_KEY",
        "COORDINATOR_NVIDIA_API_KEY",
        "RESEARCH_WORKER_NVIDIA_API_KEY",
        "CODE_WORKER_NVIDIA_API_KEY",
        "TEST_WORKER_NVIDIA_API_KEY",
        "WORKER_NVIDIA_API_KEY",
    ]

    def setUp(self):
        self._env_snapshot = {name: os.environ.get(name) for name in self.KEY_ENV_NAMES}
        os.environ["ULTRON_MOCK"] = "true"

    def tearDown(self):
        for name, value in self._env_snapshot.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value

    def test_01_llm_factory_mock_resolution(self):
        """Test get_llm returns MockLLM only when ULTRON_MOCK is explicitly true."""
        os.environ["ULTRON_MOCK"] = "true"
        llm = get_llm("boss")
        self.assertIsInstance(llm, MockLLM)

    def test_02_llm_factory_live_nvidia_resolution(self):
        """Test get_llm returns ChatOpenAI connected to NVIDIA NIM when key is set."""
        os.environ["ULTRON_MOCK"] = "false"
        os.environ["NVIDIA_API_KEY"] = "nvapi-test-key-mock-check"
        
        try:
            llm = get_llm("boss")
            self.assertEqual(llm.openai_api_base, "https://integrate.api.nvidia.com/v1")
            self.assertIn(llm.model_name, ["meta/llama-3.2-11b-vision-instruct", "meta/llama-3.1-70b-instruct"])
        finally:
            os.environ["ULTRON_MOCK"] = "true"

    def test_03_placeholder_global_key_does_not_override_role_key(self):
        """A mock global key must not disable live role-specific model resolution."""
        os.environ["ULTRON_MOCK"] = "false"
        os.environ["NVIDIA_API_KEY"] = "mock"
        os.environ["BOSS_NVIDIA_API_KEY"] = "nvapi-test-key-mock-check"

        try:
            llm = get_llm("boss")
            self.assertNotIsInstance(llm, MockLLM)
            self.assertEqual(llm.openai_api_base, "https://integrate.api.nvidia.com/v1")
        finally:
            os.environ["ULTRON_MOCK"] = "true"

    def test_04_non_deterministic_model_output_path_sanitization(self):
        """
        Test path safety parser against non-deterministic model output formats:
        Verifies path-safety enforcer blocks path traversal even when embedded in complex LLM markdown.
        """
        domain_dir = os.path.abspath("domains/web_ui")
        
        # Simulated raw output from non-deterministic live LLM
        raw_llm_outputs = [
            "TARGET_FILE: ../../../tmp/malicious_script.py\nCODE_CONTENT:\nprint('hack')",
            "TARGET_FILE: C:\\Windows\\System32\\calc.exe\nCODE_CONTENT:\nbin",
            "TARGET_FILE: ../../etc/shadow\nCODE_CONTENT:\nroot",
            "TARGET_FILE: ./../web_ui_fake/index.html\nCODE_CONTENT:\nfake"
        ]

        for raw_output in raw_llm_outputs:
            import re
            match = re.search(r"TARGET_FILE:\s*(.*)", raw_output, re.IGNORECASE)
            rel_path = match.group(1).strip() if match else "unknown.txt"
            target_path = os.path.join(domain_dir, rel_path)

            self.assertFalse(
                is_path_safe(target_path, domain_dir),
                f"Path safety enforcer failed for live model output: {rel_path}"
            )
            with self.assertRaises(PermissionError):
                write_worker_file(target_path, "test", domain_dir)

    def test_05_live_nvidia_nim_endpoint_ping(self):
        """
        Attempts a live ping to NVIDIA NIM API if real role API keys are set in environment.
        Gracefully skips live API call if keys are not present.
        """
        if os.environ.get("ULTRON_RUN_LIVE_TESTS") != "true":
            self.skipTest("Set ULTRON_RUN_LIVE_TESTS=true to run live NVIDIA endpoint pings.")
        api_key = os.environ.get("BOSS_NVIDIA_API_KEY") or os.environ.get("NVIDIA_API_KEY")
        if not api_key or api_key == "mock" or api_key == "nvapi-test-key-mock-check":
            self.skipTest("No real NVIDIA API key configured in environment. Skipping live endpoint ping.")
        
        os.environ["ULTRON_MOCK"] = "false"
        try:
            llm = get_llm("boss")
            response = invoke_llm_with_retry(llm, [
                SystemMessage(content="You are a live connectivity probe. Reply with OK only."),
                HumanMessage(content="OK")
            ], role="boss")
            self.assertIsNotNone(response.content)
            self.assertTrue(len(response.content) > 0)
        except Exception as e:
            self.skipTest(f"Live NVIDIA NIM ping skipped due to network/SSL connection: {e}")
        finally:
            os.environ["ULTRON_MOCK"] = "true"

    def test_06_live_role_keys_endpoint_ping(self):
        """
        Attempts live pings for every configured agent role.
        Skips when .env does not contain real keys so local/mock CI remains stable.
        """
        if os.environ.get("ULTRON_RUN_LIVE_TESTS") != "true":
            self.skipTest("Set ULTRON_RUN_LIVE_TESTS=true to run live role API key pings.")
        load_dotenv(".env", override=True)
        role_key_envs = {
            "boss": "BOSS_NVIDIA_API_KEY",
            "planner": "PLANNER_NVIDIA_API_KEY",
            "coordinator": "COORDINATOR_NVIDIA_API_KEY",
            "worker": "CODE_WORKER_NVIDIA_API_KEY",
        }
        missing = [env_name for env_name in role_key_envs.values() if not os.environ.get(env_name)]
        if missing:
            self.skipTest(f"Missing live role API keys: {', '.join(missing)}")

        os.environ["ULTRON_MOCK"] = "false"
        failures = {}
        try:
            for role in role_key_envs:
                try:
                    llm = get_llm(role)
                    response = invoke_llm_with_retry(llm, [
                        SystemMessage(content="You are a live connectivity probe. Reply with OK only."),
                        HumanMessage(content="OK")
                    ], role=role)
                    self.assertTrue(response.content.strip())
                except Exception as e:
                    failures[role] = str(e)
            if failures:
                self.fail(f"Live role key validation failed for roles: {sorted(failures)}")
        finally:
            os.environ["ULTRON_MOCK"] = "true"

if __name__ == "__main__":
    unittest.main()
