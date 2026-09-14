import os
import sys
import time
import unittest

def run_suite():
    print("=" * 70)
    print("      ULTRON AUTOMATED WHITE-BOX & BLACK-BOX TEST SUITE RUNNER      ")
    print("=" * 70)
    
    loader = unittest.TestLoader()
    start_dir = os.path.join(os.path.dirname(__file__), 'tests')
    suite = loader.discover(start_dir, pattern='test_*.py')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 70)
    print(f"Total Tests Run: {result.testsRun}")
    print(f"Errors: {len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Success Rate: {((result.testsRun - len(result.errors) - len(result.failures)) / result.testsRun) * 100:.1f}%")
    print("=" * 70)
    
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_suite())
