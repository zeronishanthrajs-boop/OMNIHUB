import os
import sys
import argparse
from dotenv import load_dotenv
from ultron_flow import create_ultron_graph

# Load env variables
load_dotenv()

def main():
    parser = argparse.ArgumentParser(description="Run ULTRON Phase 2 Orchestrator")
    parser.add_argument("--goal", type=str, help="The goal for the orchestrator")
    parser.add_argument("--mock", action="store_true", help="Run with a mock LLM for local validation")
    args = parser.parse_args()
    
    if args.mock:
        os.environ["ULTRON_MOCK"] = "true"
        if not os.environ.get("NVIDIA_API_KEY"):
            os.environ["NVIDIA_API_KEY"] = "mock"
            
    # Check for API Keys first to fail fast with a clear error
    has_api_key = (
        os.environ.get("NVIDIA_API_KEY") or
        os.environ.get("BOSS_NVIDIA_API_KEY") or
        os.environ.get("PLANNER_NVIDIA_API_KEY") or
        os.environ.get("COORDINATOR_NVIDIA_API_KEY") or
        os.environ.get("RESEARCH_WORKER_NVIDIA_API_KEY") or
        os.environ.get("CODE_WORKER_NVIDIA_API_KEY") or
        os.environ.get("TEST_WORKER_NVIDIA_API_KEY") or
        os.environ.get("WORKER_NVIDIA_API_KEY")
    )
    if not has_api_key:
        print("[ERROR] NVIDIA API Key is not set.")
        print("Please configure BOSS_NVIDIA_API_KEY, PLANNER_NVIDIA_API_KEY, COORDINATOR_NVIDIA_API_KEY, RESEARCH_WORKER_NVIDIA_API_KEY, CODE_WORKER_NVIDIA_API_KEY, TEST_WORKER_NVIDIA_API_KEY, or NVIDIA_API_KEY in environment or .env file.")
        print("Alternatively, run with --mock flag to test locally without an API Key.")
        sys.exit(1)
        
    goal = args.goal
    if not goal:
        goal = input("Enter your goal for ULTRON: ").strip()
        if not goal:
            print("[ERROR] Goal cannot be empty.")
            sys.exit(1)
            
    print(f"\n[ULTRON Initiated] Goal: {goal}")
    if args.mock:
        print("Running in MOCK mode (simulated LLM responses)...\n")
    else:
        print("Initializing LangGraph and connecting to NVIDIA NIM...\n")
    
    graph = create_ultron_graph()
    
    # Initialize state
    state = {
        "goal": goal,
        "boss_feedback": None,
        "planner_briefs": None,
        "logical_tree": None,
        "clarifying_question": None,
        "status": "evaluating_goal",
        "log_history": [],
        "rejection_count": 0,
        "worker_tasks": None,
        "worker_results": None,
        "consolidated_report": None
    }
    
    # Interactive loop to handle clarifications
    while True:
        try:
            print(f"Running LangGraph step (status: {state['status']})...")
            result = graph.invoke(state)
        except Exception as e:
            print(f"\n[ERROR] Error during graph execution: {e}")
            sys.exit(1)
            
        print(f"\n--- Graph State Updated: {result['status']} ---")
        
        if result["status"] == "approved":
            print("\n==================================================")
            print(" SUCCESS: GOAL APPROVED BY BOSS!")
            print("==================================================")
            if result.get("planner_briefs"):
                print("\nFinal Scoped Briefs:")
                print(result["planner_briefs"])
            if result.get("consolidated_report"):
                print("\nConsolidated Execution Report:")
                print(result["consolidated_report"])
            break
            
        elif result["status"] == "clarifying":
            print("\n==================================================")
            print(" INPUT REQUIRED: CLARIFICATION REQUIRED")
            print("==================================================")
            if result.get("clarifying_question"):
                print(f"\nPlanner Question:\n{result['clarifying_question']}")
            elif result.get("boss_feedback"):
                print(f"\nBoss Feedback:\n{result['boss_feedback']}")
                
            response = input("\nYour Response (or type 'exit' to quit): ").strip()
            if not response or response.lower() == 'exit':
                print("Exiting...")
                break
                
            # Update state to resume
            state = {
                **result,
                "goal": f"{result['goal']} (Clarification: {response})",
                "status": "evaluating_goal",  # reset to evaluate the clarified goal
                "boss_feedback": None,
                "clarifying_question": None
            }
            print("\nResubmitting updated goal to ULTRON...\n")
            
        elif result["status"] == "rejected":
            print("\n==================================================")
            print(" FAIL: PLAN/REPORT REJECTED BY BOSS (Max attempts exceeded)")
            print("==================================================")
            print(f"\nBoss Feedback:\n{result['boss_feedback']}")
            break
        else:
            print(f"\nUnexpected status: {result['status']}")
            break

if __name__ == "__main__":
    main()
