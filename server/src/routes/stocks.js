const express = require('express');
const router = express.Router();
const yahooFinanceService = require('../services/yahooFinanceService');

/**
 * GET /api/stocks — list real Indian stocks from Yahoo Finance
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, sector, refresh } = req.query;
    let stocks = await yahooFinanceService.fetchStockQuotes(refresh === 'true');

    if (q) {
      const query = q.toUpperCase();
      stocks = stocks.filter(
        (s) => s.symbol.includes(query) || s.name.toUpperCase().includes(query)
      );
    }

    if (sector) {
      stocks = stocks.filter(
        (s) => s.sector && s.sector.toLowerCase() === sector.toLowerCase()
      );
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      count: stocks.length,
      data: stocks,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stocks/:symbol — single stock detail from Yahoo Finance
 */
router.get('/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await yahooFinanceService.fetchStockDetail(symbol);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock quote for ${symbol} not found.`,
      });
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      data: stock,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stocks/:symbol/chart — historical OHLCV chart data (supports 1d, 5d, 1mo, 6mo, 1y, 2y)
 */
router.get('/:symbol/chart', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = req.query.interval || '1d';
    const range = req.query.range || '2y';

    const result = await yahooFinanceService.fetchSymbolHistory(symbol, interval, range);

    if (!result || !result.data || !result.data.length) {
      return res.status(404).json({
        success: false,
        message: `No chart data available for ${symbol} with range ${range}.`,
      });
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stocks/:symbol/history — alias for historical chart
 */
router.get('/:symbol/history', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = req.query.interval || '1d';
    const range = req.query.range || '2y';
    const result = await yahooFinanceService.fetchSymbolHistory(symbol, interval, range);

    if (!result || !result.data || !result.data.length) {
      return res.status(404).json({
        success: false,
        message: `No historical chart data available for ${symbol}.`,
      });
    }

    res.json({
      success: true,
      source: 'Live Markets',
      dataSourceNote: 'Market reference quotes',
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
