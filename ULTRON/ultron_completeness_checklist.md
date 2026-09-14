# ULTRON 3.0 — Full Feature Completeness Checklist

**331 items total** — Section 1 (items 1–190) is drawn directly from the ULTRON 3.0 spec, broken into granular checkable units. Section 2 (items 191–331) is a set of recommended production-grade additions the spec doesn't currently cover.

---

## SECTION 1 — CORE (From ULTRON 3.0 Spec)

### A. Multi-Agent Reasoning Graph
- [x] **1. Boss Node (Sentinel)** — reviews and approves/rejects every mission goal before planning starts.
- [x] **2. Boss Node scope-lock** — freezes original intent so scope cannot silently expand mid-run.
- [x] **3. Boss Node ambiguity gate** — halts and requests clarification on vague or underspecified goals.
- [x] **4. Boss Node final release approval** — nothing is marked "complete" without explicit Boss sign-off.
- [x] **5. Boss Node rejection reasoning log** — every rejection records a specific, readable reason.
- [x] **6. Planner Node (Architect)** — decomposes the approved goal into the structured `logical_tree`.
- [x] **7. Planner screens breakdown** — enumerates every UI screen/page the app needs.
- [x] **8. Planner features breakdown** — lists discrete features mapped to each screen.
- [x] **9. Planner data-entity modeling** — defines the data structures/state the app will hold.
- [x] **10. Planner task list generation** — produces an ordered list of implementation tasks.
- [x] **11. Planner verification checklist** — defines pass/fail criteria for each feature up front.
- [x] **12. Planner "no code" constraint** — Planner is architecturally barred from writing implementation code.
- [x] **13. Coordinator Node (Router)** — turns tree branches into scoped, Worker-ready briefs.
- [x] **14. Coordinator domain sandboxing** — isolates each feature/file domain to prevent cross-contamination.
- [x] **15. Coordinator dependency ordering** — sequences tasks by real dependency, not arbitrary order.
- [x] **16. Coordinator boundary enforcement** — blocks a Worker from editing files outside its assigned domain.
- [x] **17. Worker Node (Synthesizer)** — writes complete, self-contained code for its assigned brief.
- [x] **18. Worker Diamond-standard self-check** — validates its own output against standard before returning it.
- [x] **19. Worker retry-on-failure** — automatically regenerates output when self-check or verification fails.
- [x] **20. Inter-node handoff logging** — every node-to-node transition is timestamped and logged with payload.
- [x] **21. Graph state persistence** — LangGraph execution state survives a server restart mid-run.
- [x] **22. Graph abort/reset** — a running graph execution can be safely aborted and reset to idle.
- [x] **23. Graph error containment** — a failure in one node doesn't corrupt state in other nodes.
- [x] **24. Node timeout limits** — each node has its own configurable timeout (e.g. Worker 900s).
- [x] **25. Multi-turn graph memory** — the graph retains context of prior turns within the same project.

### B. Logical Tree & Planning
- [x] **26. `logical_tree.json` persistence** — every project's tree is saved to disk as a standalone artifact.
- [x] **27. Tree visual view** — the reasoning tree renders as a readable visual hierarchy in the UI.
- [x] **28. Tree raw JSON view** — a toggle exposes the exact underlying JSON for developers.
- [x] **29. Tree intent node** — captures the original one-line mission statement at the tree root.
- [x] **30. Tree screens node** — nested list of every screen with its own sub-branches.
- [x] **31. Tree features node** — features nested under their owning screen.
- [x] **32. Tree logic node** — business logic/rules captured separately from UI structure.
- [x] **33. Tree verification node** — explicit checks tied to each feature branch.
- [x] **34. Tree diffing between versions** — shows what changed in the tree between v1.0 and v1.1.
- [x] **35. Tree-to-brief translation** — Coordinator reads the tree directly to generate Worker briefs.
- [x] **36. Tree search/filter** — find a specific feature or screen inside a large tree quickly.
- [x] **37. Tree export** — tree can be exported independently of the code (e.g. as a spec doc).
- [x] **38. Tree validation** — flags orphaned nodes (features with no screen, tasks with no feature).
- [x] **39. Tree progressive disclosure** — collapses/expands branches so large trees stay readable.
- [x] **40. Tree-driven test generation** — verification nodes double as the basis for later QA checks.

### C. Command Deck — Top Bar & Nav Rail
- [x] **41. Top system bar** — persistent 46px header with system identity and live status.
- [x] **42. System identity glyph** — a distinct visual mark for "ULTRON // Autonomous OS".
- [x] **43. Live Ollama status chip** — shows model, thread count, and online/offline state in real time.
- [x] **44. Active project chip** — always shows which project is currently loaded.
- [x] **45. Global status chip** — READY / RUNNING / ERROR state visible at all times.
- [x] **46. Projects directory modal trigger** — one click opens the full projects catalog.
- [x] **47. Procedural audio toggle** — ambient/UI sound can be switched on/off globally.
- [x] **48. Left nav rail** — persistent 60px rail for switching between major views.
- [x] **49. Command view** — main command deck (reactor, console, sandbox).
- [x] **50. Projects view** — dedicated project catalog and lifecycle management drawer.
- [x] **51. Agents view** — jumps straight to the 4-node agent telemetry matrix.
- [x] **52. Activity view** — jumps straight to the execution telemetry stream.
- [x] **53. Settings view** — direct access to governance rules and safety constraints.
- [x] **54. Active-section indicator** — a visual marker shows which nav item is currently open.
- [x] **55. Keyboard navigation** — nav rail and major views are reachable without a mouse.

### D. Arc Reactor Visualization
- [x] **56. Arc Reactor hero canvas** — central animated visualization of system state.
- [x] **57. Multi-tier segmented rings** — outer bezel and counter-rotating telemetry ring render independently.
- [x] **58. Breathing containment core** — idle animation that reads as "alive," not static.
- [x] **59. Energy filaments** — visual connections from reactor core to each of the 4 agent nodes.
- [x] **60. Light packet animation** — a traveling pulse shows a handover between nodes in real time.
- [x] **61. IDLE state** — calm, low-intensity animation when nothing is running.
- [x] **62. EVALUATING_GOAL state** — distinct animation while Boss reviews a new goal.
- [x] **63. PLANNING state** — distinct animation while Planner builds the tree.
- [x] **64. COORDINATING state** — distinct animation while Coordinator dispatches briefs.
- [x] **65. SYNTHESIZING state** — highest-energy animation while Worker is actively writing code.
- [x] **66. VALIDATING state** — distinct animation during self-check/verification.
- [x] **67. APPROVED state** — confident, resolving animation on successful completion.
- [x] **68. ERROR state** — controlled, unmistakable animation on failure (not just red text).
- [x] **69. Reduced-motion support** — reactor animation respects `prefers-reduced-motion`.
- [x] **70. Performance-safe rendering** — reactor animation doesn't drop below 60fps on a mid-range laptop.

### E. Mission Console
- [x] **71. Mission input field** — auto-growing textarea for entering a goal.
- [x] **72. Glowing prompt indicator** — a visible `›` cue shows where input is typed.
- [x] **73. Reactive waveform** — a live audio-style waveform responds to typing/voice activity.
- [x] **74. Keyboard dispatch** — `Ctrl+Enter` submits a mission without touching the mouse.
- [x] **75. Input history** — previous missions for this project are recallable (e.g. up-arrow).
- [x] **76. Length/clarity guardrails** — warns if a mission prompt is too vague or too long.
- [x] **77. Submit-state feedback** — console clearly shows "submitted, reasoning started" immediately on send.
- [x] **78. Mid-run edit lock** — console prevents conflicting new submissions while a run is active.
- [x] **79. Draft autosave** — an unsent mission draft isn't lost on accidental navigation away.
- [x] **80. Console-to-Boss direct link** — everything typed here goes straight into the Boss evaluation step.

### F. Holographic Application Sandbox
- [x] **81. Live embedded browser/iframe** — the generated app renders live, not just as code.
- [x] **82. Desktop viewport (1920×1080)** — one-click preview at desktop size.
- [x] **83. Tablet viewport (1024×768)** — one-click preview at tablet size.
- [x] **84. Mobile viewport (375×667)** — one-click preview at mobile size.
- [x] **85. 3D perspective tilt** — subtle rotateX/rotateY effect on the sandbox frame.
- [x] **86. Touch-device tilt disable** — 3D tilt automatically turns off on touch devices.
- [x] **87. Reduced-motion tilt disable** — tilt also respects `prefers-reduced-motion`.
- [x] **88. One-click Save** — pins the current app state as permanent from the sandbox.
- [x] **89. One-click ZIP** — exports the current app straight from the sandbox view.
- [x] **90. Abort control** — stops an in-progress synthesis directly from the sandbox.
- [x] **91. Reset control** — reverts the sandbox to the last saved/approved state.
- [x] **92. Live reload on update** — sandbox refreshes automatically after a chat-driven code change.
- [x] **93. Sandbox isolation** — the embedded app can't reach outside its own domain/scope.
- [x] **94. Broken-render fallback** — sandbox shows a clear error state instead of a blank iframe.
- [x] **95. Full-screen preview mode** — sandbox can expand to fill the whole viewport for closer review.

### G. Right Intel Deck (5 Modes)
- [x] **96. Reasoning tab** — dedicated panel for the logical tree.
- [x] **97. Visual/Raw JSON toggle** — switch between rendered tree and source JSON.
- [x] **98. Tree node click-through** — clicking a tree node highlights the related code/telemetry.
- [x] **99. Evolution tab** — dedicated per-project chat panel.
- [x] **100. Operator vs ULTRON bubble styling** — clearly distinguishes who said what.
- [x] **101. Version badges in chat** — each reply that changes code shows its resulting version.
- [x] **102. Proactive suggestion chips** — AI-generated "possible updates" tailored to the project type.
- [x] **103. One-click chip apply** — clicking a suggestion chip submits it as the next revision.
- [x] **104. Code inspector tab** — developer-grade view of the synthesized file.
- [x] **105. File path display** — shows exactly which file/domain is being viewed.
- [x] **106. Line count display** — shows total lines for quick scale assessment.
- [x] **107. Real-time search/filter** — find a string inside the code instantly.
- [x] **108. One-click clipboard copy** — copies the full file or selection with one click.
- [x] **109. Telemetry tab** — structured execution log stream.
- [x] **110. Node badges** — BOSS/PLANNER/COORDINATOR/WORKER/ERROR tags on each log line.
- [x] **111. Timestamps on every log entry** — down to the second.
- [x] **112. Log filtering by node** — isolate just Boss, just Worker, etc.
- [x] **113. Log export** — telemetry stream can be exported for later debugging.
- [x] **114. Rules tab** — security/policy checklist panel.
- [x] **115. Scope discipline rule** — toggleable, always-on by default.
- [x] **116. Domain sandboxing rule** — toggleable, always-on by default.
- [x] **117. Verification-required rule** — blocks release without passing checks.
- [x] **118. Zero-placeholder rule** — blocks any `TODO`/"coming soon" output from shipping.
- [x] **119. Custom rule addition** — operator can add project-specific guardrails.
- [x] **120. Rule violation alerts** — a rule breach is surfaced immediately, not just logged silently.

### H. Project Lifecycle Engine
- [x] **121. Dedicated project directory** — `projects/<id>/` created automatically per mission.
- [x] **122. `project.json` metadata file** — stores name, timestamps, status, permanence.
- [x] **123. `logical_tree.json` per project** — the plan artifact lives alongside the code.
- [x] **124. `versions/` folder** — every increment is snapshotted (`v1.0.html`, `v1.1.html`, ...).
- [x] **125. 30-day expiration countdown** — unsaved projects display a live "time left" badge.
- [x] **126. Amber "expiring soon" badge** — visually distinct warning as expiration nears.
- [x] **127. Emerald "permanent" badge** — visually distinct once a project is pinned/saved.
- [x] **128. One-click permanent pin** — toggles a project out of the auto-purge cycle.
- [x] **129. Save All** — pins every active project as permanent in one action.
- [x] **130. Hourly purge daemon** — background thread actually enforces the 30-day TTL, not just UI display.
- [x] **131. Single-project ZIP export** — bundles index, project.json, tree, and all versions.
- [x] **132. Master ZIP export** — bundles every active project into one archive.
- [x] **133. Project delete** — permanently removes a project and all its versions.
- [x] **134. Project rename** — operator can relabel a project without losing history.
- [x] **135. Projects catalog drawer** — browsable list of all active/saved projects.
- [x] **136. Catalog search/filter** — find a project by name or type quickly.
- [x] **137. Catalog sort** — by creation date, expiration, or last updated.
- [x] **138. Restore from ZIP** — a previously exported project can be re-imported.
- [x] **139. Storage usage indicator** — shows how much disk space projects are consuming.
- [x] **140. Orphaned file cleanup** — purge daemon also removes stray files with no matching project.json.

### I. Per-Project Chat & Evolution Loop
- [x] **141. Chatbot** — a space to discuss project specs and issue live-update commands per project.
- [x] **142. Full conversation history** — every message and its resulting version is preserved.
- [x] **143. Context-aware revisions** — Worker receives existing code + full chat context on each update.
- [x] **144. Auto version bump** — every accepted update increments the version number automatically.
- [x] **145. Version snapshot on update** — old version is preserved before the new one overwrites `index.html`.
- [x] **146. Type-specific suggestions** — different chip suggestions for finance vs. productivity vs. sentiment tools.
- [x] **147. Universal suggestion chips** — cross-cutting suggestions (CSV export, theme switcher) always available.
- [x] **148. Chat-triggered sandbox refresh** — sandbox iframe updates live the moment an edit lands.
- [x] **149. Revision scope containment** — a chat-driven update can't silently touch unrelated files.
- [x] **150. Undo last update** — one click reverts to the immediately prior version.
- [x] **151. Chat-based bug report** — operator can flag a bug in chat and have Worker attempt a fix.
- [x] **152. Multi-turn clarification** — Worker can ask a follow-up question if a chat request is ambiguous.
- [x] **153. Chat rate limiting** — prevents runaway rapid-fire update loops from exhausting local compute.
- [x] **154. Chat search** — find a past instruction or answer within a long project thread.
- [x] **155. Chat-linked telemetry** — each chat-driven update links to its own telemetry log entries.

### J. Diamond-Grade Synthesis Standard
- [x] **156. Zero mock/placeholder policy** — no `// add code here`, no `alert('coming soon')`.
- [x] **157. Single-file self-contained architecture** — one `index.html`, zero build steps, fully offline.
- [x] **158. Modern dark UI baseline** — every generated app ships with a coherent, non-generic dark theme.
- [x] **159. Glassmorphic styling baseline** — consistent visual language across all generated apps.
- [x] **160. Responsive layout requirement** — every generated app works at mobile, tablet, and desktop sizes.
- [x] **161. Real interactive state** — calculators/charts/matrices are functional, not decorative.
- [x] **162. Local storage persistence** — generated apps retain user data across a page reload where relevant.
- [x] **163. Accessible contrast baseline** — text/background contrast meets a minimum readability bar by default.
- [x] **164. No dead links/buttons** — every interactive element in a generated app does something.
- [x] **165. Automatic standard re-check** — runs after every chat-driven revision, not just on first synthesis.

### K. API Reference / Backend
- [x] **166. `GET /`** — serves the Command Deck HUD.
- [x] **167. `GET /api/state`** — current LangGraph execution state.
- [x] **168. `POST /api/run`** — triggers a new 4-agent execution with a goal.
- [x] **169. `POST /api/reset`** — aborts the active run and resets to idle.
- [x] **170. `GET /api/tree`** — returns the latest logical_tree artifact.
- [x] **171. `GET /api/rules`** — retrieves active governance rules.
- [x] **172. `POST /api/rules/add`** — adds and validates a new custom rule.
- [x] **173. `GET /api/logs`** — real-time reasoning/execution logs.
- [x] **174. `GET /api/projects`** — lists all projects with metadata and countdowns.
- [x] **175. `POST /api/projects/save-all`** — marks every project permanent.
- [x] **176. `GET /api/projects/export-all`** — downloads the master ZIP.
- [x] **177. `GET /api/projects/{id}`** — full project detail, code, tree, and chat history.
- [x] **178. `POST /api/projects/{id}/save`** — toggles permanent retention.
- [x] **179. `DELETE /api/projects/{id}`** — permanently deletes a project.
- [x] **180. `POST /api/projects/{id}/chat`** — submits a revision prompt and evolves the code.

### L. Local-First Inference
- [x] **181. Ollama daemon integration** — `llama3.1:8b` runs fully locally.
- [x] **182. Configurable thread count** — `OLLAMA_NUM_THREADS` tunable to hardware.
- [x] **183. Configurable parallelism** — `OLLAMA_NUM_PARALLEL` tunable per machine.
- [x] **184. Zero-cost default** — no API billing when running on local inference.
- [x] **185. Extended Worker timeout** — 900s ceiling to accommodate slower local CPU inference.
- [x] **186. 100% offline capability** — the full system functions with no internet connection.
- [x] **187. Optional cloud fallback** — a hosted model can be configured for heavier tasks.
- [x] **188. Model swap support** — the target local model is configurable, not hardcoded.
- [x] **189. Inference health check** — dashboard detects and reports if the Ollama daemon isn't running.
- [x] **190. Graceful degradation** — clear error state (not a silent hang) if inference is unavailable.

---

## SECTION 2 — RECOMMENDED ADDITIONS (Not Yet in Spec)

### M. Security & Guardrails
- [x] **191. Authentication** — dashboard access requires login, even for a single-user local setup.
- [x] **192. Session management** — sessions expire and can be revoked.
- [x] **193. Secrets vault** — no credentials stored in plaintext in project files.
- [x] **194. Input sanitization** — all operator input is sanitized before reaching any agent node.
- [x] **195. Generated-code sandboxing** — synthesized apps run isolated, not with host privileges.
- [x] **196. XSS protection audit** — every generated `index.html` is scanned for injectable script risks.
- [x] **197. CSRF protection** — on all state-changing API routes.
- [x] **198. Rate limiting** — on all public-facing API endpoints.
- [x] **199. Dependency vulnerability scanning** — for anything the Worker pulls in.
- [x] **200. Least-privilege file access** — enforced at the OS/process level, not just logically.
- [x] **201. Audit log** — of every delete/export/permission change.
- [x] **202. Prompt-injection resistance** — Worker treats content inside a generated app as data, not instructions.
- [x] **203. Rules-tab runtime enforcement** — not just a UI checklist.
- [x] **204. Safe-mode toggle** — disables all outbound network calls for a fully air-gapped run.
- [x] **205. Content policy filter** — blocks synthesis of clearly harmful app categories.
- [x] **206. Secure generated-app defaults** — no inline `eval()`, no unsandboxed third-party scripts.
- [x] **207. Backup encryption** — exported ZIPs can optionally be encrypted.
- [x] **208. Role-based access** — viewer vs. operator vs. admin, if multi-user is enabled.
- [x] **209. Automatic secret redaction** — in telemetry logs.
- [x] **210. Incident alert** — a security-rule violation triggers a visible dashboard alert.

### N. Testing & QA Infrastructure
- [x] **211. Unit tests** — for `ultron_flow.py` node logic.
- [x] **212. Integration tests** — for the full 4-node graph.
- [x] **213. Lifecycle tests** — for `project_manager.py` logic.
- [x] **214. Synthesized-app smoke test** — every Worker output is auto-loaded once to confirm it renders.
- [x] **215. Visual regression testing** — on the Command Deck UI itself.
- [x] **216. Cross-browser coverage** — Chrome, Firefox, Safari, Edge.
- [x] **217. Load testing** — for concurrent project runs.
- [x] **218. Chaos testing** — simulated node failures to confirm graceful recovery.
- [x] **219. Regression suite re-run** — after every dashboard or agent-logic update.
- [x] **220. Snapshot testing** — for the `logical_tree` schema across versions.
- [x] **221. API contract testing** — for every documented endpoint.
- [x] **222. Accessibility testing** — screen reader, keyboard-only, on the dashboard.
- [x] **223. Test coverage reporting** — visible to the operator.
- [x] **224. Golden-output comparison** — for Diamond-standard compliance checks.
- [x] **225. Fuzz testing** — of the mission input field with malformed/edge-case prompts.
- [x] **226. Varied test-data policy** — every automated re-test uses freshly generated inputs, never a repeated fixed case.
- [x] **227. Version-to-version diff testing** — confirms an update didn't silently regress an unrelated feature.
- [x] **228. End-to-end pipeline test** — full "mission to export" path.
- [x] **229. Ollama failure injection** — confirms fallback behavior under simulated outage.
- [x] **230. Nightly full-suite run** — results surfaced in the dashboard.

### O. Observability & Monitoring
- [x] **231. Centralized structured logging** — across all backend modules.
- [x] **232. Historical FPS/runtime tracking** — extends the existing bottom-bar monitor.
- [x] **233. Error tracking with stack traces** — surfaced to the Telemetry tab.
- [x] **234. Per-node latency metrics** — how long Boss/Planner/Coordinator/Worker each take.
- [x] **235. Inference latency tracking** — for the local Ollama model.
- [x] **236. Resource usage monitor** — CPU/RAM consumption during synthesis.
- [x] **237. Server uptime tracking**.
- [x] **238. Repeated-failure alerting** — within a short time window.
- [x] **239. Historical run dashboard** — success/failure rate over time.
- [x] **240. Storage growth monitor** — alerts before disk fills from unpurged projects.
- [x] **241. Health check endpoint** — `/api/health` for external monitoring.
- [x] **242. Log rotation** — so telemetry logs don't grow unbounded.
- [x] **243. Exportable metrics** — CSV/JSON for external analysis.
- [x] **244. Per-project cost/time-to-build tracking**.
- [x] **245. Anomaly detection** — on unusually long or repeatedly failing runs.

### P. Reliability & Self-Healing
- [x] **246. Retry-with-backoff** — on transient Ollama failures.
- [x] **247. Mid-run state checkpointing** — a crash doesn't lose all progress.
- [x] **248. Post-completion self-check pass** — re-verifies previously passing items.
- [x] **249. Regression auto-fix loop** — if a prior passing feature breaks after a later update, Worker is re-tasked to fix it before continuing.
- [x] **250. Full-checklist re-verification round** — after all items are first completed, using freshly varied test cases.
- [x] **251. Dependency-aware re-test** — only items whose dependencies changed are re-tested, keeping re-runs efficient.
- [x] **252. Rollback-on-regression** — an update that breaks a working feature can be auto-reverted pending a fix.
- [x] **253. Circuit breaker** — repeated failures in one node pause that node rather than looping forever.
- [x] **254. Graceful shutdown** — in-progress runs are safely checkpointed on server stop.
- [x] **255. Ollama auto-restart** — if the daemon becomes unresponsive.
- [x] **256. Conflict detection** — when two chat-driven edits target overlapping code regions.
- [x] **257. Data integrity check** — on `project.json`/`logical_tree.json` at load time, repairing corrupt files where possible.
- [x] **258. Idempotent re-runs** — re-triggering the same mission doesn't create duplicate projects.
- [x] **259. Deterministic failure reproduction** — a failed test can be re-run with the same seed for debugging.
- [x] **260. Auto-generated post-mortem** — after any run that ends in ERROR state.

### Q. Collaboration & Multi-User
- [x] **261. Multi-user support** — beyond a single local operator.
- [x] **262. Per-user project ownership and visibility**.
- [x] **263. Shareable read-only project links**.
- [x] **264. Node/line commenting** — by a collaborator, on a specific tree node or code line.
- [x] **265. Concurrent-edit awareness** — warns if two people are editing the same project.
- [x] **266. Activity feed** — who changed what and when.
- [x] **267. Team-wide vs. personal rule overrides**.
- [x] **268. Invite/permission management UI**.
- [x] **269. Shareable project templates** — export a project as a template for teammates.
- [x] **270. Cross-project search** — across a whole team's catalog.
- [x] **271. Teammate-update notifications** — on shared projects.
- [x] **272. Team usage/storage quota visibility**.

### R. Extensibility & Integrations
- [x] **273. Plugin system** — new Worker capabilities (e.g. frameworks beyond vanilla HTML/JS).
- [x] **274. Webhook support** — notify external systems (Slack, email) on run completion.
- [x] **275. Custom model support** — swap in a different local or hosted LLM per project.
- [x] **276. Import existing codebase** — start a project from an uploaded file instead of a blank mission.
- [x] **277. Git integration** — commit each version snapshot to a real repository.
- [x] **278. CLI companion** — trigger missions and exports from the command line.
- [x] **279. Editor extension** — browse ULTRON projects without leaving VS Code.
- [x] **280. Pluggable custom Diamond-standard rules** — per organization.
- [x] **281. Theming API** — reskin the Command Deck without forking the code.
- [x] **282. Alternate-framework export** — React/Vue beyond single-file HTML.
- [x] **283. Third-party design-system import** — e.g. Tailwind/shadcn as an optional Worker target.
- [x] **284. Rate-limited public API access** — for external tool integration.

### S. Data Privacy & Compliance
- [x] **285. Local-only data mode** — guarantees nothing leaves the machine when cloud fallback is off.
- [x] **286. Portable per-project data export** — human-readable format.
- [x] **287. True permanent delete** — wipes all snapshots, not just the catalog entry.
- [x] **288. Visible data retention policy** — shown in Settings.
- [x] **289. Consent prompt** — before any cloud-fallback call is made.
- [x] **290. Sample-data PII detection** — warns if generated apps' sample data looks like real PII.
- [x] **291. Configurable log retention window**.
- [x] **292. No unauthorized telemetry** — no phone-home without explicit opt-in.
- [x] **293. License/attribution tracking** — for any third-party code patterns the Worker reuses.
- [x] **294. Anonymization option** — for exported telemetry used in bug reports.

### T. UX Polish & Accessibility
- [x] **295. First-run onboarding tour**.
- [x] **296. In-app contextual help/tooltips** — on every major control.
- [x] **297. Keyboard shortcut reference panel**.
- [x] **298. Toast notifications** — for background events (purge, export complete, error).
- [x] **299. Extended undo/redo history** — beyond just "last update."
- [x] **300. Dashboard dark/light theme switcher** — separate from generated-app theming.
- [x] **301. Screen-reader labels** — on all icon-only controls.
- [x] **302. Adjustable font size / zoom support**.
- [x] **303. Loading-state skeletons** — instead of blank panels during synthesis.
- [x] **304. Clear empty states** — e.g. "no projects yet," with a call to action.
- [x] **305. Actionable error messaging** — not raw stack traces.
- [x] **306. Mobile-friendly status fallback layout**.

### U. Cost & Resource Management
- [x] **307. Pre-run compute time estimate**.
- [x] **308. Cloud-fallback cost estimate** — shown before a call is made.
- [x] **309. Configurable local-vs-cloud routing rules**.
- [x] **310. Storage quota enforcement** — warning before hitting disk limits.
- [x] **311. Idle-resource throttling** — reduces background polling when unfocused.
- [x] **312. Mission batch scheduling/queueing**.
- [x] **313. Priority queue** — mark a mission as urgent.
- [x] **314. Historical cost/time reporting per project**.
- [x] **315. Runaway-usage auto-pause** — with operator alert.
- [x] **316. Configurable concurrency limit** — for simultaneous project runs.

### V. Advanced AI Capabilities
- [x] **317. Cross-session project memory** — Worker recalls prior decisions without re-reading full history each time.
- [x] **318. RAG over project docs** — Worker references uploaded reference material during synthesis.
- [x] **319. Self-critique pass** — reviews its own output against the verification checklist before returning it.
- [x] **320. Hallucination/fabrication check** — flags invented API calls or nonexistent libraries.
- [x] **321. Natural-language diff summaries** — plain-English explanation of what an update changed.
- [x] **322. Confidence scoring** — Boss surfaces a confidence level alongside approval decisions.
- [x] **323. Multi-goal missions** — a single prompt can spawn several related sub-projects.
- [x] **324. Style-consistency memory** — keeps a consistent visual style across a project's versions.
- [x] **325. Explainable rejections** — cites the specific rule or check that failed.
- [x] **326. A/B variant generation** — Worker proposes two design directions to choose between.
- [x] **327. Automatic test-case generation** — matched to each verification node in the tree.
- [x] **328. Voice-to-mission transcription tuning** — feeds the planned Voice Command feature.
- [x] **329. Long-chat context summarization** — old context isn't silently dropped.
- [x] **330. Complexity-based model routing** — simple edits use a smaller/faster model than full synthesis.
- [x] **331. Learning from operator corrections** — repeated manual fixes get folded into future Worker prompts.

---

## VERIFICATION & SELF-HEALING TEST PROTOCOL

Copy the block below as-is when you want an AI (or yourself) to systematically verify and repair Ultron against this checklist.

```

```
