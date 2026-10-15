/**
 * Yahoo Finance Market Data Service
 *
 * Integrates real market data for Indian stock market indices and equities
 * using the official unofficial yahoo-finance2 library.
 *
 * Primary Index Symbols:
 * - NIFTY 50:    ^NSEI
 * - BANK NIFTY:  ^NSEBANK
 * - SENSEX:      ^BSESN
 */

const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Configurable cache duration (default 30 seconds for quotes, 5 minutes for charts)
const QUOTE_CACHE_TTL_MS = parseInt(process.env.YAHOO_CACHE_TTL_SECONDS || '30', 10) * 1000;
const CHART_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory caches to prevent excessive upstream calls and rate limiting
let indexQuotesCache = new Map();
let lastIndexFetchTime = 0;

let stockQuotesCache = new Map();
let lastStockFetchTime = 0;

const chartCache = new Map(); // key -> { data, timestamp }
const stockDetailCache = new Map(); // key -> { data, timestamp }

// ─── Symbol Configurations ───────────────────────────────────────────────────
const INDEX_CONFIG = [
  { symbol: 'NIFTY50',     yahooSymbol: '^NSEI',                 name: 'Nifty 50',                  exchange: 'NSE' },
  { symbol: 'SENSEX',      yahooSymbol: '^BSESN',                name: 'BSE Sensex',                exchange: 'BSE' },
  { symbol: 'BANKNIFTY',   yahooSymbol: '^NSEBANK',              name: 'Nifty Bank',                exchange: 'NSE' },
  { symbol: 'FINNIFTY',    yahooSymbol: 'NIFTY_FIN_SERVICE.NS',  name: 'Nifty Financial Services',  exchange: 'NSE' },
  { symbol: 'NIFTYNEXT50', yahooSymbol: '^NSMIDCP',              name: 'Nifty Next 50',             exchange: 'NSE' },
  { symbol: 'NIFTYIT',     yahooSymbol: '^CNXIT',                name: 'Nifty IT',                  exchange: 'NSE' },
  { symbol: 'NIFTYPHARMA', yahooSymbol: '^CNXPHARMA',            name: 'Nifty Pharma',              exchange: 'NSE' },
  { symbol: 'NIFTYAUTO',   yahooSymbol: '^CNXAUTO',              name: 'Nifty Auto',                exchange: 'NSE' },
  { symbol: 'NIFTYMIDCAP', yahooSymbol: 'NIFTY_MIDCAP_100.NS',   name: 'Nifty Midcap 100',          exchange: 'NSE' },
];

const STOCK_CONFIG = [
  { symbol: 'RELIANCE',   yahooSymbol: 'RELIANCE.NS',   name: 'Reliance Industries Ltd',      sector: 'Energy',    exchange: 'NSE' },
  { symbol: 'TCS',        yahooSymbol: 'TCS.NS',        name: 'Tata Consultancy Services',    sector: 'IT',        exchange: 'NSE' },
  { symbol: 'HDFCBANK',   yahooSymbol: 'HDFCBANK.NS',   name: 'HDFC Bank Ltd',                sector: 'Banking',   exchange: 'NSE' },
  { symbol: 'INFY',       yahooSymbol: 'INFY.NS',       name: 'Infosys Ltd',                  sector: 'IT',        exchange: 'NSE' },
  { symbol: 'ICICIBANK',  yahooSymbol: 'ICICIBANK.NS',  name: 'ICICI Bank Ltd',               sector: 'Banking',   exchange: 'NSE' },
  { symbol: 'BAJFINANCE', yahooSymbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd',            sector: 'NBFC',      exchange: 'NSE' },
  { symbol: 'HINDUNILVR', yahooSymbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd',       sector: 'FMCG',      exchange: 'NSE' },
  { symbol: 'KOTAKBANK',  yahooSymbol: 'KOTAKBANK.NS',  name: 'Kotak Mahindra Bank',          sector: 'Banking',   exchange: 'NSE' },
  { symbol: 'SBIN',       yahooSymbol: 'SBIN.NS',       name: 'State Bank of India',          sector: 'Banking',   exchange: 'NSE' },
  { symbol: 'WIPRO',      yahooSymbol: 'WIPRO.NS',      name: 'Wipro Ltd',                    sector: 'IT',        exchange: 'NSE' },
  { symbol: 'ITC',        yahooSymbol: 'ITC.NS',        name: 'ITC Limited',                  sector: 'FMCG',      exchange: 'NSE' },
  { symbol: 'LT',         yahooSymbol: 'LT.NS',         name: 'Larsen & Toubro Ltd',          sector: 'Infra',     exchange: 'NSE' },
  { symbol: 'BHARTIARTL', yahooSymbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd',            sector: 'Telecom',   exchange: 'NSE' },
  { symbol: 'MARUTI',     yahooSymbol: 'MARUTI.NS',     name: 'Maruti Suzuki India Ltd',      sector: 'Auto',      exchange: 'NSE' },
  { symbol: 'AXISBANK',   yahooSymbol: 'AXISBANK.NS',   name: 'Axis Bank Ltd',                sector: 'Banking',   exchange: 'NSE' },
  { symbol: 'TATASTEEL',  yahooSymbol: 'TATASTEEL.NS',  name: 'Tata Steel Ltd',               sector: 'Metals',    exchange: 'NSE' },
];

/**
 * Check Indian Market Trading Hours (IST: 9:15 AM - 3:30 PM, Monday-Friday)
 */
function isMarketOpen() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const day = ist.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  const minutes = h * 60 + m;
  return minutes >= 555 && minutes < 930; // 9:15 - 15:30 IST
}

/**
 * Normalize and validate a quote object retrieved from Yahoo Finance
 */
function processQuote(rawQuote, configItem) {
  if (!rawQuote) return null;

  const value = rawQuote.regularMarketPrice;
  const prevClose = rawQuote.regularMarketPreviousClose || rawQuote.previousClose;

  // Validation: value must be a valid positive number
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return null;
  }

  // Exact calculations per requirements:
  // absolute change = latest price - previous close
  // percentage change = (absolute change / previous close) * 100
  let change = rawQuote.regularMarketChange;
  let changePct = rawQuote.regularMarketChangePercent;

  if (prevClose && prevClose > 0) {
    change = +(value - prevClose).toFixed(2);
    changePct = +(((value - prevClose) / prevClose) * 100).toFixed(2);
  } else if (typeof change === 'number') {
    change = +change.toFixed(2);
    changePct = typeof changePct === 'number' ? +changePct.toFixed(2) : 0;
  } else {
    change = 0;
    changePct = 0;
  }

  const dayHigh = typeof rawQuote.regularMarketDayHigh === 'number' ? rawQuote.regularMarketDayHigh : value;
  const dayLow = typeof rawQuote.regularMarketDayLow === 'number' ? rawQuote.regularMarketDayLow : value;
  const open = typeof rawQuote.regularMarketOpen === 'number' ? rawQuote.regularMarketOpen : prevClose || value;
  const volume = typeof rawQuote.regularMarketVolume === 'number' ? rawQuote.regularMarketVolume : 0;

  return {
    symbol: configItem.symbol,
    yahooSymbol: configItem.yahooSymbol,
    name: configItem.name || rawQuote.shortName || rawQuote.longName || configItem.symbol,
    exchange: configItem.exchange || (rawQuote.exchange === 'BSE' ? 'BSE' : 'NSE'),
    sector: configItem.sector || null,
    value: +value.toFixed(2),
    price: +value.toFixed(2),
    change,
    changePct,
    open: +open.toFixed(2),
    prevClose: prevClose ? +prevClose.toFixed(2) : +value.toFixed(2),
    dayHigh: +dayHigh.toFixed(2),
    dayLow: +dayLow.toFixed(2),
    volume,
    timestamp: rawQuote.regularMarketTime ? new Date(rawQuote.regularMarketTime).toISOString() : new Date().toISOString(),
    sourceTimestamp: rawQuote.regularMarketTime ? new Date(rawQuote.regularMarketTime).toISOString() : null,
    lastUpdate: new Date().toISOString(),
    marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
    isDemo: false,
    source: 'Yahoo Finance',
    dataSourceNote: 'Latest available Yahoo Finance data',
  };
}

/**
 * Fetch all tracked index quotes from Yahoo Finance
 */
async function fetchIndexQuotes(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && indexQuotesCache.size > 0 && now - lastIndexFetchTime < QUOTE_CACHE_TTL_MS) {
    return Array.from(indexQuotesCache.values());
  }

  try {
    const promises = INDEX_CONFIG.map(async (item) => {
      try {
        const raw = await yf.quote(item.yahooSymbol);
        const processed = processQuote(raw, item);
        if (processed) {
          indexQuotesCache.set(item.symbol, processed);
        }
      } catch (err) {
        console.warn(`[YahooFinance] Failed to fetch index ${item.symbol} (${item.yahooSymbol}):`, err.message);
        // Retain existing cached quote if available
      }
    });

    await Promise.all(promises);
    lastIndexFetchTime = now;
  } catch (err) {
    console.error('[YahooFinance] Batch fetch error for indices:', err.message);
  }

  return Array.from(indexQuotesCache.values());
}

/**
 * Get a single index quote by symbol
 */
async function fetchIndexQuote(symbol, forceRefresh = false) {
  const upper = symbol.toUpperCase();
  const config = INDEX_CONFIG.find((c) => c.symbol === upper);
  if (!config) return null;

  const now = Date.now();
  const cached = indexQuotesCache.get(upper);
  if (!forceRefresh && cached && now - lastIndexFetchTime < QUOTE_CACHE_TTL_MS) {
    return cached;
  }

  try {
    const raw = await yf.quote(config.yahooSymbol);
    const processed = processQuote(raw, config);
    if (processed) {
      indexQuotesCache.set(upper, processed);
      return processed;
    }
  } catch (err) {
    console.error(`[YahooFinance] Error fetching index ${symbol}:`, err.message);
  }

  return cached || null;
}

function resolveSymbolConfig(symbol) {
  const upper = (symbol || '').toUpperCase().trim();
  let found = INDEX_CONFIG.find((c) => c.symbol === upper || c.yahooSymbol.toUpperCase() === upper);
  if (found) return found;
  found = STOCK_CONFIG.find((c) => c.symbol === upper || c.yahooSymbol.toUpperCase() === upper);
  if (found) return found;
  if (upper === '^NSEI') return { symbol: 'NIFTY50', yahooSymbol: '^NSEI', name: 'Nifty 50', exchange: 'NSE' };
  if (upper === '^NSEBANK') return { symbol: 'BANKNIFTY', yahooSymbol: '^NSEBANK', name: 'Nifty Bank', exchange: 'NSE' };
  if (upper === '^BSESN') return { symbol: 'SENSEX', yahooSymbol: '^BSESN', name: 'BSE Sensex', exchange: 'BSE' };
  return {
    symbol: upper,
    yahooSymbol: upper.endsWith('.NS') || upper.endsWith('.BO') || upper.startsWith('^') ? upper : `${upper}.NS`,
    name: upper,
    exchange: 'NSE',
  };
}

/**
 * Fetch historical/intraday chart candles from Yahoo Finance
 * Supports indices, equities, multiple intervals (1m, 5m, 15m, 1h, 1d) and ranges (1d, 5d, 1mo, 6mo, 1y).
 * Returns { symbol, yahooSymbol, name, interval, range, count, data, lastCandleTime, sourceTimestamp, dataFreshness, isMarketOpen }
 */
async function fetchSymbolHistory(symbol, interval = '5m', range = '5d', forceRefresh = false) {
  const config = resolveSymbolConfig(symbol);
  if (!config) return null;

  // Clean interval and range
  let cleanInterval = (interval || '5m').toLowerCase();
  if (cleanInterval === '1h') cleanInterval = '60m';
  if (cleanInterval === 'd') cleanInterval = '1d';
  if (['1', '5', '15', '30', '60'].includes(cleanInterval)) cleanInterval = `${cleanInterval}m`;

  let cleanRange = (range || '5d').toLowerCase();

  // Enforce Yahoo Finance limits
  let daysBack = 5;
  if (cleanRange === '1d') daysBack = 2;
  else if (cleanRange === '5d') daysBack = 5;
  else if (cleanRange === '1mo' || cleanRange === '1m') daysBack = 30;
  else if (cleanRange === '3mo' || cleanRange === '3m') daysBack = 90;
  else if (cleanRange === '6mo' || cleanRange === '6m') daysBack = 180;
  else if (cleanRange === '1y') daysBack = 365;
  else if (cleanRange === '2y') daysBack = 730;
  else if (cleanRange === '5y') daysBack = 1825;

  // Yahoo limits: 1m max 7d; other intraday max 59d
  let note = null;
  if (cleanInterval === '1m' && daysBack > 7) {
    daysBack = 7;
    note = '1m intraday data capped to 7 days maximum';
  } else if (['5m', '15m', '30m', '60m'].includes(cleanInterval) && daysBack > 59) {
    // If range is large (e.g. 6mo or 1y), switch to 1d candles
    cleanInterval = '1d';
    note = 'Switched to 1d interval for extended historical range';
  }

  const cacheKey = `${config.symbol}_${cleanInterval}_${cleanRange}`;
  const now = Date.now();
  const cached = chartCache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.timestamp < CHART_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const period1 = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const res = await yf.chart(config.yahooSymbol, { period1, interval: cleanInterval });

    if (!res || !Array.isArray(res.quotes) || res.quotes.length === 0) {
      return cached ? cached.data : null;
    }

    const candles = [];
    const seenTimes = new Set();

    for (const q of res.quotes) {
      if (!q.date) continue;
      const t = Math.floor(new Date(q.date).getTime() / 1000);

      const o = typeof q.open === 'number' ? q.open : null;
      const h = typeof q.high === 'number' ? q.high : null;
      const l = typeof q.low === 'number' ? q.low : null;
      const c = typeof q.close === 'number' ? q.close : null;

      if (o === null || h === null || l === null || c === null) continue;
      if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) continue;

      if (seenTimes.has(t)) continue;
      seenTimes.add(t);

      candles.push({
        time: t,
        open: +o.toFixed(2),
        high: +h.toFixed(2),
        low: +l.toFixed(2),
        close: +c.toFixed(2),
        volume: typeof q.volume === 'number' ? q.volume : 0,
      });
    }

    candles.sort((a, b) => a.time - b.time);

    const openStatus = isMarketOpen();
    const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
    const lastCandleIso = lastCandle ? new Date(lastCandle.time * 1000).toISOString() : null;

    let dataFreshness = openStatus ? 'Live Session (~15m delay)' : 'Market Closed (Latest Session Close)';
    if (lastCandle) {
      const minutesAgo = Math.round((Date.now() - lastCandle.time * 1000) / 60000);
      if (minutesAgo < 60) {
        dataFreshness = `Updated ${minutesAgo}m ago`;
      }
    }

    const result = {
      symbol: config.symbol,
      yahooSymbol: config.yahooSymbol,
      name: config.name,
      exchange: config.exchange,
      interval: cleanInterval,
      range: cleanRange,
      count: candles.length,
      data: candles,
      lastCandleTime: lastCandleIso,
      sourceTimestamp: lastCandleIso,
      dataFreshness,
      isMarketOpen: openStatus,
      note,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      updatedAt: new Date().toISOString(),
    };

    chartCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  } catch (err) {
    console.error(`[YahooFinance] Historical data error for ${symbol}:`, err.message);
    if (cached) return cached.data;
    return null;
  }
}

/**
 * Fetch historical/intraday chart candles from Yahoo Finance (backward compatible wrapper)
 */
async function fetchIndexChart(symbol, interval = '5m', forceRefresh = false) {
  let range = '5d';
  if (interval === '1d' || interval === 'D') range = '6mo';
  if (interval === '15m') range = '15d';
  return fetchSymbolHistory(symbol, interval, range, forceRefresh);
}

/**
 * Fetch all tracked stock quotes from Yahoo Finance
 */
async function fetchStockQuotes(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && stockQuotesCache.size > 0 && now - lastStockFetchTime < QUOTE_CACHE_TTL_MS) {
    return Array.from(stockQuotesCache.values());
  }

  try {
    const promises = STOCK_CONFIG.map(async (item) => {
      try {
        const raw = await yf.quote(item.yahooSymbol);
        const processed = processQuote(raw, item);
        if (processed) {
          stockQuotesCache.set(item.symbol, processed);
        }
      } catch (err) {
        console.warn(`[YahooFinance] Failed to fetch stock ${item.symbol}:`, err.message);
      }
    });

    await Promise.all(promises);
    lastStockFetchTime = now;
  } catch (err) {
    console.error('[YahooFinance] Batch fetch error for stocks:', err.message);
  }

  return Array.from(stockQuotesCache.values());
}

/**
 * Fetch single stock detail including valuation metrics from Yahoo Finance
 */
async function fetchStockDetail(symbol, forceRefresh = false) {
  const upper = symbol.toUpperCase();
  const config = STOCK_CONFIG.find((c) => c.symbol === upper);
  if (!config) return null;

  const now = Date.now();
  const cached = stockDetailCache.get(upper);
  if (!forceRefresh && cached && now - cached.timestamp < QUOTE_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const raw = await yf.quote(config.yahooSymbol);
    const base = processQuote(raw, config);
    if (!base) return cached ? cached.data : null;

    const detail = {
      ...base,
      pe: typeof raw.trailingPE === 'number' ? +raw.trailingPE.toFixed(1) : (raw.forwardPE ? +raw.forwardPE.toFixed(1) : null),
      pb: typeof raw.priceToBook === 'number' ? +raw.priceToBook.toFixed(2) : null,
      marketCap: typeof raw.marketCap === 'number' ? raw.marketCap : null,
      fiftyTwoWeekHigh: typeof raw.fiftyTwoWeekHigh === 'number' ? +raw.fiftyTwoWeekHigh.toFixed(2) : null,
      fiftyTwoWeekLow: typeof raw.fiftyTwoWeekLow === 'number' ? +raw.fiftyTwoWeekLow.toFixed(2) : null,
    };

    stockDetailCache.set(upper, { data: detail, timestamp: now });
    return detail;
  } catch (err) {
    console.error(`[YahooFinance] Error fetching stock detail for ${symbol}:`, err.message);
    if (cached) return cached.data;
    return null;
  }
}

module.exports = {
  fetchIndexQuotes,
  fetchIndexQuote,
  fetchIndexChart,
  fetchSymbolHistory,
  resolveSymbolConfig,
  fetchStockQuotes,
  fetchStockDetail,
  isMarketOpen,
  INDEX_CONFIG,
  STOCK_CONFIG,
};
