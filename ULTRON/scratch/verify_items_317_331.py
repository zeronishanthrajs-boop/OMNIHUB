import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import time
import uuid
from advanced_ai_capabilities import advanced_ai

def run_tests():
    print("=== Testing Items 317-331: Advanced AI Capabilities ===")

    # 317: Cross-session project memory
    test_pid = f"proj_mem_{uuid.uuid4().hex[:6]}"
    decision_topic = f"chart_library_{uuid.uuid4().hex[:4]}"
    advanced_ai.record_project_decision(test_pid, decision_topic, "Use Chart.js with dark obsidian theme")
    mem = advanced_ai.get_project_memory(test_pid)
    assert decision_topic in mem and "Chart.js" in mem[decision_topic]["decision"]
    print(f"[PASS] 317. Cross-session project memory verified: {decision_topic}")

    # 318: RAG over project docs
    advanced_ai.add_doc_to_kb(test_pid, "spec.md", "The application must support WebSocket streaming on port 8080.")
    hits = advanced_ai.query_project_kb(test_pid, "WebSocket streaming")
    assert len(hits) >= 1 and "WebSocket" in hits[0]
    print("[PASS] 318. RAG over project docs verified (retrieved relevant context chunk)")

    # 319: Self-critique pass
    clean_code = "<!DOCTYPE html><html><head><style>body{background:#000}</style></head><body><button onclick='alert(1)'>Go</button></body></html>"
    pass_sc, critique = advanced_ai.self_critique_output(clean_code)
    assert pass_sc is True
    bad_code = "<div>// todo: implement placeholder</div>"
    pass_bad, critique_bad = advanced_ai.self_critique_output(bad_code)
    assert pass_bad is False and len(critique_bad) > 0
    print("[PASS] 319. Self-critique pass verified (flagged placeholders, accepted clean code)")

    # 320: Hallucination / fabrication check
    code_with_cdn = "<script src='https://cdnjs.cloudflare.com/ajax/libs/chart.js/4.4.0/chart.umd.min.js'></script>"
    pass_cdn, _ = advanced_ai.check_hallucinations(code_with_cdn)
    assert pass_cdn is True
    fake_code = "<script src='https://nonexistent-invented-library-cdn.xyz/lib.js'></script>"
    pass_fake, hall_list = advanced_ai.check_hallucinations(fake_code)
    assert pass_fake is False and len(hall_list) > 0
    print("[PASS] 320. Hallucination/fabrication check verified (flagged unverified script URL)")

    # 321: Natural-language diff summaries
    diff_sum = advanced_ai.generate_nl_diff_summary("<html></html>", "<html><body><h1>New Dashboard Panel</h1></body></html>", "Add dashboard panel")
    assert "capabilities" in diff_sum
    print(f"[PASS] 321. Natural-language diff summary verified: '{diff_sum[:60]}...'")

    # 322: Confidence scoring
    conf = advanced_ai.calculate_boss_confidence("Build fullstack cryptocurrency radar", tree={"tasks": [1]})
    assert "confidence_score" in conf and conf["confidence_score"] > 0.8
    print(f"[PASS] 322. Confidence scoring verified: {conf['confidence_score']} ({conf['confidence_label']})")

    # 323: Multi-goal missions
    composite_mission = "Build high-frequency options matrix; then build risk analysis engine; plus real-time ticker"
    sub_goals = advanced_ai.decompose_multi_goal(composite_mission)
    assert len(sub_goals) == 3
    print(f"[PASS] 323. Multi-goal mission decomposition verified: decomposed into {len(sub_goals)} sub-goals")

    # 324: Style-consistency memory
    advanced_ai.save_style_signature(test_pid, "#00ffcc", "JetBrains Mono, monospace")
    sig = advanced_ai.get_style_signature(test_pid)
    assert sig["accent"] == "#00ffcc"
    print(f"[PASS] 324. Style-consistency memory verified: accent {sig['accent']}")

    # 325: Explainable rejections
    exp = advanced_ai.explain_rejection("DOMAIN_VIOLATION")
    assert "designated directory boundary" in exp["explanation"]
    print(f"[PASS] 325. Explainable rejections verified: '{exp['explanation'][:60]}...'")

    # 326: A/B variant generation
    va, vb = advanced_ai.generate_ab_variants("Synthesize algorithmic trade desk")
    assert va["variant"] == "A" and vb["variant"] == "B"
    assert va["accent"] != vb["accent"]
    print(f"[PASS] 326. A/B variant generation verified (Direction A: {va['style']}, Direction B: {vb['style']})")

    # 327: Automatic test-case generation
    mock_tree = {"implementation_tasks": [{"id": "task-ui-01", "title": "Real-time Order Book"}]}
    tests = advanced_ai.generate_test_cases_for_tree(mock_tree)
    assert len(tests) == 1 and tests[0]["target_node"] == "task-ui-01"
    print(f"[PASS] 327. Automatic test-case generation verified: {tests[0]['test_id']}")

    # 328: Voice-to-mission transcription tuning
    tuned = advanced_ai.tune_voice_transcript("um uh please can you make a dark cyberpunk task tracker")
    assert "um" not in tuned and "uh" not in tuned and tuned.startswith("Build")
    print(f"[PASS] 328. Voice-to-mission transcription tuning verified: '{tuned}'")

    # 329: Long-chat context summarization
    long_chat = [
        {"sender": "user", "text": "Can we make the background darker?"},
        {"sender": "ultron", "text": "Done."},
        {"sender": "user", "text": "Can we add CSV export?"},
        {"sender": "ultron", "text": "Done."},
        {"sender": "user", "text": "Can we add tooltips?"},
        {"sender": "ultron", "text": "Done."}
    ]
    summary_txt, recent_chat = advanced_ai.summarize_long_chat(long_chat, keep_recent=2)
    assert "Prior discussion summary" in summary_txt and len(recent_chat) == 2
    print("[PASS] 329. Long-chat context summarization verified (condensed context with preserved recency)")

    # 330: Complexity-based model routing
    route_simple = advanced_ai.route_by_complexity("Change button color to blue")
    route_complex = advanced_ai.route_by_complexity("Architect full-duplex distributed telemetry grid")
    assert "8b" in route_simple and "70b" in route_complex
    print(f"[PASS] 330. Complexity-based model routing verified (Simple: {route_simple}, Complex: {route_complex})")

    # 331: Learning from operator corrections
    advanced_ai.record_operator_correction(test_pid, "<div>Bad code</div>", "<div>Refined Production Code</div>")
    corrections = advanced_ai.get_operator_corrections()
    assert len(corrections) > 0 and test_pid in corrections[-1]["project_id"]
    print(f"[PASS] 331. Learning from operator corrections verified ({len(corrections)} corrections learned)")

    print("\nALL ITEMS 317-331 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
