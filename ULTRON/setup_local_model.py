"""
ULTRON Local Model Setup & Verification Tool
Use this tool to configure, verify, and test running ULTRON on a 100% local model (e.g. Qwen 2.5 Coder 7B or Llama 3.1 8B).
"""

import sys
import os
import time
import shutil
import subprocess

def print_header(title):
    print("\n" + "=" * 65)
    print(f"  ULTRON // {title}")
    print("=" * 65)

def check_local_server(url="http://127.0.0.1:11434"):
    try:
        import httpx
        r = httpx.get(f"{url}/api/tags", timeout=2.0)
        if r.status_code == 200:
            models = [m.get("name") for m in r.json().get("models", [])]
            return True, models
    except Exception:
        pass
    return False, []

def main():
    print_header("100% Local Model Engine Setup")
    print("Checking for local LLM server (Ollama at http://127.0.0.1:11434)...")
    
    is_up, models = check_local_server()
    
    if is_up:
        print("\n[SUCCESS] Local LLM Server is ONLINE!")
        print(f"Installed Models ({len(models)}):")
        for m in models:
            print(f"  - {m}")
        
        target_model = os.environ.get("LOCAL_MODEL_NAME", "llama3.1:8b")
        has_target = any(target_model.split(":")[0] in m for m in models)
        
        if not has_target:
            print(f"\n[INFO] Recommended model '{target_model}' is not yet downloaded.")
            print(f"To download and run it locally, execute:")
            print(f"    ollama pull {target_model}")
            print(f"    (Size: ~4.7 GB | Fits easily in your 19.8 GB RAM)")
        else:
            print(f"\n[READY] Target model '{target_model}' is available!")
            
            # Run quick inference benchmark
            print("\nRunning quick local test inference...")
            try:
                import ultron_flow
                os.environ["LLM_BACKEND"] = "local"
                llm = ultron_flow.get_llm("boss")
                
                from langchain_core.messages import SystemMessage, HumanMessage
                t0 = time.time()
                res = llm.invoke([
                    SystemMessage(content="You are the Boss architect of ULTRON."),
                    HumanMessage(content="Evaluate this goal: Build an offline markdown previewer.")
                ])
                dur = time.time() - t0
                print(f"[BENCHMARK] Local Model Response Time: {dur:.2f}s")
                print(f"[OUTPUT PREVIEW]:\n{res.content[:200]}...")
                print("\n" + "=" * 65)
                print("  STATUS: 100% READY FOR LOCAL OFFLINE MULTI-AGENT EXECUTION")
                print("=" * 65)
            except Exception as e:
                print(f"[ERROR] Inference test failed: {e}")
    else:
        print("\n[STATUS] Local LLM server is not detected on http://127.0.0.1:11434.")
        print("\nTo set up your local model with zero token costs:")
        print("1. Download & Install Ollama from: https://ollama.com/download/windows")
        print("   (Or run: winget install Ollama.Ollama)")
        print("2. Once installed, start Ollama and pull your preferred model:")
        print("   ollama pull qwen2.5-coder:7b")
        print("   # or: ollama pull llama3.1:8b")
        print("3. Re-run this script to verify: python setup_local_model.py")

if __name__ == "__main__":
    main()
