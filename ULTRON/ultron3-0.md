# ULTRON 3.0 — Autonomous Multi-Agent Command Deck & Project Lifecycle Engine

> **Version**: 3.0.0-QUANTUM-LIFECYCLE  
> **Status**: Operational & Live  
> **Host URL**: `http://127.0.0.1:8000`  
> **Default Engine**: Local Ollama (`llama3.1:8b` @ 8 CPU Threads, $0 Cost, 100% Offline)  
> **Orchestrator**: LangGraph Multi-Agent Directed State Machine  
> **Project Storage**: `projects/<project_id>/` with 30-Day Auto-Purge & 1-Click Backup  

---

## 1. System Overview

**ULTRON 3.0** is an autonomous, tree-based multi-agent orchestration platform that translates high-level human intent into fully functional, production-grade ("Diamond-Standard") software applications with zero human code intervention.

ULTRON 3.0 introduces a complete architectural integration:
1. **4-Node LangGraph Reasoning Engine** (Boss, Planner, Coordinator, Worker) enforcing strict scope discipline and domain sandboxing.
2. **Durable Logical Reasoning Tree** (`logical_tree`) breaking down intent into structured screens, features, data entities, tasks, and verification checks.
3. **Movie-Level Holographic Command Interface** (based on `New folder/index.html`) featuring an interactive segmented Arc Reactor canvas, orbital agent telemetry, a waveform mission console, and a 3D perspective-tilted sandbox.
4. **Project Lifecycle Engine (`project_manager.py`)**: Automatic project directory creation, 1-click multi-file `.zip` export, and an automated **30-day auto-purge policy** for unsaved projects with permanent pin toggling.
5. **Per-Project Interactive Chat & Evolution Loop**: Dedicated conversation panel for each project, AI-generated "Possible Updates" recommendation chips, and autonomous incremental version bumping (`v1.0` -> `v1.1`).
6. **Local-First Zero-Cost Inference**: Powered by local Ollama running Meta's `llama3.1:8b` with extended CPU timeouts (900s Worker limit) for completely offline, cost-free execution.

---

## 2. Multi-Agent Graph Architecture

```
                  ┌──────────────────────┐
                  │   Mission Objective  │
                  └──────────┬───────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Boss Node    │◄────────────────┐
                    │   (Sentinel)    │                 │
                    └────────┬────────┘                 │
                             │ Goal Brief               │
                             ▼                          │
                    ┌─────────────────┐                 │
                    │  Planner Node   │                 │
                    │   (Architect)   │                 │
                    └────────┬────────┘                 │
                             │ Logical Tree             │ Final Review
                             ▼                          │ & Approval
                    ┌─────────────────┐                 │
                    │Coordinator Node │                 │
                    │    (Router)     │                 │
                    └────────┬────────┘                 │
                             │ Scoped Branch Tasks      │
                             ▼                          │
                    ┌─────────────────┐                 │
                    │   Worker Node   │─────────────────┘
                    │  (Synthesizer)  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Project Manager │──► projects/<id>/
                    │(30-Day Lifecycle│    ├── project.json
                    │ & 1-Click ZIP)  │    ├── index.html
                    └─────────────────┘    ├── logical_tree.json
                                           └── versions/v1.0.html
```

### Agent Node Roles

| Agent Node | Persona / Role | Core Responsibilities |
| :--- | :--- | :--- |
| **Boss Node** | Sentinel & Chief Reviewer | Evaluates goals, enforces scope discipline, rejects ambiguous or unverified outputs, and grants release approval. |
| **Planner Node** | Systems Architect | Decomposes goals into a hierarchical `logical_tree` (Intent, Screens, Features, Logic, Verification). Never writes code. |
| **Coordinator Node** | Router & Dispatcher | Converts tree branches into domain-scoped Worker briefs, enforces boundaries, and isolates file domains. |
| **Worker Node** | Autonomous Synthesizer | Synthesizes complete, self-contained, Diamond-grade applications (`domains/web_ui/index.html`). |

---

## 3. Cinematic Command Deck Architecture (UI/UX)

The user interface (`dashboard.py`) transforms ULTRON into a personal AI operating system and autonomous engineering command center:

### Layout & Information Hierarchy:
1. **Top System Bar (46px hairline header)**:
   - System Identity: `ULTRON // Autonomous OS` with geometric neon-etched diamond glyph.
   - Live Telemetry Chips: `● OLLAMA LOCAL (8 THREADS)` | `ACTIVE: PROJECT // TITLE` | `STATUS: READY`.
   - Global Actions: Projects Directory modal trigger (`📁 Projects`), Procedural Web Audio toggle (`[AUDIO: ON/OFF]`).
2. **Left Command Navigation Rail (60px refined rail)**:
   - `⌖ COMMAND` — Main command deck (Arc Reactor, Console, Sandbox).
   - `📁 PROJECTS` — Projects catalog & 30-day lifecycle management drawer.
   - `⊞ AGENTS` — Smooth navigation to the 4-node orbital agent telemetry matrix.
   - `▤ ACTIVITY` — Instant focus on the structured execution telemetry stream.
   - `⚙ SETTINGS` — Direct access to active governance rules and safety constraints.
   - Subtle cyan-illuminated vertical indicator on the active section.
3. **Primary Command Column**:
   - **Arc Reactor Main Hero**:
     - Upgraded Canvas 2D engine with multi-tier segmented rings (48-segment outer bezel, 32-segment counter-rotating telemetry ring, breathing containment core).
     - Directed energy filaments connecting the reactor core to Boss, Planner, Coordinator, and Worker nodes.
     - Dynamic light packets traveling along the filaments during node-to-node state handovers.
     - Eight semantic states: `IDLE` (0.28x Calm), `EVALUATING_GOAL` (0.65x Intelligent), `PLANNING` (0.65x Intelligent), `COORDINATING` (0.80x Strategic), `SYNTHESIZING` (1.25x High-Energy), `VALIDATING` (0.80x Precise), `APPROVED` (0.35x Confident), and `ERROR` (0.18x Controlled).
   - **Mission Console**:
     - Sleek command input with auto-growing textarea, glowing prompt indicator (`›`), 28-bar reactive waveform, and keyboard dispatch (`Ctrl + Enter`).
   - **Holographic Application Sandbox**:
     - Isolated live embedded browser with viewport switcher (`Desktop 1920x1080`, `Tablet 1024x768`, `Mobile 375x667`).
     - Smooth clamped 3D perspective tilt (`rotateX`, `rotateY`), automatically disabled on touch devices and when `prefers-reduced-motion` is active.
     - 1-Click `🔒 Save`, 1-Click `⬇ ZIP`, Abort (`✕`), and Reset (`↺`).
4. **Right Intel Deck (5 Instrument Modes)**:
   - `⌁ Reasoning`: Progressive disclosure visual architecture tree (Intent, Screens, Features, Tasks, Verification) with `[VISUAL VIEW] | [RAW JSON]` toggle.
   - `💬 Evolution`: Dedicated per-project threaded chat with Operator vs ULTRON bubbles, version badges, and dynamic **"ULTRON Proactive Suggestions"** chips.
   - `⚡ Code`: Developer-grade code inspector with file path, line counts, real-time search/filter bar, and 1-click clipboard copy.
   - `▤ Telemetry`: Structured execution log stream with node badges (`BOSS`, `PLANNER`, `COORDINATOR`, `WORKER`, `ERROR`) and timestamps.
   - `🛡 Rules`: Security policy checklist (Scope Discipline, Domain Sandboxing, Verification Required, Zero Placeholders) with custom rule additions.
5. **Projects Catalog & Visual 30-Day Lifecycle**:
   - Visual progress timeline: `[CREATED] ────────●──────── [EXPIRES IN 29D]` or `[🔒 PERMANENT] ────────────────── [INDEFINITE]`.
   - 1-Click Save/Pin toggle, 1-Click ZIP export, 1-Click "Save All", 1-Click "Export All (.ZIP)", and Delete.
6. **Bottom System Telemetry Bar (28px)**:
   - Real-time FPS monitor (`60`), Runtime timer (`00:00`), System Status, and `30-DAY TTL ACTIVE` retention indicator.

---

## 4. Project Lifecycle & 1-Click Backup Engine

ULTRON 3.0 integrates a complete **Project Management Engine** (`project_manager.py`):

### Dedicated Directory Layout:
```
projects/proj_YYYYMMDD_HHMMSS_slug/
├── project.json          # Metadata, timestamps, retention status, chat history, versions
├── index.html            # Current live synthesized application
├── logical_tree.json     # Architectural reasoning tree artifact
└── versions/
    ├── v1.0.html         # Initial autonomous synthesis
    └── v1.1.html         # Incremental update snapshot
```

### 1-Click Multi-File Export:
- **Single Project Export** (`/api/projects/{id}/export`): Bundles `index.html`, `project.json`, `logical_tree.json`, and all version snapshots into a single downloadable `.zip` file in one click.
- **Master Export** (`/api/projects/export-all`): Bundles every active project into a single consolidated `.zip` archive.

### 30-Day Auto-Purge Lifecycle:
- **Temporary Projects**: Every unsaved project tracks an expiration countdown (`expires_at = created_at + 30 days`).
- **Live Badges**: Displayed as `⏳ 29d 23h left` (amber) in the Projects Drawer and sandbox hint.
- **1-Click Permanent Retention**: Clicking **Save** toggles `is_permanent = True`, changing the badge to `🔒 Saved (Permanent)` (emerald) and exempting the project from auto-purge.
- **Save All**: One-click button in the Projects Drawer marks all active projects as Permanent.
- **Background Maintenance Daemon**: Hourly background thread in `dashboard.py` automatically scans and permanently purges unpinned projects that exceed the 30-day TTL.

---

## 5. Per-Project Chat Evolution & Proactive Recommendations

Under the **`[💬 Project Chat & Updates]`** tab:
1. **Threaded History**: Preserves full conversation context, timestamps, and version links between the operator and ULTRON.
2. **Proactive Suggestions ("Possible Updates")**: Dynamic AI-generated recommendation chips tailored to the project:
   - For Financial/EMI tools: *"+ Add Amortization Schedule table"*, *"+ Add Prepayment & Tenure reduction calculator"*.
   - For Emotion/Sentiment tools: *"+ Add Emotion Intensity radar chart"*, *"+ Add speech pitch analyzer"*.
   - For Productivity/Kanban tools: *"+ Add drag-and-drop column reordering"*, *"+ Add Pomodoro focus timer"*.
   - Universal: *"+ Add CSV report export"*, *"+ Add dark/light cyberpunk theme switcher"*.
3. **Autonomous Code Evolution**:
   - Entering an update request invokes ULTRON's Worker node with the existing code, user prompt, and Diamond standards.
   - Increments the version (`v1.0` -> `v1.1`), writes a snapshot to `versions/v1.1.html`, overwrites `index.html`, logs the chat entry, and refreshes the sandbox iframe in real time.

---

## 6. Diamond-Grade Synthesis Standard

Every application generated by ULTRON 3.0 must meet the **Diamond Standard**:
- **Zero Mock / Placeholder Policy**: No `// Add code here`, no dummy `alert('coming soon')`, no unstyled raw HTML.
- **Single-File Self-Contained Architecture**: Unified `index.html` with inline structure, modern CSS, and vanilla JavaScript (zero build steps, 100% offline).
- **Modern Dark UI Design**: Glassmorphic styling, high-contrast typography, gradient accents, and responsive layout.
- **Interactive State Engines**: Real calculators, reactive charts, interactive data matrices, and local storage persistence.

---

## 7. Five (5) Next-Generation System Plans

| # | Plan | Capability & Architecture |
| :---: | :--- | :--- |
| **1** | **Multi-Version Time Machine** | Scrub through historical snapshots (`v1.0`, `v1.1`, `v2.0`) with visual code diffs and 1-click instant rollback. |
| **2** | **Autonomous Quality & Security Sentinel** | Automated post-synthesis audit evaluating Accessibility (a11y), Performance, Mobile Responsiveness, and XSS sanitization with a live Diamond Score (0–100%). |
| **3** | **1-Click Cloud Deployment** | Instant push to GitHub Pages, Netlify, or Vercel with a live shareable public link. |
| **4** | **Neural Monaco Live In-Browser Editor** | In-browser code editor with syntax highlighting, search/replace, and live hot-reloading for rapid tweaking without full model re-runs. |
| **5** | **Voice Command & Audio Briefing Mode** | Hands-free mission dictation via browser Web Speech API with spoken holographic audio confirmations from ULTRON. |

---

## 8. Complete API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the 3D Holographic Command Deck HUD. |
| `GET` | `/api/state` | Returns the current state of the LangGraph execution loop. |
| `POST` | `/api/run` | Triggers autonomous 4-agent graph execution with a user-supplied goal. |
| `POST` | `/api/reset` | Instantly aborts any active run and resets graph state to idle. |
| `GET` | `/api/tree` | Returns the latest structured `logical_tree` artifact. |
| `GET` | `/api/rules` | Retrieves active governance rules and safety constraints. |
| `POST` | `/api/rules/add` | Adds and reviews a custom guardrail rule. |
| `GET` | `/api/logs` | Fetches the real-time agent reasoning and execution logs. |
| `GET` | `/api/projects` | Lists all active projects with metadata and retention countdowns. |
| `POST` | `/api/projects/save-all` | 1-Click Save All: Marks all projects as Permanent. |
| `GET` | `/api/projects/export-all` | 1-Click Export All: Downloads master `.zip` with all projects. |
| `GET` | `/api/projects/{id}` | Retrieves full project details, code, tree, and chat history. |
| `POST` | `/api/projects/{id}/save` | Toggles permanent retention status (exempts from 30-day purge). |
| `DELETE` | `/api/projects/{id}` | Permanently deletes a specific project. |
| `GET` | `/api/projects/{id}/export` | 1-Click Export: Downloads single project as a `.zip` archive. |
| `GET` | `/api/projects/{id}/suggestions` | Returns AI-generated proactive suggestions for next updates. |
| `POST` | `/api/projects/{id}/chat` | Submits a revision prompt, evolves code, increments version (`v1.1`), and records chat. |
| `GET` | `/projects/{id}/app` | Direct iframe mount serving the live application for any project. |
| `GET` | `/web_ui/*` | Static file mount serving the active synthesized application. |

---

## 9. Directory Structure

```
c:\Users\sakth\Music\ULTRON\
├── .env                       # Environment configurations (Ollama / API keys)
├── dashboard.py               # FastAPI server + 3D Holographic HUD frontend
├── ultron_flow.py             # LangGraph 4-node state graph & Ollama bindings
├── project_manager.py         # Project persistence, 1-click ZIP export & 30-day lifecycle
├── rules.json                 # System guardrails & synthesis constraints
├── ultron3-0.md               # ULTRON 3.0 System Specification (this file)
├── ULTRON_SPEC.md             # Original architectural principles & design spec
├── projects/                  # Managed projects (project.json, index.html, versions/)
├── domains/
│   └── web_ui/
│       └── index.html         # Live active synthesized application
├── archive/
│   └── pre_v3_projects/       # Safely archived legacy projects
└── scratch/                   # Automated test suites and verification harnesses
```

---

## 10. Operating Instructions

### Starting ULTRON 3.0:

1. **Launch Ollama Daemon**:
   ```powershell
   $env:OLLAMA_NUM_PARALLEL='1'
   $env:OLLAMA_NUM_THREADS='8'
   ollama serve
   ```

2. **Launch ULTRON Command Deck**:
   ```powershell
   python -m uvicorn dashboard:app --host 127.0.0.1 --port 8000
   ```

3. **Access Command Deck**:
   Open **`http://127.0.0.1:8000`** in any modern web browser.

4. **Execute Mission**:
   - Enter your mission in the HUD prompt (e.g., *"Text-based emotion understanding with bike EMI analyzer"*).
   - Click **`INITIALIZE REASONING GRAPH`**.
   - ULTRON autonomously plans, coordinates, synthesizes, and registers the project with a 30-day lifecycle.
   - Click **`🔒 Save`** to keep permanently, click **`⬇ ZIP`** to export, or open the **`[💬 Project Chat & Updates]`** tab to request iterative enhancements!
