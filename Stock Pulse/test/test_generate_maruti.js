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
const { generateReportPDF } = require('../pdf/generateReport');

async function testMarutiReport() {
  console.log('Generating 1000/1000 institutional PDF for MARUTI...');
  const ticker = 'MARUTI';
  const horizonYears = 10;

  const [screenerData, quoteData, newsData] = await Promise.all([
    fetchScreenerData(ticker),
    fetchLiveQuote(ticker),
    fetchCompanyNews('Maruti Suzuki India Ltd', ticker, 4)
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
  const growthClass = classifyGrowth(revCagr3y, revCagr5y, gh.ebitda_margin_current_pct, gh.ebitda_margin_prior_pct, gh.net_margin_current_pct, gh.net_margin_current_pct);

  const deBucket = bucketThreshold(gh.de_ratio, 0.5, 1.5, false);
  const icBucket = bucketThreshold(gh.interest_coverage, 5.0, 2.0, true);
  const crBucket = bucketThreshold(gh.current_ratio, 2.0, 1.0, true);
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

  state.pulse = calcPulseScore(state);
  state.scenarios = calcScenarios(state, horizonYears);
  state.confidence = calcDataConfidence(10, true, true, true);

  const pdfBuffer = await generateReportPDF(state);
  const outputPath = path.join(__dirname, '..', 'stock-pulse-maruti-10y.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`✓ Generated ${outputPath} (${pdfBuffer.length} bytes)`);

  // Also update Bharti Airtel
  console.log('Generating updated PDF for BHARTIARTL...');
  const bhartiScreener = await fetchScreenerData('BHARTIARTL');
  const bhartiQuote = await fetchLiveQuote('BHARTIARTL');
  const bhartiNews = await fetchCompanyNews('Bharti Airtel Ltd', 'BHARTIARTL', 4);
  if (bhartiQuote && bhartiQuote.current_price) {
    bhartiScreener.ratios.current_price = bhartiQuote.current_price;
    if (bhartiQuote.week52_high) bhartiScreener.ratios.high52 = bhartiQuote.week52_high;
    if (bhartiQuote.week52_low) bhartiScreener.ratios.low52 = bhartiQuote.week52_low;
  }
  const bhartiMoat = evaluateMoat(bhartiScreener);
  const bhartiTrust = evaluateManagementTrust(bhartiScreener);
  const bGh = bhartiScreener.growth_health || {};
  const bRatios = bhartiScreener.ratios || {};
  const bRev3 = calcCAGR(bGh.revenue_current_cr, bGh.revenue_3y_ago_cr, 3);
  const bRev5 = calcCAGR(bGh.revenue_current_cr, bGh.revenue_5y_ago_cr, 5);
  const bPat3 = calcCAGR(bGh.profit_current_cr, bGh.profit_3y_ago_cr, 3);
  const bPat5 = calcCAGR(bGh.profit_current_cr, bGh.profit_5y_ago_cr, 5);
  const bVal = bucketValuation(bRatios.stock_pe, 24.0, bRatios.stock_pe * 0.95);
  const bGrowth = classifyGrowth(bRev3, bRev5, bGh.ebitda_margin_current_pct, bGh.ebitda_margin_prior_pct, bGh.net_margin_current_pct, bGh.net_margin_current_pct);
  const bDe = bucketThreshold(bGh.de_ratio, 0.5, 1.5, false);
  const bIc = bucketThreshold(bGh.interest_coverage, 5.0, 2.0, true);
  const bCr = bucketThreshold(bGh.current_ratio, 2.0, 1.0, true);
  const bFcf = bGh.fcf_trend === 'growing' ? { label: 'HEALTHY', tone: 'green' } : { label: 'WATCH', tone: 'amber' };
  const bSolv = aggregateSectionBadge([bDe, bIc, bCr, bFcf]);
  const bRoe = bucketThreshold(bRatios.roe, 15.0, 10.0, true);
  const bRoce = bucketThreshold(bRatios.roce, 15.0, 10.0, true);
  const bRet = aggregateSectionBadge([bRoe, bRoce]);
  const bRange = calc52WeekContext(bRatios.current_price, bRatios.high52, bRatios.low52);
  const bFlags = evalRedFlags(bhartiScreener);

  const bhartiState = {
    overview: {
      company_name: bhartiScreener.company_name,
      ticker: bhartiScreener.ticker,
      exchange: bhartiScreener.exchange,
      sector: bhartiScreener.sector,
      about: bhartiScreener.about,
      range_context: bRange
    },
    ratios: bRatios,
    growth_health: bGh,
    ownership: bhartiScreener.ownership,
    peers: bhartiScreener.peers,
    news: bhartiNews,
    moat: bhartiMoat,
    mgmtTrust: bhartiTrust,
    revenue_cagr_3y: bRev3,
    revenue_cagr_5y: bRev5,
    profit_cagr_3y: bPat3,
    profit_cagr_5y: bPat5,
    sector_avg_pe: 24.0,
    valuation_bucket: bVal,
    growth_class: bGrowth,
    solvency_bucket: bSolv,
    return_quality_bucket: bRet,
    de_bucket: bDe,
    ic_bucket: bIc,
    cr_bucket: bCr,
    fcf_bucket: bFcf,
    roe: bRatios.roe,
    roce: bRatios.roce,
    roe_bucket: bRoe,
    roce_bucket: bRoce,
    leverage_warning: false,
    redFlags: bFlags,
    horizon: 10
  };
  bhartiState.pulse = calcPulseScore(bhartiState);
  bhartiState.scenarios = calcScenarios(bhartiState, 10);
  bhartiState.confidence = calcDataConfidence(10, true, true, true);

  const bhartiPdfBuffer = await generateReportPDF(bhartiState);
  const bhartiOutputPath = path.join(__dirname, '..', 'stock-pulse-bhartiartl-10y.pdf');
  fs.writeFileSync(bhartiOutputPath, bhartiPdfBuffer);
  console.log(`✓ Generated ${bhartiOutputPath} (${bhartiPdfBuffer.length} bytes)`);
}

testMarutiReport().catch(console.error);
