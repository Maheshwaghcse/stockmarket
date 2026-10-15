const express = require('express');
const router = express.Router();
const { getAllIndices, getIndex, getIntradayCandles, isMarketOpen, syncYahooFinanceData } = require('../services/marketDataService');
const yahooFinanceService = require('../services/yahooFinanceService');

/**
 * GET /api/market/indices
 * Returns all tracked indices with latest Yahoo Finance quotes.
 */
router.get('/indices', async (req, res, next) => {
  try {
    let indices = getAllIndices();
    if (!indices || indices.length === 0) {
      indices = await yahooFinanceService.fetchIndexQuotes();
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
      count: indices.length,
      data: indices,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/indices/:symbol
 * Returns single index quote.
 */
router.get('/indices/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let quote = getIndex(symbol);

    if (!quote) {
      quote = await yahooFinanceService.fetchIndexQuote(symbol);
    }

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: `Index ${symbol} quote not found.`,
      });
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      data: quote,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/indices/:symbol/intraday?interval=5
 * Returns real historical/intraday OHLCV candles.
 */
router.get('/indices/:symbol/intraday', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = parseInt(req.query.interval, 10) || 5;

    if (interval < 1 || interval > 60) {
      return res.status(400).json({ success: false, message: 'Interval must be 1–60 minutes.' });
    }

    const candles = await getIntradayCandles(symbol, interval);

    if (!candles || !candles.length) {
      return res.status(404).json({
        success: false,
        message: `No historical candle data available for ${symbol}.`,
      });
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      symbol,
      interval: `${interval}m`,
      count: candles.length,
      data: candles,
      lastCandleTime: candles.length > 0 ? new Date(candles[candles.length - 1].time * 1000).toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/indices/:symbol/history
 * Alias for historical data
 */
router.get('/indices/:symbol/history', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = req.query.interval || '1d';
    const chart = await yahooFinanceService.fetchIndexChart(symbol, interval);

    if (!chart || !chart.data || !chart.data.length) {
      return res.status(404).json({
        success: false,
        message: `No historical chart data available for ${symbol}.`,
      });
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      ...chart,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/chart/:symbol
 * Comprehensive historical OHLCV endpoint supporting indices and equities,
 * multiple intervals (1m, 5m, 15m, 1h, 1d) and ranges (1d, 5d, 1mo, 6mo, 1y).
 */
router.get('/chart/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol;
    const interval = req.query.interval || '5m';
    const range = req.query.range || '5d';

    const result = await yahooFinanceService.fetchSymbolHistory(symbol, interval, range);

    if (!result || !result.data || !result.data.length) {
      return res.status(404).json({
        success: false,
        message: `No chart data available for ${symbol} with interval ${interval} and range ${range}.`,
        sourceTimestamp: null,
        dataFreshness: 'Unavailable',
        count: 0,
        data: [],
      });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/gainers-losers
 * Returns top 5 gainers and losers from tracked indices/stocks.
 */
router.get('/gainers-losers', async (req, res, next) => {
  try {
    let indices = getAllIndices();
    if (!indices.length) {
      indices = await yahooFinanceService.fetchIndexQuotes();
    }

    const sorted = [...indices].sort((a, b) => (b.changePct || 0) - (a.changePct || 0));

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
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
    source: 'Live Markets',
    dataSourceNote: 'Market reference quotes',
  });
});

/**
 * POST /api/market/sync-market (and /sync-yahoo alias)
 * Triggers on-demand sync of real Indian stock market quotes.
 */
const syncHandler = async (req, res, next) => {
  try {
    const data = await syncYahooFinanceData(true);
    res.json({
      success: true,
      message: 'Successfully synchronized live market quotes',
      count: data ? data.length : 0,
      timestamp: new Date().toISOString(),
      source: 'Live Markets',
      data,
    });
  } catch (err) {
    next(err);
  }
};

router.post('/sync-market', syncHandler);
router.post('/sync-yahoo', syncHandler);
router.post('/sync-apify', syncHandler);

module.exports = router;
