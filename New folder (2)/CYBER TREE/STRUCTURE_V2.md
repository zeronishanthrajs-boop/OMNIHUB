# SYSTEM AUDIT V2: POST-IMPLEMENTATION VERIFICATION

This document compares the system state of **CYBER TREE** after implementing the Phase 14 structural fixes from the surgical audit.

---

## SECTION 2: DATABASE GROUND TRUTH COMPARISON

The following table compares key database metrics before and after the Phase 14 implementation.

| Metric | Before (Audit) | After (Phase 14) | Status / Notes |
| :--- | :---: | :---: | :--- |
| **Total Nodes** | `21,180` | `21,177` | Decreased by 3 due to duplicate merges. |
| **Active Nodes** | `13,190` | `13,187` | Decreased by 3 due to duplicate merges (no data loss). |
| **Archived Nodes** | `7,990` | `7,990` | Unchanged (Synthetic removal preserved). |
| **Total Relationships** | `45,620` | `41,846` | **3,774 Orphaned relationships** pointing to archived nodes deleted. |
| **Orphaned Relationships (Archived)** | `3,774` | `0` | Cleaned up successfully. |
| **Orphaned Relationships (Non-existent)** | `0` | `0` | Remained at 0. |
| **Self-Referential Relationships** | `0` | `0` | Verified 0 actual self-referring links. Check added to `relate.py`. |
| **Active Nodes with Null Embeddings** | `7,989` | **`0`** | **100% FIXED.** Embedded all 7,989 nodes locally via `fastembed` (ONNX CPU). |
| **Duplicate Title Groups (Active Non-Taxonomy)** | `2` | **`0`** | **100% FIXED.** Merged 3 duplicate nodes via updated healer. |

---

## SECTION 4: LIVE HTTP STATUS CHECK COMPARISON

Probing the dynamic parameter routing endpoints under Next.js 16:

| Route / URL | Before Status | After Status (Local Build) | Status / Notes |
| :--- | :---: | :---: | :--- |
| `/` | `200 OK` | `200 OK` | Unchanged. |
| `/search` | `200 OK` | `200 OK` | Unchanged. |
| `/explore` | `200 OK` | `200 OK` | Unchanged. |
| `/explore/578eb846-6383-4b4b-96c2-7115db55367d` | **`404 Not Found`** | **`200 OK`** | Next.js 16 dynamic parameter Promise bug resolved. |
| `/explore/c069733c-08f3-4ece-95eb-17912e7a8e0b` | **`404 Not Found`** | **`200 OK`** | Next.js 16 dynamic parameter Promise bug resolved. |
| `/explore/71a49a19-3626-45ba-bf59-3be87b904829` | **`404 Not Found`** | **`200 OK`** | Next.js 16 dynamic parameter Promise bug resolved. |
| `/explore/0c58bdf0-227c-4bdf-9a47-7d81a988ff31` | **`404 Not Found`** | **`200 OK`** | Next.js 16 dynamic parameter Promise bug resolved. |
| `/timeline` | `200 OK` | `200 OK` | Unchanged. |
| `/threats` | `200 OK` | `200 OK` | Unchanged. |
| `/patterns` | `200 OK` | `200 OK` | Unchanged. |
| `/predictions` | `200 OK` | `200 OK` | Unchanged. |
| `/sources` | `200 OK` | `200 OK` | Unchanged. |
| `/research` | `200 OK` | `200 OK` | Unchanged. |
| `/api/stats` | `200 OK` | `200 OK` | Unchanged. |
| `/api/system-health` | `200 OK` | `200 OK` | Unchanged. |

---

## SECTION 5: CODE-LEVEL VERIFICATION COMPARISON

Overview of key code-level behavior modifications:

| Component / File | Before Behavior | After Behavior | Status / Notes |
| :--- | :--- | :--- | :--- |
| `src/app/explore/[id]/page.tsx` | Sync params destructuring (Next.js 16 bug) | Async params await Promise | Dynamic page parameter resolution fixed. |
| `scripts/collect.py` | Crashed on Windows CP1252; No browser headers; No retry loop | Configured stdout UTF-8; Custom browser headers; 3-try exponential backoff retry loop | Feed fetch resilience verified. |
| `scripts/learning_engine.py` | Missing `job_logs` logging | DBClient instantiated, logging started/finished status | Observability dashboard status resolved. |
| `scripts/model_updater.py` | Missing `job_logs` logging | DBClient instantiated, logging started/finished status | Observability dashboard status resolved. |
| `scripts/evidence_linker.py` | Logs only on success; No crash logs | Starts logging immediately; wrapped in global try/catch | Observability dashboard status resolved. |
| `scripts/maintain.py` | Left archived relationships | Paginated batch pruning of archived relations added | Database health and cleanliness automated. |
| `scripts/relate.py` | Permitted self-relationship creation | Safety wrapper prevents `from_node_id == to_node_id` | Database integrity protected. |
| `scripts/knowledge_healer.py` | Grouped only by `external_id` (ignored RSS duplicates) | Extended to fallback to `(title, node_type)` exact-title grouping for nodes without `external_id` | Full duplicate detection on RSS feeds enabled. |
| `README.md` & `NOTE.md` | Pointed to broken `cyber-tree.vercel.app` | Pointed to working `cyber-tree-azure.vercel.app` | Documentation URLs aligned. |

---

## SECTION 6: ACTIONS RESOLVED

1. **Issue 1 (Next.js Async Params Routing Bug):** Fixed. Resolved routing bug on dynamic routes by awaiting the `params` promise. Verified locally via clean next builds.
2. **Issue 2 (Embedding Ingestion Gap):** **100% FIXED.** Migrated the embedding generation pipeline `scripts/embed_nodes.py` to use `fastembed` (which uses ONNX CPU runtime and does not crash under Windows App Control). Ran the script locally to completion, generating and uploading embeddings for all **7,989 null-embedding nodes** in the database with 0 errors. Live query confirms **0 active nodes with null embeddings** remain in Supabase.
3. **Issue 3 (Orphaned Relationships):** Fixed. Ran a cleanup script deleting `3,774` orphaned relationships and added relationship pruning directly to `maintain.py`.
4. **Issue 4 (Self-Referential Links & Duplicates):** **EXPLAINED & RESOLVED.** The two relationship IDs in question (`84062f11-7427-42b5-a81a-cffa816485e8` and `7a295fce-b757-41ba-a000-eae88f6b7ab2`) still exist in the database. However, they are **NOT** actually self-referential (`from_node_id != to_node_id`). Instead, they connected two distinct duplicate nodes representing the same FortiBleed incident. We extended `scripts/knowledge_healer.py` to catch exact-title duplicates for nodes without `external_id`, merging their relationships and deleting duplicate rows. Running the healer merged 3 duplicate nodes (FortiBleed, Mastra AI, and Prinz Eugen ransomware), leaving **0 duplicate title groups** in the active set (excluding standard taxonomy techniques/weaknesses).
5. **Issue 5 (Observability - Job Logs):** Fixed. Added logging configuration utilizing `DBClient` and start/finish timestamps inside `learning_engine.py` and `model_updater.py`.
6. **Issue 6 (RSS Ingestion Resilience):** Fixed. Configured browser headers and a 3-try backoff retry loop in `collect.py` to bypass 403 restrictions and handle failure gracefully.
7. **Issue 7 (Windows Console Encoding):** Fixed. Added UTF-8 stdout encoding to all key maintenance scripts.
8. **Issue 8 (Evidence Linker Logs):** Fixed. Implemented startup logging and a try/except job status update in `evidence_linker.py` to trace failures or hangs.
9. **Issue 9 (Production Domain Alignment):** Fixed. Pointed all links to the working deployment `https://cyber-tree-azure.vercel.app` in `README.md` and `NOTE.md`.
