const express = require('express');
const router = express.Router();

// Stocks route — placeholder for licensed data provider integration
// Individual stock quotes require a separate licensed feed (e.g. Kite Connect, Upstox).
// Demo mode returns clearly labelled mock data.

const DEMO_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE', price: 2985.50, change: 12.30, changePct: 0.41 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE', price: 4210.00, change: -25.00, changePct: -0.59 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', exchange: 'NSE', price: 1890.75, change: 8.50, changePct: 0.45 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', exchange: 'NSE', price: 1845.20, change: -5.80, changePct: -0.31 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', exchange: 'NSE', price: 1356.40, change: 15.20, changePct: 1.13 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC', exchange: 'NSE', price: 7540.00, change: -30.00, changePct: -0.40 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', exchange: 'NSE', price: 2450.00, change: 18.00, changePct: 0.74 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', exchange: 'NSE', price: 1980.00, change: 5.00, changePct: 0.25 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE', price: 845.30, change: 9.70, changePct: 1.16 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', exchange: 'NSE', price: 562.00, change: -3.50, changePct: -0.62 },
];

/**
 * GET /api/stocks — list demo stocks
 */
router.get('/', (req, res) => {
  const { q, sector } = req.query;
  let stocks = DEMO_STOCKS;
  if (q) stocks = stocks.filter(s => s.symbol.includes(q.toUpperCase()) || s.name.toLowerCase().includes(q.toLowerCase()));
  if (sector) stocks = stocks.filter(s => s.sector.toLowerCase() === sector.toLowerCase());

  res.json({
    success: true,
    isDemo: true,
    warning: 'DEMO DATA — not real market prices.',
    count: stocks.length,
    data: stocks,
  });
});

/**
 * GET /api/stocks/:symbol — single stock detail
 */
router.get('/:symbol', (req, res) => {
  const stock = DEMO_STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ success: false, message: 'Stock not found in demo set.' });

  res.json({
    success: true,
    isDemo: true,
    warning: 'DEMO DATA — not real market prices.',
    data: {
      ...stock,
      open: +(stock.price * 0.998).toFixed(2),
      prevClose: +(stock.price - stock.change).toFixed(2),
      dayHigh: +(stock.price * 1.005).toFixed(2),
      dayLow: +(stock.price * 0.993).toFixed(2),
      volume: Math.floor(Math.random() * 5000000) + 500000,
      marketCap: Math.floor(stock.price * Math.random() * 1e9),
      pe: +(Math.random() * 30 + 10).toFixed(1),
      pb: +(Math.random() * 5 + 1).toFixed(2),
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
