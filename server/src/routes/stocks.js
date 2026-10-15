const express = require('express');
const router = express.Router();
const yahooFinanceService = require('../services/yahooFinanceService');

/**
 * GET /api/stocks — list real Indian stocks from Yahoo Finance
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, sector } = req.query;
    let stocks = await yahooFinanceService.fetchStockQuotes();

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
      source: 'Yahoo Finance',
      dataSourceNote: 'Latest available Yahoo Finance data',
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
        message: `Stock ${symbol} not found on Yahoo Finance.`,
      });
    }

    res.json({
      success: true,
      source: 'Yahoo Finance',
      dataSourceNote: 'Latest available Yahoo Finance data',
      data: stock,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
