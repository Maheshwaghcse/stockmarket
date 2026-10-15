const express = require('express');
const router = express.Router();
const { getAllIndices, getIndex, getIntradayCandles, isMarketOpen } = require('../services/marketDataService');

/**
 * GET /api/market/indices
 * Returns all tracked indices with latest quotes.
 * Always includes isDemo flag — UI must display it.
 */
router.get('/indices', (req, res) => {
  const indices = getAllIndices();
  res.json({
    success: true,
    isDemo: true,
    marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
    count: indices.length,
    data: indices,
    updatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/market/indices/:symbol
 * Returns single index quote.
 */
router.get('/indices/:symbol', (req, res) => {
  const quote = getIndex(req.params.symbol.toUpperCase());
  if (!quote) {
    return res.status(404).json({ success: false, message: 'Index not found.' });
  }
  res.json({ success: true, isDemo: true, data: quote });
});

/**
 * GET /api/market/indices/:symbol/intraday?interval=5
 * Returns OHLCV candles for intraday chart.
 */
router.get('/indices/:symbol/intraday', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const interval = parseInt(req.query.interval, 10) || 5;

  if (interval < 1 || interval > 60) {
    return res.status(400).json({ success: false, message: 'Interval must be 1–60 minutes.' });
  }

  const candles = getIntradayCandles(symbol, interval);
  if (!candles.length) {
    return res.status(404).json({ success: false, message: 'Symbol not found or no data yet.' });
  }

  res.json({
    success: true,
    isDemo: true,
    symbol,
    interval,
    count: candles.length,
    data: candles,
  });
});

/**
 * GET /api/market/gainers-losers
 * Returns top 5 gainers and losers from tracked indices.
 */
router.get('/gainers-losers', (req, res) => {
  const indices = getAllIndices().sort((a, b) => b.changePct - a.changePct);
  res.json({
    success: true,
    isDemo: true,
    gainers: indices.slice(0, 5),
    losers: indices.slice(-5).reverse(),
  });
});

/**
 * GET /api/market/status
 * Returns current market session status.
 */
router.get('/status', (req, res) => {
  const open = isMarketOpen();
  res.json({
    success: true,
    marketStatus: open ? 'OPEN' : 'CLOSED',
    exchange: 'NSE/BSE',
    timezone: 'Asia/Kolkata',
    timestamp: new Date().toISOString(),
    isDemo: true,
  });
});

/**
 * POST /api/market/sync-apify
 * Triggers on-demand sync of real Indian stock market quotes via Apify.
 */
router.post('/sync-apify', async (req, res, next) => {
  try {
    const { syncWithApify } = require('../services/marketDataService');
    const data = await syncWithApify();
    res.json({
      success: true,
      message: 'Successfully synchronized live market quotes from Apify',
      count: data ? data.length : 0,
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/apify-live
 * Direct fetch of real-time quotes using Apify without mutating cache.
 */
router.get('/apify-live', async (req, res, next) => {
  try {
    const { fetchApifyQuotes } = require('../services/apifyMarketService');
    const quotes = await fetchApifyQuotes();
    res.json({
      success: true,
      provider: 'Apify (architjn/yahoo-finance)',
      count: quotes.length,
      timestamp: new Date().toISOString(),
      data: quotes,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
