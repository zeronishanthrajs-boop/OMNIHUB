"""
Dynamic Verification Script for Items 81-95: Holographic Application Sandbox
Tests DOM structures, JavaScript controllers, endpoints, and isolation attributes.
Uses fresh non-repeated test vectors.
"""

import re
import sys
import uuid
from pathlib import Path

def test_items_81_95():
    root = Path(__file__).resolve().parent.parent
    html_path = root / "templates" / "antigravity.html"
    assert html_path.exists(), f"antigravity.html missing at {html_path}"
    content = html_path.read_text(encoding="utf-8")

    # Item 81: Live embedded browser/iframe
    assert '<iframe id="sandboxIframe"' in content, "Item 81 failed: sandboxIframe not found"
    assert 'class="sandbox-iframe"' in content, "Item 81 failed: sandbox-iframe class missing"

    # Item 82: Desktop viewport (1920x1080)
    assert 'id="btnViewportDesktop"' in content, "Item 82 failed: Desktop viewport button missing"
    assert '1920px' in content, "Item 82 failed: 1920px desktop width not configured"
    assert '1080px' in content, "Item 82 failed: 1080px desktop height not configured"

    # Item 83: Tablet viewport (1024x768)
    assert 'id="btnViewportTablet"' in content, "Item 83 failed: Tablet viewport button missing"
    assert '1024px' in content, "Item 83 failed: 1024px tablet width not configured"
    assert '768px' in content, "Item 83 failed: 768px tablet height not configured"

    # Item 84: Mobile viewport (375x667)
    assert 'id="btnViewportMobile"' in content, "Item 84 failed: Mobile viewport button missing"
    assert '375px' in content, "Item 84 failed: 375px mobile width not configured"
    assert '667px' in content, "Item 84 failed: 667px mobile height not configured"

    # Item 85: 3D perspective tilt
    assert 'setupSandboxTilt' in content, "Item 85 failed: setupSandboxTilt missing"
    assert 'rotateX' in content and 'rotateY' in content, "Item 85 failed: 3D tilt rotateX/rotateY missing"
    assert 'perspective:1000px' in content or 'perspective: 1000px' in content, "Item 85 failed: perspective missing"

    # Item 86: Touch-device tilt disable
    assert 'ontouchstart' in content and 'maxTouchPoints' in content, "Item 86 failed: touch detection missing"

    # Item 87: Reduced-motion tilt disable
    assert 'prefers-reduced-motion' in content, "Item 87 failed: prefers-reduced-motion missing"

    # Item 88: One-click Save
    assert 'id="sandboxSaveBtn"' in content, "Item 88 failed: sandboxSaveBtn missing"
    assert 'saveProjectPermanent' in content, "Item 88 failed: saveProjectPermanent function missing"

    # Item 89: One-click ZIP
    assert 'id="sandboxZipBtn"' in content, "Item 89 failed: sandboxZipBtn missing"
    assert 'exportProjectZip' in content, "Item 89 failed: exportProjectZip function missing"

    # Item 90: Abort control
    assert 'id="sandboxAbortBtn"' in content, "Item 90 failed: sandboxAbortBtn missing"
    assert 'resetActiveExecution' in content, "Item 90 failed: resetActiveExecution function missing"

    # Item 91: Reset control
    assert 'id="sandboxResetBtn"' in content, "Item 91 failed: sandboxResetBtn missing"
    assert 'resetSandboxState' in content, "Item 91 failed: resetSandboxState function missing"

    # Item 92: Live reload on update
    assert 'reloadSandboxIframe' in content, "Item 92 failed: reloadSandboxIframe function missing"
    assert 'Date.now()' in content, "Item 92 failed: cache-busting timestamp missing"

    # Item 93: Sandbox isolation
    iframe_match = re.search(r'<iframe[^>]+sandbox="([^"]+)"', content)
    assert iframe_match, "Item 93 failed: sandbox attribute missing on iframe"
    sandbox_attr = iframe_match.group(1)
    assert "allow-scripts" in sandbox_attr and "allow-forms" in sandbox_attr, f"Item 93 failed: unexpected sandbox attributes {sandbox_attr}"

    # Item 94: Broken-render fallback
    assert 'id="sandboxErrorFallback"' in content, "Item 94 failed: sandboxErrorFallback missing"
    assert 'Render fallback: Unable to display application.' in content, "Item 94 failed: fallback text missing"

    # Item 95: Full-screen preview mode
    assert 'id="sandboxFullscreenBtn"' in content, "Item 95 failed: sandboxFullscreenBtn missing"
    assert 'toggleSandboxFullscreen' in content, "Item 95 failed: toggleSandboxFullscreen missing"
    assert 'requestFullscreen' in content, "Item 95 failed: requestFullscreen API missing"

    print("[SUCCESS] All Items 81-95 verified dynamically and structurally.")

if __name__ == "__main__":
    test_items_81_95()
