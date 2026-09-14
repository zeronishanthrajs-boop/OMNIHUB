/**
 * Stock Pulse v5.1 — Multi-Stock Portfolio / Watchlist Radar Studio
 * Ingests a basket of 2 to 25 equities and synthesizes a high-density,
 * rank-ordered institutional matrix across Pulse Score, Valuation,
 * Forensics, and Capital Allocation.
 * 100% Deterministic — Zero AI / Zero LLM reliance.
 */

function buildWatchlistMatrix(reports) {
  const items = reports.map(r => {
    const o = r.overview || {};
    const rat = r.ratios || {};
    const gh = r.growth_health || {};
    const p = r.pulse || {};
    const vt = r.valuation_triangulation || {};
    const fo = r.forensics || {};
    const ca = r.capital_allocation || {};
    const qm = r.quarterly_momentum || {};

    const pulseScore = p.total != null ? p.total : 0;
    const pe = rat.stock_pe != null ? rat.stock_pe : 999;
    const pePercentile = vt.historical_bands?.percentileRank != null ? vt.historical_bands.percentileRank : 50;
    const dcfGrowth = vt.reverse_dcf?.impliedGrowthRate != null ? vt.reverse_dcf.impliedGrowthRate : 15;
    const mScore = fo.beneish?.score != null ? fo.beneish.score : 0;
    const zScore = fo.altman?.score != null ? fo.altman.score : 0;
    const fScore = fo.piotroski?.total != null ? fo.piotroski.total : 0;
    const roe = ca.dupont?.roe != null ? ca.dupont.roe : (rat.roe || 0);
    const roiic = ca.roiic?.roiic3y != null ? ca.roiic.roiic3y : 0;

    // Composite Fundamental Quality Rank (Higher is better)
    // Formula: (Pulse / 10)*40 + (F-Score / 9)*20 + (100 - PE_Percentile)*0.2 + (ROIIC clamp)*0.2
    const qualityScore = +(
      (pulseScore * 4) +
      ((fScore / 9) * 20) +
      ((100 - pePercentile) * 0.2) +
      (Math.min(30, Math.max(0, roiic)) * 0.67)
    ).toFixed(1);

    return {
      ticker: o.ticker || 'UNKNOWN',
      company_name: o.company_name || o.ticker,
      sector: o.sector || 'General',
      cmp: rat.current_price,
      market_cap_cr: rat.market_cap_cr,
      stock_pe: rat.stock_pe,
      div_yield: rat.div_yield,
      pulse_score: pulseScore,
      pulse_label: p.label || 'WEAK',
      dcf_implied_growth: dcfGrowth,
      pe_percentile: pePercentile,
      beneish_score: mScore,
      beneish_label: fo.beneish?.label || 'SAFE',
      altman_z_score: zScore,
      piotroski_f_score: fScore,
      dupont_roe: roe,
      dupont_driver: ca.dupont?.primaryDriver || 'Margin Pricing Power',
      roiic_3y: roiic,
      quarterly_velocity: qm.velocity || 'STEADY',
      quarterly_sales_yoy: qm.salesYoyLatest,
      quality_score: qualityScore,
      confidence_score: r.confidence?.total || 14
    };
  });

  // Sort descending by composite quality score
  items.sort((a, b) => b.quality_score - a.quality_score);

  // Assign institutional rank
  items.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return {
    count: items.length,
    timestamp: new Date().toISOString(),
    items
  };
}

module.exports = {
  buildWatchlistMatrix
};
