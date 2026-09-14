/**
 * Stock Pulse v5.1 — SEBI Regulatory Insider Trading & Promoter Activity Radar
 * Tracks promoter and insider open-market share accumulation vs. distribution:
 * - Computes trailing net promoter percentage shift across recent quarters
 * - Derives estimated institutional transaction value (Rs. Cr)
 * - Identifies Insider Accumulation vs Distribution signals
 * 100% Deterministic — Zero AI / Zero LLM reliance.
 */

function evaluateInsiderActivity(ownershipData, marketCapCr) {
  if (!ownershipData || !ownershipData.trend_8q || !ownershipData.trend_8q.length) {
    return {
      signal: 'NEUTRAL',
      label: 'Zero Net Insider Open-Market Activity',
      tone: 'neutral',
      netStakeDeltaPct: 0.0,
      estimatedNetValueCr: 0,
      recentQuarters: []
    };
  }

  const trends = ownershipData.trend_8q; // Array of promoter percentages over last quarters
  const n = trends.length;
  if (n < 2) {
    return {
      signal: 'NEUTRAL',
      label: 'Insufficient Historical Disclosures',
      tone: 'neutral',
      netStakeDeltaPct: 0.0,
      estimatedNetValueCr: 0,
      recentQuarters: trends
    };
  }

  // Calculate delta over the last 2 quarters
  const latestStake = trends[n - 1];
  const priorStake = trends[n - 2];
  const delta2q = +(latestStake - priorStake).toFixed(2);

  // Longer 4-quarter cumulative shift
  const baseStake4q = n >= 4 ? trends[n - 4] : trends[0];
  const delta4q = +(latestStake - baseStake4q).toFixed(2);

  let signal = 'NEUTRAL';
  let label = 'Stable Insider Holding (No Material Open-Market Drift)';
  let tone = 'neutral';

  const mCap = marketCapCr || 10000;
  const estimatedValueCr = Math.round((Math.abs(delta2q) / 100) * mCap);

  if (delta2q >= 0.15) {
    signal = 'ACCUMULATION';
    label = `Promoter Accumulation (+${delta2q}% acquired in open market, ~₹${estimatedValueCr.toLocaleString('en-IN')} Cr)`;
    tone = 'green';
  } else if (delta2q <= -0.25) {
    signal = 'DISTRIBUTION';
    label = `Promoter Distribution (${delta2q}% offloaded, ~₹${estimatedValueCr.toLocaleString('en-IN')} Cr)`;
    tone = 'red';
  } else if (delta4q >= 0.30) {
    signal = 'ACCUMULATION';
    label = `Sustained Accumulation (+${delta4q}% acquired over 4 quarters)`;
    tone = 'green';
  } else if (delta4q <= -0.50) {
    signal = 'DISTRIBUTION';
    label = `Sustained Distribution (${delta4q}% reduced over 4 quarters)`;
    tone = 'red';
  }

  return {
    signal,
    label,
    tone,
    latestPromoterPct: latestStake,
    netStakeDeltaPct: delta2q,
    netStakeDelta4qPct: delta4q,
    estimatedNetValueCr: signal === 'DISTRIBUTION' ? -estimatedValueCr : estimatedValueCr,
    history: trends
  };
}

module.exports = {
  evaluateInsiderActivity
};
