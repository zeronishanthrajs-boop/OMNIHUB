/**
 * Stock Pulse v3.0 — Comprehensive Test Suite
 * Validates Resolver, Scrapers, Heuristics, Math Engine, Cache, and Institutional PDFKit Generation.
 */

const assert = require('assert');
const { resolveCompany, searchSuggestions, getIndustryPeers } = require('../scrapers/companyResolver');
const { fetchScreenerData } = require('../scrapers/screener');
const { fetchLiveQuote } = require('../scrapers/quote');
const { fetchCompanyNews } = require('../scrapers/news');
const { evaluateMoat } = require('../engine/moatHeuristics');
const { evaluateManagementTrust } = require('../engine/trustHeuristics');
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
  calcDataConfidence
} = require('../engine/math');
const { generateReportPDF } = require('../pdf/generateReport');

async function runTests() {
  console.log('=======================================================');
  console.log('  RUNNING STOCK PULSE v3.0 AUTOMATED TEST SUITE');
  console.log('=======================================================\n');

  // TEST 1: Company Resolver & Industry Peer Discovery
  console.log('--- TEST 1: Company Resolution & Peer Discovery ---');
  const tcs = resolveCompany('tcs');
  assert.strictEqual(tcs.symbol, 'TCS');
  console.log('✓ Resolved "tcs" ->', tcs.symbol, `(${tcs.name})`);

  const maruti = resolveCompany('maruti suzuki');
  assert.strictEqual(maruti.symbol, 'MARUTI');
  console.log('✓ Resolved "maruti suzuki" ->', maruti.symbol, `(${maruti.name})`);

  const marutiPeers = getIndustryPeers('MARUTI', 'Consumer Discretionary');
  assert(marutiPeers.length > 0);
  console.log('✓ Industry peers discovered for Maruti:', marutiPeers.map(p => p.name).join(', '));

  // TEST 2: Exact Mathematical Calculations & What-If Matrix Deltas
  console.log('\n--- TEST 2: Deterministic Math Formulas & Scenario Deltas ---');
  const cagr = calcCAGR(200, 100, 3);
  assert(Math.abs(cagr - 25.99) < 0.1);
  console.log(`✓ CAGR 100 -> 200 over 3Y = ${cagr.toFixed(2)}%`);

  // Test 52W Context
  const context52W = calc52WeekContext(12950, 17370, 12201);
  assert(context52W.percentile > 0 && context52W.percentile < 20);
  console.log(`✓ 52-Week Context Narrative: "${context52W.narrative}"`);

  // Test Aggregated Badges
  const aggregatedSolv = aggregateSectionBadge([
    { label: 'HEALTHY', tone: 'green' },
    { label: 'WEAK', tone: 'red' },
    { label: 'HEALTHY', tone: 'green' }
  ]);
  assert.strictEqual(aggregatedSolv.label, 'WATCH');
  console.log('✓ Section aggregation with 1 WEAK sub-metric ->', aggregatedSolv.label);

  const valPremium = bucketValuation(28.6, 24.0, null);
  assert.strictEqual(valPremium.label, 'PREMIUM');
  console.log('✓ Valuation P/E 28.6 vs Sector 24.0 (Fair Band 20.4-27.6) =', valPremium.label);

  // TEST 3: Live Financial Scraper & Pipeline
  console.log('\n--- TEST 3: Live Financial Scraper (Screener / Quote / News) ---');
  console.log('Fetching live structured data for TCS...');
  const screenerData = await fetchScreenerData('TCS');
  assert(screenerData.company_name);
  assert(screenerData.ratios.current_price > 0);
  console.log(`✓ Scraped TCS Name: ${screenerData.company_name}`);
  console.log(`✓ Scraped TCS Current Price: Rs. ${screenerData.ratios.current_price}`);
  console.log(`✓ Scraped TCS Stock P/E: ${screenerData.ratios.stock_pe}`);
  console.log(`✓ Scraped TCS Promoter Stake: ${screenerData.ownership.promoter_pct}%`);
  console.log(`✓ Scraped TCS TTM Revenue: Rs. ${screenerData.growth_health.revenue_current_cr} Cr`);
  console.log(`✓ Scraped TCS TTM Net Profit: Rs. ${screenerData.growth_health.profit_current_cr} Cr`);

  const quote = await fetchLiveQuote('TCS');
  if (quote) {
    console.log(`✓ Live Quote from ${quote.source}: Rs. ${quote.current_price} (52W: Rs. ${quote.week52_low} - Rs. ${quote.week52_high})`);
  }

  const news = await fetchCompanyNews('Tata Consultancy Services', 'TCS', 3);
  console.log(`✓ News RSS headlines count: ${news.length}`);

  // TEST 4: Tier 1 Heuristics & Scoring
  console.log('\n--- TEST 4: Tier 1 Moat & Management Trust Heuristics ---');
  const moat = evaluateMoat(screenerData);
  console.log(`✓ TCS Moat Total: ${moat.total}/14 (${moat.label})`);

  const mgmt = evaluateManagementTrust(screenerData);
  console.log(`✓ TCS Management Trust Total: ${mgmt.total}/8 (${mgmt.label})`);
  assert(mgmt.breakdown && mgmt.breakdown.length > 0);

  const mockState = {
    overview: {
      company_name: screenerData.company_name,
      ticker: 'TCS',
      exchange: 'NSE/BSE',
      sector: screenerData.sector,
      range_context: context52W
    },
    ratios: screenerData.ratios,
    growth_health: screenerData.growth_health,
    ownership: screenerData.ownership,
    peers: screenerData.peers,
    news,
    moat,
    mgmtTrust: mgmt,
    revenue_cagr_3y: 12.5,
    revenue_cagr_5y: 10.2,
    profit_cagr_3y: 11.0,
    profit_cagr_5y: 9.8,
    valuation_bucket: valPremium,
    growth_class: { label: 'STEADY', tone: 'green' },
    de_bucket: { label: 'HEALTHY', tone: 'green' },
    ic_bucket: { label: 'HEALTHY', tone: 'green' },
    cr_bucket: { label: 'HEALTHY', tone: 'green' },
    fcf_bucket: { label: 'HEALTHY', tone: 'green' },
    solvency_bucket: { label: 'HEALTHY', tone: 'green' },
    roe: screenerData.ratios.roe,
    roce: screenerData.ratios.roce,
    roe_bucket: { label: 'HEALTHY', tone: 'green' },
    roce_bucket: { label: 'HEALTHY', tone: 'green' },
    return_quality_bucket: { label: 'HEALTHY', tone: 'green' },
    redFlags: [],
    horizon: 5
  };

  const pulse = calcPulseScore(mockState);
  console.log(`✓ The Pulse Score: ${pulse.total}/10 (${pulse.label})`);

  const scenarios = calcScenarios(mockState, 5);
  assert(scenarios.base.cagr != null);
  // Verify exact arithmetic deltas
  assert.strictEqual(+(scenarios.base.cagr - 5.0).toFixed(1), scenarios.bear.cagr);
  assert.strictEqual(+(scenarios.base.cagr + 3.5).toFixed(1), scenarios.bull.cagr);
  console.log(`✓ Exact Scenario Deltas verified: Base ${scenarios.base.cagr}% | Bear ${scenarios.bear.cagr}% (-5.0%) | Bull ${scenarios.bull.cagr}% (+3.5%)`);
  console.log(`✓ Rs. 1,00,000 Total Return Compounding Simulation: Rs. ${Math.round(scenarios.lakhSim).toLocaleString('en-IN')} (Total Return Rate: ${scenarios.totalReturnRate.toFixed(1)}% CAGR)`);

  // TEST 5: PDFKit Server-Side Generation
  console.log('\n--- TEST 5: Server-Side PDF Generation ---');
  mockState.pulse = pulse;
  mockState.scenarios = scenarios;
  mockState.confidence = calcDataConfidence(10, true, true, true);

  const pdfBuffer = await generateReportPDF(mockState);
  assert(pdfBuffer instanceof Buffer);
  assert(pdfBuffer.length > 5000);
  console.log(`✓ PDFKit Institutional Report generated successfully (${pdfBuffer.length} bytes)`);

  console.log('\n=======================================================');
  console.log('  ALL STOCK PULSE v3.0 TESTS PASSED SUCCESSFULLY! 🚀');
  console.log('=======================================================');
}

runTests().catch(err => {
  console.error('\n✗ TEST SUITE FAILED:', err);
  process.exit(1);
});
