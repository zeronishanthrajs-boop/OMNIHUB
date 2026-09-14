# SYSTEM AUDIT: LIVE PRODUCTION GROUND TRUTH

This document outlines the verified ground-truth state of the live production environment for **CYBER TREE**, detailing repository state, database statistics, workflow execution history, deployment configurations, and code-level verification. 

No fixes were performed during this audit; all findings are recorded directly from live production data.

---

## SECTION 1: REPOSITORY STATE

### 1. Git Status & Log Output
The local workspace working tree is completely clean and matches the remote repository.
* **Current Commit Hash (HEAD):** `b49deff8b0079141a9cb4acee7dc37623ac74088`
* **Commit Message:** `Update COMPLETION LOG in NOTE.md with Data Loss Recovery results`
* **Commit Timestamp:** `Sun Jun 21 01:42:25 2026 +0530`
* **Working Tree Status:** `nothing to commit, working tree clean`

### 2. Vercel Production Deployment Alignment
* **Latest Production Deployment URL:** `https://cyber-tree-2g8zucoph-zeronishanthrajs-boops-projects.vercel.app`
* **Production Aliases:** `https://cyber-tree-azure.vercel.app`, `https://cyber-tree-zeronishanthrajs-boops-projects.vercel.app`
* **Deployment Timestamp:** `Sun Jun 21 2026 02:00:39 GMT+0530` (18 minutes after local commit `b49deff`)
* **Verification:** The deployment matches the exact git state of `origin/main` at HEAD commit `b49deff` (deployed automatically upon push).

### 3. File History Cross-Check (Last 10 Commits)
The actual file changes in the repository match the checklist entries and completion claims in `NOTE.md`.
* **Commit 1 (`b49deff`):** Modified `NOTE.md` (Updated completion logs).
* **Commit 2 (`2df7985`):** Modified `scripts/process.py`, `src/app/page.tsx`, `src/lib/db.ts` (Fixed data loss and system-health queries).
* **Commit 3 (`e89bae5`):** Modified `NOTE.md` (Updated checklists).
* **Commit 4 (`6cab63e`):** Modified `.gitignore`, `NOTE.md`, `scripts/export_training_data.py`, `scripts/hypothesis_engine.py`, `scripts/ingest_nvd.py`, `scripts/process.py`, `src/app/layout.tsx`, `src/lib/db.ts` (Completed NVD ingestion and Gemini reasoning reasoning integration).
* **Commit 5 (`cfb1ac4`):** Modified `phase_12_predictions_audit.md` (Added audit findings).
* **Commit 6 (`33fdf29`):** Modified taxonomy, model, schema files, and page routes (Phase 11 and 12 corrections).
* **Commit 7 (`b72c7c6`):** Modified `NOTE.md` (Phase 10 COMPLETE).
* **Commit 8 (`33d8256`):** Modified layout, page, header, and db files (Phase 10 dashboard additions).
* **Commit 9 (`5f0e694`):** Modified page, route, and research assistant files (Phase 9 Q&A implementation).
* **Commit 10 (`02c31e5`):** Modified workflow, maintenance, healer, and page files (Phase 8 autonomous healer).

---

## SECTION 2: DATABASE GROUND TRUTH

### 1. Exact Row Counts
Direct, live queries against the Supabase database returned the following exact counts (no estimations):

* **Total Nodes:** `21,180`
* **Active Nodes:** `13,190`
* **Archived Nodes (synthetic removal):** `7,990`
* **Total Relationships:** `45,620`
* **Job Logs:** `124`
* **Predictions by Status:**
  - `archived` (pre-Phase-12 scope error): `30`
  - `archived` (phase-12-output-still-generic-template): `1,000`
  - `pending`: `10`
  - **Total Predictions:** `1,040`

#### Node Distribution by Type (Total vs. Active):
| Node Type | Total Count | Active Count | Archived Count |
| :--- | :--- | :--- | :--- |
| `vulnerability` | 17,599 | 9,609 | 7,990 |
| `technique` | 1,525 | 1,525 | 0 |
| `weakness` | 878 | 878 | 0 |
| `malware` | 750 | 750 | 0 |
| `threat_actor` | 216 | 216 | 0 |
| `tool` | 95 | 95 | 0 |
| `incident` | 66 | 66 | 0 |
| `news` | 40 | 40 | 0 |
| `research` | 11 | 11 | 0 |

### 2. 20 Random Nodes Audit
A random audit of 20 nodes from the `nodes` table revealed that **5 out of 20 nodes (25%) have null embeddings**. All malformed rows are active `vulnerability` nodes:

1. ID: `c069733c-08f3-4ece-95eb-17912e7a8e0b` | Type: `vulnerability` | **MALFORMED: embedding is null** [ACTIVE]
2. ID: `4a6e79cf-cc96-435f-99ef-db0b3beb988c` | Type: `vulnerability` | OK [ARCHIVED]
3. ID: `e8ac3751-142f-470b-84f1-bc7061edd855` | Type: `vulnerability` | OK [ARCHIVED]
4. ID: `71a49a19-3626-45ba-bf59-3be87b904829` | Type: `vulnerability` | OK [ACTIVE]
5. ID: `01757f43-8aa0-442c-ad4d-aa3e0ea28b4d` | Type: `weakness`      | OK [ACTIVE]
6. ID: `0c58bdf0-227c-4bdf-9a47-7d81a988ff31` | Type: `vulnerability` | OK [ACTIVE]
7. ID: `f6d9cc64-b865-4a86-b2cd-78e2155129e5` | Type: `vulnerability` | OK [ARCHIVED]
8. ID: `48253337-b5d5-4f57-975d-19987ee6dd31` | Type: `vulnerability` | OK [ARCHIVED]
9. ID: `fc6fc004-0890-422b-9124-00827c72022c` | Type: `vulnerability` | **MALFORMED: embedding is null** [ACTIVE]
10. ID: `63b10d44-eaef-40e6-b120-e80d41dff10d` | Type: `vulnerability` | OK [ARCHIVED]
11. ID: `75d78942-884b-4283-adaa-ef4a54fa8718` | Type: `vulnerability` | **MALFORMED: embedding is null** [ACTIVE]
12. ID: `e6589d59-6c31-4af3-ac6d-25bc715beecf` | Type: `vulnerability` | OK [ARCHIVED]
13. ID: `78b2c680-f14e-49e3-abb6-01ed879bf5cc` | Type: `vulnerability` | OK [ARCHIVED]
14. ID: `1e8cf3b2-f57f-47ff-a5c7-d4b20484a02e` | Type: `vulnerability` | OK [ARCHIVED]
15. ID: `4721c0d3-73ee-4462-8844-5eb1dbd970ef` | Type: `weakness`      | OK [ACTIVE]
16. ID: `494478ed-09bc-4148-8140-3ba87e295bbb` | Type: `vulnerability` | OK [ACTIVE]
17. ID: `b40128b5-426d-4e8e-adb7-1a7fe17fd7e8` | Type: `vulnerability` | OK [ACTIVE]
18. ID: `b7b2425c-d05e-4d44-89e9-671664ff8276` | Type: `vulnerability` | **MALFORMED: embedding is null** [ACTIVE]
19. ID: `5d42270f-3574-415d-be03-e1fa6863d6a6` | Type: `vulnerability` | **MALFORMED: embedding is null** [ACTIVE]
20. ID: `4fb55361-85b2-4ad0-b67b-13caa317d64e` | Type: `vulnerability` | OK [ARCHIVED]

### 3. FortiBleed Incident Node 404 Investigation
* **Target Node ID:** `578eb846-6383-4b4b-96c2-7115db55367d`
* **Exists in Database:** Yes. It is an active `incident` type node titled *"CISA Warns Fortinet Customers as FortiBleed Hits 86,644 FortiGate Devices"*.
* **Status on Live site:** returns HTTP **404 Not Found**.
* **Reason:** Next.js dynamic routing parameter resolution bug (explained in Section 5).
* **Trace:** The node has 3 live relationships in the `relationships` table:
  1. `cffe3949-8690-4eba-8aba-df8862aa5067` (`OBSERVED_IN`): Links a threat actor node to the FortiBleed incident.
  2. `84062f11-7427-42b5-a81a-cffa816485e8` (`SIMILAR_TO`): **Self-referential** (links the node to itself).
  3. `7a295fce-b757-41ba-a000-eae88f6b7ab2` (`SIMILAR_TO`): **Self-referential** (links the node to itself).

### 4. Orphaned Relationships
* **Orphaned relationships pointing to non-existent node IDs:** `0`
* **Orphaned relationships pointing to archived node IDs:** `3,774`
* **Total Orphaned Relationships:** `3,774` (These relationships connect the 7,990 archived synthetic mock CVE nodes from Phase 13).

### 5. Embedding Vector Dimension Check
* **Active nodes with null embeddings:** `7,989` (approx. 60.5% of all active nodes).
* **Active nodes with correct (384) dimensions:** `5,201`
* **Mismatched dimensions (1536-dim or other):** `0` (no dimension mismatches).

---

## SECTION 3: GITHUB ACTIONS — REAL STATUS

Since the repository is private and local authentication is restricted, the job runs were audited directly from the Supabase `job_logs` table (the ground truth of pipeline executions):

### 1. Workflows Run History (Last 5 Runs)
* **`collect`:** 5 runs, all **partial** success.
  - *Error:* `Failed to fetch CISA Alerts: Client error '403 Forbidden' for url 'https://www.cisa.gov/uscert/ncas/alerts.xml'` (occurring on all 5 runs).
* **`process`:** 5 runs, 4 success, 1 **partial** success.
  - *Error on partial (Run `8668f7aa`):* `Failed to process raw source ad26cec4-d41f-416b-8f15-6053e0cde0e9: [WinError 10054] An existing connection was forcibly closed by the remote host`
* **`relate`:** 5 runs, all **success**.
  - *Details:* Created 147 relationships on June 21st, 2 on June 20th, 16 on June 19th, 4 on June 18th, and 2,913 on June 17th.
* **`maintain`:** 2 runs, all **success**.
* **`embed`:** 1 run, **partial** success.
  - *Details:* Embedded 13,072 nodes. 1 error encountered (no message saved).
* **`cluster_nodes`:** 2 runs, all **success**.
* **`trend_detector`:** 2 runs, all **success**.
* **`hypothesis_engine`:** 5 runs, all **success**.
  - *Details:* Latest run on June 19th processed 1,000 tech nodes and generated 10 predictions (respecting the Phase 13 cap).
* **`evidence_linker`:** 4 runs, all **success**.
  - *Details:* Processed 10 predictions on June 19th (took ~16 hours due to DB lock/hang or delayed logging).
* **`learning_engine`:** **Never Run** (actually ran once on June 19th, but did not log to `job_logs` due to missing DB insert logic in `learning_engine.py`).
* **`model_updater`:** **Never Run** (first schedule is July 1st; lacks `job_logs` reporting).
* **`source_discoverer`:** 4 runs, 3 success, 1 **failed**.
  - *Error on failed (Run `ebc24ab0`):* `UnicodeEncodeError: 'charmap' codec can't encode character '\u2192' in position 78: character maps to <undefined>` (console logging CP1252 crash on Windows).
* **`dead_source_detector`:** 5 runs, all **success**.
* **`knowledge_healer`:** 2 runs, all **success**.
* **`backup`:** 1 run, **success** (backed up 1,000 nodes, size 185,991 bytes).
* **`monitor`:** 5 runs, all **success** (reported system status healthy).

### 2. Cron Schedules Verification
Schedules extracted from `.github/workflows/*.yml` match `NOTE.md` specifications:
* `backup.yml`: `0 3 1 * *` (1st of month at 03:00 UTC)
* `classify.yml`: `0 4 1 * *` (1st of month at 04:00 UTC)
* `collect.yml`: `0 */6 * * *` (every 6 hours)
* `embed.yml`: `0 3 * * 0` (every Sunday at 03:00 UTC)
* `health_check.yml`:
  - source_discoverer: `0 6 * * 4` (Thursday 06:00 UTC)
  - dead_source_detector: `0 8 * * *` (Daily 08:00 UTC)
  - knowledge_healer: `0 4 * * 0` (Sunday 04:00 UTC)
* `hypothesize.yml`:
  - hypothesis_engine: `0 6 * * 3` (Wednesday 06:00 UTC)
  - evidence_linker: `0 7 * * *` (Daily 07:00 UTC)
* `learn.yml`:
  - learning_engine: `0 5 * * 5` (Friday 05:00 UTC)
  - model_updater: `30 5 1 * *` (1st of month at 05:30 UTC)
* `maintain.yml`: `0 2 * * 0` (every Sunday at 02:00 UTC)
* `monitor.yml`: `30 */6 * * *` (every 6 hours offset by 30 min)
* `patterns.yml`: `0 5 * * 1` (every Monday at 05:00 UTC)
* `process.yml`: `0 */12 * * *` (every 12 hours)
* `relate.yml`: `0 0 * * *` (every 24 hours)

---

## SECTION 4: VERCEL — REAL STATUS

### 1. Environment Variables Configuration
The following variables are configured on the live Vercel project:
* **Production & Development:** `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
* **Production & Preview:** `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `NVD_API_KEY`, `ALERT_EMAIL`, `ALERT_WEBHOOK_URL`
* **Note:** `GEMINI_API_KEY` and the public Supabase variables are absent from the `Preview` environment.

### 2. Live HTTP Status Check
Probing the production deployment URLs (`https://cyber-tree-azure.vercel.app`) returned:
* **`/`** $\rightarrow$ `HTTP 200 OK`
* **`/search`** $\rightarrow$ `HTTP 200 OK`
* **`/explore`** $\rightarrow$ `HTTP 200 OK`
* **`/explore/578eb846-6383-4b4b-96c2-7115db55367d`** $\rightarrow$ **HTTP 404 Not Found**
* **`/explore/c069733c-08f3-4ece-95eb-17912e7a8e0b`** $\rightarrow$ **HTTP 404 Not Found**
* **`/explore/71a49a19-3626-45ba-bf59-3be87b904829`** $\rightarrow$ **HTTP 404 Not Found**
* **`/explore/0c58bdf0-227c-4bdf-9a47-7d81a988ff31`** $\rightarrow$ **HTTP 404 Not Found**
* **`/timeline`** $\rightarrow$ `HTTP 200 OK`
* **`/threats`** $\rightarrow$ `HTTP 200 OK`
* **`/patterns`** $\rightarrow$ `HTTP 200 OK`
* **`/predictions`** $\rightarrow$ `HTTP 200 OK`
* **`/model`** $\rightarrow$ **HTTP 404 Not Found** (Note: Route does not exist in code; `/intelligence` is used)
* **`/sources`** $\rightarrow$ `HTTP 200 OK`
* **`/research`** $\rightarrow$ `HTTP 200 OK`
* **`/api/stats`** $\rightarrow$ `HTTP 200 OK`
* **`/api/system-health`** $\rightarrow$ `HTTP 200 OK`

---

## SECTION 5: CODE-LEVEL VERIFICATION

### 1. Route `/explore/[id]/page.tsx` Source Code
```typescript
import { getNodeDetails, queryNodes } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function NodeDetailsPage({ params }: PageProps) {
  // Resolving params
  const { id } = params;
  const data = await getNodeDetails(id);
  
  if (!data || !data.node) {
    notFound();
  }
...
```
* **Analysis:** In Next.js 16 (App Router), dynamic page parameters `params` are asynchronous (a `Promise`). Destructuring properties directly without an `await` causes `id` to resolve as `undefined`. This triggers `getNodeDetails(undefined) $\rightarrow$ null` and causes a 404 redirect.

### 2. Process, DB Client, and Hypothesis Engine Verification
* **`process.py`:** Matches the claimed fixes. It includes `fetch_real_content` using `httpx` to extract main paragraph text from URLs, supports `get_embedding` returning exactly 384 dimensions, and calls `db.flush()` at completion.
* **`db_client.py`:** Implements `flush()` and automatic flushing of node/relationship queues at exit.
* **`hypothesis_engine.py`:** Matches the Phase 12 & 13 updates. It queries `nodes` of type `technology`, `tool`, or `vulnerability` from the last 30 days, excludes archived nodes (`synthetic-mock-data-phase13-removal`), queries `match_nodes` vector similarity, invokes Gemini 2.5 Flash Lite (`gemini-2.5-flash-lite`) using `GEMINI_API_KEY` for reasoned threat analysis, and caps the loop at 10 predictions per run.

---

## SECTION 6: SYNTHESIS OF ISSUES

### ISSUE 1: Next.js 16 Dynamic Route Parameter Promise Bug (404 on `/explore/[id]`)
* **Where found:** Section 2.3, Section 4.3, Section 5.1
* **Root Cause:** Next.js 16 App Router renders dynamic route parameters (`params`) asynchronously. The server page `src/app/explore/[id]/page.tsx` destructured `const { id } = params` synchronously, resulting in `id` being `undefined`. This led to database lookups failing and returning `404 Not Found` for all nodes.
* **Evidence:** `src/app/explore/[id]/page.tsx` lines 13-16: `export default async function NodeDetailsPage({ params }: PageProps) { const { id } = params; ...`
* **Severity:** **HIGH** (completely breaks visual exploration of threat nodes).
* **Claimed Fixed in NOTE.md:** Yes (Phase 2 and Phase 4 completion logs claimed routing and confidence badge UI verification were complete and working live on Vercel).

### ISSUE 2: Massive Embedding Coverage Gap (Null Embeddings on 60.5% of Active Nodes)
* **Where found:** Section 2.2, Section 2.5
* **Root Cause:** The NVD CVE ingestion pipeline `ingest_nvd.py` inserts real CVEs without generating embeddings inline. Instead, it relies on `embed_nodes.py` via `embed.yml` running on a Sunday schedule to backfill them. Because the Sunday run was delayed or real NVD CVEs were recently ingested, **7,989 out of 13,190 active nodes** currently have null embeddings.
* **Evidence:** Live database query: "Active nodes with null embeddings: 7989. Active nodes with correct (384) dimensions: 5201."
* **Severity:** **HIGH** (prevents semantic searching and similarity matching on 60.5% of the intelligence database).
* **Claimed Fixed in NOTE.md:** Yes (Phase 3 and Phase 13 claimed completed embedding pipeline and data foundation rebuild).

### ISSUE 3: Orphaned Relationships Pointing to Archived Nodes
* **Where found:** Section 2.4
* **Root Cause:** Phase 13 archived 7,990 synthetic mock CVE nodes by setting `metadata.archived_reason = "synthetic-mock-data-phase13-removal"`. However, the relationship healing job did not clean or remap relationships connecting to these archived nodes, leaving them as orphans.
* **Evidence:** Live database query: "Orphaned relationships pointing to archived node IDs: 3774."
* **Severity:** **MEDIUM** (bloats the database and clutters graph visualizations with archived connections).
* **Claimed Fixed in NOTE.md:** Yes (Phase 8 Task 3 claimed to "heal knowledge graph anomalies (orphan nodes, duplicate nodes, orphan relationships)").

### ISSUE 4: Self-Referential Relationships on Incident Nodes
* **Where found:** Section 2.3
* **Root Cause:** The relate similarity pipeline allows nodes to match and relate to themselves, generating `SIMILAR_TO` relations where `from_node_id = to_node_id`.
* **Evidence:** Node `578eb846-6383-4b4b-96c2-7115db55367d` has two `SIMILAR_TO` relationships pointing to itself (IDs `84062f11-7427-42b5-a81a-cffa816485e8` and `7a295fce-b757-41ba-a000-eae88f6b7ab2`).
* **Severity:** **MEDIUM** (causes nodes in the visualizer to loop back to themselves).
* **Claimed Fixed in NOTE.md:** No.

### ISSUE 5: Learning Engine & Model Updater Missing Job Log Reporting
* **Where found:** Section 3.1
* **Root Cause:** The scripts `scripts/learning_engine.py` and `scripts/model_updater.py` do not contain code to insert/update entries in the `job_logs` table. Although they run on schedule, their logs remain empty, causing the frontend `/api/system-health` endpoint to report them as `never_run`.
* **Evidence:** Source code analysis shows no reference to the `job_logs` table in either script.
* **Severity:** **MEDIUM** (causes incorrect "Degraded" system health alerts on the main dashboard).
* **Claimed Fixed in NOTE.md:** Yes (Phase 7 completion logs claimed learn.yml workflow and metrics were fully complete).

### ISSUE 6: Constant CISA Alerts Ingestion 403 Forbidden Failures
* **Where found:** Section 3.1
* **Root Cause:** CISA WAF/Cloudflare blocks requests to its RSS alert URL (`https://www.cisa.gov/uscert/ncas/alerts.xml`) with a `403 Forbidden` response. The crawler lacks WAF evasion/retry logic, failing this feed on every run.
* **Evidence:** `job_logs` for `collect` show `partial` status with: `Client error '403 Forbidden' for url 'https://www.cisa.gov/uscert/ncas/alerts.xml'`.
* **Severity:** **MEDIUM** (blocks automated ingestion of new CISA alerts).
* **Claimed Fixed in NOTE.md:** Yes (Phase 1 completion logs claimed Tier 1 collections were fully operational).

### ISSUE 7: Character Encoding Crash on Windows (CP1252 codec crash in `source_discoverer.py`)
* **Where found:** Section 3.1
* **Root Cause:** `scripts/source_discoverer.py` outputs Unicode characters like `→` to stdout. If run on a Windows host without standard output reconfigured to UTF-8, Python throws a `UnicodeEncodeError`.
* **Evidence:** `job_logs` run `ebc24ab0-5d22-48d4-919c-614432e5d07b` failed with: `'charmap' codec can't encode character '\u2192' in position 78: character maps to <undefined>`.
* **Severity:** **LOW** (prevents local maintenance executions on Windows hosts).
* **Claimed Fixed in NOTE.md:** Yes (Phase 8 completion logs claimed source discoverer was complete).

### ISSUE 8: Evidence Linker Lacks Startup Logging & Crash Tolerance
* **Where found:** Section 3.1
* **Root Cause:** `scripts/evidence_linker.py` only writes to `job_logs` at completion. It has no startup logging and no global try/catch protection. If it hangs or times out, it logs nothing to `job_logs`, obscuring pipeline failures.
* **Evidence:** Source code of `scripts/evidence_linker.py` shows no start log insertion or try/catch job status updates.
* **Severity:** **LOW** (hides pipeline hangs/timeouts from the system status dashboard).
* **Claimed Fixed in NOTE.md:** Yes (Phase 6 completion logs claimed evidence linker was complete).

### ISSUE 9: Vercel Production Custom Domain Broken (404 Deployment Not Found)
* **Where found:** Section 4.3
* **Root Cause:** The custom domain alias `https://cyber-tree.vercel.app/` is not connected in the Vercel project settings, returning a 404 deployment error.
* **Evidence:** Accessing `https://cyber-tree.vercel.app/` returns 404 DEPLOYMENT_NOT_FOUND.
* **Severity:** **MEDIUM** (affects production landing access; developers must use `https://cyber-tree-azure.vercel.app`).
* **Claimed Fixed in NOTE.md:** Yes (Phase 10 completion logs claimed live URLs were successfully tested).
