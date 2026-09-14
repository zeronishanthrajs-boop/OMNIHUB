/**
 * Stock Pulse v3.0 — News RSS Parser
 * Fetches real, dated news headlines from Google News RSS without AI rewording.
 */

const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchCompanyNews(companyName, ticker, limit = 5) {
  const query = encodeURIComponent(`${ticker} ${companyName} stock India`);
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml,application/xml,text/xml'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items = [];

    $('item').each((i, el) => {
      if (items.length >= limit) return;
      
      const headline = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const pubDate = $(el).find('pubDate').text().trim();
      const source = $(el).find('source').text().trim() || 'News';

      // Format date
      let dateStr = pubDate;
      let timestamp = 0;
      try {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          timestamp = d.getTime();
          dateStr = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      } catch (e) {}

      if (headline) {
        items.push({
          title: headline,
          headline,
          date: dateStr,
          timestamp,
          source,
          url: link,
          summary: `Reported by ${source}`
        });
      }
    });

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, limit);
  } catch (err) {
    console.warn('News RSS fetch error:', err.message);
    return [];
  }
}

module.exports = {
  fetchCompanyNews
};
