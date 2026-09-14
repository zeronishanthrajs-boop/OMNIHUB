"""
ULTRON 51-Website Ideas Autonomous Stress Test & Self-Healing Loop
Assigns 51 distinct, unique website ideas across 12 industries to ULTRON's autonomous
synthesis engine, audits each against an 8-point production standard, detects issues,
and validates that the 51st idea and all generations are 100% flawless.
"""

import os
import sys
import re
import time
from typing import List, Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from glassmorphic_engine import synthesize_glassmorphic_app
from astra_engine import get_astra_ecommerce_html

# 51 Distinct, Unique Website Ideas spanning 12 Industries
WEBSITE_IDEAS = [
    # E-Commerce & Retail (1-10)
    ("Ergonomic Mechanical Keyboard Studio", "Build an ergonomic mechanical keyboard shop with sound test audio"),
    ("Artisan Organic Coffee Bean Roastery", "Create an artisan organic coffee bean subscription store with roast selector"),
    ("Aerodynamics Stealth Table Fan", "Build a precision aerodynamics table fan store worth $200 with 300 stock"),
    ("Limited Streetwear Sneakers Boutique", "Create a limited-edition streetwear sneakers boutique with sizing guide"),
    ("Luxury Chronograph Timepiece Catalog", "Build a luxury chronograph timepiece watch catalog with sapphire glass specs"),
    ("Active Noise Cancelling Studio", "Create a sound-dampened noise cancelling headphones landing page with frequency response"),
    ("Minimalist Electric Standing Desk", "Build a minimalist electric standing desk storefront with height memory presets"),
    ("Carbon Fiber Road Bicycle Customizer", "Create a carbon-fiber road bicycle customizer website with weight calculator"),
    ("Artisanal Ceramic Tableware Store", "Build a custom ceramic pottery and tableware store with glaze finish picker"),
    ("Smart Indoor Hydroponic Garden", "Create a smart indoor hydroponic herb garden shop with nutrient sensor telemetry"),

    # SaaS, Cloud & DevTools (11-16)
    ("API Health & Uptime Sentinel", "Build a microservice API uptime monitoring dashboard with status pings"),
    ("Real-Time Telemetry Log Stream", "Create a live real-time server log stream telemetry monitor with level filtering"),
    ("Automated Feature Flag Console", "Build an automated feature flag management console with toggle rollout slider"),
    ("Relational Database Schema Visualizer", "Create an interactive SQL relational database schema visualizer with ER diagram"),
    ("CI/CD Deployment Pipeline Tracker", "Build a continuous integration deployment pipeline tracker with stage durations"),
    ("Edge CDN Bandwidth & Latency Radar", "Create an edge CDN bandwidth and latency analytics studio with global nodes"),

    # Productivity & Workspace (17-22)
    ("Agile Sprint Kanban Board", "Build a team sprint Kanban board with drag and drop priority lanes"),
    ("Markdown Note & Document Studio", "Create a rich markdown note studio with live split preview and word count"),
    ("Pomodoro Ambient Flow Station", "Build a Pomodoro focus timer with ambient soundscapes and session logs"),
    ("Daily Habit Streak Matrix", "Create a daily habit streak tracker with achievement badges and weekly heatmaps"),
    ("Executive Meeting Agenda Clock", "Build a meeting agenda builder with countdown timers and talking point tracker"),
    ("Encrypted Personal Bookmark Vault", "Create a personal bookmark vault with tag filtering and favicon badges"),

    # Finance, Crypto & Web3 (23-27)
    ("Multi-Asset Crypto Portfolio Tracker", "Build a multi-asset cryptocurrency portfolio tracker with live P&L charts"),
    ("Global Real-Time Currency Exchange", "Create a real-time global currency exchange calculator with 12 fiat rates"),
    ("DeFi Liquidity Yield Pool Radar", "Build a decentralized liquidity pool yield radar with APY and impermanent loss"),
    ("Itemized Invoice & PDF Studio", "Create a freelance client itemized invoice and automatic PDF studio"),
    ("Net Worth & Financial Freedom FIRE Calc", "Build a personal net worth and retirement FIRE calculator with compound growth"),

    # Healthcare & Wellness (28-32)
    ("Telemedicine Doctor Appointment Booking", "Create a telemedicine doctor appointment booking portal with specialist filter"),
    ("Macronutrient & Calorie Nutrition Log", "Build a daily macronutrient and calorie meal tracker with macro doughnut chart"),
    ("Guided Breathwork & Meditation Audio", "Create a guided breathwork and meditation sound studio with breathing pacer"),
    ("Strength Training Gym Workout Log", "Build a gym strength training workout log with 1RM calculator and set counter"),
    ("Circadian Rhythm & Sleep Analyzer", "Create a sleep quality and circadian rhythm analyzer with sleep debt scores"),

    # Media, Audio & Entertainment (33-37)
    ("Neon 8-Bit Retro Arcade Hub", "Build a retro 8-bit synth arcade game center with playable high scores"),
    ("Podcast Player with Chapter Marks", "Create a podcast audio player with episode chapters and playback speed"),
    ("Synthwave Audio Spectrum Visualizer", "Build a cyberpunk synthwave audio visualizer canvas with frequency bars"),
    ("Indie Cinema Ticket & Seat Reservation", "Create an indie film cinema schedule and seat reservation booking map"),
    ("Interactive Musical Chord Generator", "Build an interactive music chord progression generator with virtual piano keys"),

    # Education & Learning (38-42)
    ("Spaced Repetition Flashcard Studio", "Create an interactive spaced repetition flashcard quiz with retention stats"),
    ("Developer Code Syntax Cheat Sheet", "Build a quick developer code syntax cheat sheet hub with instant copy"),
    ("2D Function Mathematical Grapher", "Create an interactive 2D function math graphing calculator with canvas curves"),
    ("Language Vocabulary Speed Drill Game", "Build a language vocabulary speed drill flashcard game with score streak"),
    ("Touch Typing Speed & Accuracy Test", "Create a typing speed test with words-per-minute meter and error highlighting"),

    # Real Estate & Hospitality (43-46)
    ("Luxury Apartment Rental Explorer", "Build a luxury apartment rental finder with filter search and floor plan modal"),
    ("Boutique Hotel Suite Reservation", "Create a boutique hotel suite reservation booking system with date picker"),
    ("Gourmet Bistro Table Booking & Menu", "Build a gourmet bistro menu with interactive table reservation and allergies"),
    ("Coworking Hot Desk Booking Portal", "Create a commercial office coworking desk booking portal with amenity chips"),

    # AI Tools, Regex & Utilities (47-50)
    ("AI Prompt Marketplace & Library", "Build an AI prompt library and marketplace with copy buttons and token counts"),
    ("Vector Embedding Distance Explorer", "Create a vector embedding similarity distance explorer with 2D projection"),
    ("LLM Inference Benchmark Station", "Build an LLM inference latency and token speed benchmarker with comparison bars"),
    ("Interactive Regex Sandbox & Tester", "Create an interactive regex testing sandbox with live match highlights and flags"),

    # 51st Grand Finale Benchmark (51)
    ("Astra-Caliber Master Agency Platform", "Build an Astra-caliber agency platform with hero customizer, faceted filters, shopping bag drawer, multi-step checkout modal, and 5-star customer reviews")
]

FORBIDDEN_STUBS = [
    "coming soon", "todo", "under construction", "lorem ipsum",
    "feature not implemented", "placeholder text", "href=\"#\""
]

def audit_generated_website(title: str, prompt: str, html: str) -> List[str]:
    """Audit the generated HTML code against the 8-point production standard."""
    issues = []

    # Check 1: HTML5 Document Structure
    if not ("<!doctype html" in html.lower() and "<html" in html.lower() and "<body" in html.lower() and "</html>" in html.lower()):
        issues.append("Invalid HTML5 document structure")

    # Check 2: Forbidden stubs & placeholders
    lower_html = html.lower()
    for stub in FORBIDDEN_STUBS:
        if stub in lower_html:
            issues.append(f"Contains forbidden placeholder or stub: '{stub}'")

    # Check 3: Responsive styling
    if not ("@media" in html or "clamp(" in html or "viewport" in html):
        issues.append("Missing responsive layout or viewport scaling")

    # Check 4: Functional JavaScript interactivity
    if not ("<script" in html and ("addEventListener" in html or "function" in html)):
        issues.append("Missing functional JavaScript logic or event listeners")

    # Check 5: Broken external images
    # Avoid external HTTP image links that could fail/404; encourage SVG or CSS graphics
    broken_img_matches = re.findall(r'<img[^>]+src=["\'](http[^"\']+)["\']', html, re.IGNORECASE)
    if broken_img_matches:
        issues.append(f"Contains {len(broken_img_matches)} external insecure/fragile image links")

    # Check 6: Minimum content depth (avoid truncated stubs)
    if len(html) < 2500:
        issues.append(f"HTML payload is too small ({len(html)} bytes; expected > 2,500 bytes)")

    # Check 7: Design tokens or styling
    if not ("style" in html.lower() or "css" in lower_html):
        issues.append("Missing inline styling or design tokens")

    # Check 8: Tactile audio or interactive feedback
    if not ("Sound" in html or "Audio" in html or "feedback" in lower_html or "transition" in lower_html):
        issues.append("Missing interactive feedback or transition tokens")

    return issues

def run_stress_test():
    print("=" * 80)
    print("      ULTRON 51-WEBSITE IDEAS AUTONOMOUS STRESS TEST & VALIDATION LOOP       ")
    print("=" * 80)
    print(f"Total Ideas to Synthesize: {len(WEBSITE_IDEAS)}")
    print(f"Standard: Zero Stubs, Zero Placeholders, Responsive Layout, Full Interactivity\n")

    passed_count = 0
    issues_encountered = {}
    start_all = time.time()

    for idx, (title, prompt) in enumerate(WEBSITE_IDEAS, 1):
        t0 = time.time()
        print(f"[{idx:02d}/51] Assigning to ULTRON: \"{title}\"...")
        print(f"       Prompt: \"{prompt}\"")

        # Synthesize via ULTRON's autonomous multi-domain engine
        try:
            html = synthesize_glassmorphic_app(prompt, "web_ui")
        except Exception as e:
            html = f"<!-- Error: {str(e)} -->"

        elapsed = time.time() - t0
        issues = audit_generated_website(title, prompt, html)

        if not issues:
            passed_count += 1
            print(f"       --> PASS ({len(html):,} bytes, {elapsed:.3f}s)")
        else:
            print(f"       --> ISSUES DETECTED ({len(issues)}):")
            for issue in issues:
                print(f"           * {issue}")
                issues_encountered[issue] = issues_encountered.get(issue, 0) + 1

    print("\n" + "=" * 80)
    print(f"STRESS TEST SUMMARY:")
    print(f"Total Tested: {len(WEBSITE_IDEAS)}")
    print(f"Passed: {passed_count} / {len(WEBSITE_IDEAS)} ({passed_count/len(WEBSITE_IDEAS)*100:.1f}%)")
    print(f"Total Elapsed Time: {time.time() - start_all:.2f}s")
    
    if issues_encountered:
        print("\nBreakdown of Issues Discovered:")
        for issue, count in sorted(issues_encountered.items(), key=lambda x: -x[1]):
            print(f"  [{count} occurrences] {issue}")
    else:
        print("\nAll 51 website ideas passed 100% with ZERO issues!")
    print("=" * 80)

    # Assert 51st idea specifically passed with perfection
    assert passed_count >= 51, f"Expected 51 passed websites, got {passed_count}"

if __name__ == "__main__":
    run_stress_test()
