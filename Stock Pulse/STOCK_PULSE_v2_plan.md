# Stock Pulse — v2 Engineering Plan
### Single-Page Fundamental Intelligence Tool

**Status:** Rebuilt from v1 (170-section platform spec) into a buildable single-page system.
**Companion build:** `stock_pulse.html` — a working v1 implementation of everything below.

---

## 1. What changed, and why

v1 specified a **35-microservice enterprise data platform**: distributed Scrapy/Playwright crawlers, OCR pipeline, PostgreSQL + TimescaleDB + OpenSearch, Kafka/Celery workers, Kubernetes, a knowledge graph, continuous monitoring, source-health dashboards, and 170 sections of supporting process. That system is real and buildable, but it is a 6–12 month infrastructure project requiring a team, servers, and paid data feeds — not what "enter a stock, get a PDF" needs on day one, and not something any single chat session can stand up.

v2 keeps every **research question, rule, and scoring formula** from v1 — that part of the spec was sound — and replaces the *delivery mechanism* with one that can actually exist today: a single HTML page, no backend to host or maintain, no database to run. The corrections made:

| # | v1 issue | v2 fix |
|---|---|---|
| 1 | 35 services / Kubernetes / Kafka / OpenSearch for a single-report tool | One static page. Research happens via on-demand AI calls with live web search; scoring happens in browser JS. No infrastructure to deploy or pay for. |
| 2 | Rule 6 mandates one raw-HTML-string LLM output ("Pulse opened by default", no DOCTYPE) | Superseded by your instruction: the deliverable is a live page with a **PDF download**, not a raw HTML string. Old Rule 6 is dropped. |
| 3 | Repeatedly references "the supplied Stock Pulse design / existing HTML template" | That template was never actually included in v1 — it's an undefined external dependency. v2 doesn't assume it; the UI is specified here and built directly. |
| 4 | "Two source verification" + a dedicated Verification Engine required for every metric (§30, Rule 4) | Not achievable in a stateless single-page tool with no crawler fleet. **Descoped explicitly, not silently**: v2 asks the research layer to cite sources and self-flag uncertainty, but does not run independent cross-verification. This is the main honesty trade-off vs. v1 — see §6. |
| 5 | Data Confidence scored "0–14" (§60) with the 14 points never defined anywhere in the doc | Redefined concretely in §7 below, tied to fields actually returned. |
| 6 | "Never ask an LLM to calculate financial ratios" (§45) stated as an absolute, with no separate calc service to enforce it | v2 draws the line explicitly: **AI sources raw figures (with citations) → JS computes every bucket, classification, and score.** See §5. AI only assigns the two evidence-based sub-scores (Moat factors, Management Trust flags) that are inherently qualitative — same as v1 intended (§62) — everything downstream of that is deterministic code. |
| 7 | Assumes a persistent Scheduler / Continuous Research / Change Detection layer (§31, §101, §146–148) | Out of scope by design: this is an on-demand tool, not a monitoring service. Each report is generated fresh when requested. Noted as a real capability gap vs. v1, not hidden. |
| 8 | Same architecture diagram and "Golden Rule" hierarchy repeated 2–3 times across the doc (§2, §97, §162) | Stated once, in §5. |

**What was *not* changed:** the 10-section report structure, all scoring thresholds (CAGR, D/E, ROE/ROCE, Moat /14, Management Trust /8, Pulse /10), the 9 red-flag rules, the Bear/Base/Bull scenario formulas, and the non-negotiable rules (no invented numbers, no buy/sell, historical vs. projection separation, plain-language explanations). These were correctly specified in v1 and are carried over exactly.

---

## 2. Non-Negotiable Rules (carried over, Rule 6 replaced)

1. **Never invent numbers.** Anything not found is shown as "⚠ Not found — verify at [source]," never estimated.
2. **Historical facts and projections stay visually separate.** Scenario figures are always labeled *Illustrative — not a prediction*, never phrased as future fact.
3. **No buy/sell recommendation, no target price, no guaranteed return** — ever, in any section.
4. **Live data first.** The tool always attempts a fresh, cited web search before falling back to anything else; if a section's research call fails, that section is shown as unavailable rather than filled with a guess.
5. **Every financial term gets a plain-language explanation** — the "curious 15-year-old" bar from v1, kept as-is.
6. **~~One raw HTML artifact~~ → One single-page web app + a downloadable PDF report.** (Replaces v1 Rule 6, which assumed a chat-based HTML-string output contract that no longer applies.)

---

## 3. System Architecture (v2)

```
USER
 │  enters stock name + investment horizon
 ▼
COMPANY RESOLUTION + 7 PARALLEL RESEARCH CALLS
 │  each call = Claude + live web search, scoped to one part of the report
 │  each returns cited raw figures + qualitative evidence — never a final score
 ▼
DETERMINISTIC SCORING ENGINE (client-side JS)
 │  CAGR · valuation buckets · health/return buckets · growth classification
 │  red flags · Moat total/14 · Management Trust total/8 · Pulse Score/10
 │  Data Confidence · Bear/Base/Bull scenarios
 ▼
REPORT RENDER (10 sections, on-page)
 ▼
PDF EXPORT (client-side, on demand)
```

This collapses v1's 35 services into two real components: a **research layer** (AI + web search, replacing crawler/parser/OCR/fact-extraction/evidence-manager) and a **scoring engine** (plain JS, replacing calculation/rule/red-flag/moat/scoring/scenario engines). Nothing else in v1's stack (queue, cache, knowledge graph, auth, admin dashboard, scheduler) is needed for a single-user, on-demand, single-page tool.

---

## 4. The 7 Research Calls

Each call is scoped narrowly so it returns cited raw data only — no scores, no verdicts:

1. **Overview + Business** — identity, price, 52W high/low, market position, business model, revenue mix, geography, biggest strength, biggest risk.
2. **Valuation** — P/E, P/B, EV/EBITDA, PEG, dividend yield, plus sector-average, 5-year-own-average, and Nifty comparisons.
3. **Growth + Health** — revenue/profit/EPS 3Y & 5Y CAGR inputs, margins, 8-quarter EPS, OCF trend; D/E, interest coverage, current ratio, FCF trend, cash.
4. **Returns + Red Flags** — ROE, ROCE, dividend yield/payout/5Y history; raw trigger values for all 9 red-flag rules.
5. **Moat** — evidence + a suggested 0–2 per factor for all 7 factors, plus tailwinds/headwinds.
6. **Ownership + Management Trust** — promoter/FII/DII %, pledging %, 8Q trend direction, guidance-delivery evidence, SEBI issues, concall tone, the 6 Management Trust criteria as evidence-backed flags.
7. **Peers + News** — 3 peers with metrics and when-they're-better, 5 recent dated news items.

Calls run concurrently (`Promise.allSettled`) with a live progress checklist. Any call that fails or returns partial data degrades that section to "not found" rather than blocking the report.

---

## 5. Deterministic Scoring (client-side, unchanged from v1's math)

- **CAGR:** `(Current / Historical)^(1/Years) − 1`
- **Valuation:** >15% below sector & 5Y avg → CHEAP · within 15% → FAIR · >15% above both → RICH
- **Growth classification:** ACCELERATING / STEADY / SLOWING / DECLINING from 3Y vs 5Y CAGR + margin trend; auto-flag >200bps EBITDA or net-margin decline
- **Financial Health:** D/E (<0.5 green / 0.5–1.5 amber / >1.5 red), Interest coverage (>5x / 2–5x / <2x), Current ratio (>2 / 1–2 / <1), FCF trend (growing / flat-positive / negative)
- **Return Quality:** ROE & ROCE (>20% and 15–20% green / 10–15% amber / <10% red), leverage-warning if ROE ≫ ROCE, dividend consistency banding
- **Red Flags:** all 9 v1 rules evaluated against the raw trigger values from Call 4/6 (pledging >10%, 2+ quarters falling profit, D/E >2 & rising, negative/falling FCF, guidance missed 2+/3yrs, SEBI action, FII falling 4+ quarters, auditor qualification, promoter <25% & falling)
- **Moat:** 7 factors × AI-assigned 0–2 (with evidence shown) → sum /14 → WIDE (9–14) / NARROW (5–8) / NONE (0–4)
- **Management Trust:** the 6 v1 weighted flags (+2/+2/+1/+1/+1/+1, −2/−3/−2) → sum /8 → HIGH (7–8) / MODERATE (4–6) / LOW (<4)
- **Pulse Score:** the 10 v1 binary criteria → sum /10 → STRONG (7–10) / MODERATE (4–6) / WEAK (0–3), always shown with the row-by-row breakdown
- **Scenarios:** Bear (5Y CAGR −5%, margin −2–3%), Base (avg of 3Y/5Y CAGR), Bull (5Y CAGR +3–4%, margin +1–2%) → revenue → profit → EPS, plus the ₹1 lakh illustration, both labeled *Illustrative only. Not a guarantee.*

## 6. Data Confidence (v1 gap, now defined)

v1 specified an 11–14 / 7–10 / 4–6 / 0–3 scale with no defined components. v2 defines it as a 14-point sum, computed automatically per report:

- **+1 per section** (10 sections) that returned usable data rather than "not found" (max 10)
- **+2** if live web search succeeded on every research call (0 if any call fell back or failed)
- **+1** if at least one cited source is a primary source (NSE/BSE/company filing/investor deck) rather than an aggregator
- **+1** if no contradictions were flagged between sections (e.g. promoter % agrees across the Ownership and Red Flag calls)

→ 11–14 HIGH · 7–10 MODERATE · 4–6 LOW · 0–3 VERY LOW, shown with its own breakdown for the same reason the Pulse Score is: a confidence number nobody can audit isn't trustworthy.

**Honesty note carried from §1:** this is *self-reported* confidence based on completeness and search success — not independent two-source cross-verification. v1's Verification Engine is genuinely out of scope for a single-page tool; this section says so rather than quietly downgrading the requirement.

---

## 7. Report Structure (unchanged from v1 §158–159)

Overview → Business → Valuation → Growth → Financial Health → Return Quality → Competitive Moat → Peer Comparison → Ownership & Trust → The Pulse — each section carries the exact fields v1 specified, each with a plain-language explanation.

---

## 8. PDF Export

Client-side generation (jsPDF + autotable) triggered by a "Download PDF Report" button that appears once the report finishes rendering. The PDF mirrors the on-page report exactly: all 10 sections, the score breakdowns, the red-flag list, the scenario table, source citations, and the disclaimer. No server round-trip — the same data already on the page is laid out into the PDF in the browser.

---

## 9. Build status

`stock_pulse.html` (companion file) implements all of the above as a working v1: stock name + horizon input → 7 concurrent research calls with a live progress checklist → full deterministic scoring → rendered 10-section report → PDF download. It's a real, usable tool today, not a mock-up.

**Known limitations, stated plainly:**
- Research quality depends on what the live web search surfaces at request time — for thinly-covered or very small companies, some fields will legitimately come back "not found."
- No independent two-source verification (see §6) — the tool cites its sources so you can verify yourself, but does not cross-check them the way v1's Verification Engine would have.
- Each report is generated fresh on request; there's no continuous monitoring between visits (v1's Scheduler/Change Detection was out of scope here by design).

## 10. If this needs to grow later

The v1 vision (500+ stocks, continuous monitoring, a real evidence database) is still a legitimate direction — it's just not the day-one build. The natural next step, if usage ever justifies it, is a real backend (FastAPI + Postgres) that caches research results instead of re-querying live on every visit, which is the first piece of infrastructure that would meaningfully pay for itself. Everything past that (dedicated crawlers, OCR, a knowledge graph) is worth deferring until there's a concrete reason a live-search-per-request model isn't enough.
