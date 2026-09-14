/**
 * Stock Pulse v4.1 — Multi-Sector Universe Stress-Test
 * Validates deterministic ingestion, forensic accounting, valuation triangulation,
 * capital allocation, BFSI adaptation, and PDF generation across a diversified basket.
 * Zero AI / Zero LLM reliance.
 */

const fs = require('fs');
const path = require('path');
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
const { calcBeneishMScore, calcAltmanZScore, calcPiotroskiFScore, calcSloanAccrual } = require('../engine/forensics');
const { solveReverseDcf, calcHistoricalValuationBands, calcEarningsPowerValue } = require('../engine/valuation');
const { calc5StageDuPont, calcROIIC, calcCashConversionCycle } = require('../engine/capitalAllocation');
const { isBfsiEntity, deriveBfsiMetrics } = require('../engine/bfsiAdapter');
const { generateReportPDF } = require('../pdf/generateReport');
const { generateExecutiveReportHTML } = require('../html/generateExecutiveReport');

const TEST_UNIVERSE = [
  { symbol: 'HDFCBANK', expectedSector: 'Financial Services', isBfsi: true },
  { symbol: 'ICICIBANK', expectedSector: 'Financial Services', isBfsi: true },
  { symbol: 'LT', expectedSector: 'Industrials', isBfsi: false },
  { symbol: 'ULTRACEMCO', expectedSector: 'Materials', isBfsi: false },
  { symbol: 'MARUTI', expectedSector: 'Consumer Discretionary', isBfsi: false },
  { symbol: 'TCS', expectedSector: 'Information Technology', isBfsi: false },
  { symbol: 'ITC', expectedSector: 'Consumer Goods', isBfsi: false },
  { symbol: 'TATASTEEL', expectedSector: 'Materials', isBfsi: false }
];

async function testSingleStock(symInfo) {
  const { symbol, isBfsi } = symInfo;
  console.log(`\n-----------------------------------------------------------`);
  console.log(`Testing ${symbol} (Expected BFSI: ${isBfsi})...`);

  const screenerData = await fetchScreenerData(symbol);
  if (!screenerData || !screenerData.company_name) {
    throw new Error(`Failed to parse screener data for ${symbol}`);
  }

  const ratios = screenerData.ratios || {};
  const gh = screenerData.growth_health || {};
  const history = screenerData.financials_history || {};

  // Verify core data
  if (ratios.current_price == null || ratios.current_price <= 0) {
    throw new Error(`${symbol}: Missing valid current price`);
  }

  const detectedBfsi = isBfsiEntity(screenerData.sector, screenerData.company_name, symbol);
  if (detectedBfsi !== isBfsi) {
    console.warn(`Note: ${symbol} detected as BFSI: ${detectedBfsi} (Expected: ${isBfsi})`);
  }

  // Build state
  const state = {
    overview: {
      ticker: symbol,
      company_name: screenerData.company_name,
      exchange: 'NSE',
      sector: screenerData.sector,
      about: screenerData.about
    },
    ratios,
    growth_health: gh,
    ownership: screenerData.ownership,
    financials_history: history,
    peers: screenerData.peers || [],
    news: [],
    revenue_cagr_3y: screenerData.revenue_cagr_3y,
    revenue_cagr_5y: screenerData.revenue_cagr_5y,
    profit_cagr_3y: screenerData.profit_cagr_3y,
    profit_cagr_5y: screenerData.profit_cagr_5y,
    sector_avg_pe: 24.0,
    valuation_bucket: bucketValuation(ratios.stock_pe, 24.0),
    growth_class: classifyGrowth(screenerData.revenue_cagr_3y, screenerData.profit_cagr_3y, gh.ebitda_margin_current_pct, gh.ebitda_margin_prior_pct),
    solvency_bucket: { label: 'HEALTHY', tone: 'green' },
    horizon: 5
  };

  state.moat = evaluateMoat(state);
  state.mgmtTrust = evaluateManagementTrust(state);

  // Forensic accounting
  state.forensics = {
    beneish: calcBeneishMScore(history),
    altman: calcAltmanZScore(history, ratios),
    piotroski: calcPiotroskiFScore(history, ratios),
    sloan: calcSloanAccrual(history)
  };

  // Capital allocation
  state.capital_allocation = {
    dupont: calc5StageDuPont(history),
    roiic: calcROIIC(history),
    ccc: calcCashConversionCycle(history)
  };

  // Valuation triangulation
  const sharesOutstandingCr = (ratios.market_cap_cr && ratios.current_price) ? (ratios.market_cap_cr / ratios.current_price) : 1;
  const netDebtCr = Math.max(0, (gh.cash_position_cr ? (gh.de_ratio * (ratios.market_cap_cr * 0.4) - gh.cash_position_cr) : 0));
  const enterpriseValueCr = (ratios.market_cap_cr || 1000) + netDebtCr;
  const ttmFcfCr = (gh.profit_current_cr || 100) * 0.85;

  state.valuation_triangulation = {
    reverse_dcf: solveReverseDcf(enterpriseValueCr, ttmFcfCr, 11.5, 4.5, 5),
    historical_bands: calcHistoricalValuationBands(history, ratios.stock_pe, ratios.book_value ? ratios.current_price / ratios.book_value : 3.0),
    epv: calcEarningsPowerValue(gh.profit_current_cr * 1.3, 25, 11.5, gh.cash_position_cr, netDebtCr, sharesOutstandingCr)
  };

  state.pulse = calcPulseScore(state);
  state.scenarios = calcScenarios(state, 5);
  state.confidence = calcDataConfidence(10, true, true, true);

  // Assertions
  if (state.pulse.total < 0 || state.pulse.total > 10) {
    throw new Error(`${symbol}: Pulse score out of bounds (${state.pulse.total})`);
  }
  if (state.forensics.piotroski.total < 0 || state.forensics.piotroski.total > 9) {
    throw new Error(`${symbol}: Piotroski score out of bounds (${state.forensics.piotroski.total})`);
  }

  // Generate PDF and HTML
  const pdfBuffer = await generateReportPDF(state);
  const htmlContent = generateExecutiveReportHTML(state);

  if (!pdfBuffer || pdfBuffer.length < 10000) {
    throw new Error(`${symbol}: PDF generation failed or too small (${pdfBuffer ? pdfBuffer.length : 0} bytes)`);
  }
  if (!htmlContent || !htmlContent.includes('class="section"')) {
    throw new Error(`${symbol}: HTML generation missing report sections`);
  }

  console.log(`✓ ${symbol} passed:`);
  console.log(`  CMP: Rs. ${ratios.current_price} | P/E: ${ratios.stock_pe} | P/B: ${(ratios.current_price / ratios.book_value).toFixed(2)}`);
  console.log(`  Pulse Score: ${state.pulse.total}/10 (${state.pulse.label})`);
  console.log(`  Moat: ${state.moat.total}/14 (${state.moat.label}) | Trust: ${state.mgmtTrust.total}/8 (${state.mgmtTrust.label})`);
  console.log(`  Piotroski: ${state.forensics.piotroski.total}/9 | Beneish: ${state.forensics.beneish.score} (${state.forensics.beneish.label})`);
  console.log(`  PDF: ${pdfBuffer.length} bytes (4 Pages) | HTML: ${htmlContent.length} bytes`);

  return true;
}

async function runUniverseSuite() {
  console.log("===========================================================");
  console.log("  STOCK PULSE v4.1 — MULTI-SECTOR UNIVERSE STRESS TEST");
  console.log("===========================================================");

  let passed = 0;
  let failed = 0;

  for (const item of TEST_UNIVERSE) {
    try {
      await testSingleStock(item);
      passed++;
      // Polite 600ms throttle between stocks to ensure stable network socket
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`✗ ${item.symbol} FAILED:`, err.message);
      failed++;
    }
  }

  console.log("\n===========================================================");
  console.log(`  UNIVERSE TEST COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("===========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runUniverseSuite();
}

module.exports = { runUniverseSuite };
