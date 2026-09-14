# ULTRON Current Situation And Recovery Plan

## Current Situation

ULTRON has the correct outer architecture for the original idea:

- A multi-agent LangGraph flow: Boss -> Planner -> Coordinator -> Worker -> Boss.
- Separate role API keys for specialized model behavior.
- Domain worker boundaries under `domains/`.
- A FastAPI dashboard that lets the user launch goals, see state, inspect logs, manage rules, and open generated web output.
- Mock-mode tests for local validation and sandbox safety.

The project drift is inside the reasoning layer. The app currently treats planning mostly as markdown briefs, then lets the coordinator/worker convert those briefs into file-writing tasks. That means the system can appear to be thinking while still behaving like a prompt-to-file generator.

The core product idea is stronger than that: ULTRON should turn a human idea into a logical tree first, then coordinate implementation from that tree while visualizing progress so the user does not have to follow raw logs.

## Core Problems

1. The logical tree is not a durable central artifact.
   The Planner writes briefs, but there is no structured tree for intent, features, screens, data, constraints, tasks, and verification.

2. The dashboard visualizes node movement and logs, not the reasoning tree.
   The user can see that agents ran, but not how the idea became implementation decisions.

3. Worker tasks are too close to raw file generation.
   A worker receives a brief and writes a file. It should receive the relevant tree branch and implement only that branch.

4. Verification is still mostly text evidence.
   The Boss reviews claims from the Coordinator. Web apps need stronger validation through DOM checks, browser checks, screenshots, and explicit evidence.

5. Mock data is useful for testing but dangerous when it looks like product intelligence.
   Mock behavior must stay clearly isolated from live mode.

## Recovery Direction

The logical tree becomes the core artifact of the application.

Every goal should move through this shape:

1. User idea
2. Boss acceptance or clarification
3. Planner logical tree
4. Boss review of the tree
5. Coordinator branch assignment
6. Worker branch implementation
7. Verification evidence attached back to branches
8. Boss final review
9. User-facing dashboard visualization

## Implementation Plan

### Phase 1: First-Class Logical Tree

- Add `logical_tree` to graph state.
- Make Planner produce or derive a structured tree.
- Preserve markdown briefs for compatibility, but treat them as secondary.
- Log the tree as a named stage.

### Phase 2: Tree-Aware Coordination

- Coordinator reads the logical tree, not only planner markdown.
- Worker tasks include `tree_node_id`, `tree_node_title`, and branch-specific context.
- Worker prompts receive the relevant logical branch.

### Phase 3: Dashboard Reasoning View

- Add `/api/tree`.
- Add a dashboard panel that shows:
  - Intent
  - Features
  - Screens
  - Data/API expectations
  - Implementation tasks
  - Verification steps
- Keep logs available, but no longer make logs the primary user experience.

### Phase 4: Stronger Verification

- Add browser/DOM verification for generated web apps.
- Attach evidence to worker results and tree branches.
- Make Boss approval depend on structured evidence instead of prose claims.

## Status After This Pass

This pass implements Phase 1, Phase 2, and the first dashboard slice of Phase 3. Phase 4 remains the next major quality upgrade.
