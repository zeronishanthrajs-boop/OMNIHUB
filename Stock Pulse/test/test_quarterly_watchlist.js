/**
 * Stock Pulse v5.1 — Automated Test Suite for Quarterly Momentum & Watchlist Radar
 */

const { calcQuarterlyMomentum } = require('../engine/quarterlyMomentum');
const { buildWatchlistMatrix } = require('../engine/watchlist');
const { evaluateInsiderActivity } = require('../scrapers/insiderTrading');

function runTests() {
  console.log("===========================================================");
  console.log("  RUNNING QUARTERLY MOMENTUM & WATCHLIST UNIT TESTS");
  console.log("===========================================================");

  // Test 1: Quarterly Momentum with Accelerating Sales & Inflection
  const mockQuarters = {
    headers: ['Jun 2025', 'Sep 2025', 'Dec 2025', 'Mar 2026', 'Jun 2026', 'Sep 2026', 'Dec 2026', 'Mar 2027'],
    sales: [1000, 1100, 1200, 1300, 1100, 1250, 1400, 1550], // YoY: 10%, 13.6%, 16.7%, 19.2%
    operating_profit: [200, 220, 240, 260, 230, 275, 322, 372],
    opm: [20.0, 20.0, 20.0, 20.0, 20.9, 22.0, 23.0, 24.0], // Expanding margin
    net_profit: [150, 165, 180, 195, 172, 206, 241, 279]
  };

  const qm = calcQuarterlyMomentum(mockQuarters);
  console.log(`✓ Quarterly Velocity: ${qm.velocity} (${qm.velocityLabel})`);
  console.log(`✓ Margin Inflection Detected: ${qm.isMarginInflecting} (+${qm.marginBpsDelta} bps)`);
  console.log(`✓ Recent Quarters Count: ${qm.recentQuarters.length}`);

  if (qm.velocity !== 'ACCELERATING') {
    throw new Error(`Expected ACCELERATING velocity, got ${qm.velocity}`);
  }
  if (!qm.isMarginInflecting) {
    throw new Error("Expected margin inflection to be true");
  }

  // Test 2: SEBI Insider Trading Evaluation
  const mockOwnership = {
    trend_8q: [50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.2, 50.6] // +0.4% in last 2 quarters
  };
  const insider = evaluateInsiderActivity(mockOwnership, 100000);
  console.log(`✓ Insider Trading Signal: ${insider.signal} (${insider.label})`);

  if (insider.signal !== 'ACCULATION' && insider.signal !== 'ACCUMULATION') {
    throw new Error(`Expected ACCUMULATION signal, got ${insider.signal}`);
  }

  // Test 3: Watchlist Matrix
  const mockReports = [
    {
      overview: { ticker: 'AAA', company_name: 'Alpha Ltd', sector: 'IT' },
      ratios: { current_price: 100, stock_pe: 15, market_cap_cr: 10000 },
      pulse: { total: 8, label: 'STRONG' },
      valuation_triangulation: { reverse_dcf: { impliedGrowthRate: 8 }, historical_bands: { percentileRank: 30 } },
      forensics: { beneish: { score: -2.3, label: 'SAFE' }, altman: { score: 7.5 }, piotroski: { total: 8 } },
      capital_allocation: { dupont: { roe: 25, primaryDriver: 'Margin Moat' }, roiic: { roiic3y: 20 } },
      quarterly_momentum: { velocity: 'ACCELERATING', salesYoyLatest: 15 }
    },
    {
      overview: { ticker: 'BBB', company_name: 'Beta Ltd', sector: 'Infra' },
      ratios: { current_price: 200, stock_pe: 30, market_cap_cr: 20000 },
      pulse: { total: 5, label: 'MODERATE' },
      valuation_triangulation: { reverse_dcf: { impliedGrowthRate: 20 }, historical_bands: { percentileRank: 75 } },
      forensics: { beneish: { score: -1.8, label: 'MODERATE' }, altman: { score: 2.2 }, piotroski: { total: 5 } },
      capital_allocation: { dupont: { roe: 12, primaryDriver: 'Financial Leverage' }, roiic: { roiic3y: 5 } },
      quarterly_momentum: { velocity: 'DECELERATING', salesYoyLatest: -2 }
    }
  ];

  const wl = buildWatchlistMatrix(mockReports);
  console.log(`✓ Watchlist Count: ${wl.count}`);
  console.log(`✓ Rank 1: ${wl.items[0].ticker} (Score: ${wl.items[0].quality_score})`);
  console.log(`✓ Rank 2: ${wl.items[1].ticker} (Score: ${wl.items[1].quality_score})`);

  if (wl.items[0].ticker !== 'AAA') {
    throw new Error(`Expected AAA to rank #1, got ${wl.items[0].ticker}`);
  }

  console.log("\n===========================================================");
  console.log("  ALL QUARTERLY & WATCHLIST UNIT TESTS PASSED! 🚀");
  console.log("===========================================================");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
