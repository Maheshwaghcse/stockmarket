const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const { protect } = require('../middleware/auth');

// ─── GET /api/journal — get all trades and computed statistics ────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const { from, to, symbol, type, status } = req.query;
    const filter = { user: req.user._id };

    if (symbol) filter.symbol = symbol.toUpperCase().trim();
    if (type) filter.tradeType = type;
    if (status) filter.status = status.toUpperCase();

    if (from || to) {
      filter.entryDate = {};
      if (from) filter.entryDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.entryDate.$lte = toDate;
      }
    }

    const trades = await Trade.find(filter).sort({ entryDate: -1 });

    // Compute statistics across trades
    let totalPnl = 0;
    let winCount = 0;
    let lossCount = 0;
    let totalWinPnl = 0;
    let totalLossPnl = 0;
    let biggestWin = 0;
    let biggestLoss = 0;

    // Daily breakdown for Heatmap and Monthly Calendar
    const calendarMap = {};

    trades.forEach((trade) => {
      const dateKey = new Date(trade.entryDate).toISOString().split('T')[0];

      if (!calendarMap[dateKey]) {
        calendarMap[dateKey] = { date: dateKey, pnl: 0, count: 0, trades: [] };
      }
      calendarMap[dateKey].count += 1;
      calendarMap[dateKey].pnl += trade.pnl || 0;
      calendarMap[dateKey].trades.push({
        id: trade._id,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        pnl: trade.pnl,
        pnlPercent: trade.pnlPercent,
      });

      if (trade.status === 'CLOSED') {
        const pnl = trade.pnl || 0;
        totalPnl += pnl;

        if (pnl > 0) {
          winCount++;
          totalWinPnl += pnl;
          if (pnl > biggestWin) biggestWin = pnl;
        } else if (pnl < 0) {
          lossCount++;
          totalLossPnl += pnl;
          if (pnl < biggestLoss) biggestLoss = pnl;
        }
      }
    });

    const closedTradesCount = winCount + lossCount;
    const winRate = closedTradesCount > 0 ? +((winCount / closedTradesCount) * 100).toFixed(1) : 0;
    const avgWinner = winCount > 0 ? +(totalWinPnl / winCount).toFixed(2) : 0;
    const avgLoser = lossCount > 0 ? +(totalLossPnl / lossCount).toFixed(2) : 0;
    const avgPnl = closedTradesCount > 0 ? +(totalPnl / closedTradesCount).toFixed(2) : 0;
    const riskReward = Math.abs(avgLoser) > 0 ? +(avgWinner / Math.abs(avgLoser)).toFixed(2) : (avgWinner > 0 ? 1 : 0);

    res.json({
      success: true,
      data: trades,
      stats: {
        totalTrades: trades.length,
        closedTrades: closedTradesCount,
        openTrades: trades.length - closedTradesCount,
        totalPnl: +totalPnl.toFixed(2),
        winCount,
        lossCount,
        winRate,
        biggestWin: +biggestWin.toFixed(2),
        biggestLoss: +biggestLoss.toFixed(2),
        avgWinner,
        avgLoser,
        avgPnl,
        riskReward,
      },
      calendarMap,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/journal — create new trade ────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      symbol,
      tradeType,
      entryDate,
      exitDate,
      entryPrice,
      exitPrice,
      quantity,
      imageUrl,
      entryReason,
      exitReason,
      lessonLearned,
      tags,
    } = req.body;

    if (!symbol || !entryPrice || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Symbol, entry price, and quantity are required.',
      });
    }

    const trade = new Trade({
      user: req.user._id,
      symbol: symbol.toUpperCase().trim(),
      tradeType: tradeType || 'Long',
      entryDate: entryDate ? new Date(entryDate) : new Date(),
      exitDate: exitDate ? new Date(exitDate) : null,
      entryPrice: parseFloat(entryPrice),
      exitPrice: exitPrice !== undefined && exitPrice !== '' && exitPrice !== null ? parseFloat(exitPrice) : null,
      quantity: parseInt(quantity, 10),
      imageUrl: imageUrl || null,
      entryReason: entryReason || '',
      exitReason: exitReason || '',
      lessonLearned: lessonLearned || '',
      tags: Array.isArray(tags) ? tags : [],
    });

    await trade.save();

    res.status(201).json({
      success: true,
      message: 'Trade recorded successfully',
      data: trade,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/journal/:id — single trade detail ──────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, user: req.user._id });
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found.' });
    }
    res.json({ success: true, data: trade });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/journal/:id — update trade ─────────────────────────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, user: req.user._id });
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found.' });
    }

    const updatable = [
      'symbol', 'tradeType', 'entryDate', 'exitDate',
      'entryPrice', 'exitPrice', 'quantity', 'imageUrl',
      'entryReason', 'exitReason', 'lessonLearned', 'tags',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'symbol') trade.symbol = req.body[field].toUpperCase().trim();
        else if (field === 'entryPrice' || field === 'exitPrice') trade[field] = req.body[field] ? parseFloat(req.body[field]) : null;
        else if (field === 'quantity') trade[field] = parseInt(req.body[field], 10);
        else trade[field] = req.body[field];
      }
    });

    await trade.save();

    res.json({
      success: true,
      message: 'Trade updated successfully',
      data: trade,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/journal/:id — remove trade ─────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const trade = await Trade.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found.' });
    }
    res.json({ success: true, message: 'Trade deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
