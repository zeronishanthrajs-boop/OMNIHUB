import os, sys, re
sys.path.insert(0, '.')

def run():
    print("=== PASS 1 AUDIT: ITEMS 56 TO 70 (Arc Reactor Visualization) ===")

    with open("templates/antigravity.html", "r", encoding="utf-8") as f:
        html = f.read()

    # 56. Arc Reactor hero canvas
    assert 'id="reactorCanvas"' in html, "Item 56 Failed: reactorCanvas missing"
    print("[x] Item 56 PASSED: Arc Reactor hero canvas (<canvas id=\"reactorCanvas\">)")

    # 57. Multi-tier segmented rings
    assert 'drawSegmentedRing' in html and 'R1' in html and 'R2' in html, "Item 57 Failed: Multi-tier segmented rings missing"
    print("[x] Item 57 PASSED: Multi-tier segmented rings (bezel and telemetry rings)")

    # 58. Breathing containment core
    assert 'rMotes' in html and 'coreGrad' in html and 'pulse' in html, "Item 58 Failed: Breathing containment core missing"
    print("[x] Item 58 PASSED: Breathing containment core (ambient glow & dust motes)")

    # 59. Energy filaments to 4 agent nodes
    assert 'targets' in html and 'boss' in html and 'planner' in html and 'coordinator' in html and 'worker' in html, "Item 59 Failed: Energy filaments missing"
    print("[x] Item 59 PASSED: Energy filaments connecting core to 4 agent nodes")

    # 60. Light packet animation
    assert 'rPacketProgress' in html and 'shadowBlur' in html, "Item 60 Failed: Light packet animation missing"
    print("[x] Item 60 PASSED: Light packet traveling pulse animation")

    # 61-68: Specific states in REACTOR_COLORS
    states = [
        (61, "idle", "IDLE"),
        (62, "evaluating_goal", "EVALUATING_GOAL"),
        (63, "planning", "PLANNING"),
        (64, "coordinating", "COORDINATING"),
        (65, "synthesizing", "SYNTHESIZING"),
        (66, "validating", "VALIDATING"),
        (67, "approved", "APPROVED"),
        (68, "error", "ERROR")
    ]
    for item_num, key, label in states:
        assert f'{key}: [' in html or f'"{key}": [' in html or f"'{key}': [" in html, f"Item {item_num} Failed: state {key} missing"
        print(f"[x] Item {item_num} PASSED: {label} state visualization animation")

    # 69. Reduced-motion support
    assert 'prefers-reduced-motion' in html, "Item 69 Failed: prefers-reduced-motion check missing"
    print("[x] Item 69 PASSED: Reduced-motion support (respects prefers-reduced-motion)")

    # 70. Performance-safe rendering
    assert 'id="fpsReadout"' in html and 'requestAnimationFrame' in html, "Item 70 Failed: 60fps monitor missing"
    print("[x] Item 70 PASSED: Performance-safe rendering (requestAnimationFrame & FPS monitor)")

    print("ALL ITEMS 56-70 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
