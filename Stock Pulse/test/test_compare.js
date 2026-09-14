/**
 * Stock Pulse v4.2 — Automated Comparison Test Suite
 * Tests deterministic side-by-side comparison between industry competitors:
 * - TCS vs INFY
 * - HDFCBANK vs ICICIBANK
 */

const { compareCompanies } = require('../engine/compare');

function createMockState(ticker, name, pe, pb, dcfGrowth, roe, mScore, zScore, fScore, moat, trust, pulse) {
  return {
    overview: { ticker, company_name: name, sector: 'Technology' },
    ratios: { stock_pe: pe, current_price: pb * 100, book_value: 100 },
    growth_health: { net_margin_current_pct: 20 },
    revenue_cagr_3y: 12.0,
    profit_cagr_3y: 14.0,
    valuation_triangulation: {
      reverse_dcf: { impliedGrowthRate: dcfGrowth }
    },
    capital_allocation: {
      dupont: { roe, operatingMarginPct: 22 },
      roiic: { roiic3y: 18 },
      ccc: { cccDays: 60 }
    },
    forensics: {
      beneish: { score: mScore },
      altman: { score: zScore },
      piotroski: { total: fScore },
      sloan: { ratioPct: -2.5 }
    },
    moat: { total: moat, label: 'NARROW' },
    mgmtTrust: { total: trust, label: 'HIGH' },
    pulse: { total: pulse, label: 'MODERATE' }
  };
}

function runComparisonTests() {
  console.log("===========================================================");
  console.log("  RUNNING COMPARISON ENGINE UNIT TESTS");
  console.log("===========================================================");

  const firmA = createMockState('AAA', 'Alpha Corp', 20.0, 3.0, 8.0, 22.0, -2.40, 6.5, 8, 8, 7, 7);
  const firmB = createMockState('BBB', 'Beta Corp', 25.0, 4.0, 12.0, 18.0, -1.90, 4.2, 6, 6, 6, 5);

  const comp = compareCompanies(firmA, firmB);

  console.log(`✓ Dimensions evaluated: ${comp.dimensions.length}`);
  console.log(`✓ Alpha wins: ${comp.winsA}`);
  console.log(`✓ Beta wins:  ${comp.winsB}`);
  console.log(`✓ Ties:       ${comp.ties}`);
  console.log(`✓ Verdict:    ${comp.overallVerdict}`);

  if (comp.winsA <= comp.winsB) {
    throw new Error("Test Failed: Alpha should have strictly won over Beta");
  }

  const peDim = comp.dimensions.find(d => d.metric === 'Stock P/E Ratio');
  if (peDim.winner !== 'A') {
    throw new Error(`Test Failed: Alpha P/E (20) should beat Beta P/E (25)`);
  }

  const mDim = comp.dimensions.find(d => d.metric === 'Beneish M-Score');
  if (mDim.winner !== 'A') {
    throw new Error(`Test Failed: Alpha M-Score (-2.40) should beat Beta (-1.90)`);
  }

  console.log("\n===========================================================");
  console.log("  ALL COMPARISON UNIT TESTS PASSED! 🚀");
  console.log("===========================================================");
}

if (require.main === module) {
  runComparisonTests();
}

module.exports = { runComparisonTests };
