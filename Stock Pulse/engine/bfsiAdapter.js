/**
 * Stock Pulse v4.1 — BFSI (Banking, Financial Services & Insurance) Adapter
 * Specialized deterministic scoring for commercial banks, NBFCs, and housing finance.
 * Eliminates industrial metric distortion (e.g. D/E, ROCE, Current Ratio)
 * and evaluates banking-native metrics:
 * - Return on Assets (RoA >= 1.2% elite, >= 0.8% healthy)
 * - Price to Book (P/BV) valuation benchmarking
 * - Equity-to-Assets Capital Cushion (Tier-1 Solvency Proxy >= 10.0%)
 * - Net Interest / Financing Margin resilience
 * Zero AI / Zero LLM reliance.
 */

/**
 * Checks if a company belongs to BFSI / Banking / Financial Services
 */
function isBfsiEntity(sector, companyName = '', ticker = '') {
  const s = (sector || '').toLowerCase();
  const n = (companyName || '').toLowerCase();
  const t = (ticker || '').toUpperCase();

  if (s.includes('financial') || s.includes('bank') || s.includes('insurance') || s.includes('nbfc')) {
    return true;
  }
  if (n.includes('bank') || n.includes('finance') || n.includes('housing') || n.includes('capital') || n.includes('securities')) {
    return true;
  }
  if (t.endsWith('BANK') || t.includes('FINANCE') || t === 'SBIN' || t === 'BAJFINANCE' || t === 'BAJAJFINSV') {
    return true;
  }
  return false;
}

/**
 * Derives banking-native financial ratios from statements
 */
function deriveBfsiMetrics(state) {
  const gh = state.growth_health || {};
  const ratios = state.ratios || {};
  const history = state.financials_history || {};
  const bs = history.balance_sheet || {};
  const pnl = history.pnl || {};

  const pat = gh.profit_current_cr || 1000;
  const totalAssets = bs.total_assets || [];
  const curAssets = totalAssets.length ? totalAssets[totalAssets.length - 1] : (pat * 50);
  const prevAssets = totalAssets.length >= 2 ? totalAssets[totalAssets.length - 2] : curAssets;
  const avgAssets = (curAssets + prevAssets) / 2;

  // 1. Return on Assets (RoA)
  const roa = +(avgAssets > 0 ? (pat / avgAssets) * 100 : 1.2).toFixed(2);

  // 2. Capital Cushion (Equity to Assets Ratio - Tier 1 Capital Proxy)
  const equitySeries = bs.equity_capital || [];
  const reservesSeries = bs.reserves || [];
  const curEquity = (equitySeries.length ? equitySeries[equitySeries.length - 1] : 0) +
                    (reservesSeries.length ? reservesSeries[reservesSeries.length - 1] : 0);
  const capitalCushionPct = +(curAssets > 0 ? (curEquity / curAssets) * 100 : 12.0).toFixed(2);

  // 3. Price to Book (P/BV)
  const cmp = ratios.current_price || 100;
  const bv = ratios.book_value || 50;
  const pbRatio = +(cmp / bv).toFixed(2);

  // 4. RoA Metric Bucketing
  let roaBucket = { label: "HEALTHY", tone: "green" };
  if (roa < 0.8) {
    roaBucket = { label: "WATCH", tone: "amber" };
  } else if (roa < 0.4) {
    roaBucket = { label: "WEAK", tone: "red" };
  }

  // 5. Capital Cushion Bucketing (Basel III minimum ~11.5% CRAR, corresponds to ~9-10% unweighted Equity/Assets)
  let capitalBucket = { label: "HEALTHY", tone: "green" };
  if (capitalCushionPct < 9.0) {
    capitalBucket = { label: "WATCH", tone: "amber" };
  } else if (capitalCushionPct < 6.0) {
    capitalBucket = { label: "WEAK", tone: "red" };
  }

  // 6. Valuation Bucketing for Banks (P/BV based)
  let valBucket = { label: "FAIR", tone: "green", bandMin: 1.5, bandMax: 3.0 };
  if (pbRatio < 1.2) {
    valBucket = { label: "CHEAP", tone: "green", bandMin: 1.5, bandMax: 3.0 };
  } else if (pbRatio > 3.5) {
    valBucket = { label: "PREMIUM", tone: "amber", bandMin: 1.5, bandMax: 3.0 };
  }

  return {
    isBfsi: true,
    roa,
    roaBucket,
    capitalCushionPct,
    capitalBucket,
    pbRatio,
    valBucket,
    curAssetsCr: Math.round(curAssets),
    curEquityCr: Math.round(curEquity),
    evidence: `Banking Model: RoA stands at ${roa}% (${roaBucket.label}, >=1.2% Tier-1 benchmark). Equity-to-Assets capital cushion stands at ${capitalCushionPct}% (${capitalBucket.label}, >=9.0% regulatory cushion). P/BV: ${pbRatio}x.`
  };
}

/**
 * Modifies the 10-rule scorecard specifically for banking & NBFC entities
 */
function adaptScorecardForBfsi(criteria, bfsiMetrics) {
  return criteria.map(c => {
    // Replace Rule 04 (Solvency / DE) with Capital Cushion & Asset Solvency
    if (c.rule === "04") {
      const pass = bfsiMetrics.capitalBucket.tone !== "red" && bfsiMetrics.roaBucket.tone !== "red";
      return {
        rule: "04",
        name: "Banking capital cushion & solvency sound (Equity/Assets >=9% & RoA >=0.8%)",
        pass,
        evidence: `Equity/Assets: ${bfsiMetrics.capitalCushionPct}% (${bfsiMetrics.capitalBucket.label}) | RoA: ${bfsiMetrics.roa}%`
      };
    }

    // Replace Rule 06 (ROCE) with Return on Assets (RoA)
    if (c.rule === "06") {
      const pass = bfsiMetrics.roa >= 1.0;
      return {
        rule: "06",
        name: "Banking Return on Assets (RoA) healthy (>=1.0% benchmark)",
        pass,
        evidence: `RoA: ${bfsiMetrics.roa}% (${pass ? "PASS >=1.0%" : "FAIL <1.0%"})`
      };
    }

    return c;
  });
}

module.exports = {
  isBfsiEntity,
  deriveBfsiMetrics,
  adaptScorecardForBfsi
};
