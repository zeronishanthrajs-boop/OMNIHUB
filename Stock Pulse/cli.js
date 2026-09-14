#!/usr/bin/env node
/**
 * Stock Pulse v4.2 — Institutional Analyst Command-Line Tool
 * Usage:
 *   node cli.js <TICKER> [--horizon <N>]
 *   node cli.js <TICKER1> --compare <TICKER2> [--horizon <N>]
 * Examples:
 *   node cli.js HDFCBANK
 *   node cli.js TCS --compare INFY
 *   node cli.js LT --horizon 10
 */

const fs = require('fs');
const path = require('path');
const { fetchScreenerData } = require('./scrapers/screener');
const { fetchLiveQuote } = require('./scrapers/quote');
const { fetchCompanyNews } = require('./scrapers/news');
const { evaluateMoat } = require('./engine/moatHeuristics');
const { evaluateManagementTrust } = require('./engine/trustHeuristics');
const {
  calcCAGR,
  bucketValuation,
  classifyGrowth,
  calcPulseScore,
  calcScenarios,
  calcDataConfidence
} = require('./engine/math');
const { calcBeneishMScore, calcAltmanZScore, calcPiotroskiFScore, calcSloanAccrual } = require('./engine/forensics');
const { solveReverseDcf, calcHistoricalValuationBands, calcEarningsPowerValue } = require('./engine/valuation');
const { calc5StageDuPont, calcROIIC, calcCashConversionCycle } = require('./engine/capitalAllocation');
const { isBfsiEntity, deriveBfsiMetrics } = require('./engine/bfsiAdapter');
const { compareCompanies } = require('./engine/compare');
const { generateReportPDF } = require('./pdf/generateReport');
const { generateExecutiveReportHTML } = require('./html/generateExecutiveReport');

async function buildCliReport(ticker, horizon = 5) {
  const cleanSym = ticker.toUpperCase().trim();
  const [screenerData, newsData] = await Promise.all([
    fetchScreenerData(cleanSym),
    fetchCompanyNews(cleanSym, cleanSym, 3).catch(() => [])
  ]);

  const ratios = screenerData.ratios || {};
  const gh = screenerData.growth_health || {};
  const history = screenerData.financials_history || {};

  const state = {
    overview: {
      ticker: cleanSym,
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
    news: newsData,
    revenue_cagr_3y: screenerData.revenue_cagr_3y,
    revenue_cagr_5y: screenerData.revenue_cagr_5y,
    profit_cagr_3y: screenerData.profit_cagr_3y,
    profit_cagr_5y: screenerData.profit_cagr_5y,
    sector_avg_pe: 24.0,
    valuation_bucket: bucketValuation(ratios.stock_pe, 24.0),
    growth_class: classifyGrowth(screenerData.revenue_cagr_3y, screenerData.profit_cagr_3y, gh.ebitda_margin_current_pct, gh.ebitda_margin_prior_pct),
    solvency_bucket: { label: 'HEALTHY', tone: 'green' },
    horizon
  };

  state.moat = evaluateMoat(state);
  state.mgmtTrust = evaluateManagementTrust(state);

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
    reverse_dcf: solveReverseDcf(enterpriseValueCr, ttmFcfCr, 11.5, 4.5, horizon),
    historical_bands: calcHistoricalValuationBands(history, ratios.stock_pe, ratios.book_value ? ratios.current_price / ratios.book_value : 3.0),
    epv: calcEarningsPowerValue(gh.profit_current_cr * 1.3, 25, 11.5, gh.cash_position_cr, netDebtCr, sharesOutstandingCr)
  };

  state.pulse = calcPulseScore(state);
  state.scenarios = calcScenarios(state, horizon);
  state.confidence = calcDataConfidence(10, true, true, true);

  return state;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log("Usage: node cli.js <TICKER> [--compare <TICKER2>] [--horizon <5|10>]");
    process.exit(0);
  }

  let ticker1 = null;
  let ticker2 = null;
  let horizon = 5;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--compare' && args[i + 1]) {
      ticker2 = args[i + 1];
      i++;
    } else if (args[i] === '--horizon' && args[i + 1]) {
      horizon = parseInt(args[i + 1], 10) || 5;
      i++;
    } else if (!ticker1) {
      ticker1 = args[i];
    }
  }

  console.log("\n===========================================================");
  console.log(`  STOCK PULSE v4.2 CLI — INSTITUTIONAL EQUITY RESEARCH`);
  console.log("===========================================================");

  if (ticker2) {
    console.log(`Comparing ${ticker1.toUpperCase()} vs ${ticker2.toUpperCase()} (${horizon}Y Horizon)...`);
    const [stateA, stateB] = await Promise.all([
      buildCliReport(ticker1, horizon),
      buildCliReport(ticker2, horizon)
    ]);

    const comp = compareCompanies(stateA, stateB);

    console.log(`\nHEAD-TO-HEAD INSTITUTIONAL COMPARISON MATRIX:`);
    console.log(`-----------------------------------------------------------`);
    console.log(`${'METRIC'.padEnd(28)} | ${comp.companyA.ticker.padEnd(12)} | ${comp.companyB.ticker.padEnd(12)} | ADVANTAGE`);
    console.log(`-----------------------------------------------------------`);

    comp.dimensions.forEach(d => {
      const adv = d.winner === 'A' ? comp.companyA.ticker : (d.winner === 'B' ? comp.companyB.ticker : 'TIE');
      console.log(`${d.metric.padEnd(28)} | ${String(d.valA).padEnd(12)} | ${String(d.valB).padEnd(12)} | ${adv}`);
    });

    console.log(`-----------------------------------------------------------`);
    console.log(`\nSCORE SUMMARY:`);
    console.log(`  ${comp.companyA.name}: ${comp.winsA} wins`);
    console.log(`  ${comp.companyB.name}: ${comp.winsB} wins`);
    console.log(`  Ties: ${comp.ties}`);
    console.log(`\nVERDICT:\n  ${comp.overallVerdict}\n`);
    return;
  }

  // Single Stock Analysis
  console.log(`Analyzing ${ticker1.toUpperCase()} (${horizon}Y Horizon)...`);
  const state = await buildCliReport(ticker1, horizon);
  const r = state.ratios;
  const gh = state.growth_health;
  const fo = state.forensics;
  const ca = state.capital_allocation;
  const vt = state.valuation_triangulation;

  console.log(`\nCOMPANY: ${state.overview.company_name} (${state.overview.ticker})`);
  console.log(`SECTOR:  ${state.overview.sector}`);
  console.log(`\n1. MARKET & VALUATION:`);
  console.log(`   CMP: Rs. ${r.current_price} | 52W: Rs. ${r.low52} - Rs. ${r.high52} | M-Cap: Rs. ${r.market_cap_cr.toLocaleString('en-IN')} Cr`);
  console.log(`   P/E: ${r.stock_pe} | P/B: ${(r.current_price / r.book_value).toFixed(2)} | Div Yield: ${r.div_yield}% | Sector P/E: ${state.sector_avg_pe}`);
  console.log(`   Reverse DCF Implied FCF Growth: ${vt.reverse_dcf.impliedGrowthRate}% (${vt.reverse_dcf.label}, WACC: 11.5%)`);
  console.log(`   Earnings Power Value (EPV): Rs. ${vt.epv.epvPerShare} per share`);

  console.log(`\n2. 5-STAGE DUPONT & CAPITAL ALLOCATION:`);
  console.log(`   Reconstituted ROE: ${ca.dupont.roe}% (Primary Driver: ${ca.dupont.primaryDriver})`);
  console.log(`   Tax: ${ca.dupont.taxBurden} | Interest: ${ca.dupont.interestBurden} | Margin: ${ca.dupont.operatingMarginPct}% | Turnover: ${ca.dupont.assetTurnover}x | Leverage: ${ca.dupont.leverage}x`);
  console.log(`   3Y ROIIC: ${ca.roiic.roiic3y}% | CCC: ${ca.ccc.cccDays} Days (${ca.ccc.trend})`);

  console.log(`\n3. FORENSIC ACCOUNTING AUDIT:`);
  console.log(`   Beneish M-Score: ${fo.beneish.score} (${fo.beneish.label} Manipulation Risk)`);
  console.log(`   Altman Z''-Score: ${fo.altman.score} (${fo.altman.label})`);
  console.log(`   Piotroski F-Score: ${fo.piotroski.total}/9 (${fo.piotroski.label} Fundamental Quality)`);
  console.log(`   Sloan Accrual Ratio: ${fo.sloan.ratioPct}% (${fo.sloan.label})`);

  console.log(`\n4. THE PULSE SCORE & MOAT:`);
  console.log(`   The Pulse Score: ${state.pulse.total}/10 (${state.pulse.label} PULSE)`);
  console.log(`   Competitive Moat: ${state.moat.total}/14 (${state.moat.label})`);
  console.log(`   Management Trust: ${state.mgmtTrust.total}/8 (${state.mgmtTrust.label})`);

  // Export PDF & HTML
  const pdfBuffer = await generateReportPDF(state);
  const pdfPath = path.join(__dirname, `stock-pulse-${state.overview.ticker.toLowerCase()}-${horizon}y.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);

  const htmlContent = generateExecutiveReportHTML(state);
  const htmlPath = path.join(__dirname, `stock-pulse-${state.overview.ticker.toLowerCase()}-${horizon}y.html`);
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  console.log(`\n✓ Generated 4-Page Institutional PDF: ${pdfPath}`);
  console.log(`✓ Generated Executive HTML Dossier:    ${htmlPath}\n`);
}

if (require.main === module) {
  main().catch(err => {
    console.error("\nError:", err.message);
    process.exit(1);
  });
}

module.exports = { buildCliReport };
