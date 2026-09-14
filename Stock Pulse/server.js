/**
 * Stock Pulse v3.0 — Express Server Entrypoint
 * Single process, single command (`npm start` or `node server.js`).
 * Deterministic, Zero-API-Key System.
 */

const express = require('express');
const path = require('path');
const { resolveCompany, searchSuggestions } = require('./scrapers/companyResolver');
const { fetchScreenerData } = require('./scrapers/screener');
const { fetchLiveQuote } = require('./scrapers/quote');
const { fetchCompanyNews } = require('./scrapers/news');
const { getCachedReport, setCachedReport } = require('./cache/cacheManager');
const { evaluateMoat } = require('./engine/moatHeuristics');
const { evaluateManagementTrust } = require('./engine/trustHeuristics');
const {
  calcCAGR,
  bucketValuation,
  bucketThreshold,
  aggregateSectionBadge,
  classifyGrowth,
  calc52WeekContext,
  evalRedFlags,
  calcPulseScore,
  calcScenarios,
  calcDataConfidence,
  getSectorBenchmarkPe
} = require('./engine/math');
const { calcBeneishMScore, calcAltmanZScore, calcPiotroskiFScore, calcSloanAccrual } = require('./engine/forensics');
const { solveReverseDcf, calcHistoricalValuationBands, calcEarningsPowerValue } = require('./engine/valuation');
const { calc5StageDuPont, calcROIIC, calcCashConversionCycle } = require('./engine/capitalAllocation');
const { generateReportPDF } = require('./pdf/generateReport');
const { generateExecutiveReportHTML } = require('./html/generateExecutiveReport');
const { compareCompanies } = require('./engine/compare');
const { calcQuarterlyMomentum } = require('./engine/quarterlyMomentum');
const { buildWatchlistMatrix } = require('./engine/watchlist');
const { evaluateInsiderActivity } = require('./scrapers/insiderTrading');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '3.0.0', time: new Date().toISOString() });
});

// Auto-suggest resolution endpoint
app.get('/api/resolve', (req, res) => {
  const query = req.query.query || '';
  const results = searchSuggestions(query);
  res.json({ query, results });
});

// Build state orchestrator
async function buildCompanyReport(companyQuery, horizonYears = 5) {
  // 1. Resolve Company locally (zero network)
  const resolved = resolveCompany(companyQuery);
  if (!resolved || !resolved.symbol) {
    throw new Error(`Could not resolve listed Indian equity for "${companyQuery}".`);
  }

  const ticker = resolved.symbol.toUpperCase();

  // 2. Check 24-hour Cache
  const cached = getCachedReport(ticker);
  if (cached && cached.quarterly_momentum && cached.insider_activity) {
    // Recompute scenarios if horizon differs
    cached.horizon = horizonYears;
    cached.scenarios = calcScenarios(cached, horizonYears);
    return cached;
  }

  // 3. Parallel Scraper Fetch (Screener + Quote + News)
  const [screenerRes, quoteRes, newsRes] = await Promise.allSettled([
    fetchScreenerData(ticker),
    fetchLiveQuote(ticker),
    fetchCompanyNews(resolved.name || ticker, ticker, 5)
  ]);

  const screenerData = screenerRes.status === 'fulfilled' ? screenerRes.value : null;
  const quoteData = quoteRes.status === 'fulfilled' ? quoteRes.value : null;
  const newsData = newsRes.status === 'fulfilled' ? newsRes.value : [];

  if (!screenerData) {
    throw new Error(`Unable to retrieve financial data for ${ticker} from Screener.in.`);
  }

  // Merge quotes
  if (quoteData && quoteData.current_price) {
    screenerData.ratios.current_price = quoteData.current_price;
    if (quoteData.week52_high) screenerData.ratios.high52 = quoteData.week52_high;
    if (quoteData.week52_low) screenerData.ratios.low52 = quoteData.week52_low;
  }

  // 4. Run Tier 1 Heuristics
  const moat = evaluateMoat(screenerData);
  const mgmtTrust = evaluateManagementTrust(screenerData);

  // 5. Run Deterministic Math Engine
  const gh = screenerData.growth_health || {};
  const ratios = screenerData.ratios || {};

  const revCagr3y = calcCAGR(gh.revenue_current_cr, gh.revenue_3y_ago_cr, 3);
  const revCagr5y = calcCAGR(gh.revenue_current_cr, gh.revenue_5y_ago_cr, 5);
  const patCagr3y = calcCAGR(gh.profit_current_cr, gh.profit_3y_ago_cr, 3);
  const patCagr5y = calcCAGR(gh.profit_current_cr, gh.profit_5y_ago_cr, 5);
  const epsCagr3y = calcCAGR(gh.eps_current, gh.eps_3y_ago, 3);
  const epsCagr5y = calcCAGR(gh.eps_current, gh.eps_5y_ago, 5);

  // Sector average P/E from peers or sector benchmark table
  let sectorAvgPe = getSectorBenchmarkPe(screenerData.sector);
  if (screenerData.peers && screenerData.peers.length) {
    const validPeers = screenerData.peers.map(p => p.pe).filter(p => typeof p === 'number' && p > 0);
    if (validPeers.length >= 2) {
      sectorAvgPe = +(validPeers.reduce((a, b) => a + b, 0) / validPeers.length).toFixed(1);
    }
  }

  const valuationBucket = bucketValuation(ratios.stock_pe, sectorAvgPe, ratios.stock_pe ? ratios.stock_pe * 0.95 : null, screenerData.sector);
  const growthClass = classifyGrowth(revCagr3y, revCagr5y, gh.ebitda_margin_current_pct, gh.ebitda_margin_prior_pct, gh.net_margin_current_pct, gh.net_margin_current_pct, patCagr3y, patCagr5y);

  const deBucket = bucketThreshold(gh.de_ratio, 0.5, 1.5, false);
  const icBucket = bucketThreshold(gh.interest_coverage, 5.0, 2.0, true);
  const crBucket = bucketThreshold(gh.current_ratio, 1.2, 1.0, true);
  const fcfBucket = gh.fcf_trend === 'growing' ? { label: 'HEALTHY', tone: 'green' } : (gh.fcf_trend === 'flat_positive' ? { label: 'WATCH', tone: 'amber' } : { label: 'WEAK', tone: 'red' });

  const solvencyBucket = aggregateSectionBadge([deBucket, icBucket, crBucket, fcfBucket]);

  const roeBucket = bucketThreshold(ratios.roe, 15.0, 10.0, true);
  const roceBucket = bucketThreshold(ratios.roce, 15.0, 10.0, true);
  const returnQualityBucket = aggregateSectionBadge([roeBucket, roceBucket]);
  const leverageWarning = (ratios.roe != null && ratios.roce != null && (ratios.roe - ratios.roce) > 6.0);

  const rangeContext = calc52WeekContext(ratios.current_price, ratios.high52, ratios.low52);
  const redFlags = evalRedFlags(screenerData);

  const partialState = {
    overview: {
      company_name: screenerData.company_name,
      ticker: screenerData.ticker,
      exchange: screenerData.exchange,
      sector: screenerData.sector,
      about: screenerData.about,
      range_context: rangeContext
    },
    ratios,
    growth_health: gh,
    ownership: screenerData.ownership,
    peers: screenerData.peers,
    news: newsData,
    moat,
    mgmtTrust,
    revenue_cagr_3y: revCagr3y,
    revenue_cagr_5y: revCagr5y,
    profit_cagr_3y: patCagr3y,
    profit_cagr_5y: patCagr5y,
    eps_cagr_3y: epsCagr3y,
    eps_cagr_5y: epsCagr5y,
    sector_avg_pe: sectorAvgPe,
    valuation_bucket: valuationBucket,
    growth_class: growthClass,
    solvency_bucket: solvencyBucket,
    return_quality_bucket: returnQualityBucket,
    de_bucket: deBucket,
    ic_bucket: icBucket,
    cr_bucket: crBucket,
    fcf_bucket: fcfBucket,
    roe: ratios.roe,
    roce: ratios.roce,
    roe_bucket: roeBucket,
    roce_bucket: roceBucket,
    leverage_warning: leverageWarning,
    redFlags,
    horizon: horizonYears
  };

  const history = screenerData.financials_history || {};

  // Forensic Accounting Engine (Phase 2)
  const beneish = calcBeneishMScore(history);
  const altman = calcAltmanZScore(history, ratios);
  const piotroski = calcPiotroskiFScore(history, ratios);
  const sloan = calcSloanAccrual(history);
  partialState.forensics = {
    beneish,
    altman,
    piotroski,
    sloan
  };

  // Capital Allocation & DuPont (Phase 4)
  const dupont = calc5StageDuPont(history);
  const roiic = calcROIIC(history);
  const ccc = calcCashConversionCycle(history);
  partialState.capital_allocation = {
    dupont,
    roiic,
    ccc
  };

  // Valuation Triangulation (Phase 3)
  const sharesOutstandingCr = (ratios.market_cap_cr && ratios.current_price) ? (ratios.market_cap_cr / ratios.current_price) : 1;
  const netDebtCr = Math.max(0, (gh.cash_position_cr ? (gh.de_ratio * (ratios.market_cap_cr * 0.4) - gh.cash_position_cr) : 0));
  const enterpriseValueCr = (ratios.market_cap_cr || 1000) + netDebtCr;
  const ttmFcfCr = (gh.profit_current_cr || 100) * 0.85;

  const reverseDcf = solveReverseDcf(enterpriseValueCr, ttmFcfCr, 11.5, 4.5, horizonYears);
  const valuationBands = calcHistoricalValuationBands(history, ratios.stock_pe, ratios.book_value ? ratios.current_price / ratios.book_value : 3.0);
  const epv = calcEarningsPowerValue(gh.profit_current_cr * 1.3, 25, 11.5, gh.cash_position_cr, netDebtCr, sharesOutstandingCr);
  partialState.valuation_triangulation = {
    reverse_dcf: reverseDcf,
    historical_bands: valuationBands,
    epv
  };
  partialState.financials_history = history;

  // Quarterly Earnings Momentum & Inflection
  partialState.quarterly_momentum = calcQuarterlyMomentum(history.quarters);

  // SEBI Insider Trading & Promoter Drift
  partialState.insider_activity = evaluateInsiderActivity(screenerData.ownership, ratios.market_cap_cr);

  const pulse = calcPulseScore(partialState);
  partialState.pulse = pulse;

  const scenarios = calcScenarios(partialState, horizonYears);
  partialState.scenarios = scenarios;

  const allScrapersOk = screenerRes.status === 'fulfilled' && quoteRes.status === 'fulfilled';
  const confidence = calcDataConfidence(10, allScrapersOk, Boolean(screenerData), true);
  partialState.confidence = confidence;

  // 6. Cache and return
  setCachedReport(ticker, partialState);
  return partialState;
}

// Report endpoint
app.get('/api/report', async (req, res) => {
  const company = req.query.company || req.query.q || '';
  const horizon = parseInt(req.query.horizon, 10) || 5;

  if (!company.trim()) {
    return res.status(400).json({ error: 'Missing required query parameter "company".' });
  }

  try {
    const report = await buildCompanyReport(company, horizon);
    res.json(report);
  } catch (err) {
    console.error('Report generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Head-to-Head Comparison Endpoint
app.get('/api/compare', async (req, res) => {
  const tickersParam = req.query.tickers || req.query.symbols || req.query.companies || '';
  const horizon = parseInt(req.query.horizon, 10) || 5;

  const tickers = tickersParam.split(',').map(s => s.trim()).filter(Boolean);
  if (tickers.length < 2) {
    return res.status(400).json({ error: 'Please provide at least 2 tickers comma-separated (e.g. ?tickers=HDFCBANK,ICICIBANK)' });
  }

  try {
    const [stateA, stateB] = await Promise.all([
      buildCompanyReport(tickers[0], horizon),
      buildCompanyReport(tickers[1], horizon)
    ]);

    const comparison = compareCompanies(stateA, stateB);
    res.json({
      horizon,
      comparison,
      companyA: stateA,
      companyB: stateB
    });
  } catch (err) {
    console.error('Comparison error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Multi-Stock Watchlist Radar Endpoint
app.get('/api/watchlist', async (req, res) => {
  const tickersParam = req.query.tickers || req.query.symbols || '';
  const horizon = parseInt(req.query.horizon, 10) || 5;

  const tickers = tickersParam.split(',').map(s => s.trim()).filter(Boolean);
  if (!tickers.length) {
    return res.status(400).json({ error: 'Please provide at least 1 ticker (e.g. ?tickers=HDFCBANK,TCS,LT)' });
  }

  try {
    const reports = await Promise.all(tickers.map(sym => buildCompanyReport(sym, horizon)));
    const matrix = buildWatchlistMatrix(reports);
    res.json(matrix);
  } catch (err) {
    console.error('Watchlist error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PDF endpoint
app.get('/api/pdf', async (req, res) => {
  const company = req.query.company || req.query.q || '';
  const horizon = parseInt(req.query.horizon, 10) || 5;

  if (!company.trim()) {
    return res.status(400).send('Missing company parameter');
  }

  try {
    const state = await buildCompanyReport(company, horizon);
    const pdfBuffer = await generateReportPDF(state);

    const safeTicker = (state.overview?.ticker || 'report').toLowerCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="stock-pulse-${safeTicker}-${horizon}y.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err.message);
    res.status(500).send('PDF generation failed: ' + err.message);
  }
});

// Executive HTML endpoint
app.get('/api/html', async (req, res) => {
  const company = req.query.company || req.query.q || '';
  const horizon = parseInt(req.query.horizon, 10) || 5;

  if (!company.trim()) {
    return res.status(400).send('Missing company parameter');
  }

  try {
    const state = await buildCompanyReport(company, horizon);
    const html = generateExecutiveReportHTML(state);

    const safeTicker = (state.overview?.ticker || 'report').toLowerCase();
    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="stock-pulse-${safeTicker}-${horizon}y.html"`);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('HTML export error:', err.message);
    res.status(500).send('HTML generation failed: ' + err.message);
  }
});

// Root HTML fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'stock_pulse.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Stock Pulse v3.0 is LIVE on http://localhost:${PORT}`);
  console.log(` Deterministic, Zero-API-Key System`);
  console.log(` Ready to evaluate Indian equities`);
  console.log(`=======================================================`);
});
