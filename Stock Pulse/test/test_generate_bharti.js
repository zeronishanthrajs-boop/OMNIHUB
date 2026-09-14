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
  classifyGrowth,
  evalRedFlags,
  calcPulseScore,
  calcScenarios,
  calcDataConfidence
} = require('../engine/math');
const { generateReportPDF } = require('../pdf/generateReport');

async function testBhartiPdf() {
  console.log('Generating high-quality PDF for BHARTIARTL...');
  const ticker = 'BHARTIARTL';
  const horizonYears = 10;

  const [screenerData, quoteData, newsData] = await Promise.all([
    fetchScreenerData(ticker),
    fetchLiveQuote(ticker),
    fetchCompanyNews('Bharti Airtel Ltd', ticker, 4)
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

  const valuationBucket = bucketValuation(ratios.stock_pe, 24.0, ratios.stock_pe * 0.95);
  const growthClass = classifyGrowth(revCagr3y, revCagr5y, gh.ebitda_margin_current_pct, gh.ebitda_margin_prior_pct, gh.net_margin_current_pct, gh.net_margin_current_pct);

  const deBucket = bucketThreshold(gh.de_ratio, 0.5, 1.5, false);
  const icBucket = bucketThreshold(gh.interest_coverage, 5.0, 2.0, true);
  const crBucket = bucketThreshold(gh.current_ratio, 2.0, 1.0, true);
  const fcfBucket = gh.fcf_trend === 'growing' ? { label: 'HEALTHY', tone: 'green' } : { label: 'WATCH', tone: 'amber' };

  const roeBucket = bucketThreshold(ratios.roe, 15.0, 10.0, true);
  const roceBucket = bucketThreshold(ratios.roce, 15.0, 10.0, true);
  const leverageWarning = (ratios.roe != null && ratios.roce != null && (ratios.roe - ratios.roce) > 6.0);

  const redFlags = evalRedFlags(screenerData);

  const state = {
    overview: {
      company_name: screenerData.company_name,
      ticker: screenerData.ticker,
      exchange: screenerData.exchange,
      sector: screenerData.sector,
      about: screenerData.about
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
    sector_avg_pe: 24.0,
    valuation_bucket: valuationBucket,
    growth_class: growthClass,
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

  state.pulse = calcPulseScore(state);
  state.scenarios = calcScenarios(state, horizonYears);
  state.confidence = calcDataConfidence(10, true, true, true);

  const pdfBuffer = await generateReportPDF(state);
  const outputPath = path.join(__dirname, '..', 'stock-pulse-bhartiartl-10y.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`✓ Generated ${outputPath} (${pdfBuffer.length} bytes)`);
}

testBhartiPdf().catch(console.error);
