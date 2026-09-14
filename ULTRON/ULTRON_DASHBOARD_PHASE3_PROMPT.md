# ULTRON — Dashboard Enhancement v2 (Directions Only)

> Builds on the existing Phase 2 dashboard (`dashboard.py`, FastAPI,
> localhost:8000, `ultron_log.md`-driven timeline, domain isolation
> already enforced). This file describes behavior, UX, and visual
> direction only — no implementation code included. Read this alongside
> `ULTRON_SPEC.md` and the current codebase before writing anything.

## Design direction (governs both features below — read first)

**Concept:** "Live blueprint." Ultron is, at its core, a schematic of
agents and domains that is always inspectable and evidence-stamped —
lean into that literally instead of building a generic AI-dashboard
look. Explicitly avoid the three defaults every AI-generated dashboard
falls into: warm cream background with a serif headline and a
terracotta accent; near-black background with a single neon accent;
newspaper-style hairline-rule layout. None of those say anything about
what Ultron actually is. A blueprint does.

**Palette** (each color maps to a real system state — nothing here is
decorative, so no other UI element should borrow these three status
colors for anything else):
- Blueprint Navy `#16233B` — base canvas
- Panel Navy `#1D3050` — card/panel surfaces, slightly lifted off canvas
- Chalk `#E7ECF3` — primary text and line-work (the "drafting pencil" color)
- Signal Amber `#F5A623` — in progress / active, and nothing else
- Verified Green `#4CAF7D` — done, with evidence attached, and nothing else
- Alert Rust `#C1502E` — rejected / boundary violation, and nothing else

**Typography:** a monospace face for headers, node labels, timestamps,
and rule IDs (schematic annotation feel — e.g. IBM Plex Mono or
JetBrains Mono), paired with a clean sans body face for anything
long-form like rule text or descriptions (e.g. IBM Plex Sans or Inter).
Don't mix in a third family anywhere.

**Layout:** the live tree from Feature 1 is the visual center of the
page — the one signature element everything else supports. The rules
panel and the existing timeline arrange around it as secondary "spec
sheet" panels; neither should compete with the tree for attention.

**Motion:** one orchestrated animation language, used consistently (see
Feature 1) — no unrelated decorative animation elsewhere on the page.
Respect the OS-level reduced-motion preference: when it's on, state
still reads clearly from color and icon alone, motion is just the
enhancement, never the only signal.

**Accessibility/responsiveness:** usable at narrower than desktop
widths, visible keyboard focus on the add-rule form and on any
interactive node in the tree.

## Feature 1 — Live System Flow Animation

**Purpose:** show, in real time, what's currently happening between
Boss, Planner, Coordinator, and Domain Workers — not just a static log.

- **Node states, each visually distinct:**
  - *Idle* — thin Chalk outline, low opacity.
  - *Active* — Signal Amber pulse with a soft glow and a slow "breathing"
    scale loop.
  - *Verified* — settles to a Verified Green outline with a small stamp
    or checkmark mark; pulsing stops, it goes quiet and stays visible.
  - *Rejected* — Alert Rust outline with a brief shake or a flag icon;
    stays visible rather than disappearing, so CS can see what failed
    and why.
  - *Stalled* (Coordinator timeout hit) — a slow, dashed-outline blink,
    visually distinct from a normal in-progress pulse so a stall never
    reads as ordinary progress.
- **Handoffs:** when one agent hands off to another, a small point of
  light travels along the connecting line in the direction of the
  handoff; its arrival triggers the receiving node's active state.
- **Concurrency:** multiple Domain Workers can be active in parallel —
  each animates independently, no forced single spotlight when the real
  system is genuinely running more than one worker at once.
- **System idle state:** when no goal is running, the tree stays fully
  idle and quiet, but not dead — a very slow ambient breathing on the
  Boss node only, signaling "listening," not "working."
- **Data source:** purely reflects existing execution state /
  `ultron_log.md`. This is a visualization layer — it does not add new
  backend logic or invent state that doesn't already exist.

## Feature 2 — Rules Section

**Purpose:** show every rule currently governing the agents in one
place, and let CS add new ones without hand-editing spec files.

- **Grouping:** *Core rules* (from `BOSS_PROFILE.md` / spec files,
  read-only, cannot be edited or removed from the UI) shown separately
  from *Added rules* (created via the dashboard).
- **Add-rule flow:** short text input → submit → enters **Pending**.
  Pending rules are visually distinct (dashed border, amber "pending"
  tag) and listed apart from active ones, never mixed in.
- **Confirmation:** the Boss agent reviews a pending rule the same way
  it reviews worker output — either confirms it (moves to **Active**,
  included in system prompts from the next run onward) or flags a
  concern, e.g. a conflict with an existing core rule, for CS to
  resolve. Not a blind approve button.
- **Retiring a rule:** an active added-rule can be retired to an
  **Archived** state, never silently deleted — keeps a record of what
  rules existed over time, consistent with the evidence-first principle.
- **Guardrail:** core rules are never editable from the UI under any
  circumstance. Changing one is a spec-file change outside the
  dashboard, not a dashboard action.

## Hard rules for the coding agent

- Directions only — no code shipped in this file itself.
- Do not modify Boss/Planner/Coordinator decision logic while building
  this. It is a dashboard/visualization layer addition only.
- Do not let a newly added rule take effect until the Boss agent has
  explicitly confirmed it as active.
- Do not introduce a second color system, font pairing, or animation
  style anywhere on the dashboard — one consistent language across old
  and new sections.
