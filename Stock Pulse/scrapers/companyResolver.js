/**
 * Stock Pulse v3.0 — Company Resolver
 * Local offline fuzzy matching against bundled NSE/BSE equity list.
 * Zero network calls, zero AI required.
 */

const fs = require('fs');
const path = require('path');

let listings = [];
try {
  const dataPath = path.join(__dirname, '..', 'data', 'nse-bse-listing.json');
  listings = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (err) {
  console.error('Failed to load nse-bse-listing.json:', err.message);
  listings = [];
}

// Common alias map
const ALIAS_MAP = {
  'ZOMATO': 'ZOMATO',
  'ETERNAL': 'ZOMATO',
  'TATA MOTORS': 'TATAMOTORS',
  'TATA MOTOR': 'TATAMOTORS',
  'HDFC': 'HDFCBANK',
  'HDFC BANK': 'HDFCBANK',
  'ICICI': 'ICICIBANK',
  'ICICI BANK': 'ICICIBANK',
  'KOTAK': 'KOTAKBANK',
  'KOTAK BANK': 'KOTAKBANK',
  'AXIS': 'AXISBANK',
  'AXIS BANK': 'AXISBANK',
  'SBI': 'SBIN',
  'STATE BANK': 'SBIN',
  'STATE BANK OF INDIA': 'SBIN',
  'L&T': 'LT',
  'LARSEN': 'LT',
  'LARSEN & TOUBRO': 'LT',
  'LARSEN AND TOUBRO': 'LT',
  'RELIANCE': 'RELIANCE',
  'RIL': 'RELIANCE',
  'TCS': 'TCS',
  'TATA CONSULTANCY': 'TCS',
  'INFOSYS': 'INFY',
  'INFY': 'INFY',
  'AIRTEL': 'BHARTIARTL',
  'BHARTI': 'BHARTIARTL',
  'BHARTI AIRTEL': 'BHARTIARTL',
  'DMART': 'DMART',
  'AVENUE SUPERMARTS': 'DMART',
  'AVENUE': 'DMART',
  'MARUTI': 'MARUTI',
  'MARUTI SUZUKI': 'MARUTI',
  'M&M': 'M&M',
  'MAHINDRA': 'M&M',
  'TITAN': 'TITAN',
  'ASIAN PAINTS': 'ASIANPAINT',
  'ASIAN PAINT': 'ASIANPAINT',
  'HUL': 'HINDUNILVR',
  'HINDUSTAN UNILEVER': 'HINDUNILVR',
  'ITC': 'ITC',
  'NESTLE': 'NESTLEIND',
  'BRITANNIA': 'BRITANNIA',
  'SUN PHARMA': 'SUNPHARMA',
  'DR REDDY': 'DRREDDY',
  'CIPLA': 'CIPLA',
  'PAYTM': 'PAYTM',
  'NYKAA': 'NYKAA',
  'POLICY BAZAAR': 'POLICYBZR',
  'DELHIVERY': 'DELHIVERY',
  'IRCTC': 'IRCTC'
};

function normalize(str) {
  return (str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function resolveCompany(input) {
  if (!input || !input.trim()) return null;
  const raw = input.trim();
  const norm = normalize(raw);

  // 1. Direct Alias Match
  if (ALIAS_MAP[norm]) {
    const symbol = ALIAS_MAP[norm];
    const match = listings.find(l => l.symbol.toUpperCase() === symbol.toUpperCase());
    if (match) return match;
    return { symbol, name: raw, sector: "General", industry: "Listed Equity" };
  }

  // 2. Exact Symbol Match
  const exactSym = listings.find(l => l.symbol.toUpperCase() === norm);
  if (exactSym) return exactSym;

  // 3. Exact Name Match
  const exactName = listings.find(l => normalize(l.name) === norm);
  if (exactName) return exactName;

  // 4. Token / Substring Matching
  const subMatches = listings.filter(l => {
    const sym = l.symbol.toUpperCase();
    const nm = normalize(l.name);
    return sym.startsWith(norm) || nm.includes(norm) || norm.includes(sym);
  });

  if (subMatches.length > 0) {
    // Sort by best fit
    subMatches.sort((a, b) => {
      const aExact = a.symbol.toUpperCase() === norm ? 1 : 0;
      const bExact = b.symbol.toUpperCase() === norm ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return a.name.length - b.name.length;
    });
    return subMatches[0];
  }

  // 5. Fuzzy Levenshtein Match
  let best = null;
  let bestScore = Infinity;

  for (const item of listings) {
    const symDist = levenshtein(norm, item.symbol.toUpperCase());
    const nameDist = levenshtein(norm, normalize(item.name).slice(0, norm.length));
    const score = Math.min(symDist, nameDist);
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best && bestScore <= Math.max(2, Math.floor(norm.length * 0.35))) {
    return best;
  }

  // Default fallback to raw upper-case ticker
  return {
    symbol: norm.replace(/\s+/g, ''),
    name: raw,
    sector: "General",
    industry: "Listed Equity"
  };
}

function searchSuggestions(prefix, limit = 8) {
  if (!prefix || !prefix.trim()) return [];
  const norm = normalize(prefix);
  const results = [];

  for (const item of listings) {
    const sym = item.symbol.toUpperCase();
    const nm = normalize(item.name);
    if (sym.startsWith(norm) || nm.includes(norm)) {
      results.push(item);
      if (results.length >= limit) break;
    }
  }
  return results;
}
function getIndustryPeers(symbol, sector = '', industry = '', limit = 3) {
  const cleanSym = (symbol || '').toUpperCase().trim();
  const companyItem = listings.find(l => l.symbol.toUpperCase() === cleanSym);

  const targetSec = ((companyItem && companyItem.sector) || sector || '').toLowerCase().trim();
  const targetInd = ((companyItem && companyItem.industry) || industry || '').toLowerCase().trim();

  let matches = listings.filter(item => {
    if (item.symbol.toUpperCase() === cleanSym) return false;
    const itemSec = (item.sector || '').toLowerCase();
    const itemInd = (item.industry || '').toLowerCase();

    if (targetInd && (itemInd.includes(targetInd) || targetInd.includes(itemInd))) return true;
    if (targetSec && (itemSec.includes(targetSec) || targetSec.includes(itemSec))) return true;
    return false;
  });

  // Fallback broad matches if sector string differs from listed database
  if (!matches.length && targetSec) {
    if (targetSec.includes('auto') || targetSec.includes('consumer discretionary')) {
      matches = listings.filter(l => l.symbol !== cleanSym && l.sector === 'Automobile');
    } else if (targetSec.includes('tech') || targetSec.includes('software')) {
      matches = listings.filter(l => l.symbol !== cleanSym && l.sector === 'Information Technology');
    } else if (targetSec.includes('bank') || targetSec.includes('finance')) {
      matches = listings.filter(l => l.symbol !== cleanSym && l.sector === 'Financial Services');
    } else if (targetSec.includes('telecom')) {
      matches = listings.filter(l => l.symbol !== cleanSym && l.sector === 'Telecommunications');
    }
  }

  return matches.slice(0, limit);
}

module.exports = {
  resolveCompany,
  searchSuggestions,
  getIndustryPeers,
  listings
};
