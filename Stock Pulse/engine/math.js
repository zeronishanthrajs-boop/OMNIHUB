/**
 * Stock Pulse v3.0 — Core Deterministic Math Engine
 * 100% pure JavaScript mathematical formulas matching institutional specifications.
 */

function calcCAGR(current, historical, years) {
  if (current == null || historical == null || historical <= 0 || current <= 0 || !years) return null;
  return (Math.pow(current / historical, 1 / years) - 1) * 100;
}

const SECTOR_BENCHMARKS = {
  "telecommunication": 28.0,
  "telecom": 28.0,
  "automobile": 26.0,
  "auto": 26.0,
  "information technology": 26.0,
  "it": 26.0,
  "software": 28.0,
  "financial services": 18.0,
  "bank": 18.0,
  "consumer goods": 42.0,
  "fmcg": 42.0,
  "consumer discretionary": 30.0,
  "consumer services": 50.0,
  "retail": 50.0,
  "healthcare": 32.0,
  "pharma": 32.0,
  "oil": 14.0,
  "energy": 16.0,
  "power": 16.0,
  "metals": 12.0,
  "mining": 12.0,
  "steel": 12.0,
  "capital goods": 42.0,
  "engineering": 38.0,
  "chemicals": 28.0,
  "cement": 30.0,
  "commodities": 17.0
};

function getSectorBenchmarkPe(sector = '') {
  const secLower = (sector || '').toLowerCase();
  for (const [k, v] of Object.entries(SECTOR_BENCHMARKS)) {
    if (secLower.includes(k)) return v;
  }
  return 24.0;
}

function bucketValuation(current, sectorAvg, ownAvg, sectorName = '') {
  const fallback = getSectorBenchmarkPe(sectorName);
  const benchmark = (sectorAvg && sectorAvg > 0) ? sectorAvg : (ownAvg && ownAvg > 0 ? ownAvg : fallback);
  const bandMin = +(benchmark * 0.85).toFixed(1);
  const bandMax = +(benchmark * 1.15).toFixed(1);

  if (current == null) {
    return { label: "UNKNOWN", tone: "neutral", benchmark, bandMin, bandMax };
  }

  if (current < bandMin) {
    return { label: "CHEAP", tone: "green", benchmark, bandMin, bandMax };
  }
  if (current > bandMax) {
    const tone = current > (benchmark * 1.35) ? "red" : "amber";
    return { label: "PREMIUM", tone, benchmark, bandMin, bandMax };
  }
  return { label: "FAIR", tone: "green", benchmark, bandMin, bandMax };
}

function bucketThreshold(value, greenThreshold, amberThreshold, higherIsBetter = true) {
  if (value == null) return { label: "UNKNOWN", tone: "neutral" };
  if (higherIsBetter) {
    if (value >= greenThreshold) return { label: "HEALTHY", tone: "green" };
    if (value >= amberThreshold) return { label: "WATCH", tone: "amber" };
    return { label: "WEAK", tone: "red" };
  } else {
    if (value <= greenThreshold) return { label: "HEALTHY", tone: "green" };
    if (value <= amberThreshold) return { label: "WATCH", tone: "amber" };
    return { label: "WEAK", tone: "red" };
  }
}

function aggregateSectionBadge(subBadges = []) {
  const valid = subBadges.filter(b => b && b.tone && b.tone !== "neutral");
  if (!valid.length) return { label: "UNKNOWN", tone: "neutral" };

  const redCount = valid.filter(b => b.tone === "red").length;
  const amberCount = valid.filter(b => b.tone === "amber").length;

  if (redCount >= 2) return { label: "WEAK", tone: "red" };
  if (redCount === 1 || amberCount >= 1) return { label: "WATCH", tone: "amber" };
  return { label: "HEALTHY", tone: "green" };
}

function classifyGrowth(cagr3y, cagr5y, ebitdaCur, ebitdaPrior, netCur, netPrior, patCagr3y, patCagr5y) {
  if (cagr3y == null && cagr5y == null) {
    return { label: "UNKNOWN", tone: "neutral", marginFlag: false, revTrend: "UNKNOWN", patTrend: "UNKNOWN" };
  }
  const c3 = cagr3y != null ? cagr3y : cagr5y;
  const c5 = cagr5y != null ? cagr5y : cagr3y;

  let revTrend = "STEADY";
  if (c3 < 0) revTrend = "DECLINING";
  else if (c3 > c5 + 2) revTrend = "ACCELERATING";
  else if (c3 < c5 - 2) revTrend = "SLOWING";

  let patTrend = "STEADY";
  if (patCagr3y != null && patCagr5y != null) {
    if (patCagr3y > patCagr5y + 2) patTrend = "ACCELERATING";
    else if (patCagr3y < patCagr5y - 2) patTrend = "SLOWING";
  }

  let label = revTrend;
  let tone = revTrend === "ACCELERATING" ? "green" : (revTrend === "SLOWING" ? "amber" : (revTrend === "DECLINING" ? "red" : "green"));

  if (revTrend === "SLOWING" && patTrend === "ACCELERATING") {
    label = "REV NORMALIZING / PROFIT EXPANDING";
    tone = "green";
  }

  let marginFlag = false;
  if (ebitdaCur != null && ebitdaPrior != null && (ebitdaPrior - ebitdaCur) > 2.0) {
    marginFlag = true;
  }
  if (netCur != null && netPrior != null && (netPrior - netCur) > 2.0) {
    marginFlag = true;
  }

  return { label, tone, marginFlag, revTrend, patTrend };
}

function calc52WeekContext(cmp, high52, low52) {
  if (cmp == null || high52 == null || low52 == null || high52 <= low52) {
    return { narrative: "52-week trading band context not available." };
  }
  const range = high52 - low52;
  const percentile = Math.max(0, Math.min(100, ((cmp - low52) / range) * 100));
  const pctAboveLow = ((cmp - low52) / low52) * 100;
  const pctBelowHigh = ((high52 - cmp) / high52) * 100;

  let positionDesc = "mid-range";
  if (percentile <= 25) positionDesc = "lower quartile (near 52W low)";
  else if (percentile >= 75) positionDesc = "upper quartile (near 52W high)";

  const narrative = `CMP (Rs. ${cmp.toLocaleString('en-IN')}) is +${pctAboveLow.toFixed(1)}% above 52W Low (Rs. ${low52.toLocaleString('en-IN')}) and -${pctBelowHigh.toFixed(1)}% below 52W High (Rs. ${high52.toLocaleString('en-IN')}) — trading in ${positionDesc} (${percentile.toFixed(0)}th percentile of 1-year band).`;

  return {
    percentile,
    pctAboveLow,
    pctBelowHigh,
    narrative
  };
}

function evalRedFlags(scrapedData) {
  const flags = [];
  const own = scrapedData.ownership || {};
  const gh = scrapedData.growth_health || {};

  const pledge = own.pledging_pct;
  if (pledge != null && pledge > 10) {
    flags.push(`Promoter pledging is ${pledge.toFixed(1)}% (exceeds 10% caution threshold).`);
  }

  if (gh.profit_falling_quarters != null && gh.profit_falling_quarters >= 2) {
    flags.push(`Net profit has declined for ${gh.profit_falling_quarters} consecutive quarters.`);
  }

  const de = gh.de_ratio;
  if (de != null && de > 2.0) {
    flags.push(`Debt-to-equity is high (${de.toFixed(2)}).`);
  }

  if (gh.fcf_trend === "negative") {
    flags.push("Free cash flow is negative or under sustained contraction.");
  }

  if (own.fii_pct != null && own.fii_pct < 2.0) {
    flags.push(`Low institutional foreign portfolio holding (${own.fii_pct.toFixed(1)}%).`);
  }

  const prom = own.promoter_pct;
  if (prom != null && prom < 25 && own.trend_8q === "falling") {
    flags.push(`Promoter stake is low (${prom.toFixed(1)}%) and continuing to decline.`);
  }

  return flags;
}

function calcPulseScore(state) {
  const criteria = [];
  const val = state.valuation_bucket;

  criteria.push({
    rule: "01",
    name: "Valuation within fair/attractive range",
    pass: Boolean(val && (val.label === "CHEAP" || val.label === "FAIR")),
    evidence: val ? `P/E ${state.ratios?.stock_pe || 'N/A'} vs Sector ${val.benchmark || 24}` : "N/A"
  });

  const revStrong = (state.revenue_cagr_3y != null && state.revenue_cagr_3y >= 10) ||
                    (state.growth_class && (state.growth_class.label === "ACCELERATING" || state.growth_class.label === "STEADY"));
  criteria.push({
    rule: "02",
    name: "Revenue 3Y growth trajectory robust (>=10% 3Y CAGR or steady)",
    pass: Boolean(revStrong),
    evidence: `3Y Rev CAGR: ${state.revenue_cagr_3y != null ? state.revenue_cagr_3y.toFixed(1) + '%' : 'N/A'}${state.revenue_cagr_5y != null ? ' (5Y: ' + state.revenue_cagr_5y.toFixed(1) + '%)' : ''}`
  });

  const hasConsecutiveDrops = state.growth_health && state.growth_health.profit_falling_quarters >= 2;
  const patPass3y = state.profit_cagr_3y != null && state.profit_cagr_3y > 8;
  const patPass5y = state.profit_cagr_5y != null && state.profit_cagr_5y > 8;
  const patStrong = !hasConsecutiveDrops && (patPass3y || patPass5y);
  let patEvidence = '';
  if (hasConsecutiveDrops) {
    patEvidence = `${state.growth_health.profit_falling_quarters} consecutive quarter profit drop`;
  } else if (patPass3y) {
    patEvidence = `3Y PAT CAGR: ${state.profit_cagr_3y.toFixed(1)}% (>8% cutoff)`;
  } else if (patPass5y) {
    patEvidence = `5Y PAT CAGR: ${state.profit_cagr_5y.toFixed(1)}% (3Y: ${state.profit_cagr_3y != null ? state.profit_cagr_3y.toFixed(1) + '%' : 'N/A'})`;
  } else {
    patEvidence = `3Y PAT CAGR: ${state.profit_cagr_3y != null ? state.profit_cagr_3y.toFixed(1) + '%' : 'N/A'} (<8% cutoff)`;
  }

  criteria.push({
    rule: "03",
    name: "Operating profit expansion solid (>8% CAGR & no consecutive drops)",
    pass: Boolean(patStrong),
    evidence: patEvidence
  });

  const healthTones = [state.de_bucket, state.ic_bucket, state.cr_bucket, state.fcf_bucket]
    .filter(b => b && b.tone !== "neutral")
    .map(b => b.tone);
  const healthHealthy = healthTones.length > 0 && !healthTones.includes("red") && !healthTones.includes("amber");
  criteria.push({
    rule: "04",
    name: "Solvency & liquidity balance sheet sound (zero watch/weak metrics)",
    pass: Boolean(healthHealthy),
    evidence: healthHealthy ? "All solvency ratios within safe bounds" : (state.de_bucket?.tone !== 'green' ? `D/E ${state.growth_health?.de_ratio} flagged ${state.de_bucket?.label}` : (state.cr_bucket?.tone !== 'green' ? `Current Ratio ${state.growth_health?.current_ratio} flagged ${state.cr_bucket?.label}` : "Solvency metric flagged watch/weak"))
  });

  criteria.push({
    rule: "05",
    name: "Return on Equity (ROE) exceeds 15%",
    pass: Boolean(state.roe != null && state.roe >= 15),
    evidence: `ROE: ${state.roe != null ? state.roe.toFixed(1) + '%' : 'N/A'}`
  });

  criteria.push({
    rule: "06",
    name: "Return on Capital Employed (ROCE) exceeds 15%",
    pass: Boolean(state.roce != null && state.roce >= 15.0),
    evidence: `ROCE: ${state.roce != null ? state.roce.toFixed(1) + '%' : 'N/A'}`
  });

  const promPct = state.ownership && state.ownership.promoter_pct;
  const ownTrend = state.ownership && state.ownership.trend_8q;
  const instPct = ((state.ownership?.fii_pct || 0) + (state.ownership?.dii_pct || 0));
  const isWidelyHeld = promPct === 0.0 || ownTrend === 'widely_held';

  let promPass = false;
  let promEvidence = '';
  if (isWidelyHeld) {
    promPass = instPct >= 40.0;
    promEvidence = `0% Promoter (Widely Held / Inst Backed: ${instPct.toFixed(1)}%)`;
  } else {
    promPass = (promPct != null && promPct >= 30.0) && (ownTrend === "rising" || ownTrend === "stable");
    promEvidence = `Promoter Stake: ${promPct != null ? promPct + '%' : 'N/A'} (${ownTrend || 'stable'})`;
  }

  criteria.push({
    rule: "07",
    name: "Promoter shareholding stable/accumulating (or institutional backing >=40%)",
    pass: Boolean(promPass),
    evidence: promEvidence
  });

  const hasPledgingFlag = state.redFlags && state.redFlags.some(f => f.toLowerCase().includes("pledg"));
  criteria.push({
    rule: "08",
    name: "Promoter shares unencumbered (pledge <=10%)",
    pass: !hasPledgingFlag,
    evidence: `Pledging: ${state.ownership?.pledging_pct || 0}%`
  });

  criteria.push({
    rule: "09",
    name: "Defensible competitive moat (score >=5/14)",
    pass: Boolean(state.moat && (state.moat.label === "NARROW" || state.moat.label === "WIDE")),
    evidence: `Moat: ${state.moat?.total || 0}/14 (${state.moat?.label || 'NONE'})`
  });

  criteria.push({
    rule: "10",
    name: "Management trust & capital allocation score >=4/8",
    pass: Boolean(state.mgmtTrust && (state.mgmtTrust.label === "HIGH" || state.mgmtTrust.label === "MODERATE")),
    evidence: `Trust: ${state.mgmtTrust?.total || 0}/8 (${state.mgmtTrust?.label || 'LOW'})`
  });

  const { isBfsiEntity, deriveBfsiMetrics, adaptScorecardForBfsi } = require('./bfsiAdapter');
  let finalCriteria = criteria;
  const isBfsi = isBfsiEntity(state.overview?.sector, state.overview?.company_name, state.overview?.ticker);
  if (isBfsi) {
    const bfsiMetrics = deriveBfsiMetrics(state);
    finalCriteria = adaptScorecardForBfsi(criteria, bfsiMetrics);
    state.bfsi_metrics = bfsiMetrics;
  }

  const total = finalCriteria.filter(c => c.pass).length;
  let label, tone;
  if (total >= 8) { label = "STRONG"; tone = "green"; }
  else if (total >= 5) { label = "MODERATE"; tone = "amber"; }
  else { label = "WEAK"; tone = "red"; }

  return { criteria: finalCriteria, total, label, tone, isBfsi };
}

function calcScenarios(state, horizonYears) {
  const gh = state.growth_health || {};
  const ratios = state.ratios || {};
  const rev = gh.revenue_current_cr;
  const pat = gh.profit_current_cr;
  const eps = gh.eps_current;
  const divYield = ratios.div_yield || 0;

  const cagr3 = state.revenue_cagr_3y;
  const cagr5 = state.revenue_cagr_5y;

  if (rev == null || (cagr3 == null && cagr5 == null)) return null;

  // Exact base CAGR
  let baseCagr = cagr5 != null ? cagr5 : cagr3;
  if (cagr3 != null && cagr5 != null) {
    baseCagr = (cagr3 + cagr5) / 2;
  }
  baseCagr = +baseCagr.toFixed(1);

  // Exact arithmetic deltas from Base CAGR
  const bearCagr = +Math.max(0, baseCagr - 5.0).toFixed(1);
  const bullCagr = +(baseCagr + 3.5).toFixed(1);

  const currentMargin = (pat != null && rev > 0) ? (pat / rev) * 100 : (gh.net_margin_current_pct || 10);
  const bearMargin = +Math.max(2, currentMargin - 2.0).toFixed(1);
  const baseMargin = +currentMargin.toFixed(1);
  const bullMargin = +(currentMargin + 1.5).toFixed(1);

  function project(cagrPct, marginPct) {
    const gRev = cagrPct / 100;
    const futureRev = rev * Math.pow(1 + gRev, horizonYears);
    const futurePat = futureRev * (marginPct / 100);

    let impliedPatCagr = 0;
    if (pat != null && pat > 0 && futurePat > 0) {
      impliedPatCagr = +( (Math.pow(futurePat / pat, 1 / horizonYears) - 1) * 100 ).toFixed(2);
    }

    let futureEps = null;
    if (eps != null && pat != null && pat > 0) {
      const impliedShares = (pat * 10000000) / eps;
      futureEps = (futurePat * 10000000) / impliedShares;
    }
    return {
      cagr: cagrPct,
      patCagr: impliedPatCagr,
      margin: marginPct,
      futureRev,
      futurePat,
      futureEps
    };
  }

  const bear = project(bearCagr, bearMargin);
  const base = project(baseCagr, baseMargin);
  const bull = project(bullCagr, bullMargin);

  // Total Return Compounding Simulation:
  // Driven by Base Case Fundamental Model PAT CAGR + Dividend Yield
  const cleanDivYield = +(divYield || 0).toFixed(2);
  const basePatGrowth = base.patCagr;
  const totalReturnRate = +(basePatGrowth + cleanDivYield).toFixed(2);
  const lakhSim = 100000 * Math.pow(1 + (totalReturnRate / 100), horizonYears);

  // Valuation Multiple Reversion Model (Sensitivity if current P/E reverts to sector benchmark over N years)
  const currentPe = ratios.stock_pe || 24.0;
  const sectorPe = state.sector_avg_pe || 24.0;
  const multReversionFactor = Math.pow(sectorPe / currentPe, 1 / horizonYears);
  const reversionReturnRate = +(((1 + totalReturnRate / 100) * multReversionFactor - 1) * 100).toFixed(2);
  const lakhSimReverted = 100000 * Math.pow(1 + (reversionReturnRate / 100), horizonYears);

  return {
    baseline: {
      rev_cr: rev,
      pat_cr: pat,
      eps: eps,
      net_margin_pct: baseMargin,
      div_yield: cleanDivYield
    },
    bear,
    base,
    bull,
    totalReturnRate,
    lakhSim,
    valuationSensitivity: {
      currentPe,
      sectorPe,
      multReversionFactor: +multReversionFactor.toFixed(4),
      reversionReturnRate,
      lakhSimReverted
    }
  };
}

function calcDataConfidence(sectionsCount, allScrapersOk, screenerOk, isCachedFresh) {
  let points = 0;
  const audit = [];

  points += Math.min(10, sectionsCount);
  audit.push({ item: `Section completeness (${sectionsCount}/10 sections parsed from real data)`, pts: `+${sectionsCount}` });

  if (allScrapersOk) {
    points += 2;
    audit.push({ item: "Scraper execution (100% financial modules returned)", pts: "+2" });
  } else {
    audit.push({ item: "Scraper execution (partial fallback engaged)", pts: "+0" });
  }

  if (screenerOk) {
    points += 1;
    audit.push({ item: "Primary structured source reachable (Screener.in)", pts: "+1" });
  } else {
    audit.push({ item: "Primary source unreachable", pts: "+0" });
  }

  if (isCachedFresh) {
    points += 1;
    audit.push({ item: "Data freshness (<24h verified cache / live fetch)", pts: "+1" });
  } else {
    audit.push({ item: "Data freshness (stale or initial sync)", pts: "+0" });
  }

  points = Math.min(14, Math.max(0, points));

  let label;
  if (points >= 11) label = "HIGH";
  else if (points >= 7) label = "MODERATE";
  else if (points >= 4) label = "LOW";
  else label = "VERY LOW";

  return { total: points, label, audit };
}

module.exports = {
  calcCAGR,
  bucketValuation,
  bucketThreshold,
  aggregateSectionBadge,
  classifyGrowth,
  calc52WeekContext,
  evalRedFlags,
  calcPulseScore,
  calcScenarios,
  calcDataConfidence,
  getSectorBenchmarkPe,
  SECTOR_BENCHMARKS
};
