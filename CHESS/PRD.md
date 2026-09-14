# PRD — Cinematic Chess
**"Chess that feels like a battle."**

Version 1.0 · Draft PRD for MVP → V2 → V3
Owner: Product/Engineering
Status: Ready for build

---

## 1. Executive Summary

Cinematic Chess is a chess application built on a mathematically rigorous, cheat-free chess engine, wrapped in a presentation layer that turns key moments — captures, checks, promotions, and checkmates — into short, elegant battle animations. The chess logic and the animation layer are strictly decoupled: the engine decides what happened, the renderer only shows it. This lets the product be simultaneously a serious strength-scalable chess game and a visually distinctive, "premium" experience that differentiates it from commodity chess apps.

**Core promise:** A high-strength chess engine, enhanced with brief cinematic sequences for the moments that matter, without ever slowing down or compromising serious play.

---

## 2. Product Vision & USP

> "Chess that feels like a battle." / "Every move has a consequence."

The market is full of functionally identical chess apps (Chess.com, Lichess, various mobile clones) that differentiate on content and community, not on the moment-to-moment feel of playing a move. Cinematic Chess's differentiator is the **fusion of engine-grade chess intelligence with cinematic, piece-specific visual storytelling** — while still respecting the players who just want to play fast, serious chess (via an Animation setting that can be turned off entirely).

**Positioning statement:** For chess players who want more than a flat board, Cinematic Chess is a chess app that combines a real, uncompromising chess engine with short cinematic sequences for captures, checks, promotions, and checkmates — unlike commodity chess apps, it makes big moments feel big without getting in the way of serious play.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- Ship a fully rules-correct chess game (all legal moves, special rules, draw conditions) with zero logic bugs.
- Deliver a scalable AI opponent from "Beginner" to "Ultimate," where Ultimate is near engine-strength and never cheats (no hidden-information access).
- Build a presentation/animation layer that is **entirely decoupled** from game logic, driven only by structured events emitted by the Chess Core.
- Make animations skippable/configurable (Off / Minimal / Normal / Cinematic) so competitive players are not slowed down.
- Ship an MVP that is a complete, polished single-device product (Player vs AI, Player vs Player local) before investing in multiplayer infrastructure.

### 3.2 Non-Goals (MVP)
- Online multiplayer, ranked ladders, and accounts are explicitly **out of scope for MVP** (planned for V2).
- 3D rendering, voice commentary, and tournament infrastructure are **out of scope until V3**.
- Matching the strength of reference-grade engines (e.g., Stockfish-level play) is out of scope — the self-built engine targets strong club-level play at its top tier through classical search techniques, not engine-of-record strength. No third-party or machine-learning-based chess engine is used anywhere in the product.

---

## 4. Target Users & Personas

| Persona | Description | Needs |
|---|---|---|
| **Casual Player** | Plays occasionally, enjoys visual flair | Fun, readable animations; easy difficulty levels; simple UI |
| **Serious Club Player** | Plays daily, cares about accurate rules and speed | Fast play, animations off or minimal, strong AI, accurate move list/PGN |
| **Improving Player** | Wants to get better | Puzzles, training modes, difficulty ladder, eventual analysis board |
| **Content/Streaming Audience** | Watches or shares clips | Checkmate cinematics, victory/defeat screens, shareable moments |

---

## 5. Core Product Principles

1. **Separation of concerns is non-negotiable.** The chess engine decides everything (legality, check, checkmate, draws, evaluation). The animation layer only visualizes events it receives; it cannot alter game state, and a rendering crash must never corrupt or block the game state.
2. **The engine never cheats.** At every difficulty level, including Ultimate, the AI selects moves solely from the legal current position via search and evaluation — never from knowledge of concealed information or from artificially reading the opponent's intended move.
3. **Animation is proportional to significance.** Not every move deserves a cinematic. A tiered system (Micro / Tactical / Cinematic) keeps pacing tight across a full game.
4. **Everything cinematic is optional.** An `Animation Level` setting (Off / Minimal / Normal / Cinematic) must be respected globally and per-session.
5. **Theming is a skin, not a rule change.** Medieval, Fantasy, Samurai, Sci-fi, etc. only change asset/animation packs — the underlying rules and notation (FEN/PGN) never change.

---

## 6. Feature Requirements

### 6.1 MVP (v1.0)

**Chess Core**
- Full legal move generation for all pieces, including pins, discovered checks, and en passant edge cases.
- Special rules: castling (kingside/queenside, with all legality conditions: king/rook unmoved, no check, no passing through check), en passant, pawn promotion (Queen/Rook/Bishop/Knight, player choice).
- Game-end detection: checkmate, stalemate, threefold repetition, fifty-move rule, insufficient material, resignation, draw offer/accept.
- Full move history in algebraic notation; PGN export; FEN import/export for any position.
- Undo/redo (for local/practice play only — disabled in any future ranked context) and restart.

**AI**
- Self-built minimax/alpha-beta search engine (see §8), entirely in-house, with configurable strength per tier — no third-party or external engine.
- Difficulty tiers: Beginner, Easy, Medium, Hard, Expert, Master, Ultimate — mapped to concrete engine parameters (see §8.2), not arbitrary randomness.
- Turn timing/"thinking" budget configurable per level so weaker levels don't feel instant/robotic and stronger levels don't stall the UI.

**Game Modes**
- Player vs AI (all difficulty tiers).
- Player vs Player, local/same-device (hot-seat), with an option to flip the board for the side to move.

**Presentation / Animation**
- Board rendering with legal-move highlighting, last-move highlighting, check indicator.
- Micro animations for ordinary moves and captures (~0.2–0.6s).
- Tactical animations for check, capture of a Queen, promotion, castling, en passant (~0.5–1.5s).
- Cinematic sequences for checkmate and game end (~2–4s), including the "army surrounds the King" checkmate visualization.
- Per-piece-type capture animation variants (Pawn/Knight/Bishop/Rook/Queen/King — see §9.3).
- Promotion sequence: pawn reaches last rank → camera focus → transformation effect → chosen piece appears.
- Victory/Defeat screen after checkmate/resignation/draw.
- Animation Level setting: Off / Minimal / Normal / Cinematic, persisted per user/device.
- Sound design: move, capture, check, checkmate, ambient — with independent mute/volume control from animations.
- Fully responsive UI: desktop, tablet, and mobile portrait/landscape.

**Settings & Utilities**
- New game / resign / offer draw / undo (practice only) / flip board.
- Move list panel with algebraic notation, scrollable, tap-to-jump-to-position (view-only for now).
- Board and piece theme selection (at least one full default theme in MVP; theming architecture ready for more).

### 6.2 V2

- Online multiplayer (real-time, via WebSocket), matchmaking by rating band.
- Accounts & authentication, profiles, avatars.
- Elo/glicko-style rating system, leaderboards, match history with replays.
- Chess clocks (bullet/blitz/rapid/classical presets, custom time + increment).
- Puzzles: tactical puzzles, checkmate-in-N challenges, endgame drills, opening practice, sourced/generated and rated by difficulty.
- Analysis board with engine evaluation bar and best-move suggestions post-game.
- Opening explorer (book moves, common continuations, win/draw/loss stats).
- Spectator mode for live games.

### 6.3 V3

- Multiple full visual themes (Medieval, Fantasy, Samurai, Sci-fi) as swappable asset/animation packs.
- Optional 3D board and pieces (in addition to 2D).
- Advanced cinematics: extended checkmate sequences, camera work, slow-motion highlights.
- AI-generated natural-language move explanations ("why did the engine play this?").
- Voice commentary (rule-based or generative) for key moments.
- Tournament mode (brackets, round robin, Swiss).
- Custom battle environments/backgrounds tied to theme.

---

## 7. System Architecture

The application is split into four decoupled systems coordinated by a Game Manager. This boundary is the single most important architectural decision in the product: **the Chess Core has no dependency on, or awareness of, the Presentation layer.**

```
                         CHESS APPLICATION
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
          CHESS CORE         AI ENGINE        PRESENTATION
              │                 │                 │
        Board State          Search            Animation
        Move Rules           Evaluation        Camera
        Legal Moves          Strategy          Effects
        Check/Mate           Depth mgmt        Sound
        Draw rules           Opening/Endgame   UI / HUD
        Move history         book/tablebase
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
                          GAME MANAGER
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
             Player Input                 Game State
             (UI/touch/mouse,          (single source of truth:
              network in V2)            board, turn, clocks, history)
```

**Data flow for a single move:**

```
Player moves Pawn e2→e4
        │
        ▼
Chess Core validates legality against current board state
        │
   ┌────┴────┐
   │ illegal │──▶ reject, no state change, no event emitted
   └────┬────┘
        │ legal
        ▼
Chess Core updates Board State (immutable snapshot + diff)
        │
        ▼
Chess Core emits a structured GameEvent (see §7.1)
        │
        ├──▶ AI Engine (if it is now AI's turn) computes response
        │
        └──▶ Presentation layer consumes GameEvent → selects animation
             tier → plays sequence → returns control to Game Manager
```

If the Presentation layer throws an error mid-animation, the Game Manager must be able to snap directly to the resulting board state with no animation and continue play — game state is never blocked on rendering.

### 7.1 GameEvent contract (Chess Core → Presentation)

Every state change emits one immutable event object, e.g.:

```json
{
  "type": "MOVE",
  "moveNumber": 24,
  "san": "Nxf7+",
  "uci": "e5f7",
  "piece": "N",
  "color": "w",
  "capture": { "piece": "R", "square": "f7" },
  "special": null,
  "isCheck": true,
  "isCheckmate": false,
  "isStalemate": false,
  "isDraw": false,
  "fenBefore": "...",
  "fenAfter": "...",
  "resultingLegalMoves": 0
}
```

`special` may be one of: `"castle-kingside"`, `"castle-queenside"`, `"en-passant"`, `"promotion"` (with a `promotedTo` field). The Presentation layer maps `type` + `capture.piece` + `isCheck` + `isCheckmate` to an animation tier and a specific clip (see §9).

---

## 8. Chess Engine / Opponent Logic (Self-Built, No External Engine)

No third-party chess engine and no machine-learning model is used anywhere in this product. The computer opponent is entirely self-built classical game-tree search — pure, deterministic mathematics, chosen specifically to keep the codebase self-contained, auditable, and fast.

### 8.1 Engine components
- **Legal move generation:** full pseudo-legal generation + legality filtering (pins, check evasion), including all edge cases for castling and en passant. (Shared with the Chess Core — the opponent never has a separate, looser notion of legality.)
- **Board representation:** bitboards (or 0x88) for performance; FEN as the canonical serialization format for save/load.
- **Search:** Negamax with Alpha-Beta pruning, iterative deepening, transposition tables, move ordering (MVV-LVA, killer moves, history heuristic), and quiescence search to avoid horizon effects — all implemented in-house, in plain, inspectable code.
- **Evaluation:** a hand-authored evaluation function combining material count, piece-square tables, king safety, pawn structure, and mobility. No external evaluation network, no NNUE, no learned weights.
- **Opening book (optional, post-MVP):** a small, hand-curated table of common opening lines stored as static lookup data — a table, not a model.
- **Endgame lookup (optional, V2):** a small precomputed table for basic endings (e.g., K+Q vs K, K+R vs K) — again precomputed data, not a learned system.
- **Time/depth management:** each difficulty tier maps to a fixed search-depth cap and a move-time cap computed from the same evaluation function — never to artificial randomness as a substitute for weaker play, beyond the narrow top-N pick used at the very weakest tier (see §8.2).

**Why self-built:** this keeps "pure mathematical logic" true end-to-end — every move the opponent makes can be traced to a concrete depth, evaluation score, and search path in code the team owns, with zero network calls, zero binary dependencies, and zero black-box behavior.

### 8.2 Difficulty tier mapping (self-built engine)

| Level | Search depth | Time budget | Evaluation used | Move selection |
|---|---|---|---|---|
| Beginner | 1 ply, no quiescence | ~100ms | material count only | random pick among the top 3 near-equal moves (keeps it feeling human, not robotic) |
| Easy | 2 ply | ~200ms | material + basic piece-square tables | pick from top 2 candidates |
| Medium | 3–4 ply, basic move ordering | ~400ms | + mobility | best move found |
| Hard | 5–6 ply, alpha-beta + move ordering | ~800ms | + king safety | best move found |
| Expert | 7–8 ply, transposition table enabled | ~1500ms | + pawn structure | best move found |
| Master | 9–10 ply, quiescence search enabled | ~2500ms | full evaluation function | best move found |
| **Ultimate** | Iterative deepening to the time cap (typically 12+ ply on a modern device) | ~4000ms (device-dependent) | full evaluation function, deepest reachable line | best move found |

**Explicit product requirement:**
> The opponent must select moves exclusively through its own search (negamax with alpha-beta pruning) and evaluation function over the legal current position. It must never access hidden or future player information, never call an external service or engine, and never substitute randomness for weaker play beyond the narrow top-N pick used at the Beginner tier.

### 8.3 Where the engine runs
- Runs entirely client-side inside a Web Worker (or a native background thread on mobile), so search never blocks the main UI thread at any tier.
- No network dependency for single-player: the full game, including the "Ultimate" tier, works completely offline.
- The same search/evaluation code is reused unchanged if ported to a V2 native mobile shell — no engine swap is ever required.

---

## 9. Presentation & Animation System

### 9.1 Guiding rule

> **The animation never changes the chess logic. The chess engine decides everything; the animation only visualizes what happened.**

All animation content is **pre-authored**: hand-crafted sprite sheets / frame-by-frame sequences created for each piece, event, and tier. At runtime, the Presentation layer only selects and plays back the correct pre-made sequence for a given `GameEvent` — it never generates, procedurally composes, or AI-generates motion.

### 9.2 Animation tiers

| Tier | Used for | Duration | Examples |
|---|---|---|---|
| **A — Micro** | Ordinary moves and routine captures | ~0.2–0.6s | slide/step, small bounce on arrival, simple capture effect |
| **B — Tactical** | Meaningful in-game events | ~0.5–1.5s | check, capturing a Queen, promotion, castling, en passant, a flagged "brilliant" tactic |
| **C — Cinematic** | Game-defining moments | ~2–4s | checkmate, game victory/defeat, promotion to Queen (optional upgrade to Tier C), special finishing sequences |

A global **Animation Level** setting scales this system:
- **Off** — instant snap moves, no effects, for maximum speed.
- **Minimal** — Tier A only; B/C collapse to a fast generic flash.
- **Normal** — full A/B, shortened C.
- **Cinematic** — full A/B/C at intended durations.

### 9.3 Per-piece capture identity

Each piece type has a distinct capture animation to reinforce its character, all resolving within Tier A/B timing:

| Piece | Identity | Capture motion |
|---|---|---|
| Pawn | Infantry/soldier | Small strike, target falls |
| Knight | Mounted warrior | Horse charge → strike → target knocked down |
| Bishop | Mystic/mage-like warrior | Energy/blade strike, target collapses |
| Rook | Heavy/fortress-like | Powerful impact, target knocked backward |
| Queen | Most dramatic, but still brief | Fast, elegant strike, brief large effect |
| King | Restrained — important, not overpowered | Minimal, dignified motion (King is rarely "captured" outright — mainly relevant for illustrative/King-adjacent effects) |

Reference sequencing for a generic capture (Tier A/B):

| Time | Action |
|---|---|
| 0.0–0.2s | Attacking piece moves/turns toward target square |
| 0.2–0.5s | Attack motion plays |
| 0.5–0.8s | Target piece reacts/falls |
| 0.8–1.0s | Target piece is removed from the board |
| 1.0s | Board is ready for the next input |

### 9.4 Check sequence (Tier B)

1. Camera subtly moves/zooms toward the checked King.
2. King plays a reaction animation.
3. King's square and the checking piece are both highlighted.
4. Brief "Check" sound cue and on-screen label.
5. Control returns to normal play immediately after (~0.5–1.5s total).

### 9.5 Checkmate sequence (Tier C)

1. **Detection** — Chess Core determines `isCheck = true` and `legalMoves = 0` → emits `isCheckmate: true` on the GameEvent. This is a pure logic decision made before any animation begins.
2. **Camera** — slow push-in toward the losing King.
3. **Surrounding pieces** — the attacking side's pieces nearest the King orient/turn toward it (visual only; board state does not change).
4. **Final moment** — attacking pieces raise weapons toward the King; brief freeze-frame on "Checkmate."
5. **Result screen** — "White Victory" / "Black Victory," with options to rematch, review, or exit.
Total duration target: 2–4 seconds, skippable/tap-to-skip at Normal level and below.

### 9.6 Promotion sequence (Tier B, upgradeable to C for Queen)

1. Pawn reaches the last rank; movement animation pauses at the square.
2. Camera focuses on the pawn.
3. Transformation/light effect plays.
4. Player selects Queen / Rook / Bishop / Knight (if not pre-set); chosen piece appears on the square.
5. Play resumes; the GameEvent's `special.promotedTo` field is what the Presentation layer keys off — the Chess Core has already fully resolved the legal position before any visual plays.

### 9.7 Theming
Board/piece skins and animation clip sets are swappable resource packs (Medieval, Fantasy, Samurai, Sci-fi in V3); the mapping from `GameEvent` → animation tier/clip stays identical across themes, so adding a theme never touches chess logic.

---

## 10. Non-Functional Requirements

- **Correctness:** 100% adherence to FIDE chess rules; validated against a standard legal-move test suite (e.g., perft test positions) before release.
- **Performance:** Move input → legality check → board update must complete in <50ms regardless of animation settings; AI "thinking" must never freeze input handling (run off the main/UI thread).
- **Reliability:** A Presentation-layer failure must never corrupt or lock game state; the Game Manager can always fall back to an instant, non-animated state sync.
- **Accessibility:** Colorblind-safe board themes, adjustable animation speed, full keyboard/switch input path for move entry, screen-reader-friendly move list.
- **Responsiveness:** Playable and legible from small mobile portrait screens up to large desktop displays.
- **Fair play (V2+):** Server-authoritative move validation for any online/ranked mode; client is never trusted for legality or result determination.

---

## 11. Data Model (illustrative — V2 backend)

```
User
 ├─ id, username, email, password_hash, created_at
 ├─ rating (Elo/Glicko), rating_history[]
 └─ preferences { animation_level, theme, sound }

Game
 ├─ id, white_user_id, black_user_id (nullable if vs AI)
 ├─ ai_difficulty (nullable if PvP)
 ├─ pgn, final_fen, result, termination_reason
 ├─ time_control { initial_seconds, increment }
 └─ created_at, ended_at

Move
 ├─ id, game_id, move_number, color
 ├─ san, uci, fen_after
 ├─ special (castle/en-passant/promotion), is_check, is_capture
 └─ clock_remaining_ms

Puzzle
 ├─ id, fen, solution_moves[], theme_tags[], difficulty_rating
 └─ source

LeaderboardEntry
 └─ user_id, rating, rank, period
```

---

## 12. API Surface (illustrative — V2 backend)

```
POST   /api/games                  create a new game (PvAI or PvP)
GET    /api/games/:id               fetch game state
POST   /api/games/:id/moves         submit a move (server validates)
POST   /api/games/:id/resign
POST   /api/games/:id/draw-offer
GET    /api/games/:id/pgn

POST   /api/ai/move                 { fen, difficulty } -> { move, eval }
POST   /api/analysis/evaluate       { fen, depth } -> { eval, bestLine }

POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/:id
GET    /api/leaderboard

WS     /ws/games/:id                 real-time move/clock sync (V2 multiplayer)
```

---

## 13. Suggested Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Client (MVP) | React (web) or React Native/Flutter (mobile) | Fast iteration, large ecosystem, works for the responsive-first requirement |
| Rendering/Animation | Canvas/WebGL (e.g., PixiJS) or a game-oriented layer (e.g., Unity) if 3D (V3) is prioritized early | Plays back pre-authored sprite sheets / frame-by-frame sequences per piece and event; no procedural or AI-generated motion. Unity is a valid alternative if 3D is a near-term goal |
| Chess logic (client) | Custom-built move generation/validation, cross-checked against perft tests | Fully in-house and auditable; no external rules dependency |
| AI engine | Self-built minimax/alpha-beta search engine (TypeScript, run in a Web Worker; optionally compiled to WASM later purely for raw speed) | Fully in-house, deterministic, no third-party or ML-based engine, no network dependency |
| Backend (V2+) | Node.js/TypeScript or equivalent, WebSocket server for real-time play | Matches JS-heavy client stack; strong WebSocket support |
| Database (V2+) | PostgreSQL | Relational integrity for users/games/ratings |
| Auth (V2+) | Standard token-based auth (e.g., JWT) with secure password hashing | Industry standard |
| Infra | Containerized services, horizontally scalable AI/analysis workers | AI computation is the heaviest server cost center |

---

## 14. Suggested Folder Structure

```
cinematic-chess/
├── apps/
│   ├── client/                 # UI, board rendering, animation layer
│   │   ├── src/
│   │   │   ├── core-bridge/    # thin adapter consuming GameEvents
│   │   │   ├── animation/      # tiered animation system, per-piece clips
│   │   │   ├── screens/        # menu, game, settings, victory/defeat
│   │   │   └── themes/         # medieval/fantasy/samurai/sci-fi asset packs
│   │   └── ...
│   └── server/ (V2+)
│       ├── src/
│       │   ├── api/            # REST endpoints
│       │   ├── ws/             # real-time game sync
│       │   ├── ai/             # Stockfish/UCI service wrapper
│       │   └── db/             # models, migrations
│       └── ...
├── packages/
│   ├── chess-core/             # board state, legality, check/mate/draw rules
│   │   ├── moveGeneration.*
│   │   ├── boardState.*
│   │   ├── gameEvents.*
│   │   └── tests/perft/
│   └── shared-types/           # GameEvent, FEN/PGN utils shared client+server
└── docs/
    └── PRD.md
```

---

## 15. Key Screens (MVP)

1. **Main Menu** — Play vs AI, Play vs Friend (local), Settings, How to Play.
2. **Difficulty Select** — Beginner → Ultimate, with a short description per tier.
3. **Game Screen** — board, move list, captured-pieces tray, resign/draw/undo controls, clock area (V2).
4. **Promotion Picker** — modal/overlay during promotion sequence.
5. **Check/Checkmate Overlay** — transient (check) and full-screen (checkmate) states.
6. **Victory/Defeat Screen** — result, rematch, review moves, return to menu.
7. **Settings** — Animation Level, Sound, Theme, Board orientation, Accessibility options.

---

## 16. Success Metrics

- **Rules correctness:** 0 known legality bugs at launch (validated via perft/regression suite).
- **Engagement:** average session length, games completed vs abandoned, % of games with Animation Level ≥ Normal.
- **Retention:** D1/D7/D30 retention post-launch.
- **Performance:** input-to-board-update latency <50ms on target devices; checkmate cinematic completion rate (vs. skip rate) as a proxy for whether the animation is landing.
- **Difficulty calibration:** win/loss distribution per AI tier roughly matching intended Elo bands.

---

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Animation system accidentally coupled to game logic, causing desync bugs | Enforce the GameEvent contract as the only channel between Chess Core and Presentation; unit-test Chess Core with zero rendering dependencies |
| Self-built engine is slow or weak without careful optimization | Use classical speed techniques (bitboards, alpha-beta pruning, move ordering, transposition tables, iterative deepening, quiescence search); cap think-time per tier; run search off the main thread (Web Worker) |
| Over-animating makes serious players abandon the app | Ship Animation Level (Off/Minimal/Normal/Cinematic) at MVP, default to Normal, make Off one tap away |
| Rules edge cases (en passant, castling through check, threefold repetition) shipped broken | Validate against standard perft positions and known edge-case test suites before MVP sign-off |
| Scope creep into multiplayer/theming before MVP is solid | Hold V2/V3 features out of scope explicitly per §3.2 and §6 |

---

## 18. Roadmap Summary

**MVP →** Complete rules-correct chess core, a self-built minimax/alpha-beta opponent across 7 tiers (no third-party engine), local PvP, full animation system built on pre-authored sprite/frame sequences with tiering and Animation Level setting, responsive UI.
**V2 →** Online multiplayer, accounts, ratings/leaderboards, clocks, puzzles, analysis board, opening explorer, spectator mode.
**V3 →** Multiple visual themes, optional 3D, advanced cinematics, AI move explanations, voice commentary, tournaments, custom environments.

---

## 19. Master Build Prompt

The following single prompt is intended to be handed to an AI coding assistant (e.g., an agentic coding tool) to scaffold and build the MVP described in this PRD.

```
You are building "Cinematic Chess," a chess application whose full specification is in PRD.md. Build strictly according to that document, respecting these non-negotiable constraints:

1. Architecture: implement four decoupled systems — Chess Core, AI Engine, Presentation, and a coordinating Game Manager — exactly as described in Section 7. The Chess Core must have zero dependency on the Presentation layer. All state changes must flow through an immutable GameEvent object (Section 7.1) that the Presentation layer consumes read-only.

2. Chess Core: implement complete, standards-correct chess rules — legal move generation (including pins, discovered checks), castling, en passant, promotion, checkmate/stalemate/draw detection (threefold repetition, fifty-move rule, insufficient material). Represent state canonically as FEN and produce PGN move history. Validate correctness against standard perft test positions before considering this system done.

3. Chess Engine/Opponent: build the search and evaluation entirely in-house — negamax with alpha-beta pruning, iterative deepening, transposition tables, move ordering, and quiescence search (Section 8.1). Do NOT integrate Stockfish or any third-party or ML-based engine. Implement the seven difficulty tiers exactly per Section 8.2 using fixed depth/time budgets and evaluation-function complexity — never randomize as a substitute for weaker play beyond the narrow top-N pick used at the Beginner tier, and never give any tier access to information outside the legal current position.

4. Presentation/Animation: implement the three-tier animation system (Micro/Tactical/Cinematic, Section 9) driven only by GameEvent objects, using pre-authored sprite/frame-by-frame animation assets for each piece and event — never procedurally generated or AI-generated motion. Include per-piece-type capture animations (Section 9.3), a check sequence, a checkmate cinematic (the "army surrounds the king" sequence, Section 9.5), and a promotion sequence (Section 9.6). Implement a global Animation Level setting (Off/Minimal/Normal/Cinematic) that scales or bypasses these tiers. Ensure a rendering failure can never corrupt or block game state — the Game Manager must always be able to fall back to an instant state sync.

5. Scope: build only the MVP feature set from Section 6.1 (Player vs AI across all 7 tiers, local Player vs Player, full move/undo/restart, complete animation system, settings for animation/sound/theme, responsive UI). Do not build online multiplayer, accounts, ratings, or additional visual themes — those are explicitly out of scope for this pass (Sections 3.2, 6.2, 6.3).

6. Deliver a working, testable build: a playable board, a functioning difficulty selector, a settings screen with the Animation Level control, and a checkmate flow that ends in a Victory/Defeat screen. Include the perft-based test suite for the Chess Core as part of the deliverable.

Follow the folder structure in Section 14 and the GameEvent schema in Section 7.1 exactly, so the Chess Core package could in principle be reused with a completely different renderer.
```
