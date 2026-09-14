# ULTRON — System Specification & Architectural Directives (Directions Only)

> **Document Type**: System Specification & Behavioral Brief  
> **Status**: Active & Authoritative  
> **Target Version**: ULTRON 3.0+  
> **Host Server**: `http://127.0.0.1:8000`  
> 
> *This document specifies WHAT to build, HOW agents must behave, and the NON-NEGOTIABLE standards governing all execution. It does not contain ad-hoc patch code — it is the engineering brief that guides all development, agent orchestration, and system validation.*

---

## 1. System Vision & Core Mission

**ULTRON** is an autonomous, tree-based multi-agent operating system and synthesis platform. Its mission is to transform high-level human objectives into fully functional, production-ready, self-contained software applications with zero human code intervention.

ULTRON operates completely independently. It is built and validated on its own merits before being targeted at external codebases or production workflows.

---

## 2. Cardinal Rules & Non-Negotiable Core Principles

Every agent, node, engine, and code modification within ULTRON must strictly adhere to these fundamental principles:

### Rule 0: ZERO FALSE CLAIMS (Truth in Verification)
- **Absolute Mandate**: **Never claim something is working if it is not.**
- No agent output is accepted as "done" without concrete, automated verification evidence attached (e.g., automated headless browser execution, DOM element validation, end-to-end file generation tests).
- Statements like *"it should work"*, *"the download button is now present"*, or *"conversion complete"* are strictly forbidden unless verified by a test script or live assertions that physically confirm their presence and behavior.

### Rule 1: Real Capabilities Only (Zero Mocks, Zero Deception)
- **No Mock Implementations**: Dummy handlers (`alert('Feature coming soon')`), blank placeholder comments (`// TODO: implement logic`), and unstyled raw stubs are strictly banned.
- **No Format Substitution**: When a file type or format is specified (e.g., *"Upload PDF and convert to DOCX"*), the system must genuinely handle that format. Accepting only images or substituting easier formats is treated as a critical system defect.
- **Genuine Client-Side Processing**: Document and media processing must integrate genuine libraries (such as PDF.js for parsing and page canvas rendering, and client-side DOCX synthesis engines) that extract text and compile actual `.docx` files.

### Rule 2: 1-Click Accessible Actions
- Every synthesized application must provide prominent, high-contrast, 1-click action triggers (e.g., Download Button, Convert Button, Reset Canvas) visible in all viewports without requiring hidden scrolls or obscure navigation.

### Rule 3: Sub-Second Deterministic Evolution (< 100ms)
- When a user requests an update or modification through the per-project chat, the system must never stall, freeze on heavy full-file LLM rewrites, or generate identical "fake" version bumps.
- Fast intent-driven code transformers (`autonomous_transformer.py`) must immediately execute targeted DOM/CSS/JS mutations, increment the version snapshot, and hot-reload the sandbox preview.

### Rule 4: Human-like, Evidence-First Communication
- Agents communicate like senior engineers conducting peer reviews: concise, structured, and explaining **WHY** alongside **WHAT**.
- Machine-to-machine raw JSON dumps are forbidden as primary inter-agent or user-facing messaging formats.
- **Mandatory Timestamps**: Every user message, agent action, and telemetry event must carry precise human-readable timestamps.

### Rule 5: Tree-Based Domain Isolation
- Structure follows a strict hierarchy: **Boss → Planner → Coordinator → Domain Workers**.
- Each Worker owns exactly one domain or file scope and has zero read/write access outside that boundary.
- Tasks are broken down into small, independently reviewable blocks rather than monolithic, unverifiable code dumps.

### Rule 6: Comprehensive Project Retention & Lifecycle Management
- Every generated application is stored in an isolated project directory (`projects/<project_id>/`) with version history.
- Unpinned projects have an automated **30-day auto-purge TTL** to conserve disk space.
- Users can toggle permanent retention (`🔒 Save`), download a 1-click multi-file `.zip` bundle, export all projects, or clear projects cleanly.

---

## 3. Multi-Agent Hierarchy & Roles

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
                        │ (30-Day TTL &   │    ├── project.json
                        │  1-Click Export)│    ├── index.html
                        └─────────────────┘    ├── logical_tree.json
                                               └── versions/v1.0.html
```

### Agent Responsibilities

1. **Boss Node (Sentinel & Gatekeeper)**:
   - Root decision-maker.
   - Enforces scope discipline, evaluates goal viability, and verifies evidence.
   - Does not write application code; approves or rejects completed blocks based purely on verification proofs.

2. **Planner Node (Systems Architect)**:
   - Deconstructs goals into an inspectable `logical_tree` (Intent, Screens, Features, Logic, Verification).
   - If a prompt is ambiguous or underspecified, asks targeted clarifying questions instead of guessing.
   - Never writes code.

3. **Coordinator Node (Router & Boundary Enforcer)**:
   - Assigns Planner's briefs to the appropriate domain Worker.
   - Enforces execution timeouts and strict file path isolation ("DO NOT TOUCH" lists).
   - Consolidates block results into unified status reports.

4. **Worker Node (Autonomous Synthesizer)**:
   - Owns exactly one module or output file.
   - Writes clean, self-contained, Diamond-grade code matching the architectural tree.
   - Must supply verification evidence before Coordinator can advance the pipeline.

5. **Autonomous Transformer & Healer (Rapid Evolution Engine)**:
   - Handles real-time conversational tweaks (< 100ms) without invoking slow model re-generations.
   - Performs automated AST/regex code mutations (e.g., adding download controls, themes, layout tweaks).
   - Auto-repairs script breakages, missing tags, or syntax errors.

---

## 4. Tech Stack & Execution Architecture

- **Orchestration**: LangGraph StateGraph (Python 3.10+) with stateful transitions and checkpointing.
- **Model Inference**:
  - **Primary**: 100% Local Model Engine via local Ollama daemon (`llama3.1:8b` running on multi-threaded CPU/GPU).
  - **Cost**: $0.00 / Zero API tokens.
  - **Availability**: 100% offline capability — zero network error vulnerabilities during autonomous runs.
  - **Worker Timeouts**: Extended limits (900s) to guarantee CPU completion without premature cutoff.
- **Command Deck & Dashboard**:
  - **Backend**: FastAPI with asynchronous event broadcasting (SSE / JSON endpoints).
  - **Frontend**: Holographic Cinematic Command Deck featuring:
    - 2D Canvas Arc Reactor with 8 operational states and particle handoff filaments.
    - 3D Perspective-Tilted Application Sandbox with device viewport toggles (Desktop, Tablet, Mobile).
    - Real-Time Waveform Mission Console.
    - 5-Mode Intel Deck: Reasoning Tree, Project Chat Evolution, Code Inspector, Telemetry Logs, Security Rules.
- **Verification Harness**: Playwright automated headless browser test suite running live DOM, network, and download assertions.

---

## 5. Project Directory & Lifecycle Engine

All project artifacts are organized in dedicated directories managed by `project_manager.py`:

```
projects/proj_YYYYMMDD_HHMMSS_slug/
├── project.json          # Metadata, timestamps, retention status, chat history, versions
├── index.html            # Current live synthesized application
├── logical_tree.json     # Architectural reasoning tree artifact
└── versions/
    ├── v1.0.html         # Initial autonomous synthesis
    └── v1.1.html         # Incremental chat evolution snapshot
```

### Retention Policy & Operations:
- **30-Day Auto-Purge**: Unpinned projects track an expiration timestamp (`expires_at = created_at + 30 days`). An automated maintenance loop purges expired unpinned projects.
- **Permanent Retention (`🔒 Save`)**: 1-click toggle marks `is_permanent = True`, exempting the project indefinitely.
- **1-Click Multi-File Export**: Downloads single-project `.zip` archive containing all versions and metadata.
- **Master Export All**: Bundles all projects into a unified backup archive.
- **Project Clearing**: Clean deletion of single or multiple projects with directory cleanup.

---

## 6. Diamond-Grade Synthesis Standards

Every synthesized web application must adhere to the **Diamond Standard**:

1. **Single-File Self-Contained Architecture**:
   - Everything required to execute the application is contained within `index.html` (inline CSS, embedded or reliable CDN scripts with offline fallbacks, vanilla JavaScript).
   - Zero external build tooling (`npm run build`, Webpack, etc.) required to run.
2. **Visual & Ergonomic Polish**:
   - Modern glassmorphic or dark high-contrast interface design.
   - Clean typographic hierarchy, responsive layout, smooth state transitions.
   - Prominent action controls (e.g., 1-click Download, Convert, Copy, Reset).
3. **Genuine Interactivity & Functional Depth**:
   - Real parsing, calculations, data transformations, and state persistence (`localStorage`).
   - If document conversion is requested (e.g., PDF to DOCX):
     - Must accept `.pdf` and render page previews.
     - Must extract text and structure into a genuine downloadable `.docx` file using docx generation libraries.

---

## 7. Hard Verification Rules for Engineering Agents

1. **Evidence Precedes Declaration**: Never inform the user or report that a feature is functional without running an automated test verifying that exact behavior.
2. **No Regression on Refactor**: Refactoring or optimizing code must preserve existing capabilities (e.g., PDF ingestion, canvas rendering, download triggers).
3. **Traceable Logs & Timestamps**: Every step, prompt, response, and error must be recorded in `ultron_log.md` and telemetry streams with exact timestamps.
4. **Enforced File Isolation**: A domain worker must never write outside its designated project or domain directory.
