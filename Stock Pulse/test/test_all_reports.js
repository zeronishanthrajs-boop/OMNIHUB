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
const { generateReportPDF } = require('../pdf/generateReport');

async function generateSingleStockReport(ticker, horizonYears = 10) {
  console.log(`\n=======================================================`);
  console.log(`Generating Report for ${ticker}...`);
  console.log(`=======================================================`);

  const [screenerData, quoteData, newsData] = await Promise.all([
    fetchScreenerData(ticker),
    fetchLiveQuote(ticker),
    fetchCompanyNews(ticker, ticker, 3)
  ]);

  if (quoteData && quoteData.current_price) {
    screenerData.ratios.current_price = quoteData.current_price;
    if (quoteData.week52_high) screenerData.ratios.high52 = quoteData.week52_high;
    if (quoteData.week52_low) screenerData.ratios.low52 = quoteData.week52_low;
  }

  const moat = evaluateMoat(screenerData);
  const mgmtTrust = evaluateManagementTrust(screenerData);

  const gh = screenerData.growth_health || {};
  const ratios = screenerData.ratios || {};

  const revCagr3y = calcCAGR(gh.revenue_current_cr, gh.revenue_3y_ago_cr, 3);
  const revCagr5y = calcCAGR(gh.revenue_current_cr, gh.revenue_5y_ago_cr, 5);
  const patCagr3y = calcCAGR(gh.profit_current_cr, gh.profit_3y_ago_cr, 3);
  const patCagr5y = calcCAGR(gh.profit_current_cr, gh.profit_5y_ago_cr, 5);
  const epsCagr3y = calcCAGR(gh.eps_current, gh.eps_3y_ago, 3);
  const epsCagr5y = calcCAGR(gh.eps_current, gh.eps_5y_ago, 5);

  let sectorAvgPe = 24.0;
  if (screenerData.peers && screenerData.peers.length) {
    const validPeers = screenerData.peers.map(p => p.pe).filter(p => typeof p === 'number' && p > 0);
    if (validPeers.length) {
      sectorAvgPe = +(validPeers.reduce((a, b) => a + b, 0) / validPeers.length).toFixed(1);
    }
  }

  const valuationBucket = bucketValuation(ratios.stock_pe, sectorAvgPe, ratios.stock_pe ? ratios.stock_pe * 0.95 : null);
  const growthClass = classifyGrowth(revCagr3y, revCagr5y, gh.ebitda_margin_current_pct, gh.ebitda_margin_prior_pct, gh.net_margin_current_pct, gh.net_margin_current_pct, patCagr3y, patCagr5y);

  const deBucket = bucketThreshold(gh.de_ratio, 0.5, 1.5, false);
  const icBucket = bucketThreshold(gh.interest_coverage, 5.0, 2.0, true);
  const crBucket = bucketThreshold(gh.current_ratio, 1.2, 1.0, true);
  const fcfBucket = gh.fcf_trend === 'growing' ? { label: 'HEALTHY', tone: 'green' } : { label: 'WATCH', tone: 'amber' };

  const solvencyBucket = aggregateSectionBadge([deBucket, icBucket, crBucket, fcfBucket]);

  const roeBucket = bucketThreshold(ratios.roe, 15.0, 10.0, true);
  const roceBucket = bucketThreshold(ratios.roce, 15.0, 10.0, true);
  const returnQualityBucket = aggregateSectionBadge([roeBucket, roceBucket]);
  const leverageWarning = (ratios.roe != null && ratios.roce != null && (ratios.roe - ratios.roce) > 6.0);

  const rangeContext = calc52WeekContext(ratios.current_price, ratios.high52, ratios.low52);
  const redFlags = evalRedFlags(screenerData);

  const state = {
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
  state.financials_history = history;

  state.forensics = {
    beneish: calcBeneishMScore(history),
    altman: calcAltmanZScore(history, ratios),
    piotroski: calcPiotroskiFScore(history, ratios),
    sloan: calcSloanAccrual(history)
  };

  state.capital_allocation = {
    dupont: calc5StageDuPont(history),
    roiic: calcROIIC(history),
    ccc: calcCashConversionCycle(history)
  };

  const sharesOutstandingCr = (ratios.market_cap_cr && ratios.current_price) ? (ratios.market_cap_cr / ratios.current_price) : 1;
  const netDebtCr = Math.max(0, (gh.cash_position_cr ? (gh.de_ratio * (ratios.market_cap_cr * 0.4) - gh.cash_position_cr) : 0));
  const enterpriseValueCr = (ratios.market_cap_cr || 1000) + netDebtCr;
  const ttmFcfCr = (gh.profit_current_cr || 100) * 0.85;

  state.valuation_triangulation = {
    reverse_dcf: solveReverseDcf(enterpriseValueCr, ttmFcfCr, 11.5, 4.5, horizonYears),
    historical_bands: calcHistoricalValuationBands(history, ratios.stock_pe, ratios.book_value ? ratios.current_price / ratios.book_value : 3.0),
    epv: calcEarningsPowerValue(gh.profit_current_cr * 1.3, 25, 11.5, gh.cash_position_cr, netDebtCr, sharesOutstandingCr)
  };

  state.pulse = calcPulseScore(state);
  state.scenarios = calcScenarios(state, horizonYears);
  state.confidence = calcDataConfidence(10, true, true, true);

  const pdfBuffer = await generateReportPDF(state);
  const filename = `stock-pulse-${ticker.toLowerCase()}-${horizonYears}y.pdf`;
  const outputPath = path.join(__dirname, '..', filename);
  fs.writeFileSync(outputPath, pdfBuffer);

  const { generateExecutiveReportHTML } = require('../html/generateExecutiveReport');
  const htmlContent = generateExecutiveReportHTML(state);
  const htmlFilename = `stock-pulse-${ticker.toLowerCase()}-${horizonYears}y.html`;
  const htmlOutputPath = path.join(__dirname, '..', htmlFilename);
  fs.writeFileSync(htmlOutputPath, htmlContent, 'utf8');

  console.log(`✓ Saved ${outputPath} (${pdfBuffer.length} bytes)`);
  console.log(`✓ Saved ${htmlOutputPath} (${htmlContent.length} bytes)`);
  console.log(`  Pulse Score: ${state.pulse.total}/10 (${state.pulse.label})`);
  console.log(`  Moat Score: ${state.moat.total}/14 (${state.moat.label})`);
  console.log(`  Trust Score: ${state.mgmtTrust.total}/8 (${state.mgmtTrust.label}) [${state.mgmtTrust.formula}]`);
  console.log(`  Base Scenario CAGR: ${state.scenarios.base.cagr}% (PAT CAGR: ${state.scenarios.base.patCagr}%)`);
  console.log(`  Total Return Compounding: Rs. ${Math.round(state.scenarios.lakhSim).toLocaleString('en-IN')} (Reversion to sector: Rs. ${Math.round(state.scenarios.valuationSensitivity.lakhSimReverted).toLocaleString('en-IN')})`);
}

async function runAll() {
  console.log("=======================================================");
  console.log("Generating Reports for Benchmark Stocks...");
  console.log("=======================================================");
  await generateSingleStockReport('ULTRACEMCO', 5);
  await generateSingleStockReport('LT', 5);

  for (const ticker of ['ULTRACEMCO', 'LT', 'MARUTI', 'BHARTIARTL', 'ADANIENT', 'TCS']) {
    try {
      await generateSingleStockReport(ticker, 10);
    } catch (e) {
      console.error(`Error generating ${ticker}:`, e.message);
    }
  }
}

module.exports = {
  generateSingleStockReport,
  runAll
};

if (require.main === module) {
  runAll();
}
