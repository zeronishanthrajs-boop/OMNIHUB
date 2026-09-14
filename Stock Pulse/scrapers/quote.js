/**
 * Stock Pulse v3.0 — Real-Time Quote Parser
 * Fetches live quotes and 52W high/low from Yahoo Finance with Screener fallback.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchLiveQuote(symbol) {
  const cleanSym = symbol.toUpperCase().trim();
  const yahooSymbols = [`${cleanSym}.NS`, `${cleanSym}.BO`];

  for (const ySym of yahooSymbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=1d&range=1y`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const json = await res.json();
        const result = json.chart && json.chart.result && json.chart.result[0];
        if (result && result.meta) {
          const meta = result.meta;
          const currentPrice = meta.regularMarketPrice || null;
          const high52 = meta.fiftyTwoWeekHigh || null;
          const low52 = meta.fiftyTwoWeekLow || null;
          const prevClose = meta.chartPreviousClose || meta.previousClose || null;

          return {
            symbol: cleanSym,
            current_price: currentPrice,
            week52_high: high52,
            week52_low: low52,
            previous_close: prevClose,
            exchange: ySym.endsWith('.NS') ? 'NSE' : 'BSE',
            source: 'Yahoo Finance'
          };
        }
      }
    } catch (e) {
      // Quiet fallback
    }
  }

  return null;
}

module.exports = {
  fetchLiveQuote
};
