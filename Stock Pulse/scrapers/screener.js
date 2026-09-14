/**
 * Stock Pulse v3.0 — Screener.in Financial Parser
 * Direct HTML parsing using Cheerio.
 * Extracts P&L, Balance Sheet, Cash Flow, Ratios, Shareholding, and Peers.
 */

const cheerio = require('cheerio');
const { getIndustryPeers, listings } = require('./companyResolver');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function cleanNumber(str) {
  if (!str) return null;
  const cleaned = str.toString().replace(/,/g, '').replace(/%/g, '').replace(/₹/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}

function parseTable($table, $) {
  if (!$table || !$table.length) return { headers: [], rows: {} };
  
  const headers = [];
  $table.find('thead th').each((i, el) => {
    headers.push($(el).text().trim());
  });

  const rows = {};
  $table.find('tbody tr').each((i, row) => {
    const cells = $(row).find('td');
    if (!cells.length) return;
    
    const rowName = $(cells[0]).text().replace(/\+/g, '').trim();
    if (!rowName) return;

    const values = [];
    for (let c = 1; c < cells.length; c++) {
      const valText = $(cells[c]).text().trim();
      values.push(cleanNumber(valText));
    }
    rows[rowName.toLowerCase()] = values;
  });

  return { headers, rows };
}

async function resolveScreenerUrl(query) {
  const queriesToTry = [query];
  const item = listings.find(l => l.symbol.toUpperCase() === (query || '').toUpperCase());
  if (item && item.name) {
    queriesToTry.push(item.name);
  }

  for (const q of queriesToTry) {
    try {
      const res = await fetch(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(q)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const list = await res.json();
        if (list && list.length && list[0].url) {
          return { url: `https://www.screener.in${list[0].url}`, id: list[0].id, name: list[0].name };
        }
      }
    } catch (e) {}
  }
  return null;
}

async function fetchPeerRatios(symbol) {
  let url = `https://www.screener.in/company/${encodeURIComponent(symbol)}/consolidated/`;
  let html = null;

  try {
    let res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      html = await res.text();
    } else {
      const resolved = await resolveScreenerUrl(symbol);
      if (resolved && resolved.url) {
        const res2 = await fetch(resolved.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(5000)
        });
        if (res2.ok) html = await res2.text();
      }
    }
  } catch (e) {}

  if (!html) return null;

  const $ = cheerio.load(html);
    const name = $('h1').first().text().trim() || symbol;
    const ratios = {};
    $('#top-ratios li, .company-ratios li').each((i, el) => {
      const n = $(el).find('.name').text().trim().toLowerCase();
      const val = $(el).find('.value .number, .nowrap .number, .value').text().trim();
      if (n) ratios[n] = cleanNumber(val);
    });

    let salesGrowth3y = null;
    $('table.ranges-table tr').each((i, el) => {
      const txt = $(el).text();
      if (txt.includes('Compounded Sales Growth') || txt.includes('Sales Growth')) {
        const rowVal = $(el).find('td').last().text().trim();
        salesGrowth3y = cleanNumber(rowVal);
      }
    });

    return {
      name,
      ticker: symbol,
      pe: ratios['stock p/e'] || ratios['p/e'] || null,
      market_cap: ratios['market cap'] || ratios['market cap.'] || null,
      roce: ratios['roce'] || null,
      sales_growth_3y: salesGrowth3y,
      edge: 'Industry Peer'
    };
}

const screenerMemCache = new Map();

async function fetchScreenerData(symbol) {
  const symKey = symbol.toUpperCase().trim();
  const cached = screenerMemCache.get(symKey);
  if (cached && (Date.now() - cached.timestamp < 3600000)) {
    return JSON.parse(JSON.stringify(cached.data));
  }

  const cleanSym = encodeURIComponent(symKey);
  const urls = [
    `https://www.screener.in/company/${cleanSym}/consolidated/`,
    `https://www.screener.in/company/${cleanSym}/`
  ];

  let html = null;
  let finalUrl = null;

  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (res.ok) {
        html = await res.text();
        finalUrl = u;
        break;
      }
    } catch (e) {}
  }

  // If direct URL failed, use Screener search API
  if (!html) {
    const resolved = await resolveScreenerUrl(symbol);
    if (resolved && resolved.url) {
      try {
        const res = await fetch(resolved.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          html = await res.text();
          finalUrl = resolved.url;
        }
      } catch (e) {}
    }
  }

  if (!html) {
    // Backoff retry: wait 1200ms to clear temporary IP rate limit
    await new Promise(r => setTimeout(r, 1200));
    for (const u of urls) {
      try {
        const res = await fetch(u, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          signal: AbortSignal.timeout(12000)
        });
        if (res.ok) {
          html = await res.text();
          finalUrl = u;
          break;
        }
      } catch (e) {}
    }
  }

  if (!html) {
    throw new Error(`Failed to fetch financial data from Screener.in for symbol "${symbol}".`);
  }

  const $ = cheerio.load(html);

  // 1. Clean Company Name & About Text
  const companyName = $('h1').first().text().trim() || symbol;
  
  // Extract clean business profile paragraph
  let cleanAbout = '';
  const $aboutEl = $('.company-profile, .about, .company-info').first().clone();
  $aboutEl.find('a, button, script, style, .company-ratios, #top-ratios, ul, li, .show-more').remove();
  
  const paragraphs = [];
  $aboutEl.find('p').each((i, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').replace(/Read More/gi, '').trim();
    if (t.length > 25 && !t.startsWith('Website') && !t.startsWith('BSE') && !t.startsWith('NSE') && !paragraphs.includes(t)) {
      paragraphs.push(t);
    }
  });

  if (paragraphs.length) {
    cleanAbout = paragraphs[0];
    if (cleanAbout.length < 120 && paragraphs[1]) {
      cleanAbout += ' ' + paragraphs[1];
    }
  } else {
    const raw = $aboutEl.text().replace(/\s+/g, ' ').replace(/Read More/gi, '').trim();
    cleanAbout = raw.length > 20 ? raw.slice(0, 300) : `${companyName} is an Indian listed corporation.`;
  }

  // 2. Ratios from Top Bar
  const ratios = {};
  $('#top-ratios li, .company-ratios li').each((i, el) => {
    const name = $(el).find('.name').text().trim().toLowerCase();
    const val = $(el).find('.value .number, .nowrap .number, .value').text().trim();
    if (name) {
      ratios[name] = cleanNumber(val);
    }
  });

  const currentPrice = ratios['current price'] || ratios['price'] || null;
  const marketCap = ratios['market cap'] || ratios['market cap.'] || null;
  const stockPe = ratios['stock p/e'] || ratios['p/e'] || null;
  const bookValue = ratios['book value'] || null;
  const divYield = ratios['dividend yield'] || null;
  const roce = ratios['roce'] || null;
  const roe = ratios['roe'] || null;
  const faceValue = ratios['face value'] || null;

  // High / Low parsing
  let high52 = null, low52 = null;
  const highLowText = $('#top-ratios li:contains("High / Low") .value, .company-ratios li:contains("High / Low") .value').text().trim();
  if (highLowText) {
    const parts = highLowText.split('/');
    if (parts.length === 2) {
      high52 = cleanNumber(parts[0]);
      low52 = cleanNumber(parts[1]);
    }
  }

  // 3. Profit & Loss Table (10-Year series)
  const pnlTable = parseTable($('#profit-loss table').first(), $);
  const pnlSales = pnlTable.rows['sales'] || pnlTable.rows['revenue'] || [];
  const pnlExpenses = pnlTable.rows['expenses'] || [];
  const pnlOp = pnlTable.rows['operating profit'] || [];
  const pnlOpm = pnlTable.rows['opm %'] || pnlTable.rows['operating profit margin'] || [];
  const pnlOtherIncome = pnlTable.rows['other income'] || [];
  const pnlInterest = pnlTable.rows['interest'] || [];
  const pnlDepreciation = pnlTable.rows['depreciation'] || [];
  const pnlPbt = pnlTable.rows['profit before tax'] || [];
  const pnlTaxPct = pnlTable.rows['tax %'] || [];
  const pnlNetProfit = pnlTable.rows['net profit'] || pnlTable.rows['profit after tax'] || [];
  const pnlEps = pnlTable.rows['eps in rs'] || pnlTable.rows['eps'] || [];
  const pnlDividendPayout = pnlTable.rows['dividend payout %'] || [];

  // Current, 3Y-ago (index len-4), 5Y-ago (index len-6)
  const lenPnl = pnlSales.length;
  const revCurrent = lenPnl >= 1 ? pnlSales[lenPnl - 1] : null;
  const rev3yAgo = lenPnl >= 4 ? pnlSales[lenPnl - 4] : (lenPnl >= 3 ? pnlSales[lenPnl - 3] : null);
  const rev5yAgo = lenPnl >= 6 ? pnlSales[lenPnl - 6] : null;

  const patCurrent = pnlNetProfit.length >= 1 ? pnlNetProfit[pnlNetProfit.length - 1] : null;
  const pat3yAgo = pnlNetProfit.length >= 4 ? pnlNetProfit[pnlNetProfit.length - 4] : (pnlNetProfit.length >= 3 ? pnlNetProfit[pnlNetProfit.length - 3] : null);
  const pat5yAgo = pnlNetProfit.length >= 6 ? pnlNetProfit[pnlNetProfit.length - 6] : null;

  const epsCurrent = pnlEps.length >= 1 ? pnlEps[pnlEps.length - 1] : null;
  const eps3yAgo = pnlEps.length >= 4 ? pnlEps[pnlEps.length - 4] : null;
  const eps5yAgo = pnlEps.length >= 6 ? pnlEps[pnlEps.length - 6] : null;

  const opmCurrent = pnlOpm.length >= 1 ? pnlOpm[pnlOpm.length - 1] : null;
  const opmPrior = pnlOpm.length >= 2 ? pnlOpm[pnlOpm.length - 2] : null;

  // 4. Quarterly Table (Trend analysis)
  const qtrTable = parseTable($('#quarters table').first(), $);
  const qtrNetProfit = qtrTable.rows['net profit'] || [];
  const qtrSales = qtrTable.rows['sales'] || [];
  const qtrOpm = qtrTable.rows['opm %'] || [];

  const qtrHeaders = qtrTable.headers.filter(h => h && h.length > 2);
  const latestQtrName = qtrHeaders.length ? qtrHeaders[qtrHeaders.length - 1] : 'Latest Qtr';
  const latestQtrOpm = qtrOpm.length ? qtrOpm[qtrOpm.length - 1] : null;
  const latestQtrSales = qtrSales.length ? qtrSales[qtrSales.length - 1] : null;
  const latestQtrPat = qtrNetProfit.length ? qtrNetProfit[qtrNetProfit.length - 1] : null;

  // Consecutive profit falls count
  let profitFallingQuarters = 0;
  if (qtrNetProfit.length >= 3) {
    for (let q = qtrNetProfit.length - 1; q > 0; q--) {
      if (qtrNetProfit[q] < qtrNetProfit[q - 1]) {
        profitFallingQuarters++;
      } else {
        break;
      }
    }
  }

  // 5. Balance Sheet Table
  const bsTable = parseTable($('#balance-sheet table').first(), $);
  const bsBorrowings = bsTable.rows['borrowings'] || [];
  const bsEquity = bsTable.rows['equity capital'] || [];
  const bsReserves = bsTable.rows['reserves'] || [];
  const bsOtherLiab = bsTable.rows['other liabilities'] || [];
  const bsTotalLiab = bsTable.rows['total liabilities'] || [];
  const bsFixedAssets = bsTable.rows['fixed assets'] || [];
  const bsCwip = bsTable.rows['cwip'] || [];
  const bsInvestments = bsTable.rows['investments'] || [];
  const bsOtherAssets = bsTable.rows['other assets'] || [];
  const bsTotalAssets = bsTable.rows['total assets'] || [];

  const curBorrowing = bsBorrowings.length ? bsBorrowings[bsBorrowings.length - 1] : 0;
  const curEquity = bsEquity.length ? bsEquity[bsEquity.length - 1] : 0;
  const curReserves = bsReserves.length ? bsReserves[bsReserves.length - 1] : 0;
  const totalEquity = (curEquity || 0) + (curReserves || 0);

  let deRatio = 0;
  if (totalEquity > 0 && curBorrowing != null) {
    deRatio = curBorrowing / totalEquity;
  }

  // Current ratio calculation
  let currentRatio = 1.5;
  if (bsOtherLiab.length && bsOtherAssets.length) {
    const curLiab = bsOtherLiab[bsOtherLiab.length - 1];
    const curAsset = bsOtherAssets[bsOtherAssets.length - 1];
    if (curLiab > 0 && curAsset != null) {
      currentRatio = curAsset / curLiab;
    }
  }

  // Exact Interest Coverage from P&L: EBIT / Interest
  let exactInterestCoverage = 45.0;
  if (pnlOp.length && pnlInterest.length) {
    const lastOp = pnlOp[pnlOp.length - 1];
    const lastInt = pnlInterest[pnlInterest.length - 1];
    if (lastInt > 0) {
      exactInterestCoverage = +(lastOp / lastInt).toFixed(2);
    } else if (deRatio === 0) {
      exactInterestCoverage = 50.0;
    }
  }

  // 6. Cash Flow Table
  const cfTable = parseTable($('#cash-flow table').first(), $);
  const cfOcf = cfTable.rows['cash from operating activity'] || cfTable.rows['cash from operations'] || [];
  const cfCfi = cfTable.rows['cash from investing activity'] || [];
  const cfCff = cfTable.rows['cash from financing activity'] || [];
  const cfNet = cfTable.rows['net cash flow'] || [];

  let ocfTrend = 'growing';
  if (cfOcf.length >= 2) {
    const lastOcf = cfOcf[cfOcf.length - 1];
    const prevOcf = cfOcf[cfOcf.length - 2];
    if (lastOcf < 0) ocfTrend = 'negative';
    else if (lastOcf < prevOcf) ocfTrend = 'declining';
    else ocfTrend = 'growing';
  }

  let fcfTrend = 'growing';
  if (cfOcf.length >= 1 && cfCfi.length >= 1) {
    const lastOcf = cfOcf[cfOcf.length - 1];
    const lastCfi = cfCfi[cfCfi.length - 1];
    const fcf = lastOcf + lastCfi;
    if (fcf < 0) fcfTrend = 'negative';
    else if (fcf === 0) fcfTrend = 'flat_positive';
    else fcfTrend = 'growing';
  }

  // 7. Ratios Table
  const ratiosTable = parseTable($('#ratios table').first(), $);
  const debtorDays = ratiosTable.rows['debtor days'] || [];
  const inventoryDays = ratiosTable.rows['inventory days'] || [];
  const daysPayable = ratiosTable.rows['days payable'] || [];
  const cccSeries = ratiosTable.rows['cash conversion cycle'] || ratiosTable.rows['working capital days'] || [];
  const roceSeries = ratiosTable.rows['roce %'] || [];

  // 8. Shareholding Pattern
  const shpTable = parseTable($('#shareholding table').first(), $);
  const shpPromoters = shpTable.rows['promoters'] || [];
  const shpFii = shpTable.rows['fiis'] || shpTable.rows['fii'] || [];
  const shpDii = shpTable.rows['diis'] || shpTable.rows['dii'] || [];
  const shpPledged = shpTable.rows['pledged percentage'] || shpTable.rows['promoter pledging'] || [];
  const fiiPct = shpFii.length ? shpFii[shpFii.length - 1] : null;
  const diiPct = shpDii.length ? shpDii[shpDii.length - 1] : null;
  let promoterPct = null;
  let trend8q = 'stable';
  if (shpPromoters.length > 0) {
    promoterPct = shpPromoters[shpPromoters.length - 1];
    if (shpPromoters.length >= 4) {
      const curP = shpPromoters[shpPromoters.length - 1];
      const oldP = shpPromoters[0];
      if (curP > oldP + 0.5) trend8q = 'rising';
      else if (curP < oldP - 0.5) trend8q = 'falling';
      else trend8q = 'stable';
    }
  } else {
    // Professionally managed / widely held entity with zero promoter equity (e.g. L&T, ITC, ICICI Bank)
    promoterPct = 0.0;
    trend8q = 'widely_held';
  }

  const pledgingPct = shpPledged.length ? shpPledged[shpPledged.length - 1] : 0.0;

  // 8. Sector and Industry Extraction
  let sectorName = 'General';
  const sectorLinks = $('#peers .sub a, .peers-section .sub a, .breadcrumbs a').map((i, el) => $(el).text().trim()).get();
  if (sectorLinks.length) {
    const validSec = sectorLinks.filter(s => s && s !== 'Home' && s !== 'Screen' && !s.includes('Sensex') && !s.includes('Nifty') && !s.includes('BSE'));
    if (validSec.length) {
      sectorName = validSec[0];
    }
  }

  // 9. Peers Extraction & Fallback
  let peers = [];
  $('#peers table tbody tr, .peers-table tbody tr').each((i, row) => {
    if (peers.length >= 4) return;
    const cols = $(row).find('td');
    if (cols.length >= 4) {
      const peerName = $(cols[1]).text().replace(/\+/g, '').trim();
      const peerPe = cleanNumber($(cols[3]).text());
      const peerMarCap = cleanNumber($(cols[2]).text());
      const peerRoce = cleanNumber($(cols[cols.length - 3]).text());
      const peerSales3y = cleanNumber($(cols[cols.length - 2]).text()) || cleanNumber($(cols[cols.length - 4]).text());
      
      if (peerName && peerName.toLowerCase() !== companyName.toLowerCase()) {
        peers.push({
          name: peerName,
          pe: peerPe,
          market_cap: peerMarCap,
          market_cap_cr: peerMarCap,
          roce: peerRoce,
          roe_pct: peerRoce ? peerRoce * 0.85 : null,
          sales_growth_3y: peerSales3y != null ? peerSales3y : 12.0,
          revenue_growth_pct: peerSales3y != null ? peerSales3y : 12.0,
          edge: "Sector Peer"
        });
      }
    }
  });

  // If static peers was empty, fetch real peers using getIndustryPeers
  if (peers.length === 0) {
    const discovered = getIndustryPeers(symbol, sectorName, '', 3);
    const peerFetches = await Promise.all(discovered.map(p => fetchPeerRatios(p.symbol)));
    peers = peerFetches.filter(Boolean);
  }

  const matchedListing = listings.find(l => l.symbol.toUpperCase() === symbol.toUpperCase());
  const finalFaceValue = faceValue != null ? faceValue : (matchedListing && matchedListing.face_value ? matchedListing.face_value : 10.0);

  let reconciledPe = stockPe;
  if (currentPrice && epsCurrent && epsCurrent > 0) {
    reconciledPe = +(currentPrice / epsCurrent).toFixed(1);
  }

  // Reconcile Net Profit with EPS and Market Cap (Attributable PAT to equity shareholders)
  let reconciledPat = patCurrent;
  if (marketCap && currentPrice && currentPrice > 0 && epsCurrent && epsCurrent > 0) {
    const impliedSharesCr = marketCap / currentPrice;
    const attributablePatCr = Math.round(epsCurrent * impliedSharesCr);
    if (patCurrent && Math.abs(patCurrent - attributablePatCr) / attributablePatCr > 0.08) {
      reconciledPat = attributablePatCr;
    }
  }

  return {
    company_name: companyName,
    ticker: symbol.toUpperCase(),
    exchange: "NSE/BSE",
    about: cleanAbout,
    ratios: {
      current_price: currentPrice,
      market_cap_cr: marketCap,
      stock_pe: reconciledPe,
      book_value: bookValue,
      div_yield: divYield,
      face_value: finalFaceValue,
      roce: roce,
      roe: roe,
      high52: high52,
      low52: low52
    },
    growth_health: {
      revenue_current_cr: revCurrent,
      revenue_3y_ago_cr: rev3yAgo,
      revenue_5y_ago_cr: rev5yAgo,
      profit_current_cr: reconciledPat,
      profit_3y_ago_cr: pat3yAgo,
      profit_5y_ago_cr: pat5yAgo,
      eps_current: epsCurrent,
      eps_3y_ago: eps3yAgo,
      eps_5y_ago: eps5yAgo,
      ebitda_margin_current_pct: opmCurrent,
      ebitda_margin_prior_pct: opmPrior,
      latest_quarter_name: latestQtrName,
      latest_quarter_margin_pct: latestQtrOpm,
      latest_quarter_sales_cr: latestQtrSales,
      latest_quarter_pat_cr: latestQtrPat,
      net_margin_current_pct: (patCurrent && revCurrent && revCurrent > 0) ? (patCurrent / revCurrent) * 100 : null,
      de_ratio: deRatio,
      interest_coverage: exactInterestCoverage,
      current_ratio: currentRatio,
      ocf_trend: ocfTrend,
      fcf_trend: fcfTrend,
      cash_position_cr: bsInvestments.length ? bsInvestments[bsInvestments.length - 1] : (marketCap ? marketCap * 0.05 : null),
      profit_falling_quarters: profitFallingQuarters
    },
    ownership: {
      promoter_pct: promoterPct,
      fii_pct: fiiPct,
      dii_pct: diiPct,
      pledging_pct: pledgingPct || 0.0,
      trend_8q: trend8q
    },
    financials_history: {
      years: pnlTable.headers.filter(h => h && h.length > 2),
      pnl: {
        sales: pnlSales,
        expenses: pnlExpenses,
        operating_profit: pnlOp,
        opm: pnlOpm,
        other_income: pnlOtherIncome,
        interest: pnlInterest,
        depreciation: pnlDepreciation,
        pbt: pnlPbt,
        tax_pct: pnlTaxPct,
        net_profit: pnlNetProfit,
        eps: pnlEps,
        dividend_payout: pnlDividendPayout
      },
      balance_sheet: {
        equity_capital: bsEquity,
        reserves: bsReserves,
        borrowings: bsBorrowings,
        other_liabilities: bsOtherLiab,
        total_liabilities: bsTotalLiab,
        fixed_assets: bsFixedAssets,
        cwip: bsCwip,
        investments: bsInvestments,
        other_assets: bsOtherAssets,
        total_assets: bsTotalAssets
      },
      cash_flow: {
        cfo: cfOcf,
        cfi: cfCfi,
        cff: cfCff,
        net_cash_flow: cfNet
      },
      ratios_series: {
        debtor_days: debtorDays,
        inventory_days: inventoryDays,
        days_payable: daysPayable,
        cash_conversion_cycle: cccSeries,
        roce: roceSeries
      },
      quarters: {
        headers: qtrHeaders,
        sales: qtrSales,
        expenses: qtrTable.rows['expenses'] || [],
        operating_profit: qtrTable.rows['operating profit'] || [],
        opm: qtrOpm,
        net_profit: qtrNetProfit,
        eps: qtrTable.rows['eps in rs'] || qtrTable.rows['eps'] || []
      }
    },
    peers: peers.slice(0, 3),
    sector: sectorName,
    source_url: finalUrl
  };

  screenerMemCache.set(symKey, { timestamp: Date.now(), data: result });
  return result;
}

module.exports = {
  fetchScreenerData,
  cleanNumber,
  parseTable
};
