/**
 * Stock Pulse v3.0 — 24-Hour Cache Layer
 * Provides respectful, rate-limited local caching for scraped reports.
 */

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'reports_cache.json');
const TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load cache file, reinitializing:', e.message);
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save cache file:', e.message);
  }
}

function getCachedReport(ticker) {
  if (!ticker) return null;
  const key = ticker.toUpperCase().trim();
  const cache = loadCache();
  const entry = cache[key];

  if (entry && entry.timestamp) {
    const age = Date.now() - entry.timestamp;
    if (age < TTL_MS) {
      return {
        ...entry.data,
        _cached: true,
        _cached_at: new Date(entry.timestamp).toISOString(),
        _age_hours: (age / (1000 * 60 * 60)).toFixed(1)
      };
    }
  }
  return null;
}

function setCachedReport(ticker, data) {
  if (!ticker || !data) return;
  const key = ticker.toUpperCase().trim();
  const cache = loadCache();
  cache[key] = {
    timestamp: Date.now(),
    data
  };
  saveCache(cache);
}

function clearCache(ticker = null) {
  if (ticker) {
    const cache = loadCache();
    delete cache[ticker.toUpperCase().trim()];
    saveCache(cache);
  } else {
    saveCache({});
  }
}

module.exports = {
  getCachedReport,
  setCachedReport,
  clearCache,
  TTL_MS
};
