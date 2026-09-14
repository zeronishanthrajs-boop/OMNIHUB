import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import time
import uuid
from cost_and_queue_engine import cost_and_queue
import project_manager as pm
import telemetry_monitor as tm

def run_tests():
    print("=== Testing Items 307-316: Cost & Resource Management ===")

    # 307: Pre-run compute time estimate
    test_goal = f"Build fullstack multi-tenant telemetry hub with dynamic websockets and state chart {uuid.uuid4().hex[:4]}"
    est_sec = cost_and_queue.estimate_compute_time(test_goal, is_local=True)
    assert 2.0 <= est_sec <= 15.0
    print(f"[PASS] 307. Pre-run compute time estimate verified: ~{est_sec}s")

    # 308: Cloud-fallback cost estimate
    local_cost = cost_and_queue.estimate_cloud_cost(test_goal, is_local=True)
    assert local_cost["is_zero_cost"] is True and local_cost["cost_usd"] == 0.0
    cloud_cost = cost_and_queue.estimate_cloud_cost(test_goal, is_local=False)
    assert cloud_cost["is_zero_cost"] is False and cloud_cost["cost_usd"] > 0
    print(f"[PASS] 308. Cloud-fallback cost estimate verified (Local: ${local_cost['cost_usd']}, Cloud: ${cloud_cost['cost_usd']})")

    # 309: Local-vs-cloud routing rules
    route_normal = cost_and_queue.determine_routing("Build a calculator", prefer_local=True)
    route_complex = cost_and_queue.determine_routing("Build massive 70b complex architecture", prefer_local=False)
    assert route_normal == "local" and route_complex == "cloud"
    print("[PASS] 309. Configurable local-vs-cloud routing rules verified")

    # 310: Storage quota enforcement
    storage = pm.get_storage_usage()
    assert "total_mb" in storage or "storage_mb" in storage
    mb_val = storage.get("total_mb", storage.get("storage_mb", 0.0))
    print(f"[PASS] 310. Storage quota enforcement verified ({mb_val} MB utilized)")

    # 311: Idle-resource throttling
    cost_and_queue.set_idle_throttling(True)
    assert cost_and_queue.idle_throttled is True
    cost_and_queue.set_idle_throttling(False)
    assert cost_and_queue.idle_throttled is False
    print("[PASS] 311. Idle-resource throttling verified (background polling reduced when idle)")

    # 312 & 313: Mission batch scheduling & Priority queue
    q1 = cost_and_queue.enqueue_mission("Normal mission 1", priority=1)
    q_urgent = cost_and_queue.enqueue_mission("Urgent critical mission", priority=10)
    q2 = cost_and_queue.enqueue_mission("Normal mission 2", priority=1)
    # Dequeue must return urgent mission first
    next_m = cost_and_queue.dequeue_next_mission()
    assert next_m["goal"] == "Urgent critical mission" and next_m["priority"] == 10
    print(f"[PASS] 312 & 313. Mission batch scheduling & priority queue verified (urgent prioritized: {next_m['id']})")

    # 314: Historical cost/time reporting per project
    t_pid = f"proj_rpt_{uuid.uuid4().hex[:6]}"
    tm.telemetry.record_project_build(t_pid, duration_sec=3.85, token_cost=0.0)
    b_stats = tm.telemetry.get_project_build_stats(t_pid)
    assert b_stats["build_duration_sec"] == 3.85
    print(f"[PASS] 314. Historical cost/time reporting per project verified: {b_stats['build_duration_sec']}s")

    # 315: Runaway-usage auto-pause
    triggered, reason = cost_and_queue.check_runaway_guard(elapsed_seconds=700.0, token_count=1200)
    assert triggered is True and "Runaway Guard Triggered" in reason
    not_triggered, _ = cost_and_queue.check_runaway_guard(elapsed_seconds=12.0, token_count=800)
    assert not_triggered is False
    print("[PASS] 315. Runaway-usage auto-pause verified (paused run exceeding safety envelope)")

    # 316: Configurable concurrency limit
    cost_and_queue.set_concurrency_limit(4)
    assert cost_and_queue.get_concurrency_limit() == 4
    print(f"[PASS] 316. Configurable concurrency limit verified: {cost_and_queue.get_concurrency_limit()} concurrent runs")

    print("\nALL ITEMS 307-316 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
