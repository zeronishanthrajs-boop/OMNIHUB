# Stock Pulse — v3.0 Engineering Plan
### Deterministic, Zero-API-Key System (No AI in the Data Path)

**Supersedes:** v2.0 (`STOCK_PULSE_v2_plan.md` + the `note.md` build it produced)
**Outlook:** unchanged — same single page, same 10-section report, same PDF export.
**What's actually different:** v2 got its numbers by asking an AI to search the web and self-report figures, gated behind a provider API key. v3.0 gets its numbers by **fetching and parsing real financial data directly from public sources**, and computes every score with the same math as before — no AI call anywhere in the pipeline, no key to configure, nothing that stops working if a provider changes its terms.

---

## 1. What was wrong with v2, and the fix

| # | v2 problem | v3.0 fix |
|---|---|---|
| 1 | Every figure came from an AI "researching" the web and self-reporting a number — accurate only as far as the model's honesty and search luck | Figures are **parsed directly** out of real structured data (HTML tables, JSON endpoints) — the same number Screener/NSE actually shows, not an AI's paraphrase of it |
| 2 | Required a provider API key (NVIDIA NIM / OpenRouter / Anthropic) before the app did anything | **No key, no account, no provider.** The backend talks to public financial data sources, not an AI gateway |
| 3 | Needed a local CORS proxy just to route around AI-provider CORS blocks | The backend is now a real server — it fetches data server-side, so there's no CORS problem to route around in the first place |
| 4 | Shipped 4 hardcoded "offline sample" companies because without a key there was no other way to demo it | Every company works the same way, live — no special-cased demo data, because there's no key gate to work around |
| 5 | "Deterministic scoring" was true for the *math*, but the *inputs to that math* were still AI-reported, so the whole report inherited AI's reliability ceiling | Both the inputs and the math are now deterministic — the only place any judgment enters at all is the small, explicitly-scoped heuristic layer in §6, not a general-purpose LLM |

---

## 2. Architecture

```
BROWSER (same page as v2 — stock name + horizon → progress checklist → report → PDF)
   │  fetch("/api/report?company=...")
   ▼
LOCAL BACKEND (Node.js / Express, one process, one command to start)
   │
   ├── Company Resolver ─── bundled NSE+BSE listing file + fuzzy match (no AI, no network)
   │
   ├── 7 Scraper Modules ─── parse real pages/endpoints in parallel (Promise.allSettled)
   │     Screener.in (primary) · NSE/Yahoo quote endpoints · news RSS feeds
   │
   ├── Cache Layer ─── SQLite/JSON, keyed by ticker, ~24h TTL — real sites get one respectful
   │     request per company per day, everything else is instant from cache
   │
   ├── Deterministic Math Engine ─── identical formulas to v2 §5 (CAGR, buckets,
   │     classification, red flags, Moat/14, Mgmt Trust/8, Pulse/10, scenarios, confidence)
   │
   ├── Heuristic Layer (Tier 1, ships day one, see §6) ─── rule-based moat & trust scoring
   │
   └── PDF Generator ─── pdfkit, server-side, returns a file the browser downloads
```

The AI research layer from v2 is gone entirely. Nothing in this pipeline makes a network call to an AI provider, and nothing requires a secret to be configured before first run.

---

## 3. Data sources (replaces v2's "7 AI research calls")

Screener.in's company page is the backbone — a single fetch returns most of what the report needs as real, structured HTML tables (10-year P&L, balance sheet, cash flow, ratios, shareholding pattern, and a peer-comparison table). The other sources fill the gaps Screener doesn't cover.

| Report section | Source | What's parsed |
|---|---|---|
| Overview & quote | NSE/Yahoo quote endpoint (`SYMBOL.NS`) | Live price, 52W high/low, market cap |
| Business description | Screener.in "About" block | Verbatim company description — real text, not generated |
| Valuation | Screener.in ratios table | P/E, P/B, EV/EBITDA-derived, dividend yield; sector average computed by averaging the peer set from §3's Peers table (deterministic, not AI-estimated) |
| Growth | Screener.in Profit & Loss + Quarterly Results tables | 10Y revenue/profit/EPS history → 3Y & 5Y CAGR computed by formula; 8-quarter EPS series |
| Financial health | Screener.in Balance Sheet + Cash Flow tables | D/E, current ratio (from balance sheet), OCF & FCF trend (OCF − CapEx from cash flow table) |
| Returns | Screener.in ratios table | ROE, ROCE, payout ratio, 5Y dividend record |
| Red flags | Derived from the tables above | All 9 rules evaluated against real parsed figures — no separate fetch needed |
| Ownership | Screener.in Shareholding Pattern table | Promoter/FII/DII %, pledging %, quarter-by-quarter trend — this table literally is the 8-quarter series |
| Peers | Screener.in Peer Comparison table | Real peer P/E, ROE, growth — already computed by Screener, just parsed |
| News | Google News / Moneycontrol / Economic Times RSS, filtered by company name | Dated headlines with source links — shown as headline + date, not summarized or reworded |
| Moat & Management Trust | See §6 | The one place real data alone isn't enough — handled by the heuristic layer, not by scraping |

---

## 4. Deterministic Math Engine

Unchanged from v2 §5, verbatim — CAGR formula, valuation bucketing, growth classification, health/return thresholds, the 9 red-flag rules, Moat /14, Management Trust /8, Pulse Score /10, and the Bear/Base/Bull scenario matrix. This part of v2 was never the problem; it's ported as-is. The only formula that changes meaning is Data Confidence (§7 below), because "did the AI's search succeed" no longer applies.

---

## 5. Company Resolution — no AI, no network lookup

NSE publishes a public, no-auth CSV of every listed equity (ticker, ISIN, company name). This is bundled into the app at build time. Resolving "zomato" or "hdfc bank" to `ETERNAL` / `HDFCBANK` is a local fuzzy-string match (Levenshtein/token match) against that bundled list — instant, offline, and not a place any model is needed.

---

## 6. The heuristic layer (where "small AI" applies, if at all)

Two things in the report — Moat evidence and Management Trust's "concall specific vs vague" flag — are the only fields that genuinely need judgment rather than a number straight off a page. v3.0 handles this in two tiers, and **ships with Tier 1 only**; Tier 2 is a documented, optional upgrade, not a day-one requirement.

**Tier 1 — rule-based, ships day one, zero AI:**
- Moat factors scored from quantitative proxies already in the scraped data: sustained high & stable operating margin (10Y) → Cost Advantage/Pricing Power signal; sector tag (from Screener) matched against a small curated sector→moat-tendency table (e.g. FMCG → Brand Power, Utilities/Telecom → Regulatory License) → starting signal, adjusted by market-cap rank within peers → Scale Advantage signal. Every rule and its evidence is shown on the report exactly like v2 showed AI evidence — just sourced from a formula instead of a model.
- Management Trust's "specific vs vague" flag replaced with a fully numeric proxy: whether reported results beat/met/missed the company's own previously stated guidance number, computed by comparing two real figures across quarters — not a qualitative read of the call at all.

**Tier 2 — optional, only if Tier 1 proves too coarse:**
A small, locally-embedded text classifier (a few hundred KB, trained once and shipped as a static model file — not a hosted LLM) that reads scraped concall/investor-deck text and scores specificity. It runs in-process in the backend with zero network calls and no key of any kind — closer to a spam filter than to a chatbot. This is the "small AI inside itself" the plan allows for, scoped narrowly to this one judgment call, and only built if Tier 1's heuristics are visibly not good enough once real reports are compared against Screener/annual-report reality.

---

## 7. Data Confidence (/14) — redefined for real sources

- **+1 per section** (10 sections) that returned parsed data rather than "not found" (max 10)
- **+2** if every scraper module returned successfully (no timeout/blocked/HTML-changed failure)
- **+1** if the primary source (Screener.in) was reachable and fully parsed, rather than falling back to a secondary source
- **+1** if the cached figure is less than 24 hours old (fresher data, higher confidence)

Same 11–14 HIGH / 7–10 MODERATE / 4–6 LOW / 0–3 VERY LOW bands as v2.

---

## 8. Caching & respectful fetching

Every scraped result is cached (SQLite or a flat JSON store, keyed by ticker) with a ~24-hour TTL. A repeat lookup for the same company on the same day is served instantly from cache with zero outbound requests. First-time lookups are rate-limited to one request per source per company, with realistic browser headers and a sane request interval — this keeps the tool a good citizen of the sites it depends on, and happens to make it fast for anyone who looks up the same handful of stocks repeatedly.

---

## 9. PDF export

Moves server-side (`pdfkit`, pure Node, no headless-browser dependency). The backend builds the same 10-section, disclaimer-included PDF as v2 and streams it back as a download — one less client-side library dependency, and no risk of a CDN hiccup breaking the export button.

---

## 10. Operations

```
npm install
npm start          →  starts the backend on localhost, serves the frontend, no config needed
```
No API key screen. No provider selector. No "Test Connection" button. Open the page, type a stock name, get a report.

---

## 11. Known limitations, stated plainly

- **Scraper fragility, the real cost of dropping AI:** v2's AI-search approach could adapt if a source website changed its layout; a scraper cannot — if Screener.in changes its HTML structure, the corresponding scraper module needs a manual fix. This is the direct trade-off for getting real numbers instead of AI-reported ones, and it's a maintenance commitment, not a one-time build.
- **Terms of use:** Screener.in, NSE, and news sites have their own terms around automated access. Fine for personal/analytical use at a light, cached, rate-limited pace as designed here; heavier or commercial-scale use later would be worth checking against each source's terms, or budgeting for one of their official data-licensing options if this ever needs to run at real volume.
- **Moat and management-trust judgment is intentionally the weakest-evidenced part of the report** — flagged as such in the UI (Tier 1 heuristic, not a verified fact) exactly the way v1/v2 flagged AI-sourced fields, so the report never overstates its own certainty.

---

## 12. File structure

```
stock-pulse-v3/
├── server.js                    # Express entrypoint — routes, orchestration
├── package.json
├── /public
│   └── index.html                # same UI/outlook as v2, now calls the local backend
├── /scrapers
│   ├── screener.js                # Screener.in parser (cheerio)
│   ├── quote.js                   # NSE/Yahoo live price + 52W range
│   ├── news.js                    # RSS fetch + filter
│   └── companyResolver.js         # bundled listing + fuzzy match
├── /data
│   └── nse-bse-listing.json       # bundled public NSE/BSE equity list
├── /engine
│   ├── math.js                    # CAGR / buckets / classification / red flags / scores
│   ├── moatHeuristics.js          # Tier 1 rule-based moat scoring
│   └── trustHeuristics.js         # Tier 1 rule-based management trust scoring
├── /smallmodel                    # Tier 2, optional — not built unless §6 triggers it
├── /cache
│   └── reports.sqlite
└── /pdf
    └── generateReport.js          # pdfkit-based server-side export
```
