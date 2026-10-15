/**
 * Apify Market Data Integration Service
 * Uses Apify Actor (architjn/yahoo-finance) to fetch real live market quotes
 * for NSE/BSE stocks and indices using the user's Apify token.
 */

const https = require('https');

const APIFY_ACTOR_URL = 'https://api.apify.com/v2/acts/architjn~yahoo-finance/run-sync-get-dataset-items';

// Default tracked tickers on NSE (focused set for fast response)
const DEFAULT_INDIAN_TICKERS = [
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  '^NSEI',
  '^BSESN',
];

/**
 * Execute HTTP POST request using native https to avoid heavy external dependencies
 */
function postJson(url, postData) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const dataString = JSON.stringify(postData);

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
      },
      timeout: 90000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Apify response: ${e.message}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Apify request timed out after 45 seconds'));
    });

    req.write(dataString);
    req.end();
  });
}

/**
 * Map raw symbol to internal symbol
 */
function normalizeSymbol(raw) {
  if (raw === '^NSEI') return 'NIFTY50';
  if (raw === '^BSESN') return 'SENSEX';
  if (raw === '^NSEBANK') return 'BANKNIFTY';
  return raw.replace(/\.NS$/, '').replace(/\.BO$/, '');
}

/**
 * Fetch live quotes from Apify for a list of tickers
 */
async function fetchApifyQuotes(tickers = DEFAULT_INDIAN_TICKERS) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('APIFY_API_TOKEN is not configured in server .env');
  }

  const endpoint = `${APIFY_ACTOR_URL}?token=${encodeURIComponent(token)}&timeout=45`;
  const result = await postJson(endpoint, { tickers });

  if (!Array.isArray(result)) {
    return [];
  }

  const normalized = [];
  for (const item of result) {
    const rawSymbol = item.ticker || item.price_info?.symbol;
    if (!rawSymbol) continue;

    const symbol = normalizeSymbol(rawSymbol);
    const p = item.price_info || {};

    const price = typeof p.current_price === 'number' && p.current_price > 0
      ? p.current_price
      : (typeof p.previous_close === 'number' ? p.previous_close : 0);

    const change = typeof p.change === 'number' ? +p.change.toFixed(2) : 0;
    const changePct = typeof p.change_percent === 'number' ? +p.change_percent.toFixed(2) : 0;

    normalized.push({
      symbol,
      rawSymbol,
      name: item.stock_info?.shortName || item.stock_info?.longName || symbol,
      price: +price.toFixed(2),
      change,
      changePct,
      prevClose: typeof p.previous_close === 'number' ? +p.previous_close.toFixed(2) : price,
      timestamp: p.timestamp || new Date().toISOString(),
      source: 'Apify / Yahoo Finance Live',
      isRealTime: true,
    });
  }

  return normalized;
}

module.exports = {
  fetchApifyQuotes,
  DEFAULT_INDIAN_TICKERS,
};
