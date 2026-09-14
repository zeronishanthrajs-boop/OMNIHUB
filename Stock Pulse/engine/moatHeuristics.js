/**
 * Stock Pulse v3.0 — Tier 1 Moat Heuristics Engine
 * Evaluates 7 competitive moat dimensions using real quantitative proxies and sector tendencies.
 * 100% deterministic, zero AI network calls.
 */

const SECTOR_MOAT_DEFAULTS = {
  "Information Technology": {
    "Brand Power": { score: 1, text: "Global IT delivery brand recognition and enterprise client recall." },
    "Switching Costs": { score: 2, text: "Deep enterprise core system integration creates mission-critical migration risk." },
    "Network Effects": { score: 0, text: "Limited consumer network effects; standard vendor partner ecosystem." },
    "Cost Advantage": { score: 1, text: "Global offshore delivery pyramid structure and billing utilization." },
    "Regulatory License": { score: 0, text: "Open services market without statutory monopolies." },
    "Patents/IP": { score: 1, text: "Proprietary software suites, accelerators, and AI delivery platforms." },
    "Scale Advantage": { score: 2, text: "Massive global delivery workforce enables multi-billion dollar master contracts." }
  },
  "Consumer Goods": {
    "Brand Power": { score: 2, text: "Household consumer brand awareness, loyal retail repeat purchase patterns." },
    "Switching Costs": { score: 0, text: "Low consumer friction to substitute daily consumption products." },
    "Network Effects": { score: 0, text: "Individual consumption without direct network effects." },
    "Cost Advantage": { score: 1, text: "High-volume raw material procurement and automated packaging lines." },
    "Regulatory License": { score: 0, text: "Standard FSSAI and consumer compliance clearances." },
    "Patents/IP": { score: 1, text: "Proprietary formulations, distinct packaging, and trade secret recipes." },
    "Scale Advantage": { score: 2, text: "Pan-India multi-million retail store distribution and supply chain reach." }
  },
  "Financial Services": {
    "Brand Power": { score: 2, text: "Trusted institutional reputation for depositor safety and credit prudence." },
    "Switching Costs": { score: 2, text: "High inertia to migrate salary accounts, auto-debits, and existing mortgages." },
    "Network Effects": { score: 1, text: "Payment merchant POS network and UPI acquiring ecosystem." },
    "Cost Advantage": { score: 2, text: "Low-cost CASA deposit franchise delivers superior funding cost advantage." },
    "Regulatory License": { score: 2, text: "Strict RBI universal banking licensing forms immense barrier to entry." },
    "Patents/IP": { score: 1, text: "Proprietary underwriting algorithms and digital credit scorecard models." },
    "Scale Advantage": { score: 2, text: "Multi-thousand branch distribution network and massive lending underwriting capacity." }
  },
  "Automobile": {
    "Brand Power": { score: 2, text: "Iconic automotive badges and strong dealership showroom reach." },
    "Switching Costs": { score: 0, text: "Consumers can switch vehicle brands upon next purchase cycle." },
    "Network Effects": { score: 0, text: "Negligible direct user network effects." },
    "Cost Advantage": { score: 1, text: "Modular platform manufacturing and localization of auto components." },
    "Regulatory License": { score: 1, text: "Stringent vehicular safety and emission homologation standards." },
    "Patents/IP": { score: 1, text: "EV powertrain architecture, battery management systems, and engine IP." },
    "Scale Advantage": { score: 2, text: "Extensive dealer sales and aftermarket authorized service centers." }
  },
  "Consumer Discretionary": {
    "Brand Power": { score: 2, text: "Strong consumer brand equity and retail franchise recall." },
    "Switching Costs": { score: 0, text: "Low customer switching costs between discretionary brands." },
    "Network Effects": { score: 0, text: "Limited consumer network externalities." },
    "Cost Advantage": { score: 1, text: "Scale procurement and efficient vendor component ecosystem." },
    "Regulatory License": { score: 1, text: "Standard industrial certifications and consumer compliance." },
    "Patents/IP": { score: 1, text: "Proprietary product designs, platforms, and manufacturing tooling." },
    "Scale Advantage": { score: 2, text: "Pan-India distribution footprint and service network presence." }
  },
  "Capital Goods": {
    "Brand Power": { score: 1, text: "Reputable engineering EPC track record and technical pre-qualifications." },
    "Switching Costs": { score: 2, text: "Custom industrial equipment specifications and maintenance lock-in." },
    "Network Effects": { score: 0, text: "Project-based industrial execution." },
    "Cost Advantage": { score: 1, text: "Heavy manufacturing fabrication capacity and supply chain scale." },
    "Regulatory License": { score: 1, text: "Strict safety, defense, and power grid quality clearances." },
    "Patents/IP": { score: 1, text: "Proprietary engineering blueprints and automation controllers." },
    "Scale Advantage": { score: 2, text: "High order book execution capacity and project bonding strength." }
  },
  "Chemicals": {
    "Brand Power": { score: 1, text: "B2B client supplier audits and trusted chemical consistency." },
    "Switching Costs": { score: 2, text: "High customer audit qualification barriers and regulatory molecule approvals." },
    "Network Effects": { score: 0, text: "Direct chemical supply contracts." },
    "Cost Advantage": { score: 1, text: "Backward integration into key starting materials and process yield optimization." },
    "Regulatory License": { score: 2, text: "Strict pollution control board, REACH, and hazardous chemical permits." },
    "Patents/IP": { score: 1, text: "Complex multi-step synthesis and proprietary process patents." },
    "Scale Advantage": { score: 1, text: "Specialized batch reactor capacity and hazard-rated logistics." }
  },
  "Telecommunications": {
    "Brand Power": { score: 1, text: "Mass-market consumer recall in national connectivity." },
    "Switching Costs": { score: 1, text: "Family bundled plans and fiber broadband create modest retention." },
    "Network Effects": { score: 2, text: "Interconnected broadband and mobile subscriber network." },
    "Cost Advantage": { score: 1, text: "High-density optical fiber infrastructure reduces marginal data transit cost." },
    "Regulatory License": { score: 2, text: "Exclusive DoT spectrum licenses and multi-decade telecom permits." },
    "Patents/IP": { score: 1, text: "Proprietary 5G RAN stack and telecom cloud infrastructure." },
    "Scale Advantage": { score: 2, text: "Hundreds of millions of subscribers amortizing fixed tower capex." }
  },
  "Healthcare": {
    "Brand Power": { score: 1, text: "Established clinical trust among medical practitioners and patients." },
    "Switching Costs": { score: 1, text: "Doctor prescription stickiness and hospital formulary listings." },
    "Network Effects": { score: 0, text: "Negligible network effects." },
    "Cost Advantage": { score: 1, text: "Low-cost bulk active pharmaceutical ingredient (API) synthesis." },
    "Regulatory License": { score: 2, text: "Stringent USFDA and DCGI regulatory plant compliance certifications." },
    "Patents/IP": { score: 2, text: "Extensive patent portfolios, ANDA generic filings, and proprietary drug delivery." },
    "Scale Advantage": { score: 1, text: "Global distribution footprint across regulated western markets." }
  }
};

const DEFAULT_MOAT = {
  "Brand Power": { score: 1, text: "Recognized industry presence and commercial goodwill." },
  "Switching Costs": { score: 1, text: "Established B2B operational integration and contractual terms." },
  "Network Effects": { score: 0, text: "Standard operating structure without direct network externalities." },
  "Cost Advantage": { score: 1, text: "Operational efficiencies and supply chain optimization." },
  "Regulatory License": { score: 0, text: "Standard statutory operating permissions." },
  "Patents/IP": { score: 0, text: "Conventional industry technology and processes." },
  "Scale Advantage": { score: 1, text: "Competitive market presence within peer group." }
};

function evaluateMoat(scrapedData) {
  const sector = scrapedData.sector || "General";
  const gh = scrapedData.growth_health || {};
  const ratios = scrapedData.ratios || {};

  // Find matching sector defaults
  let sectorMatch = null;
  for (const [secKey, secObj] of Object.entries(SECTOR_MOAT_DEFAULTS)) {
    if (sector.toLowerCase().includes(secKey.toLowerCase()) || secKey.toLowerCase().includes(sector.toLowerCase())) {
      sectorMatch = secObj;
      break;
    }
  }
  const baseMoat = sectorMatch || DEFAULT_MOAT;

  const factors = [];

  // Factor 1: Brand Power
  let brandScore = baseMoat["Brand Power"].score;
  let brandEvidence = baseMoat["Brand Power"].text;
  if (gh.ebitda_margin_current_pct && gh.ebitda_margin_current_pct > 25) {
    brandScore = Math.min(2, brandScore + 1);
    brandEvidence += " High operating margin (>25%) reflects pricing power.";
  }
  factors.push({ name: "Brand Power", score: brandScore, evidence: brandEvidence });

  // Factor 2: Switching Costs
  factors.push({
    name: "Switching Costs",
    score: baseMoat["Switching Costs"].score,
    evidence: baseMoat["Switching Costs"].text
  });

  // Factor 3: Network Effects
  let netScore = baseMoat["Network Effects"].score;
  let netEvidence = baseMoat["Network Effects"].text;
  if (scrapedData.about && (scrapedData.about.toLowerCase().includes("platform") || scrapedData.about.toLowerCase().includes("marketplace") || scrapedData.about.toLowerCase().includes("exchange"))) {
    netScore = 2;
    netEvidence = "Multi-sided digital platform connecting ecosystem participants with compounding liquidity.";
  }
  factors.push({ name: "Network Effects", score: netScore, evidence: netEvidence });

  // Factor 4: Cost Advantage
  let costScore = baseMoat["Cost Advantage"].score;
  let costEvidence = baseMoat["Cost Advantage"].text;
  if (gh.ebitda_margin_current_pct && gh.ebitda_margin_prior_pct && (gh.ebitda_margin_current_pct >= gh.ebitda_margin_prior_pct)) {
    costScore = Math.min(2, costScore + 1);
    costEvidence += " Resilient operating margins prove cost efficiency.";
  }
  factors.push({ name: "Cost Advantage", score: costScore, evidence: costEvidence });

  // Factor 5: Regulatory License
  factors.push({
    name: "Regulatory License",
    score: baseMoat["Regulatory License"].score,
    evidence: baseMoat["Regulatory License"].text
  });

  // Factor 6: Patents/IP
  factors.push({
    name: "Patents/IP",
    score: baseMoat["Patents/IP"].score,
    evidence: baseMoat["Patents/IP"].text
  });

  // Factor 7: Scale Advantage
  let scaleScore = baseMoat["Scale Advantage"].score;
  let scaleEvidence = baseMoat["Scale Advantage"].text;
  if (ratios.market_cap_cr && ratios.market_cap_cr > 50000) {
    scaleScore = 2;
    scaleEvidence = `Mega-cap balance sheet (Rs. ${ratios.market_cap_cr.toLocaleString('en-IN')} Cr) drives structural procurement scale.`;
  }
  factors.push({ name: "Scale Advantage", score: scaleScore, evidence: scaleEvidence });

  const total = factors.reduce((sum, f) => sum + f.score, 0);
  let label = "NONE", tone = "red";
  if (total >= 9) { label = "WIDE"; tone = "green"; }
  else if (total >= 5) { label = "NARROW"; tone = "amber"; }

  const tailwinds = `Long-term expansion in ${sector} driven by Indian domestic consumption, capex cycle, and formalization.`;
  const headwinds = `Competitive pricing pressure, input inflation volatility, and broader macroeconomic shifts.`;

  return {
    factors,
    total,
    label,
    tone,
    tailwinds,
    headwinds,
    sources: [scrapedData.source_url || "https://www.screener.in"]
  };
}

module.exports = {
  evaluateMoat
};
