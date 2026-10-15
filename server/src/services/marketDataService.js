/**
 * Market Data Service — Demo Mode
 *
 * Generates realistic mock data for NSE/BSE indices.
 * All values are clearly labelled DEMO — never presented as live.
 *
 * For production: replace the mock feed with a licensed provider
 * (e.g. Upstox, Zerodha Kite Connect, Angel One SmartAPI, or NSE/BSE data feeds).
 * Confirm redistribution rights before enabling live display.
 */

const { getIO } = require('../socket');

// ─── Base data for major Indian indices ──────────────────────────────────────
const INDEX_SEEDS = [
  { symbol: 'NIFTY50',      name: 'Nifty 50',                exchange: 'NSE', base: 24500 },
  { symbol: 'SENSEX',       name: 'BSE Sensex',              exchange: 'BSE', base: 80500 },
  { symbol: 'BANKNIFTY',    name: 'Nifty Bank',              exchange: 'NSE', base: 52000 },
  { symbol: 'FINNIFTY',     name: 'Nifty Financial Services', exchange: 'NSE', base: 23200 },
  { symbol: 'NIFTYNEXT50',  name: 'Nifty Next 50',           exchange: 'NSE', base: 71000 },
  { symbol: 'NIFTYIT',      name: 'Nifty IT',                exchange: 'NSE', base: 40000 },
  { symbol: 'NIFTYPHARMA',  name: 'Nifty Pharma',            exchange: 'NSE', base: 22000 },
  { symbol: 'NIFTYAUTO',    name: 'Nifty Auto',              exchange: 'NSE', base: 24000 },
  { symbol: 'NIFTYMIDCAP',  name: 'Nifty Midcap 100',        exchange: 'NSE', base: 57000 },
  { symbol: 'NIFTYSMALL',   name: 'Nifty Smallcap 100',      exchange: 'NSE', base: 18500 },
];

// ─── In-memory cache of latest index quotes ──────────────────────────────────
const indexCache = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function gaussian(mean = 0, std = 1) {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function isMarketOpen() {
  // IST = UTC+5:30
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const day = ist.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  const minutes = h * 60 + m;
  return minutes >= 555 && minutes < 930; // 9:15 – 15:30 IST
}

function buildQuote(seed, prevClose) {
  const pctChange = gaussian(0, 0.08); // ±0.08% per tick
  const value = +(prevClose * (1 + pctChange / 100)).toFixed(2);
  const change = +(value - seed.prevClose).toFixed(2);
  const changePct = +((change / seed.prevClose) * 100).toFixed(2);

  // Update session high/low
  if (value > seed.dayHigh) seed.dayHigh = value;
  if (value < seed.dayLow)  seed.dayLow  = value;

  return {
    symbol: seed.symbol,
    name: seed.name,
    exchange: seed.exchange,
    value,
    change,
    changePct,
    open: seed.open,
    prevClose: seed.prevClose,
    dayHigh: seed.dayHigh,
    dayLow: seed.dayLow,
    timestamp: new Date().toISOString(),
    marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
    isDemo: true, // ⚠️  ALWAYS true in demo mode — never remove
  };
}

// ─── Initialize seeds ─────────────────────────────────────────────────────────
function initSeeds() {
  INDEX_SEEDS.forEach((idx) => {
    const noise = gaussian(0, 0.5);
    const open  = +(idx.base * (1 + noise / 100)).toFixed(2);
    idx.prevClose = +(idx.base * (1 + gaussian(0, 0.3) / 100)).toFixed(2);
    idx.open      = open;
    idx.dayHigh   = open;
    idx.dayLow    = open;
    idx.current   = open;

    const quote = buildQuote(idx, open);
    indexCache.set(idx.symbol, quote);
  });
}

// ─── Tick — update one index ──────────────────────────────────────────────────
function tick() {
  try {
    const io = getIO();
    INDEX_SEEDS.forEach((seed) => {
      const prev = indexCache.get(seed.symbol)?.value ?? seed.current;
      const quote = buildQuote(seed, prev);
      indexCache.set(seed.symbol, quote);

      // Emit to subscribers of this index room
      io.to(`index:${seed.symbol}`).emit('index:update', quote);
    });

    // Also broadcast all at once on the market:tick event
    io.emit('market:tick', Object.fromEntries(indexCache));
  } catch {
    // Socket not yet initialized — normal during startup
  }
}

function updateIndexSeedPrices(realQuotes = []) {
  for (const q of realQuotes) {
    const seed = INDEX_SEEDS.find((s) => s.symbol === q.symbol);
    if (seed && q.price) {
      seed.base = q.price;
      seed.prevClose = q.prevClose || q.price;
      seed.current = q.price;
      const quote = buildQuote(seed, q.price);
      quote.isRealTime = true;
      quote.source = q.source || 'Apify Live';
      indexCache.set(seed.symbol, quote);
    }
  }
}

async function syncWithApify() {
  const { fetchApifyQuotes } = require('./apifyMarketService');
  const quotes = await fetchApifyQuotes();
  if (quotes && quotes.length) {
    updateIndexSeedPrices(quotes);
    try {
      const { updateStockPrices } = require('../routes/stocks');
      updateStockPrices(quotes);
    } catch {}
    console.log(`✅ Apify market data sync successful: updated ${quotes.length} instruments with live data`);
  }
  return quotes;
}

// ─── Public API ──────────────────────────────────────────────────────────────
let tickInterval = null;

function startMarketDataService() {
  initSeeds();

  const mode = process.env.MARKET_DATA_MODE || 'demo';

  if (mode === 'apify') {
    tickInterval = setInterval(tick, 2000);
    console.log('📊 Market data service running in APIFY mode (Real Indian market data + WebSockets)');
    syncWithApify().catch((err) => {
      console.warn('⚠️  Initial Apify sync note (using cached baseline):', err.message);
    });
    // Periodic refresh every 10 minutes to stay fresh without exhausting credits
    setInterval(() => {
      syncWithApify().catch(() => {});
    }, 10 * 60 * 1000);
  } else if (mode === 'demo') {
    // Tick every 2 seconds in demo mode
    tickInterval = setInterval(tick, 2000);
    console.log('📊 Market data service started in DEMO mode (mock data, 2 s tick)');
    console.log('⚠️  DEMO data is NOT real market data. Label clearly in the UI.');
  } else {
    // Placeholder for real provider integration
    console.log('📊 Live market data mode selected — provider integration required.');
  }
}

function stopMarketDataService() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function getAllIndices() {
  return Array.from(indexCache.values());
}

function getIndex(symbol) {
  return indexCache.get(symbol.toUpperCase()) || null;
}

/**
 * Generate intraday candles for a given symbol (mock).
 * Returns OHLCV data from market open to now (or close).
 */
function getIntradayCandles(symbol, intervalMinutes = 5) {
  const seed = INDEX_SEEDS.find((s) => s.symbol === symbol);
  if (!seed) return [];

  const candles = [];
  const base = seed.prevClose || seed.base;

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  // Start from 9:15 IST today
  const startIst = new Date(ist);
  startIst.setUTCHours(3, 45, 0, 0); // 9:15 IST = 03:45 UTC

  let price = base;
  const totalMinutes = Math.min(
    (ist - startIst) / 60000,
    375 // full session (9:15 – 15:30 = 375 min)
  );

  for (let i = 0; i < totalMinutes; i += intervalMinutes) {
    const t = new Date(startIst.getTime() + i * 60000);
    const o = +price.toFixed(2);
    const moves = Array.from({ length: intervalMinutes }, () => gaussian(0, 0.06));
    moves.forEach((m) => { price = price * (1 + m / 100); });
    const c = +price.toFixed(2);
    const h = +(Math.max(o, c) * (1 + Math.abs(gaussian(0, 0.03)) / 100)).toFixed(2);
    const l = +(Math.min(o, c) * (1 - Math.abs(gaussian(0, 0.03)) / 100)).toFixed(2);
    const v = Math.floor(Math.abs(gaussian(500000, 200000)));

    candles.push({ time: Math.floor(t.getTime() / 1000), open: o, high: h, low: l, close: c, volume: v });
  }

  return candles;
}

module.exports = {
  startMarketDataService,
  stopMarketDataService,
  getAllIndices,
  getIndex,
  getIntradayCandles,
  isMarketOpen,
  syncWithApify,
};
