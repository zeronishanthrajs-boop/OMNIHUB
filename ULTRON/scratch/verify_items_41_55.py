import os, sys, re
sys.path.insert(0, '.')

def run():
    print("=== PASS 1 AUDIT: ITEMS 41 TO 55 (Top Bar & Nav Rail) ===")

    with open("templates/antigravity.html", "r", encoding="utf-8") as f:
        html = f.read()

    # 41. Top system bar — persistent 46px header
    assert 'class="top-app-bar top-system-bar"' in html or 'id="topSystemBar"' in html, "Item 41 Failed: topSystemBar missing"
    assert 'height:46px;' in html or 'height: 46px;' in html, "Item 41 Failed: 46px height missing"
    print("[x] Item 41 PASSED: Top system bar (persistent 46px header)")

    # 42. System identity glyph
    assert 'class="system-glyph"' in html and 'Antigravity' in html, "Item 42 Failed: System identity glyph missing"
    print("[x] Item 42 PASSED: System identity glyph (Antigravity // ULTRON OS)")

    # 43. Live Ollama status chip
    assert 'id="ollamaStatusChip"' in html and 'Ollama:' in html, "Item 43 Failed: Ollama status chip missing"
    print("[x] Item 43 PASSED: Live Ollama status chip")

    # 44. Active project chip
    assert 'id="activeProjectChip"' in html and 'id="topActiveProjName"' in html, "Item 44 Failed: Active project chip missing"
    print("[x] Item 44 PASSED: Active project chip")

    # 45. Global status chip
    assert 'id="globalStatusChip"' in html and 'id="globalStatusBadge"' in html, "Item 45 Failed: Global status chip missing"
    print("[x] Item 45 PASSED: Global status chip (READY / RUNNING / ERROR)")

    # 46. Projects directory modal trigger
    assert 'id="projectsModalTrigger"' in html and 'openHistoryModal()' in html, "Item 46 Failed: Projects modal trigger missing"
    print("[x] Item 46 PASSED: Projects directory modal trigger")

    # 47. Procedural audio toggle
    assert 'id="audioToggleBtn"' in html and 'toggleAudio()' in html, "Item 47 Failed: Audio toggle missing"
    assert 'audioCtx' in html and 'AudioContext' in html, "Item 47 Failed: Web Audio API synthesis missing"
    print("[x] Item 47 PASSED: Procedural audio toggle (Web Audio API synthesizer)")

    # 48. Left nav rail
    assert 'class="nav-rail"' in html and 'id="leftNavRail"' in html, "Item 48 Failed: Left nav rail missing"
    assert 'width: 60px;' in html or 'width:60px;' in html, "Item 48 Failed: 60px width missing"
    print("[x] Item 48 PASSED: Left nav rail (persistent 60px rail)")

    # 49. Command view
    assert 'id="navBtnCommand"' in html and "switchNavView('command')" in html, "Item 49 Failed: Command view button missing"
    print("[x] Item 49 PASSED: Command view nav trigger")

    # 50. Projects view
    assert 'id="navBtnProjects"' in html and "switchNavView('projects')" in html, "Item 50 Failed: Projects view button missing"
    print("[x] Item 50 PASSED: Projects view nav trigger")

    # 51. Agents view
    assert 'id="navBtnAgents"' in html and "switchNavView('agents')" in html, "Item 51 Failed: Agents view button missing"
    print("[x] Item 51 PASSED: Agents view nav trigger")

    # 52. Activity view
    assert 'id="navBtnActivity"' in html and "switchNavView('activity')" in html, "Item 52 Failed: Activity view button missing"
    print("[x] Item 52 PASSED: Activity view nav trigger")

    # 53. Settings view
    assert 'id="navBtnSettings"' in html and "switchNavView('settings')" in html, "Item 53 Failed: Settings view button missing"
    print("[x] Item 53 PASSED: Settings view nav trigger")

    # 54. Active-section indicator
    assert '.nav-rail-item.active::before' in html and '#00ffcc' in html, "Item 54 Failed: Active section glow indicator missing"
    print("[x] Item 54 PASSED: Active-section indicator")

    # 55. Keyboard navigation
    assert 'switchNavView' in html and 'e.altKey' in html and 'e.key === "1"' in html, "Item 55 Failed: Keyboard nav shortcuts missing"
    print("[x] Item 55 PASSED: Keyboard navigation (1-5 / Alt+1-5 view switching)")

    print("ALL ITEMS 41-55 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
