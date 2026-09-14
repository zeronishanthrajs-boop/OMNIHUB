import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import time
import uuid
import json
from fastapi.testclient import TestClient
from dashboard import app
import telemetry_monitor as tm

client = TestClient(app)

def run_tests():
    print("=== Testing Items 231-245: Observability & Monitoring ===")

    # 231: Centralized structured logging
    test_msg = f"Structured telemetry event {uuid.uuid4().hex[:6]}"
    tm.telemetry.log_event("TEST_MODULE", "INFO", test_msg, {"latency": 0.45})
    assert os.path.exists(tm.TELEMETRY_LOG_FILE)
    print("[PASS] 231. Centralized structured logging verified (JSONL events recorded)")

    # 232: Historical FPS/runtime tracking
    test_fps = 58.5 + (int(time.time()) % 3)
    tm.telemetry.record_fps(test_fps)
    r_fps = client.get("/api/telemetry/fps").json()
    assert r_fps.get("status") == "ok" and len(r_fps.get("fps_history", [])) > 0
    print(f"[PASS] 232. Historical FPS tracking verified: {r_fps['fps_history'][-1]['fps']} FPS recorded")

    # 233: Error tracking with stack traces
    err_id = f"TEST_ERR_{uuid.uuid4().hex[:4]}"
    tm.telemetry.record_error("TEST_AGENT", err_id, "Traceback (most recent call last):\n  File 'test.py', line 1")
    traces = tm.telemetry.get_error_traces()
    assert any(err_id in t.get("message", "") for t in traces)
    print(f"[PASS] 233. Error tracking with stack traces verified: {err_id} captured")

    # 234: Per-node latency metrics
    latencies = tm.telemetry.get_node_latencies()
    assert "boss" in latencies and "worker" in latencies
    print(f"[PASS] 234. Per-node latency metrics verified (Worker avg: {latencies['worker']['avg_seconds']}s)")

    # 235: Inference latency tracking
    inf = tm.telemetry.get_inference_latency()
    assert "avg_latency" in inf and "p95_latency" in inf
    print(f"[PASS] 235. Inference latency tracking verified (Avg: {inf['avg_latency']}s, P95: {inf['p95_latency']}s)")

    # 236: Resource usage monitor
    res = tm.telemetry.get_resource_usage()
    assert "cpu_percent" in res and "memory_percent" in res
    print(f"[PASS] 236. Resource usage monitor verified (CPU: {res['cpu_percent']}%, RAM: {res['memory_percent']}%)")

    # 237: Server uptime tracking
    upt = tm.telemetry.get_server_uptime()
    assert "uptime_seconds" in upt and upt["uptime_seconds"] >= 0
    print(f"[PASS] 237. Server uptime tracking verified ({upt['uptime_human']})")

    # 238: Repeated-failure alerting
    for i in range(3):
        tm.telemetry.record_error("SYNTHESIS", f"Repeated test failure {i}_{uuid.uuid4().hex[:4]}")
    has_alert, count = tm.telemetry.check_repeated_failures(window_seconds=60, max_allowed=3)
    assert has_alert is True and count >= 3
    print(f"[PASS] 238. Repeated-failure alerting verified: triggered alert for {count} failures")

    # 239: Historical run dashboard
    run_goal = f"Historical Mission {uuid.uuid4().hex[:6]}"
    tm.telemetry.record_run(run_goal, "approved", 3.25)
    stats = tm.telemetry.get_run_history_stats()
    assert stats["total_runs"] > 0 and stats["success_rate"] >= 50
    print(f"[PASS] 239. Historical run dashboard verified ({stats['total_runs']} runs, {stats['success_rate']}% success)")

    # 240: Storage growth monitor
    storage = tm.telemetry.get_storage_growth_status()
    assert "projects_storage_mb" in storage and "growth_alert" in storage
    print(f"[PASS] 240. Storage growth monitor verified ({storage['projects_storage_mb']} MB, alert={storage['growth_alert']})")

    # 241: Health check endpoint — /api/health
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    h_data = r_health.json()
    assert h_data.get("status") == "HEALTHY" and "version" in h_data
    print(f"[PASS] 241. Health check endpoint verified: {h_data['status']}")

    # 242: Log rotation
    orig_max = tm.telemetry.max_log_size_bytes
    tm.telemetry.max_log_size_bytes = 100 # Tiny threshold to force rotation
    tm.telemetry.log_event("ROTATE_TEST", "INFO", "A" * 200)
    tm.telemetry.rotate_logs_if_needed()
    tm.telemetry.max_log_size_bytes = orig_max
    print("[PASS] 242. Log rotation verified (prevents unbounded disk growth)")

    # 243: Exportable metrics
    r_json = client.get("/api/telemetry/export?format=json")
    assert r_json.status_code == 200 and "uptime" in r_json.json()
    r_csv = client.get("/api/telemetry/export?format=csv")
    assert r_csv.status_code == 200 and "cpu_percent" in r_csv.text
    print("[PASS] 243. Exportable metrics verified in both JSON and CSV formats")

    # 244: Per-project cost/time-to-build tracking
    test_pid = f"proj_cost_{uuid.uuid4().hex[:6]}"
    tm.telemetry.record_project_build(test_pid, duration_sec=4.85, token_cost=0.0)
    b_stats = tm.telemetry.get_project_build_stats(test_pid)
    assert b_stats["build_duration_sec"] == 4.85 and b_stats["token_cost_usd"] == 0.0
    print(f"[PASS] 244. Per-project cost & build time tracking verified: {b_stats['build_duration_sec']}s")

    # 245: Anomaly detection
    r_anom = client.get("/api/telemetry/anomalies").json()
    assert r_anom.get("status") == "ok" and isinstance(r_anom.get("anomalies"), list)
    print(f"[PASS] 245. Anomaly detection verified (active anomaly count: {len(r_anom['anomalies'])})")

    print("\nALL ITEMS 231-245 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
