# Stock Pulse — v3.0 Comprehensive Technical & Architectural Documentation

**Version:** 3.0 (Production Release — Deterministic, Zero-API-Key System)  
**Target Market:** Indian Listed Equities (NSE / BSE)  
**Architecture:** Unified Single-Process Express + Real Financial Data Scrapers (Zero AI in the Data Path)  
**Specification:** [`STOCK_PULSE_v3_plan.md`](STOCK_PULSE_v3_plan.md)  

---

## 1. Executive Summary & Core Philosophy

**Stock Pulse v3.0** completely eliminates third-party AI keys, provider accounts, and AI hallucinations from the data path. Instead of asking an LLM to search and paraphrase financial figures, v3.0 **fetches and parses real structured financial data** (P&L tables, Balance Sheets, Cash Flow, Shareholding patterns, Ratios, Peers) directly from public sources (Screener.in, NSE/Yahoo Finance, news RSS feeds).

Every score, ratio, scenario, and red flag is computed using **100% deterministic mathematical formulas** and transparent **Tier 1 rule-based heuristics**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STOCK PULSE v3.0                                 │
│                                                                             │
│  BROWSER (stock_pulse.html)                                                 │
│    │  User inputs Ticker/Name (e.g. TCS, Zomato, HDFC Bank, Reliance)       │
│    │  GET /api/report?company=...&horizon=...                               │
│    ▼                                                                        │
│  LOCAL BACKEND (server.js — single process, `npm start`)                    │
│    │                                                                        │
│    ├── Company Resolver ─── Bundled NSE/BSE database + fuzzy matcher       │
│    │                                                                        │
│    ├── 24-Hour Cache Layer ── Local JSON store with 24h TTL                 │
│    │                                                                        │
│    ├── Scraper Engine ─── Direct Cheerio HTML/RSS parsers                   │
│    │     • Screener.in (10Y P&L, Balance Sheet, Cash Flow, Ratios, Peers)   │
│    │     • Yahoo Finance / NSE (Live Quotes, 52W High/Low Range)            │
│    │     • Google News RSS (Dated headlines with direct links)              │
│    │                                                                        │
│    ├── Tier 1 Heuristics ── Rule-based Moat (/14) & Mgmt Trust (/8)         │
│    │                                                                        │
│    ├── Deterministic Math Engine ── CAGR, Bucketing, Pulse (/10), Scenarios  │
│    │                                                                        │
│    └── PDF Generator ── Server-side PDFKit multi-page report export         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
C:\Users\sakth\Music\Stock Pulse\
├── server.js                      # Express server entrypoint (routes, orchestration)
├── package.json                   # Dependencies: express, cheerio, pdfkit
├── stock_pulse.html               # Unified client UI with live diagnostics & auto-suggest
├── STOCK_PULSE_v3_plan.md         # Ground-truth v3 specification
├── note.md                        # Complete end-to-end technical reference (this file)
│
├── data/
│   └── nse-bse-listing.json       # Bundled reference database of Indian listed equities
│
├── scrapers/
│   ├── companyResolver.js         # Offline fuzzy matcher & auto-suggest resolver
│   ├── screener.js                # Screener.in structured HTML table parser (Cheerio)
│   ├── quote.js                   # Yahoo Finance / NSE live quotes & 52W high/low
│   └── news.js                    # Google News RSS parser for dated headlines
│
├── cache/
│   └── reports_cache.json         # 24-hour TTL local cache store
│
├── engine/
│   ├── math.js                    # Deterministic math (CAGR, buckets, Pulse, scenarios)
│   ├── moatHeuristics.js          # Tier 1 rule-based Moat calculation (/14)
│   └── trustHeuristics.js         # Tier 1 rule-based Management Trust calculation (/8)
│
├── pdf/
│   └── generateReport.js          # Server-side PDFKit publication report generator
│
└── test/
    └── test_v3.js                 # Complete automated test suite
```

---

## 3. Data Ingestion & Direct Scrapers

### A. Company Resolver (`scrapers/companyResolver.js`)
- Instant offline resolution matching user input against `data/nse-bse-listing.json`.
- Supports alias resolution (e.g. `"Zomato"` $\rightarrow$ `ETERNAL`, `"HDFC Bank"` $\rightarrow$ `HDFCBANK`, `"Tata Motors"` $\rightarrow$ `TATAMOTORS`).
- Provides auto-complete suggestions via `GET /api/resolve?query=...`.

### B. Screener.in Structured Parser (`scrapers/screener.js`)
- Primary structured financial backbone parsed via **Cheerio**:
  - **About:** Legal entity profile and industry classification.
  - **Top Ratios:** Current Price, Market Cap, Stock P/E, Book Value, ROCE %, ROE %, Dividend Yield %, 52W High/Low.
  - **10-Year Profit & Loss Table:** Sales, Net Profit, EPS, Operating Profit Margin (OPM %).
  - **Quarterly Results Table:** Sequential quarter-by-quarter net profit trends and consecutive profit drop detection.
  - **Balance Sheet Table:** Borrowings, Share Capital, Reserves, Investments, Debt-to-Equity (D/E), Current Ratio approximation.
  - **Cash Flow Table:** Operating Cash Flow (OCF), Investing Cash Flow (CapEx), Free Cash Flow (FCF = OCF + CFI).
  - **Shareholding Pattern Table:** 8-quarter history of Promoter %, FII %, DII %, Public %, and Promoter Pledging %.
  - **Peer Comparison Table:** Sector classification and real peer P/E, Market Cap, and ROCE %.
- **Self-Healing Dynamic Search Resolution:** Automatically queries Screener's search API if a company ticker was recently renamed or merged.

### C. Live Quotes (`scrapers/quote.js`)
- Fetches real-time market quotes and 52-week trading ranges from Yahoo Finance (`.NS` / `.BO`).

### D. News RSS Parser (`scrapers/news.js`)
- Parses real, dated headlines from Google News RSS without AI summarization or rewording.

---

## 4. Deterministic Math & Heuristic Engines

### A. CAGR Calculation
$$\text{CAGR} = \left( \frac{\text{Current}}{\text{Historical}} \right)^{\frac{1}{\text{Years}}} - 1$$
Computed for 3Y and 5Y Revenue, Operating Profit, and EPS.

### B. Valuation Multiples Bucketing
- `CHEAP`: Current P/E is **>15% below** both Sector Average and Historical Median P/E.
- `RICH`: Current P/E is **>15% above** both Sector Average and Historical Median P/E.
- `FAIR`: Falls within the $\pm 15\%$ benchmark range.

### C. Growth Classification
- `ACCELERATING`: $\text{CAGR}_{3Y} > \text{CAGR}_{5Y} + 2.0\%$
- `SLOWING`: $\text{CAGR}_{3Y} < \text{CAGR}_{5Y} - 2.0\%$
- `DECLINING`: $\text{CAGR}_{3Y} < 0\%$
- `STEADY`: Stability within $\pm 2.0\%$.
- **Margin Compression Alert:** Flagged if EBITDA margin contracts by $>200\text{ bps}$.

### D. Tier 1 Moat Heuristics (`engine/moatHeuristics.js`)
Evaluates 7 factors ($0-2$ each, Total $/14$):
1. **Brand Power:** Scored via sector mapping + pricing power proxy (OPM $>25\%$).
2. **Switching Costs:** Scored via software/BFSI/specialty B2B sector patterns.
3. **Network Effects:** Scored via platform/marketplace classification.
4. **Cost Advantage:** Scored via operating margin resilience.
5. **Regulatory License:** Scored via banking/telecom/pharma compliance permits.
6. **Patents / IP:** Scored via pharma/tech IP intensity.
7. **Scale Advantage:** Scored via mega-cap balance sheet ($>₹50,000\text{ Cr}$).
- **Rating:** `WIDE` ($9-14$), `NARROW` ($5-8$), `NONE` ($0-4$).

### E. Tier 1 Management Trust Heuristics (`engine/trustHeuristics.js`)
Evaluates 6 positive and 3 negative criteria (Total $/8$):
- Results consistency across quarters (zero consecutive profit drops).
- Promoter stake stability ($>50\%$ and stable/rising).
- Zero / low promoter pledging ($<5\%$).
- FII institutional stake accumulation ($>10\%$).
- **Rating:** `HIGH` ($7-8$), `MODERATE` ($4-6$), `LOW` ($<4$).

### F. The Pulse Score (/10)
Synthesizes 10 binary fundamental criteria into an overarching quality index:
1. Valuation in fair/cheap range.
2. Revenue trajectory robust ($\ge 10\%$ or steady).
3. Operating profit expansion solid ($>8\%$).
4. Solvency & liquidity sound (zero red health metrics).
5. $\text{ROE} \ge 15\%$.
6. $\text{ROCE} \ge 15\%$.
7. Promoter holding stable or rising.
8. Promoter shares unencumbered (pledge $\le 10\%$).
9. Defensible competitive moat ($\ge 5/14$).
10. Management trust score $\ge 4/8$.

### G. What-If Scenario Matrix
- **Bear Case:** $\text{CAGR}_{5Y} - 5.0\%$, Margin $-250\text{ bps}$.
- **Base Case:** Historical Avg CAGR, Current Margin.
- **Bull Case:** $\text{CAGR}_{5Y} + 3.5\%$, Margin $+150\text{ bps}$.
- **₹1,00,000 Capital Compound Illustration** projected over 3, 5, or 10 years.

---

## 5. Server-Side PDF Export (`pdf/generateReport.js`)

Uses **PDFKit** to render clean multi-page research reports:
- Dynamic headers and footers with page numbering (`Page X of Y`).
- Formatted tables across all 10 sections.
- Regulatory disclaimer and source attributions.
- Downloaded via direct stream from `GET /api/pdf?company=...&horizon=...`.

---

## 6. How to Run

### Quick Start:
```bash
npm start
```
Open **`http://localhost:3000`** in your browser, search any Indian stock ticker (e.g. `TCS`, `ZOMATO`, `HDFCBANK`, `RELIANCE`, `TITAN`, `INFY`), and generate reports instantly!

### Run Automated Tests:
```bash
npm test
```
