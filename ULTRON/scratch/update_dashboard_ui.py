import re
import os

BASE_DIR = r"c:\Users\sakth\Music\ULTRON"
DASHBOARD_FILE = os.path.join(BASE_DIR, "dashboard.py")

with open(DASHBOARD_FILE, "r", encoding="utf-8") as f:
    full_text = f.read()

# Split at @app.get("/", response_class=HTMLResponse)
idx = full_text.find('@app.get("/", response_class=HTMLResponse)')
if idx == -1:
    raise ValueError("Could not find dashboard_home route!")

backend_code = full_text[:idx].strip()

new_html_content = r'''@app.get("/", response_class=HTMLResponse)
async def dashboard_home():
    html_content = """<!DOCTYPE html>
<html lang="en" class="dark h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ULTRON // 3D QUANTUM MULTI-AGENT COMMAND DECK</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
    
    <!-- Cyberpunk & Sci-Fi Movie Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        orbitron: ['Orbitron', 'sans-serif'],
                        rajdhani: ['Rajdhani', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                        cyber: {
                            black: '#02040a',
                            dark: '#050a16',
                            card: '#081024',
                            border: '#16284e',
                            cyan: '#00f0ff',
                            blue: '#0070f3',
                            purple: '#8b5cf6',
                            amber: '#f59e0b',
                            emerald: '#00ff88',
                            rose: '#ff0055'
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        :root {
            --glow-cyan: rgba(0, 240, 255, 0.4);
            --glow-purple: rgba(139, 92, 246, 0.4);
            --glow-emerald: rgba(0, 255, 136, 0.4);
            --glow-rose: rgba(255, 0, 85, 0.4);
        }

        * { box-sizing: border-box; }
        
        body {
            background-color: #02040a;
            color: #e2e8f0;
            font-family: 'Rajdhani', sans-serif;
            overflow-x: hidden;
            background-image: 
                linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }

        /* Scanlines Overlay Effect */
        .scanlines {
            background: linear-gradient(
                rgba(18, 16, 16, 0) 50%, 
                rgba(0, 0, 0, 0.25) 50%
            ), linear-gradient(
                90deg,
                rgba(255, 0, 0, 0.03),
                rgba(0, 255, 0, 0.01),
                rgba(0, 0, 255, 0.03)
            );
            background-size: 100% 3px, 6px 100%;
        }

        /* Movie-Level Cyber Glass Panels */
        .cyber-panel {
            background: rgba(6, 12, 28, 0.82);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(0, 240, 255, 0.18);
            border-radius: 14px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(0, 240, 255, 0.03);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cyber-panel:hover {
            border-color: rgba(0, 240, 255, 0.35);
            box-shadow: 0 12px 35px rgba(0,0,0,0.7), 0 0 20px rgba(0, 240, 255, 0.08);
        }

        /* Luminous Corner Accents */
        .cyber-corner {
            position: relative;
        }
        .cyber-corner::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            width: 10px;
            height: 10px;
            border-top: 2px solid #00f0ff;
            border-left: 2px solid #00f0ff;
            pointer-events: none;
        }
        .cyber-corner::after {
            content: '';
            position: absolute;
            bottom: -1px;
            right: -1px;
            width: 10px;
            height: 10px;
            border-bottom: 2px solid #00f0ff;
            border-right: 2px solid #00f0ff;
            pointer-events: none;
        }

        /* Holographic Arc Reactor Pulse */
        @keyframes reactorPulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px #00f0ff); }
            50% { transform: scale(1.08); filter: drop-shadow(0 0 24px #00f0ff); }
        }
        .reactor-pulse {
            animation: reactorPulse 2.5s infinite ease-in-out;
        }

        @keyframes ringRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .ring-spin {
            animation: ringRotate 12s linear infinite;
        }
        .ring-spin-reverse {
            animation: ringRotate 8s linear infinite reverse;
        }

        /* 3D Sandbox Holographic Tilt */
        .holo-tilt-container {
            perspective: 1400px;
            transition: transform 0.5s ease;
        }
        .holo-tilt-active {
            transform: rotateX(12deg) rotateY(-4deg) scale(0.98);
            box-shadow: 0 30px 60px rgba(0, 240, 255, 0.2), 0 0 40px rgba(0, 240, 255, 0.15) !important;
        }

        /* Custom Sci-Fi Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #16284e; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #00f0ff; }
    </style>
</head>
<body class="h-full flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">

    <!-- 3D Neural Sphere Canvas Background -->
    <canvas id="holo-canvas" class="fixed inset-0 pointer-events-none z-0 opacity-40"></canvas>

    <!-- CRT Scanlines Overlay -->
    <div id="scanlines-layer" class="fixed inset-0 pointer-events-none z-10 scanlines opacity-30"></div>

    <!-- Top Sci-Fi Movie HUD Header -->
    <header class="border-b border-cyber-border/80 bg-cyber-dark/85 backdrop-blur-xl sticky top-0 z-50">
        <div class="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            
            <!-- Brand & Hologram Core -->
            <div class="flex items-center gap-3.5">
                <div class="relative w-10 h-10 flex items-center justify-center">
                    <!-- Rotating Sci-Fi Rings -->
                    <div class="absolute inset-0 rounded-full border border-dashed border-cyan-400/60 ring-spin"></div>
                    <div class="absolute inset-1 rounded-full border border-dotted border-purple-400/60 ring-spin-reverse"></div>
                    <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-orbitron font-black text-white text-xs shadow-lg shadow-cyan-500/50 reactor-pulse">
                        ⚡
                    </div>
                </div>

                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-orbitron font-extrabold text-lg tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400">ULTRON</span>
                        <span class="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/30">HOLO-DECK v3.2</span>
                    </div>
                    <p class="text-[10px] text-slate-400 font-mono tracking-wide hidden sm:block">QUANTUM MULTI-AGENT AUTONOMOUS REASONING & SYNTHESIS</p>
                </div>
            </div>

            <!-- Central Live Telemetry -->
            <div class="hidden lg:flex items-center gap-6 font-mono text-xs">
                <div class="flex items-center gap-2 text-slate-400">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>FPS: <strong id="hud-fps" class="text-emerald-400 font-bold">60</strong></span>
                </div>
                <div class="flex items-center gap-2 text-slate-400">
                    <span>CORES: <strong class="text-cyan-400">8 THREADS</strong></span>
                </div>
                <div class="flex items-center gap-2 text-slate-400">
                    <span>COST: <strong class="text-emerald-400">$0.00 (OFFLINE)</strong></span>
                </div>
            </div>

            <!-- Global Action Controls -->
            <div class="flex items-center gap-2.5">
                <!-- Sound Toggle -->
                <button onclick="toggleAudio()" id="sound-btn" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-slate-300 hover:text-cyan-400 font-mono text-xs transition">
                    <span id="sound-icon">🔊</span>
                    <span class="hidden sm:inline" id="sound-text">AUDIO</span>
                </button>

                <!-- Scanlines Toggle -->
                <button onclick="toggleScanlines()" class="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-slate-400 hover:text-cyan-300 font-mono text-xs transition">
                    <span>CRT</span>
                </button>

                <!-- Engine Pill -->
                <div id="engine-pill" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs font-mono">
                    <span id="engine-dot" class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                    <span id="engine-text" class="text-slate-300 font-semibold">llama3.1:8b</span>
                </div>

                <!-- Status Pill -->
                <div id="status-pill" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs font-mono">
                    <span id="status-dot" class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <span id="status-text" class="text-slate-300 font-bold">IDLE</span>
                    <span id="status-timer" class="text-cyan-400 text-[11px] pl-1 border-l border-cyber-border hidden">0.0s</span>
                </div>

                <!-- Emergency Reset Button -->
                <button onclick="resetExecution()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 font-mono text-xs font-bold transition">
                    <span>↺ RESET</span>
                </button>

                <!-- Open App Link -->
                <a id="open-app-btn" href="/web_ui/" target="_blank" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition shadow-sm shadow-cyan-500/20">
                    <span>POP-OUT</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
            </div>
        </div>
    </header>

    <!-- Main Command Deck -->
    <main class="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 space-y-6 relative z-20">

        <!-- Boss Clarification Alert (Shows only when Boss prompts for clarification) -->
        <div id="clarification-modal" class="hidden p-5 rounded-xl bg-amber-950/80 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 cyber-corner">
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold flex-shrink-0">
                    ⚠️
                </div>
                <div class="flex-1 space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-bold font-orbitron text-amber-300 uppercase tracking-wider">COMMANDER DIRECTIVE REQUIRED // BOSS NODE</h3>
                        <span class="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">AWAITING INPUT</span>
                    </div>
                    <p id="clarification-question-text" class="text-sm text-slate-100 font-sans leading-relaxed"></p>
                    <div class="flex gap-2 pt-1">
                        <input id="clarification-input" type="text" placeholder="Type your directive to guide the Boss node..." class="flex-1 bg-cyber-black border border-amber-500/40 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-sans" onkeydown="if(event.key==='Enter') submitClarification()">
                        <button onclick="submitClarification()" class="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider font-orbitron transition shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
                            <span>TRANSMIT</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hero Sci-Fi Prompt Console -->
        <section class="cyber-panel cyber-corner p-6 shadow-2xl space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 class="text-base sm:text-xl font-orbitron font-extrabold text-white tracking-wide flex items-center gap-2.5">
                        <span class="text-cyan-400">⚡</span>
                        <span>QUANTUM APPLICATION SYNTHESIS FORGE</span>
                    </h1>
                    <p class="text-xs text-slate-400 font-rajdhani text-sm">Input your mission intent. ULTRON's 4-node neural graph will autonomously reason, architect, route, and synthesize Diamond-grade code live.</p>
                </div>

                <div class="flex items-center gap-4 text-xs font-mono">
                    <label class="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200">
                        <input id="mock-checkbox" type="checkbox" class="w-4 h-4 rounded bg-cyber-black border-cyber-border text-cyan-500 focus:ring-0">
                        <span>SIMULATION / MOCK MODE</span>
                    </label>
                </div>
            </div>

            <!-- Input Bar -->
            <div class="flex flex-col sm:flex-row gap-2.5">
                <div class="relative flex-1">
                    <input id="goal-input" type="text" placeholder="e.g. Build an interactive text emotion analysis matrix with live psychological diagnosis and counterfactual reframing" 
                           class="w-full bg-cyber-black/90 border border-cyber-border rounded-xl px-5 py-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition shadow-inner font-sans tracking-wide"
                           onkeydown="if(event.key==='Enter') startGoal()">
                </div>
                <button id="launch-btn" onclick="startGoal()" class="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-orbitron font-bold text-xs uppercase tracking-widest transition duration-300 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span id="launch-btn-text">INITIATE SYNTHESIS</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </button>
                <button id="reset-btn" onclick="resetExecution()" class="px-4 py-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-rose-300 font-orbitron font-bold text-xs transition duration-200 flex items-center justify-center flex-shrink-0" title="Abort current synthesis / Reset state">
                    <span>✕ ABORT</span>
                </button>
            </div>

            <!-- Quick Mission Presets -->
            <div class="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span class="text-[11px] font-mono text-slate-500">QUICK MISSIONS:</span>
                <button onclick="setPresetGoal('build an app for underatanding text based emotion ,eg in ui:a box for writing:user-i am thinking it would have been better if i didnt buy a bike on emi agent:guilt')" class="px-3 py-1 rounded-lg bg-cyber-black hover:bg-cyber-card border border-cyber-border text-slate-300 hover:text-cyan-300 font-mono transition">💎 Emotion AI Matrix</button>
                <button onclick="setPresetGoal('Build an interactive Kanban task board with columns (To Do, In Progress, Done), modal to create tasks with priority tags, and localStorage persistence')" class="px-3 py-1 rounded-lg bg-cyber-black hover:bg-cyber-card border border-cyber-border text-slate-300 hover:text-cyan-300 font-mono transition">📋 Kanban Board</button>
                <button onclick="setPresetGoal('Build a modern Pomodoro productivity timer with 25/5 intervals, circular SVG countdown ring, audio chimes, and sprint task checklist')" class="px-3 py-1 rounded-lg bg-cyber-black hover:bg-cyber-card border border-cyber-border text-slate-300 hover:text-cyan-300 font-mono transition">⏱️ Pomodoro Studio</button>
                <button onclick="setPresetGoal('Build an interactive currency and unit converter web app with quick currency tabs, real-time conversion, and conversion history')" class="px-3 py-1 rounded-lg bg-cyber-black hover:bg-cyber-card border border-cyber-border text-slate-300 hover:text-cyan-300 font-mono transition">💱 Currency Converter</button>
            </div>
        </section>

        <!-- 4-Stage 3D Holo-Pod Agent Matrix -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Agent 1: Boss Node -->
            <div id="card-boss" class="cyber-panel p-5 transition-all duration-300">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" id="dot-boss"></div>
                        <h4 class="font-orbitron text-xs font-bold tracking-wider text-amber-400">BOSS [ALPHA]</h4>
                    </div>
                    <span id="badge-boss" class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-black border border-cyber-border text-slate-400">STANDBY</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed font-rajdhani font-medium">Direction-only orchestrator. Enforces CS decision profile, evaluates scope discipline, and audits final verification evidence.</p>
            </div>

            <!-- Agent 2: Planner Node -->
            <div id="card-planner" class="cyber-panel p-5 transition-all duration-300">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-3 h-3 rounded-full bg-purple-400 shadow-md shadow-purple-400/50" id="dot-planner"></div>
                        <h4 class="font-orbitron text-xs font-bold tracking-wider text-purple-400">PLANNER [BETA]</h4>
                    </div>
                    <span id="badge-planner" class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-black border border-cyber-border text-slate-400">STANDBY</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed font-rajdhani font-medium">Architectural reasoning engine. Transforms mission intent into structured logical tree branches with measurable proof points.</p>
            </div>

            <!-- Agent 3: Coordinator Node -->
            <div id="card-coordinator" class="cyber-panel p-5 transition-all duration-300">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" id="dot-coordinator"></div>
                        <h4 class="font-orbitron text-xs font-bold tracking-wider text-cyan-400">COORDINATOR [GAMMA]</h4>
                    </div>
                    <span id="badge-coordinator" class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-black border border-cyber-border text-slate-400">STANDBY</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed font-rajdhani font-medium">Task scheduler & boundary controller. Enforces sandboxing rules, schedules parallel worker branches, and aggregates reports.</p>
            </div>

            <!-- Agent 4: Worker Node -->
            <div id="card-worker" class="cyber-panel p-5 transition-all duration-300">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" id="dot-worker"></div>
                        <h4 class="font-orbitron text-xs font-bold tracking-wider text-emerald-400">WORKER [DELTA]</h4>
                    </div>
                    <span id="badge-worker" class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-black border border-cyber-border text-slate-400">STANDBY</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed font-rajdhani font-medium">Diamond-grade code synthesis forge. Writes self-contained, responsive, production HTML5/CSS/JavaScript with 0 placeholders.</p>
            </div>
        </section>

        <!-- Split Workspace (Left: Logical Architecture Tree & Guardrails | Right: 3D Holographic Sandbox & Terminal) -->
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            <!-- Left: Logical Tree & System Guardrails (5 cols) -->
            <div class="xl:col-span-5 space-y-6">
                
                <!-- Logical Tree Section -->
                <div class="cyber-panel cyber-corner p-5 shadow-2xl space-y-4">
                    <div class="flex items-center justify-between border-b border-cyber-border pb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-purple-400 text-lg">🌳</span>
                            <h3 class="text-xs font-orbitron font-bold text-white uppercase tracking-wider">LOGICAL ARCHITECTURE TREE</h3>
                        </div>
                        <button onclick="loadLogicalTree()" class="text-slate-400 hover:text-cyan-300 text-xs font-mono flex items-center gap-1 transition">
                            <span>REFRESH</span>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        </button>
                    </div>

                    <div id="logical-tree-container" class="space-y-3 max-h-[500px] overflow-y-auto pr-1 font-mono text-xs">
                        <p class="text-slate-500 italic py-4 text-center">No logical tree generated yet. Launch a mission to visualize the live architectural topology.</p>
                    </div>
                </div>

                <!-- Guardrails & Security Policies -->
                <div class="cyber-panel cyber-corner p-5 shadow-2xl space-y-4">
                    <div class="flex items-center justify-between border-b border-cyber-border pb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-amber-400 text-lg">🛡️</span>
                            <h3 class="text-xs font-orbitron font-bold text-white uppercase tracking-wider">SYSTEM GUARDRAILS & POLICIES</h3>
                        </div>
                        <span id="rules-count-badge" class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-black text-amber-300 border border-amber-500/30">0 ACTIVE</span>
                    </div>

                    <div id="rules-container" class="space-y-2 max-h-[220px] overflow-y-auto pr-1 font-mono text-xs">
                        <p class="text-slate-500 italic py-2 text-center">Loading guardrails...</p>
                    </div>

                    <!-- Propose Rule Input -->
                    <div class="flex gap-2 pt-2 border-t border-cyber-border">
                        <input id="new-rule-input" type="text" placeholder="Propose custom constraint (e.g. Enforce zero external CDNs)..." class="flex-1 bg-cyber-black border border-cyber-border rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-sans">
                        <button onclick="proposeRule()" class="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition">SUBMIT</button>
                    </div>
                </div>
            </div>

            <!-- Right: 3D Holographic App Sandbox & Matrix Terminal (7 cols) -->
            <div class="xl:col-span-7 space-y-6">
                
                <!-- 3D Holographic App Sandbox -->
                <div class="cyber-panel cyber-corner p-5 shadow-2xl space-y-4">
                    <div class="flex flex-wrap items-center justify-between border-b border-cyber-border pb-3 gap-2">
                        <div class="flex items-center gap-2.5">
                            <span class="text-cyan-400 text-lg">🚀</span>
                            <h3 class="text-xs font-orbitron font-bold text-white uppercase tracking-wider">HOLOGRAPHIC APPLICATION SANDBOX</h3>
                            <span id="app-status-tag" class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">LIVE PROJECTION</span>
                        </div>

                        <div class="flex items-center gap-2">
                            <!-- 3D Tilt Toggle -->
                            <button onclick="toggleHoloTilt()" id="tilt-toggle-btn" class="px-2.5 py-1 rounded-lg bg-cyber-black hover:bg-cyber-card border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold transition shadow-sm" title="Toggle 3D Movie-Level Perspective Hologram">
                                <span>3D TILT: OFF</span>
                            </button>

                            <!-- Viewport toggles -->
                            <div class="flex items-center bg-cyber-black border border-cyber-border rounded-lg p-0.5 text-xs font-mono">
                                <button onclick="setSandboxWidth('100%')" class="px-2 py-1 rounded text-slate-400 hover:text-white transition">🖥️ FULL</button>
                                <button onclick="setSandboxWidth('768px')" class="px-2 py-1 rounded text-slate-400 hover:text-white transition">💻 768</button>
                                <button onclick="setSandboxWidth('390px')" class="px-2 py-1 rounded text-slate-400 hover:text-white transition">📱 390</button>
                            </div>

                            <button onclick="reloadSandbox()" class="p-1.5 rounded-lg bg-cyber-black hover:bg-cyber-card border border-cyber-border text-slate-400 hover:text-cyan-300 transition" title="Reload Frame">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Multi-Tier Application Switcher Tabs -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                        <span class="text-[11px] font-mono text-slate-500 flex items-center gap-1">APPS:</span>
                        <button onclick="switchSandboxApp('/web_ui/', this)" class="sandbox-tab px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm transition">💎 Emotion AI (Diamond)</button>
                        <button onclick="switchSandboxApp('/demos/kanban_project_board/', this)" class="sandbox-tab px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyber-black text-slate-400 hover:text-white border border-cyber-border transition">📋 Kanban (Tier 3)</button>
                        <button onclick="switchSandboxApp('/demos/pomodoro_focus_studio/', this)" class="sandbox-tab px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyber-black text-slate-400 hover:text-white border border-cyber-border transition">⏱️ Pomodoro (Tier 2)</button>
                        <button onclick="switchSandboxApp('/demos/currency_unit_converter/', this)" class="sandbox-tab px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyber-black text-slate-400 hover:text-white border border-cyber-border transition">💱 Converter (Tier 1)</button>
                    </div>

                    <!-- Sandbox Iframe Container with 3D Tilt Hook -->
                    <div class="holo-tilt-container w-full">
                        <div id="sandbox-wrapper" class="w-full mx-auto bg-black rounded-xl border border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col items-center transition-all duration-500" style="height: 540px;">
                            <iframe id="app-iframe" src="/web_ui/" class="w-full h-full border-0 bg-cyber-black rounded-xl" sandbox="allow-scripts allow-forms allow-same-origin allow-modals"></iframe>
                        </div>
                    </div>
                </div>

                <!-- Matrix Multi-Agent Event Terminal -->
                <div class="cyber-panel cyber-corner p-5 shadow-2xl space-y-4">
                    <div class="flex items-center justify-between border-b border-cyber-border pb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-emerald-400 text-lg">📟</span>
                            <h3 class="text-xs font-orbitron font-bold text-white uppercase tracking-wider">MATRIX MULTI-AGENT TELEMETRY</h3>
                        </div>

                        <div class="flex items-center gap-2 text-xs font-mono">
                            <label class="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer select-none">
                                <input id="autoscroll-toggle" type="checkbox" checked class="w-3.5 h-3.5 rounded bg-cyber-black border-cyber-border text-cyan-500">
                                <span>AUTOSCROLL</span>
                            </label>
                            <button onclick="loadLogs()" class="px-2.5 py-1 rounded bg-cyber-black hover:bg-cyber-card border border-cyber-border text-slate-400 hover:text-cyan-300 transition">FETCH</button>
                        </div>
                    </div>

                    <!-- Log Stream Container -->
                    <div id="log-timeline" class="space-y-2 max-h-[380px] overflow-y-auto font-mono text-xs pr-1">
                        <p class="text-slate-500 italic py-3 text-center">Awaiting neural telemetry stream...</p>
                    </div>
                </div>

            </div>
        </div>
    </main>

    <!-- Sci-Fi Audio Synthesis Engine (Web Audio API) -->
    <script>
        let audioEnabled = true;
        let audioCtx = null;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        function playSciFiBeep(freq = 900, duration = 0.08, type = 'sine') {
            if (!audioEnabled) return;
            try {
                initAudio();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            } catch(e) {}
        }

        function playLaunchSound() {
            if (!audioEnabled) return;
            try {
                initAudio();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.35);
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.45);
            } catch(e) {}
        }

        function toggleAudio() {
            audioEnabled = !audioEnabled;
            document.getElementById('sound-icon').textContent = audioEnabled ? '🔊' : '🔇';
            document.getElementById('sound-text').textContent = audioEnabled ? 'AUDIO' : 'MUTED';
            if (audioEnabled) playSciFiBeep(1200, 0.1);
        }

        function toggleScanlines() {
            const layer = document.getElementById('scanlines-layer');
            if (layer) layer.classList.toggle('hidden');
        }

        let isHoloTilt = false;
        function toggleHoloTilt() {
            isHoloTilt = !isHoloTilt;
            const wrapper = document.getElementById('sandbox-wrapper');
            const btn = document.getElementById('tilt-toggle-btn');
            if (wrapper) wrapper.classList.toggle('holo-tilt-active', isHoloTilt);
            if (btn) btn.innerHTML = `<span>3D TILT: ${isHoloTilt ? 'ON' : 'OFF'}</span>`;
            playSciFiBeep(isHoloTilt ? 1400 : 700, 0.08);
        }
    </script>

    <!-- 3D Neural Sphere Animation (Background WebGL/Canvas) -->
    <script>
        const canvas = document.getElementById('holo-canvas');
        const ctx = canvas.getContext('2d');
        let points = [];
        let numPoints = 140;
        let radius = 260;
        let angleX = 0, angleY = 0;
        let speed = 0.003;
        let sphereColor = '#00f0ff';
        let mouseX = 0, mouseY = 0;

        function initSphere() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            points = [];
            for (let i = 0; i < numPoints; i++) {
                const theta = Math.acos(2 * Math.random() - 1);
                const phi = Math.random() * 2 * Math.PI;
                points.push({
                    x: radius * Math.sin(theta) * Math.cos(phi),
                    y: radius * Math.sin(theta) * Math.sin(phi),
                    z: radius * Math.cos(theta)
                });
            }
        }

        window.addEventListener('resize', initSphere);
        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) * 0.0004;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.0004;
        });

        let lastFrameTime = performance.now();
        let frameCount = 0;
        let fps = 60;

        function renderSphere() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Calculate FPS
            const now = performance.now();
            frameCount++;
            if (now - lastFrameTime >= 1000) {
                fps = frameCount;
                frameCount = 0;
                lastFrameTime = now;
                const fpsElem = document.getElementById('hud-fps');
                if (fpsElem) fpsElem.textContent = fps;
            }

            angleX += speed + mouseY;
            angleY += speed + mouseX;

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.fillStyle = sphereColor;
            ctx.strokeStyle = sphereColor;

            const projected = [];

            points.forEach(p => {
                // Rotate around X
                let y1 = p.y * Math.cos(angleX) - p.z * Math.sin(angleX);
                let z1 = p.y * Math.sin(angleX) + p.z * Math.cos(angleX);

                // Rotate around Y
                let x2 = p.x * Math.cos(angleY) + z1 * Math.sin(angleY);
                let z2 = -p.x * Math.sin(angleY) + z1 * Math.cos(angleY);

                // Perspective projection
                let fov = 420;
                let scale = fov / (fov + z2 + 300);
                let x2d = x2 * scale + cx;
                let y2d = y1 * scale + cy;

                projected.push({ x: x2d, y: y2d, scale: scale, z: z2 });

                ctx.beginPath();
                ctx.arc(x2d, y2d, Math.max(0.5, 2 * scale), 0, Math.PI * 2);
                ctx.globalAlpha = Math.min(1, Math.max(0.1, (z2 + radius) / (2 * radius)));
                ctx.fill();
            });

            // Draw connecting neural constellation lines
            ctx.lineWidth = 0.5;
            for (let i = 0; i < projected.length; i++) {
                for (let j = i + 1; j < projected.length; j++) {
                    const d = Math.hypot(projected[i].x - projected[j].x, projected[i].y - projected[j].y);
                    if (d < 50) {
                        ctx.beginPath();
                        ctx.moveTo(projected[i].x, projected[i].y);
                        ctx.lineTo(projected[j].x, projected[j].y);
                        ctx.globalAlpha = (1 - d / 50) * 0.25;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(renderSphere);
        }

        initSphere();
        renderSphere();
    </script>

    <!-- State Polling & Dashboard Interaction Script -->
    <script>
        let isRunning = false;
        let lastStatusCode = "idle";
        let autoScroll = true;

        const autoscrollCheckbox = document.getElementById('autoscroll-toggle');
        if (autoscrollCheckbox) {
            autoscrollCheckbox.addEventListener('change', (e) => { autoScroll = e.target.checked; });
        }

        function setPresetGoal(text) {
            const input = document.getElementById('goal-input');
            if (input) {
                input.value = text;
                input.focus();
                playSciFiBeep(800, 0.05);
            }
        }

        function setSandboxWidth(width) {
            const wrapper = document.getElementById('sandbox-wrapper');
            if (wrapper) wrapper.style.width = width;
            playSciFiBeep(1000, 0.04);
        }

        function reloadSandbox() {
            const iframe = document.getElementById('app-iframe');
            if (iframe) {
                const src = iframe.src.split('?')[0];
                iframe.src = src + '?t=' + Date.now();
                playSciFiBeep(1100, 0.06);
            }
        }

        function switchSandboxApp(path, btn) {
            const iframe = document.getElementById('app-iframe');
            const openAppBtn = document.getElementById('open-app-btn');
            if (iframe) {
                iframe.src = path + (path.includes('?') ? '&' : '?') + 't=' + Date.now();
            }
            if (openAppBtn) {
                openAppBtn.href = path;
            }
            document.querySelectorAll('.sandbox-tab').forEach(t => {
                t.className = "sandbox-tab px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyber-black text-slate-400 hover:text-white border border-cyber-border transition";
            });
            if (btn) {
                btn.className = "sandbox-tab px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm transition";
            }
            playSciFiBeep(1300, 0.06);
        }

        async function resetExecution() {
            try {
                const btn = document.getElementById('reset-btn');
                if (btn) btn.innerHTML = '<span>...</span>';
                await fetch('/api/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}'
                });
                await getSystemState();
                if (btn) btn.innerHTML = '<span>✕ ABORT</span>';
                playSciFiBeep(500, 0.15, 'sawtooth');
            } catch (e) {
                console.error('Reset error:', e);
            }
        }

        async function startGoal() {
            const input = document.getElementById('goal-input');
            const mockCheckbox = document.getElementById('mock-checkbox');
            const goal = input ? input.value.trim() : "";
            if (!goal) return;

            const launchBtn = document.getElementById('launch-btn');
            const launchBtnText = document.getElementById('launch-btn-text');
            if (launchBtn) launchBtn.disabled = true;
            if (launchBtnText) launchBtnText.textContent = "SYNTHESIZING...";

            playLaunchSound();

            try {
                const res = await fetch('/api/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ goal: goal, mock: mockCheckbox ? mockCheckbox.checked : false })
                });
                const data = await res.json();
                if (!res.ok) alert(data.message || "Failed to start goal");
            } catch (e) {
                console.error("Launch error:", e);
            }
            getSystemState();
        }

        async function submitClarification() {
            const input = document.getElementById('clarification-input');
            const mockCheckbox = document.getElementById('mock-checkbox');
            const resp = input ? input.value.trim() : "";
            if (!resp) return;

            try {
                await fetch('/api/resume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ response: resp, mock: mockCheckbox ? mockCheckbox.checked : false })
                });
                if (input) input.value = "";
                document.getElementById('clarification-modal')?.classList.add('hidden');
                playSciFiBeep(1200, 0.1);
            } catch (e) {
                console.error("Clarification error:", e);
            }
            getSystemState();
        }

        async function proposeRule() {
            const input = document.getElementById('new-rule-input');
            const mockCheckbox = document.getElementById('mock-checkbox');
            const text = input ? input.value.trim() : "";
            if (!text) return;

            try {
                await fetch('/api/rules/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, mock: mockCheckbox ? mockCheckbox.checked : false })
                });
                if (input) input.value = "";
                loadRules();
                playSciFiBeep(900, 0.08);
            } catch (e) {
                console.error("Rule error:", e);
            }
        }

        async function getSystemState() {
            try {
                const res = await fetch('/api/state');
                if (!res.ok) return;
                const state = await res.json();

                isRunning = state.is_running;
                const statusCode = state.status_code || "idle";

                // Update 3D sphere velocity based on running state
                speed = isRunning ? 0.012 : 0.003;

                // Update status pill
                const statusDot = document.getElementById('status-dot');
                const statusText = document.getElementById('status-text');
                const statusTimer = document.getElementById('status-timer');
                const launchBtn = document.getElementById('launch-btn');
                const launchBtnText = document.getElementById('launch-btn-text');

                if (statusText) statusText.textContent = (state.status || "IDLE").toUpperCase();

                if (isRunning) {
                    if (statusDot) statusDot.className = "w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping";
                    if (statusTimer) {
                        statusTimer.classList.remove('hidden');
                        statusTimer.textContent = (state.elapsed_seconds || 0) + 's';
                    }
                    if (launchBtn) launchBtn.disabled = true;
                    if (launchBtnText) launchBtnText.textContent = "SYNTHESIZING...";
                } else {
                    if (statusDot) {
                        if (statusCode === "approved") statusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400";
                        else if (statusCode === "clarifying") statusDot.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
                        else if (statusCode === "rejected" || statusCode === "error") statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-400";
                        else statusDot.className = "w-2.5 h-2.5 rounded-full bg-slate-500";
                    }
                    if (statusTimer) statusTimer.classList.add('hidden');
                    if (launchBtn) launchBtn.disabled = false;
                    if (launchBtnText) launchBtnText.textContent = "INITIATE SYNTHESIS";
                }

                // Clarification Modal Handling
                const modal = document.getElementById('clarification-modal');
                if (statusCode === "clarifying") {
                    const qRes = await fetch('/api/clarification');
                    if (qRes.ok) {
                        const qData = await qRes.json();
                        const qElem = document.getElementById('clarification-question-text');
                        if (qElem) qElem.textContent = qData.question || "Commander input required.";
                        modal?.classList.remove('hidden');
                    }
                } else {
                    modal?.classList.add('hidden');
                }

                // If approved transition detected, auto reload iframe
                if (lastStatusCode !== "approved" && statusCode === "approved") {
                    setTimeout(reloadSandbox, 600);
                    playSciFiBeep(1600, 0.2);
                }

                lastStatusCode = statusCode;
                updateAgentCards(statusCode);
            } catch (e) {
                console.error("State poll error:", e);
            }
        }

        function updateAgentCards(code) {
            const stages = {
                boss: ['evaluating_goal', 'evaluating_briefs', 'evaluating_report'],
                planner: ['planning'],
                coordinator: ['coordinating', 'executed'],
                worker: ['executing']
            };

            const resetCard = (id, badgeId, dotId) => {
                const card = document.getElementById(id);
                const badge = document.getElementById(badgeId);
                const dot = document.getElementById(dotId);
                if (card) card.className = "cyber-panel p-5 transition-all duration-300";
                if (badge) { badge.textContent = "STANDBY"; badge.className = "text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-black border border-cyber-border text-slate-400"; }
            };

            resetCard('card-boss', 'badge-boss', 'dot-boss');
            resetCard('card-planner', 'badge-planner', 'dot-planner');
            resetCard('card-coordinator', 'badge-coordinator', 'dot-coordinator');
            resetCard('card-worker', 'badge-worker', 'dot-worker');

            const highlight = (cardId, badgeId, text, borderClass, bgClass, badgeClass, colorHex) => {
                const card = document.getElementById(cardId);
                const badge = document.getElementById(badgeId);
                if (card) card.className = `cyber-panel p-5 transition-all duration-300 ${borderClass} ${bgClass} shadow-xl`;
                if (badge) { badge.textContent = text; badge.className = `text-[10px] font-mono px-2 py-0.5 rounded ${badgeClass}`; }
                sphereColor = colorHex;
            };

            if (stages.boss.includes(code)) highlight('card-boss', 'badge-boss', 'EVALUATING', 'border-amber-500/80', 'bg-amber-500/10', 'bg-amber-500/20 text-amber-300 border border-amber-500/50', '#f59e0b');
            else if (stages.planner.includes(code)) highlight('card-planner', 'badge-planner', 'STRUCTURING', 'border-purple-500/80', 'bg-purple-500/10', 'bg-purple-500/20 text-purple-300 border border-purple-500/50', '#8b5cf6');
            else if (stages.coordinator.includes(code)) highlight('card-coordinator', 'badge-coordinator', 'ROUTING', 'border-cyan-500/80', 'bg-cyan-500/10', 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50', '#00f0ff');
            else if (stages.worker.includes(code)) highlight('card-worker', 'badge-worker', 'SYNTHESIZING', 'border-emerald-500/80', 'bg-emerald-500/10', 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50', '#00ff88');
            else if (code === "approved") highlight('card-worker', 'badge-worker', 'VERIFIED & SHIPPED', 'border-emerald-500/80', 'bg-emerald-500/10', 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50', '#00ff88');
            else sphereColor = '#00f0ff';
        }

        async function loadLogicalTree() {
            try {
                const res = await fetch('/api/tree');
                if (!res.ok) return;
                const data = await res.json();
                const container = document.getElementById('logical-tree-container');
                if (!container) return;

                const tree = data.tree;
                if (!tree) {
                    container.innerHTML = '<p class="text-slate-500 italic py-4 text-center">No logical tree generated yet. Launch a mission to inspect the live architectural reasoning tree.</p>';
                    return;
                }

                const renderSection = (title, items, icon) => {
                    if (!items || items.length === 0) return '';
                    return `
                        <div class="space-y-1.5">
                            <div class="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                                <span>${icon}</span>
                                <span>${title}</span>
                            </div>
                            <div class="space-y-1">
                                ${items.map(i => `
                                    <div class="p-2 rounded bg-cyber-black/70 border border-cyber-border flex items-center justify-between">
                                        <div class="flex-1 pr-2">
                                            <div class="text-xs font-semibold text-slate-200">${i.title || i.id}</div>
                                            <div class="text-[10px] text-slate-400">${i.summary || ''}</div>
                                        </div>
                                        <span class="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${i.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}">${i.status || 'pending'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                };

                let html = '';
                if (tree.user_intent) html += renderSection('User Intent', [tree.user_intent], '🎯');
                if (tree.features) html += renderSection('Features & Boundaries', tree.features, '⚡');
                if (tree.implementation_tasks) html += renderSection('Implementation Tasks', tree.implementation_tasks, '⚙️');
                if (tree.verification_steps) html += renderSection('Verification Proofs', tree.verification_steps, '✅');

                container.innerHTML = html || '<p class="text-slate-500 italic py-3 text-center">Tree empty.</p>';
            } catch (e) {
                console.error("Tree load error:", e);
            }
        }

        async function loadRules() {
            try {
                const res = await fetch('/api/rules');
                if (!res.ok) return;
                const data = await res.json();
                const container = document.getElementById('rules-container');
                const badge = document.getElementById('rules-count-badge');
                if (!container) return;

                const core = data.core || [];
                const added = data.added || [];
                const activeAdded = added.filter(r => r.status === 'active');
                
                if (badge) badge.textContent = `${core.length + activeAdded.length} ACTIVE`;

                const allRules = [
                    ...core.map(r => ({ ...r, isCore: true })),
                    ...added.map(r => ({ ...r, isCore: false }))
                ];

                container.innerHTML = allRules.map(r => `
                    <div class="p-2 rounded bg-cyber-black/70 border border-cyber-border flex items-center justify-between text-xs">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-amber-400 font-mono text-[10px]">${r.id}</span>
                            <span class="text-slate-300 text-xs">${r.text}</span>
                        </div>
                        <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${r.isCore ? 'bg-cyan-500/10 text-cyan-400' : (r.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400')}">
                            ${r.isCore ? 'CORE' : r.status}
                        </span>
                    </div>
                `).join('');
            } catch (e) {
                console.error("Rules load error:", e);
            }
        }

        async function loadLogs() {
            try {
                const res = await fetch('/api/logs');
                if (!res.ok) return;
                const logs = await res.json();
                const container = document.getElementById('log-timeline');
                if (!container) return;

                if (!logs || logs.length === 0) {
                    container.innerHTML = '<p class="text-slate-500 italic py-3 text-center">No telemetry logs recorded yet.</p>';
                    return;
                }

                container.innerHTML = logs.map(l => `
                    <div class="p-2.5 rounded bg-cyber-black/80 border border-cyber-border space-y-1">
                        <div class="flex items-center justify-between text-[10px] font-mono">
                            <span class="font-bold text-cyan-400 uppercase tracking-wider">${l.stage}</span>
                            <span class="text-slate-500">${l.timestamp}</span>
                        </div>
                        <div class="text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">${escapeHtml(l.body)}</div>
                    </div>
                `).join('');

                if (autoScroll) {
                    container.scrollTop = container.scrollHeight;
                }
            } catch (e) {
                console.error("Log fetch error:", e);
            }
        }

        function escapeHtml(str) {
            return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        async function checkEngineStatus() {
            try {
                const res = await fetch('/api/engine');
                if (!res.ok) return;
                const data = await res.json();
                const dot = document.getElementById('engine-dot');
                const text = document.getElementById('engine-text');
                if (text) text.textContent = data.engine_label || "Local Model";
                if (dot) {
                    if (data.is_local_online) dot.className = "w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400";
                    else if (data.backend === "local") dot.className = "w-2 h-2 rounded-full bg-amber-400";
                    else dot.className = "w-2 h-2 rounded-full bg-cyan-400";
                }
            } catch (e) {}
        }

        // Live Polling Intervals
        setInterval(getSystemState, 1000);
        setInterval(checkEngineStatus, 4000);
        setInterval(loadLogs, 2000);
        setInterval(loadLogicalTree, 2000);
        setInterval(loadRules, 3000);

        // Initial fetch on mount
        getSystemState();
        checkEngineStatus();
        loadLogicalTree();
        loadLogs();
        loadRules();
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("dashboard:app", host="127.0.0.1", port=8000, reload=True)
'''

full_new_code = backend_code + "\n\n" + new_html_content

with open(DASHBOARD_FILE, "w", encoding="utf-8") as f:
    f.write(full_new_code)

print("SUCCESS: dashboard.py updated with 3D Visualized Movie-Level UI/UX!")
