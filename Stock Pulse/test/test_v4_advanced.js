/**
 * Automated Verification Suite for Stock Pulse v4.0 Advanced Models
 * Tests:
 * 1. Beneish M-Score (8-variable earnings manipulation)
 * 2. Altman Z''-Score (credit distress predictor)
 * 3. Piotroski F-Score (9-factor accounting strength)
 * 4. Sloan Accrual Ratio
 * 5. Reverse DCF (binary search implied growth rate solver)
 * 6. 5-Stage DuPont Decomposition (algebraic identity proof)
 * 7. Cash Conversion Cycle & ROIIC
 */

const assert = require('assert');
const { calcBeneishMScore, calcAltmanZScore, calcPiotroskiFScore, calcSloanAccrual } = require('../engine/forensics');
const { solveReverseDcf, calcHistoricalValuationBands, calcEarningsPowerValue } = require('../engine/valuation');
const { calc5StageDuPont, calcROIIC, calcCashConversionCycle } = require('../engine/capitalAllocation');

console.log("=======================================================");
console.log(" RUNNING STOCK PULSE v4.0 ADVANCED MATHEMATICAL TESTS");
console.log("=======================================================\n");

// Synthetic 10-Year Healthy Corporate Financial History
const mockHistoryHealthy = {
  years: ["FY20", "FY21", "FY22", "FY23", "FY24"],
  pnl: {
    sales: [10000, 11500, 13200, 15200, 17500],
    expenses: [7500, 8600, 9800, 11200, 12800],
    operating_profit: [2500, 2900, 3400, 4000, 4700],
    opm: [25, 25.2, 25.7, 26.3, 26.8],
    other_income: [200, 250, 300, 350, 400],
    interest: [100, 90, 80, 70, 60],
    depreciation: [500, 580, 660, 750, 850],
    pbt: [2100, 2480, 2960, 3530, 4190],
    tax_pct: [25, 25, 25, 25, 25],
    net_profit: [1575, 1860, 2220, 2647, 3142],
    eps: [15.75, 18.60, 22.20, 26.47, 31.42]
  },
  balance_sheet: {
    equity_capital: [100, 100, 100, 100, 100],
    reserves: [5000, 6500, 8300, 10400, 12900],
    borrowings: [1000, 850, 700, 550, 400],
    other_liabilities: [2000, 2300, 2600, 3000, 3400],
    total_liabilities: [8100, 9750, 11700, 14050, 16800],
    fixed_assets: [4000, 4600, 5300, 6100, 7000],
    cwip: [300, 350, 400, 450, 500],
    investments: [800, 1000, 1300, 1700, 2200],
    other_assets: [3000, 3800, 4700, 5800, 7100],
    total_assets: [8100, 9750, 11700, 14050, 16800]
  },
  cash_flow: {
    cfo: [2200, 2600, 3100, 3700, 4400],
    cfi: [-1200, -1400, -1600, -1900, -2200],
    cff: [-600, -700, -800, -900, -1000],
    net_cash_flow: [400, 500, 700, 900, 1200]
  },
  ratios_series: {
    debtor_days: [42, 40, 38, 36, 35],
    inventory_days: [50, 48, 46, 44, 42],
    days_payable: [60, 62, 65, 68, 70],
    cash_conversion_cycle: [32, 26, 19, 12, 7],
    roce: [28, 29, 30, 31, 32]
  }
};

// 1. Beneish M-Score Test
console.log("--- TEST 1: Beneish M-Score (Earnings Manipulation) ---");
const mScoreRes = calcBeneishMScore(mockHistoryHealthy);
console.log(`✓ Beneish M-Score: ${mScoreRes.score} (${mScoreRes.label}) [${mScoreRes.probManipulation}]`);
assert(mScoreRes.score <= -1.78, "Healthy company must have M-score <= -1.78");
assert.strictEqual(mScoreRes.label, "SAFE");

// 2. Altman Z''-Score Test
console.log("\n--- TEST 2: Altman Z''-Score (Insolvency Predictor) ---");
const zScoreRes = calcAltmanZScore(mockHistoryHealthy, {});
console.log(`✓ Altman Z''-Score: ${zScoreRes.score} (${zScoreRes.label})`);
assert(zScoreRes.score > 2.60, "Healthy company must be in Safe Zone (> 2.60)");
assert.strictEqual(zScoreRes.label, "SAFE ZONE");

// 3. Piotroski F-Score Test
console.log("\n--- TEST 3: Piotroski F-Score (9-Factor Fundamental Strength) ---");
const fScoreRes = calcPiotroskiFScore(mockHistoryHealthy, {});
console.log(`✓ Piotroski F-Score: ${fScoreRes.total}/9 (${fScoreRes.label})`);
assert(fScoreRes.total >= 7, "Growing profitable firm must achieve F-Score >= 7");
assert.strictEqual(fScoreRes.label, "STRONG");

// 4. Sloan Accrual Ratio Test
console.log("\n--- TEST 4: Sloan Accrual Anomaly Ratio ---");
const sloanRes = calcSloanAccrual(mockHistoryHealthy);
console.log(`✓ Sloan Accrual Ratio: ${sloanRes.ratioPct}% (${sloanRes.label})`);
assert(sloanRes.ratioPct < 5.0, "Cash-rich firm must have low accruals");

// 5. Reverse DCF Test
console.log("\n--- TEST 5: Reverse DCF Numerical Solver ---");
const revDcfRes = solveReverseDcf(50000, 2200, 11.5, 4.5, 10);
console.log(`✓ Reverse DCF Implied Growth Rate: ${revDcfRes.impliedGrowthRate}% (${revDcfRes.label})`);
assert(typeof revDcfRes.impliedGrowthRate === 'number');
assert(revDcfRes.impliedGrowthRate > -20 && revDcfRes.impliedGrowthRate < 50);

// 6. 5-Stage DuPont Decomposition Test
console.log("\n--- TEST 6: 5-Stage DuPont Algebraic Decomposition ---");
const dupontRes = calc5StageDuPont(mockHistoryHealthy);
console.log(`✓ DuPont Reconstituted ROE: ${dupontRes.roe}%`);
console.log(`  Tax Burden: ${dupontRes.taxBurden} | Interest Burden: ${dupontRes.interestBurden} | Margin: ${dupontRes.operatingMarginPct}% | Asset Turnover: ${dupontRes.assetTurnover}x | Leverage: ${dupontRes.leverage}x`);
const productCheck = +(dupontRes.taxBurden * dupontRes.interestBurden * (dupontRes.operatingMarginPct / 100) * dupontRes.assetTurnover * dupontRes.leverage * 100).toFixed(1);
assert(Math.abs(productCheck - dupontRes.roe) <= 0.2, "DuPont 5 components must algebraically multiply to ROE");

// 7. Cash Conversion Cycle & ROIIC Test
console.log("\n--- TEST 7: Cash Conversion Cycle & ROIIC ---");
const cccRes = calcCashConversionCycle(mockHistoryHealthy);
console.log(`✓ Cash Conversion Cycle: ${cccRes.cccDays} days (Trend: ${cccRes.trend})`);
assert.strictEqual(cccRes.trend, "CONTRACTING");

const roiicRes = calcROIIC(mockHistoryHealthy);
console.log(`✓ 3Y Incremental ROIC (ROIIC): ${roiicRes.roiic3y}% (${roiicRes.label})`);
assert(roiicRes.roiic3y > 10.0, "Profitable firm must have strong ROIIC");

console.log("\n=======================================================");
console.log("  ALL STOCK PULSE v4.0 ADVANCED TESTS PASSED! 🚀");
console.log("=======================================================");
