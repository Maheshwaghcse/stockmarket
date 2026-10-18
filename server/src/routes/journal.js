const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const { protect } = require('../middleware/auth');
const { computeJournalAnalytics } = require('../utils/journalAnalytics');

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

    // Compute comprehensive analytics, streaks, extremes, and curves
    const analytics = computeJournalAnalytics(trades);

    // Daily breakdown for Heatmap and Monthly Calendar
    const calendarMap = {};

    trades.forEach((trade) => {
      const dateKey = new Date(trade.entryDate).toISOString().split('T')[0];

      if (!calendarMap[dateKey]) {
        calendarMap[dateKey] = {
          date: dateKey,
          pnl: 0,
          count: 0,
          wins: 0,
          losses: 0,
          trades: [],
        };
      }
      const pnl = trade.pnl || 0;
      calendarMap[dateKey].count += 1;
      calendarMap[dateKey].pnl = +(calendarMap[dateKey].pnl + pnl).toFixed(2);
      if (trade.status === 'CLOSED') {
        if (pnl > 0) calendarMap[dateKey].wins += 1;
        else if (pnl < 0) calendarMap[dateKey].losses += 1;
      }

      calendarMap[dateKey].trades.push({
        id: trade._id,
        _id: trade._id,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        lotSize: trade.lotSize || trade.quantity,
        entryDate: trade.entryDate,
        exitDate: trade.exitDate,
        pnl,
        pnlPercent: trade.pnlPercent || 0,
        status: trade.status,
        imageUrl: trade.imageUrl || null,
        entryReason: trade.entryReason || '',
        exitReason: trade.exitReason || '',
        lessonLearned: trade.lessonLearned || '',
        tags: trade.tags || [],
        position: trade.position || 'Intraday',
        time: trade.time || '',
        instrumentType: trade.instrumentType || 'Equity',
        strategy: trade.strategy || '',
        stopLoss: trade.stopLoss || null,
        takeProfit: trade.takeProfit || null,
        riskReward: trade.riskReward || '',
        assumptions: trade.assumptions || '',
        disciplined: trade.disciplined || 'Y',
        followedRules: trade.followedRules || 'Y',
        rating: trade.rating !== undefined ? trade.rating : 5,
        chartNotes: trade.chartNotes || '',
      });
    });

    const closedTradesCount = analytics.closedTradesCount;
    const avgPnl = closedTradesCount > 0 ? +(analytics.netPnl / closedTradesCount).toFixed(2) : 0;
    const riskReward =
      Math.abs(analytics.avgLoser) > 0
        ? +(analytics.avgWinner / Math.abs(analytics.avgLoser)).toFixed(2)
        : analytics.avgWinner > 0
        ? 1
        : 0;

    res.json({
      success: true,
      data: trades,
      stats: {
        totalTrades: trades.length,
        closedTrades: closedTradesCount,
        openTrades: trades.length - closedTradesCount,
        totalPnl: analytics.netPnl,
        winCount: analytics.winCount,
        lossCount: analytics.lossCount,
        winRate: analytics.winRate,
        lossRate: analytics.lossRate,
        biggestWin: analytics.highestProfitTrade ? analytics.highestProfitTrade.pnl : 0,
        biggestLoss: analytics.lowestProfitTrade ? analytics.lowestProfitTrade.pnl : 0,
        avgWinner: analytics.avgWinner,
        avgLoser: analytics.avgLoser,
        avgPnl,
        riskReward,
        profitFactor: analytics.profitFactor,
        maxDrawdown: analytics.maxDrawdown,
        highestProfitTrade: analytics.highestProfitTrade,
        lowestProfitTrade: analytics.lowestProfitTrade,
        longestWinStreak: analytics.longestWinStreak,
        longestWinStreakPnl: analytics.longestWinStreakPnl,
        longestLossStreak: analytics.longestLossStreak,
        longestLossStreakPnl: analytics.longestLossStreakPnl,
        currentStreak: analytics.currentStreak,
      },
      analytics,
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
      lotSize,
      imageUrl,
      entryReason,
      exitReason,
      lessonLearned,
      tags,
      position,
      time,
      instrumentType,
      strategy,
      stopLoss,
      takeProfit,
      riskReward,
      assumptions,
      disciplined,
      followedRules,
      rating,
      chartNotes,
    } = req.body;

    const parsedQty = parseInt(quantity || lotSize || 1, 10);

    if (!symbol || !entryPrice || !parsedQty) {
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
      quantity: parsedQty,
      lotSize: lotSize ? parseInt(lotSize, 10) : parsedQty,
      imageUrl: imageUrl || null,
      entryReason: entryReason || '',
      exitReason: exitReason || '',
      lessonLearned: lessonLearned || '',
      tags: Array.isArray(tags) ? tags : [],
      position: position || 'Intraday',
      time: time || '',
      instrumentType: instrumentType || 'Equity',
      strategy: strategy || '',
      stopLoss: stopLoss !== undefined && stopLoss !== '' && stopLoss !== null ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit !== undefined && takeProfit !== '' && takeProfit !== null ? parseFloat(takeProfit) : null,
      riskReward: riskReward || '',
      assumptions: assumptions || '',
      disciplined: disciplined || 'Y',
      followedRules: followedRules || 'Y',
      rating: rating ? parseInt(rating, 10) : 5,
      chartNotes: chartNotes || '',
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
      'entryPrice', 'exitPrice', 'quantity', 'lotSize', 'imageUrl',
      'entryReason', 'exitReason', 'lessonLearned', 'tags',
      'position', 'time', 'instrumentType', 'strategy',
      'stopLoss', 'takeProfit', 'riskReward', 'assumptions',
      'disciplined', 'followedRules', 'rating', 'chartNotes',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'symbol') trade.symbol = req.body[field].toUpperCase().trim();
        else if (field === 'entryPrice' || field === 'exitPrice' || field === 'stopLoss' || field === 'takeProfit') {
          trade[field] = req.body[field] !== '' && req.body[field] !== null ? parseFloat(req.body[field]) : null;
        } else if (field === 'quantity' || field === 'lotSize' || field === 'rating') {
          trade[field] = req.body[field] !== '' && req.body[field] !== null ? parseInt(req.body[field], 10) : trade[field];
        } else {
          trade[field] = req.body[field];
        }
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
