/**
 * Stock Pulse v5.1 — Quarterly Earnings Momentum & Inflection Engine
 * Evaluates trailing 8 quarters of financial results:
 * - YoY Sales & PAT Velocity (Accelerating vs Steady vs Decelerating)
 * - Operating Margin Inflection Point detection (consecutive bps expansion)
 * - Trailing 4-quarter sparkline trajectory
 * 100% Deterministic — Zero AI / Zero LLM reliance.
 */

function calcQuarterlyMomentum(quartersData) {
  if (!quartersData || !quartersData.sales || !quartersData.sales.length) {
    return {
      status: 'INSUFFICIENT_DATA',
      velocity: 'STEADY',
      velocityLabel: 'Steady Trajectory',
      salesYoyLatest: null,
      patYoyLatest: null,
      isMarginInflecting: false,
      marginBpsDelta: 0,
      recentQuarters: []
    };
  }

  const { headers = [], sales = [], operating_profit = [], opm = [], net_profit = [] } = quartersData;
  const n = sales.length;

  // Need at least 5 quarters to compute a single YoY comparison (Q_t vs Q_{t-4})
  if (n < 5) {
    return {
      status: 'INSUFFICIENT_DATA',
      velocity: 'STEADY',
      velocityLabel: 'Steady Trajectory',
      salesYoyLatest: null,
      patYoyLatest: null,
      isMarginInflecting: false,
      marginBpsDelta: 0,
      recentQuarters: []
    };
  }

  const recentQuarters = [];
  // Build up to 4 recent YoY points
  const startIdx = Math.max(4, n - 4);
  for (let i = startIdx; i < n; i++) {
    const qName = headers[i] || `Qtr ${i + 1}`;
    const sCurrent = sales[i];
    const sPrior = sales[i - 4];
    const pCurrent = net_profit[i];
    const pPrior = net_profit[i - 4];
    const curOpm = opm[i];

    let sYoy = null;
    if (sCurrent != null && sPrior != null && sPrior > 0) {
      sYoy = +(((sCurrent - sPrior) / sPrior) * 100).toFixed(1);
    }

    let pYoy = null;
    if (pCurrent != null && pPrior != null && pPrior !== 0) {
      // Use absolute value of prior for negative base quarters
      pYoy = +(((pCurrent - pPrior) / Math.abs(pPrior)) * 100).toFixed(1);
    }

    recentQuarters.push({
      quarter: qName,
      salesCr: sCurrent,
      salesYoyPct: sYoy,
      patCr: pCurrent,
      patYoyPct: pYoy,
      opmPct: curOpm
    });
  }

  // Determine velocity
  const len = recentQuarters.length;
  const latestQtr = recentQuarters[len - 1] || {};
  const priorQtr = len >= 2 ? recentQuarters[len - 2] : null;

  let velocity = 'STEADY';
  let velocityLabel = 'Steady Trajectory';
  let velocityTone = 'neutral';

  if (latestQtr.salesYoyPct != null && priorQtr && priorQtr.salesYoyPct != null) {
    const deltaSales = latestQtr.salesYoyPct - priorQtr.salesYoyPct;
    if (deltaSales >= 2.0 && (latestQtr.patYoyPct == null || latestQtr.patYoyPct > 0)) {
      velocity = 'ACCELERATING';
      velocityLabel = `Accelerating (+${latestQtr.salesYoyPct}% YoY)`;
      velocityTone = 'green';
    } else if (deltaSales <= -2.5) {
      velocity = 'DECELERATING';
      velocityLabel = `Decelerating (${latestQtr.salesYoyPct}% YoY)`;
      velocityTone = 'red';
    } else {
      velocity = 'STEADY';
      velocityLabel = `Steady Trajectory (+${latestQtr.salesYoyPct}% YoY)`;
      velocityTone = 'neutral';
    }
  } else if (latestQtr.salesYoyPct != null) {
    velocity = latestQtr.salesYoyPct > 12 ? 'ACCELERATING' : (latestQtr.salesYoyPct < 2 ? 'DECELERATING' : 'STEADY');
    velocityLabel = `${velocity} (+${latestQtr.salesYoyPct}% YoY)`;
    velocityTone = velocity === 'ACCELERATING' ? 'green' : (velocity === 'DECELERATING' ? 'red' : 'neutral');
  }

  // Operating Margin Inflection Check (last 3 quarters)
  let isMarginInflecting = false;
  let marginBpsDelta = 0;
  if (n >= 3 && opm.length >= 3) {
    const opm0 = opm[n - 1]; // latest
    const opm1 = opm[n - 2]; // 1 qtr ago
    const opm2 = opm[n - 3]; // 2 qtrs ago

    if (opm0 != null && opm1 != null && opm2 != null) {
      const step1 = opm1 - opm2;
      const step2 = opm0 - opm1;
      const totalDelta = opm0 - opm2;
      marginBpsDelta = Math.round(totalDelta * 100);

      // Inflection requires consecutive expansion totaling >= 75 bps
      if (step1 >= 0.25 && step2 >= 0.5 && totalDelta >= 0.75) {
        isMarginInflecting = true;
      }
    }
  }

  return {
    status: 'OPTIMAL',
    velocity,
    velocityLabel,
    velocityTone,
    salesYoyLatest: latestQtr.salesYoyPct,
    patYoyLatest: latestQtr.patYoyPct,
    isMarginInflecting,
    marginBpsDelta,
    recentQuarters
  };
}

module.exports = {
  calcQuarterlyMomentum
};
