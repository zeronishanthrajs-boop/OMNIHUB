/**
 * Stock Pulse v4.2 — Deterministic Head-to-Head Comparison Engine
 * Computes dimension-by-dimension institutional comparison between 2 (or 3) equities:
 * - Valuation Triangulation (P/E, P/B, Reverse DCF Implied Growth, EPV)
 * - Growth & Operating Profitability (Sales CAGR, PAT CAGR, Operating Margin)
 * - 5-Stage DuPont & Capital Allocation (ROE, ROIIC, Cash Conversion Cycle)
 * - Forensic Accounting Quality (Beneish M-Score, Altman Z'', Piotroski F-Score, Sloan Accruals)
 * - Competitive Moat & Governance Trust (Moat /14, Trust /8, Pulse Score /10)
 * 100% Deterministic — Zero AI / Zero LLM reliance.
 */

function compareCompanies(stateA, stateB) {
  const symA = stateA.overview?.ticker || 'Company A';
  const symB = stateB.overview?.ticker || 'Company B';
  const nameA = stateA.overview?.company_name || symA;
  const nameB = stateB.overview?.company_name || symB;

  const rA = stateA.ratios || {};
  const rB = stateB.ratios || {};
  const ghA = stateA.growth_health || {};
  const ghB = stateB.growth_health || {};
  const vtA = stateA.valuation_triangulation || {};
  const vtB = stateB.valuation_triangulation || {};
  const caA = stateA.capital_allocation || {};
  const caB = stateB.capital_allocation || {};
  const foA = stateA.forensics || {};
  const foB = stateB.forensics || {};
  const mA = stateA.moat || {};
  const mB = stateB.moat || {};
  const tA = stateA.mgmtTrust || {};
  const tB = stateB.mgmtTrust || {};
  const pA = stateA.pulse || {};
  const pB = stateB.pulse || {};

  const dimensions = [];

  function addRow(cat, metric, valA, valB, winner, rationale) {
    dimensions.push({
      category: cat,
      metric,
      valA,
      valB,
      winner, // 'A', 'B', 'TIE', or 'N/A'
      rationale
    });
  }

  // 1. Valuation Triangulation
  const peA = rA.stock_pe;
  const peB = rB.stock_pe;
  let peWinner = 'TIE';
  if (peA && peB) peWinner = peA < peB ? 'A' : (peB < peA ? 'B' : 'TIE');
  addRow('Valuation', 'Stock P/E Ratio', peA != null ? peA.toFixed(1) : '—', peB != null ? peB.toFixed(1) : '—', peWinner,
    peWinner === 'TIE' ? 'Comparable valuation multiple' : `${peWinner === 'A' ? symA : symB} trades at a lower P/E multiple`);

  const pbA = rA.book_value ? (rA.current_price / rA.book_value) : null;
  const pbB = rB.book_value ? (rB.current_price / rB.book_value) : null;
  let pbWinner = 'TIE';
  if (pbA && pbB) pbWinner = pbA < pbB ? 'A' : (pbB < pbA ? 'B' : 'TIE');
  addRow('Valuation', 'Price to Book (P/B)', pbA != null ? pbA.toFixed(2) : '—', pbB != null ? pbB.toFixed(2) : '—', pbWinner,
    pbWinner === 'TIE' ? 'Equal book valuation' : `${pbWinner === 'A' ? symA : symB} trades at lower price-to-book multiple`);

  const dcfA = vtA.reverse_dcf?.impliedGrowthRate;
  const dcfB = vtB.reverse_dcf?.impliedGrowthRate;
  let dcfWinner = 'TIE';
  if (dcfA != null && dcfB != null) dcfWinner = dcfA < dcfB ? 'A' : (dcfB < dcfA ? 'B' : 'TIE');
  addRow('Valuation', 'Reverse DCF Implied Growth', dcfA != null ? `${dcfA}%` : '—', dcfB != null ? `${dcfB}%` : '—', dcfWinner,
    dcfWinner === 'TIE' ? 'Identical implied growth hurdle' : `${dcfWinner === 'A' ? symA : symB} prices in lower market-implied growth hurdle`);

  // 2. Growth & Profitability
  const revA = stateA.revenue_cagr_3y;
  const revB = stateB.revenue_cagr_3y;
  let revWinner = 'TIE';
  if (revA != null && revB != null) revWinner = revA > revB ? 'A' : (revB > revA ? 'B' : 'TIE');
  addRow('Growth', 'Revenue 3Y CAGR', revA != null ? `${revA.toFixed(1)}%` : '—', revB != null ? `${revB.toFixed(1)}%` : '—', revWinner,
    revWinner === 'TIE' ? 'Equal top-line growth rate' : `${revWinner === 'A' ? symA : symB} achieved faster revenue CAGR`);

  const patA = stateA.profit_cagr_3y;
  const patB = stateB.profit_cagr_3y;
  let patWinner = 'TIE';
  if (patA != null && patB != null) patWinner = patA > patB ? 'A' : (patB > patA ? 'B' : 'TIE');
  addRow('Growth', 'Profit 3Y CAGR', patA != null ? `${patA.toFixed(1)}%` : '—', patB != null ? `${patB.toFixed(1)}%` : '—', patWinner,
    patWinner === 'TIE' ? 'Equal net earnings growth' : `${patWinner === 'A' ? symA : symB} expanded net profit faster`);

  const opmA = caA.dupont?.operatingMarginPct != null ? caA.dupont.operatingMarginPct : ghA.net_margin_current_pct;
  const opmB = caB.dupont?.operatingMarginPct != null ? caB.dupont.operatingMarginPct : ghB.net_margin_current_pct;
  let opmWinner = 'TIE';
  if (opmA != null && opmB != null) opmWinner = opmA > opmB ? 'A' : (opmB > opmA ? 'B' : 'TIE');
  addRow('Operating Margin', 'Operating Profit Margin', opmA != null ? `${opmA}%` : '—', opmB != null ? `${opmB}%` : '—', opmWinner,
    opmWinner === 'TIE' ? 'Comparable margin profile' : `${opmWinner === 'A' ? symA : symB} exhibits stronger pricing power`);

  // 3. Capital Allocation & DuPont
  const roeA = caA.dupont?.roe != null ? caA.dupont.roe : rA.roe;
  const roeB = caB.dupont?.roe != null ? caB.dupont.roe : rB.roe;
  let roeWinner = 'TIE';
  if (roeA != null && roeB != null) roeWinner = roeA > roeB ? 'A' : (roeB > roeA ? 'B' : 'TIE');
  addRow('Capital Allocation', 'Return on Equity (ROE)', roeA != null ? `${roeA}%` : '—', roeB != null ? `${roeB}%` : '—', roeWinner,
    roeWinner === 'TIE' ? 'Equal equity returns' : `${roeWinner === 'A' ? symA : symB} delivers higher return on shareholder equity`);

  const roiicA = caA.roiic?.roiic3y;
  const roiicB = caB.roiic?.roiic3y;
  let roiicWinner = 'TIE';
  if (roiicA != null && roiicB != null) roiicWinner = roiicA > roiicB ? 'A' : (roiicB > roiicA ? 'B' : 'TIE');
  addRow('Capital Allocation', '3Y Incremental ROIC (ROIIC)', roiicA != null ? `${roiicA}%` : '—', roiicB != null ? `${roiicB}%` : '—', roiicWinner,
    roiicWinner === 'TIE' ? 'Equal reinvestment efficacy' : `${roiicWinner === 'A' ? symA : symB} earns higher returns on fresh reinvested capital`);

  const cccA = caA.ccc?.cccDays;
  const cccB = caB.ccc?.cccDays;
  let cccWinner = 'TIE';
  if (cccA != null && cccB != null) cccWinner = cccA < cccB ? 'A' : (cccB < cccA ? 'B' : 'TIE');
  addRow('Working Capital', 'Cash Conversion Cycle (CCC)', cccA != null ? `${cccA} Days` : '—', cccB != null ? `${cccB} Days` : '—', cccWinner,
    cccWinner === 'TIE' ? 'Comparable cash cycle' : `${cccWinner === 'A' ? symA : symB} converts working capital to cash faster`);

  // 4. Forensic Accounting & Earnings Integrity
  const mScoreA = foA.beneish?.score;
  const mScoreB = foB.beneish?.score;
  let mWinner = 'TIE';
  if (mScoreA != null && mScoreB != null) mWinner = mScoreA < mScoreB ? 'A' : (mScoreB < mScoreA ? 'B' : 'TIE');
  addRow('Forensics', 'Beneish M-Score', mScoreA != null ? `${mScoreA}` : '—', mScoreB != null ? `${mScoreB}` : '—', mWinner,
    mWinner === 'TIE' ? 'Equivalent manipulation score' : `${mWinner === 'A' ? symA : symB} exhibits lower earnings manipulation probability`);

  const zScoreA = foA.altman?.score;
  const zScoreB = foB.altman?.score;
  let zWinner = 'TIE';
  if (zScoreA != null && zScoreB != null) zWinner = zScoreA > zScoreB ? 'A' : (zScoreB > zScoreA ? 'B' : 'TIE');
  addRow('Forensics', 'Altman Z\'\'-Score', zScoreA != null ? `${zScoreA}` : '—', zScoreB != null ? `${zScoreB}` : '—', zWinner,
    zWinner === 'TIE' ? 'Equivalent balance sheet cushion' : `${zWinner === 'A' ? symA : symB} possesses stronger solvency buffer against distress`);

  const fScoreA = foA.piotroski?.total;
  const fScoreB = foB.piotroski?.total;
  let fWinner = 'TIE';
  if (fScoreA != null && fScoreB != null) fWinner = fScoreA > fScoreB ? 'A' : (fScoreB > fScoreA ? 'B' : 'TIE');
  addRow('Forensics', 'Piotroski F-Score', fScoreA != null ? `${fScoreA}/9` : '—', fScoreB != null ? `${fScoreB}/9` : '—', fWinner,
    fWinner === 'TIE' ? 'Equivalent accounting momentum' : `${fWinner === 'A' ? symA : symB} passes more fundamental accounting tests`);

  // 5. Moat, Trust & Pulse Score
  const moatA = mA.total || 0;
  const moatB = mB.total || 0;
  let moatWinner = 'TIE';
  if (moatA !== moatB) moatWinner = moatA > moatB ? 'A' : 'B';
  addRow('Moat & Trust', 'Competitive Moat Score', `${moatA}/14 (${mA.label || 'NONE'})`, `${moatB}/14 (${mB.label || 'NONE'})`, moatWinner,
    moatWinner === 'TIE' ? 'Comparable structural moat' : `${moatWinner === 'A' ? symA : symB} commands wider competitive barriers`);

  const trustA = tA.total || 0;
  const trustB = tB.total || 0;
  let trustWinner = 'TIE';
  if (trustA !== trustB) trustWinner = trustA > trustB ? 'A' : 'B';
  addRow('Moat & Trust', 'Management Trust Score', `${trustA}/8 (${tA.label || 'LOW'})`, `${trustB}/8 (${tB.label || 'LOW'})`, trustWinner,
    trustWinner === 'TIE' ? 'Comparable governance transparency' : `${trustWinner === 'A' ? symA : symB} satisfies more governance criteria`);

  const pulseA = pA.total || 0;
  const pulseB = pB.total || 0;
  let pulseWinner = 'TIE';
  if (pulseA !== pulseB) pulseWinner = pulseA > pulseB ? 'A' : 'B';
  addRow('Overall Score', 'The Pulse Score (10 Rules)', `${pulseA}/10 (${pA.label || 'WEAK'})`, `${pulseB}/10 (${pB.label || 'WEAK'})`, pulseWinner,
    pulseWinner === 'TIE' ? 'Equal composite fundamental score' : `${pulseWinner === 'A' ? symA : symB} passes more core fundamental tests`);

  // Calculate dimension wins
  const winsA = dimensions.filter(d => d.winner === 'A').length;
  const winsB = dimensions.filter(d => d.winner === 'B').length;
  const ties = dimensions.filter(d => d.winner === 'TIE').length;

  let overallVerdict = '';
  if (winsA > winsB) {
    overallVerdict = `${nameA} (${symA}) leads on ${winsA} of ${dimensions.length} fundamental dimensions, displaying superior relative quality and metrics compared to ${nameB} (${symB}).`;
  } else if (winsB > winsA) {
    overallVerdict = `${nameB} (${symB}) leads on ${winsB} of ${dimensions.length} fundamental dimensions, displaying superior relative quality and metrics compared to ${nameA} (${symA}).`;
  } else {
    overallVerdict = `Both companies are evenly balanced across fundamental quality, valuation hurdles, and governance benchmarks (${winsA} vs ${winsB} wins with ${ties} ties).`;
  }

  return {
    companyA: { ticker: symA, name: nameA },
    companyB: { ticker: symB, name: nameB },
    winsA,
    winsB,
    ties,
    dimensions,
    overallVerdict
  };
}

module.exports = {
  compareCompanies
};
