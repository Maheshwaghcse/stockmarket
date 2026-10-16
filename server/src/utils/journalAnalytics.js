/**
 * Trading Journal Analytics Engine
 * Computes streaks, extremes (highest/lowest profits), equity curve, and distributions.
 */

function computeJournalAnalytics(trades = []) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      closedTradesCount: 0,
      winCount: 0,
      lossCount: 0,
      winRate: 0,
      lossRate: 0,
      totalWinPnl: 0,
      totalLossPnl: 0,
      netPnl: 0,
      avgWinner: 0,
      avgLoser: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      highestProfitTrade: null,
      lowestProfitTrade: null,
      longestWinStreak: 0,
      longestWinStreakPnl: 0,
      longestLossStreak: 0,
      longestLossStreakPnl: 0,
      currentStreak: { type: 'NONE', count: 0, pnl: 0 },
      streakHistory: [],
      equityCurve: [],
      symbolList: [],
      typeStats: {
        Long: { count: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 },
        Short: { count: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 },
      },
    };
  }

  // Filter closed trades and sort chronologically (oldest to newest)
  const closedTrades = trades
    .filter((t) => t && t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate || a.createdAt || 0) - new Date(b.entryDate || b.createdAt || 0));

  let totalWinPnl = 0;
  let totalLossPnl = 0;
  let winCount = 0;
  let lossCount = 0;

  let highestProfitTrade = null;
  let lowestProfitTrade = null;

  let longestWinStreak = 0;
  let longestWinStreakPnl = 0;
  let longestLossStreak = 0;
  let longestLossStreakPnl = 0;

  let runningWinStreak = 0;
  let runningWinStreakPnl = 0;
  let runningLossStreak = 0;
  let runningLossStreakPnl = 0;

  const streakHistory = [];
  let activeStreakBlock = null;

  let cumulativePnl = 0;
  let peakPnl = 0;
  let maxDrawdown = 0;
  const equityCurve = [];

  const symbolStats = {};
  const typeStats = {
    Long: { count: 0, wins: 0, losses: 0, pnl: 0, winPnl: 0, lossPnl: 0 },
    Short: { count: 0, wins: 0, losses: 0, pnl: 0, winPnl: 0, lossPnl: 0 },
  };

  closedTrades.forEach((trade, index) => {
    const pnl = typeof trade.pnl === 'number' ? trade.pnl : parseFloat(trade.pnl) || 0;
    const isWin = pnl > 0;
    const isLoss = pnl < 0;

    const tradeSummary = {
      id: trade._id || trade.id || `trade-${index}`,
      symbol: trade.symbol || 'UNKNOWN',
      tradeType: trade.tradeType || 'Long',
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      pnl: +pnl.toFixed(2),
      pnlPercent: typeof trade.pnlPercent === 'number' ? +trade.pnlPercent.toFixed(2) : 0,
      tags: trade.tags || [],
    };

    // Track highest profit
    if (highestProfitTrade === null || pnl > highestProfitTrade.pnl) {
      highestProfitTrade = tradeSummary;
    }

    // Track lowest profit (biggest loss)
    if (lowestProfitTrade === null || pnl < lowestProfitTrade.pnl) {
      lowestProfitTrade = tradeSummary;
    }

    // Streaks
    if (isWin) {
      winCount++;
      totalWinPnl += pnl;

      runningWinStreak++;
      runningWinStreakPnl += pnl;

      if (runningWinStreak > longestWinStreak) {
        longestWinStreak = runningWinStreak;
        longestWinStreakPnl = runningWinStreakPnl;
      }

      runningLossStreak = 0;
      runningLossStreakPnl = 0;

      if (!activeStreakBlock || activeStreakBlock.type !== 'WIN') {
        if (activeStreakBlock) streakHistory.push(activeStreakBlock);
        activeStreakBlock = {
          type: 'WIN',
          count: 1,
          pnl: pnl,
          startDate: trade.entryDate,
          endDate: trade.entryDate,
          trades: [tradeSummary],
        };
      } else {
        activeStreakBlock.count++;
        activeStreakBlock.pnl += pnl;
        activeStreakBlock.endDate = trade.entryDate;
        activeStreakBlock.trades.push(tradeSummary);
      }
    } else if (isLoss) {
      lossCount++;
      totalLossPnl += pnl;

      runningLossStreak++;
      runningLossStreakPnl += pnl;

      if (runningLossStreak > longestLossStreak) {
        longestLossStreak = runningLossStreak;
        longestLossStreakPnl = runningLossStreakPnl;
      }

      runningWinStreak = 0;
      runningWinStreakPnl = 0;

      if (!activeStreakBlock || activeStreakBlock.type !== 'LOSS') {
        if (activeStreakBlock) streakHistory.push(activeStreakBlock);
        activeStreakBlock = {
          type: 'LOSS',
          count: 1,
          pnl: pnl,
          startDate: trade.entryDate,
          endDate: trade.entryDate,
          trades: [tradeSummary],
        };
      } else {
        activeStreakBlock.count++;
        activeStreakBlock.pnl += pnl;
        activeStreakBlock.endDate = trade.entryDate;
        activeStreakBlock.trades.push(tradeSummary);
      }
    }

    // Equity Curve & Drawdown
    cumulativePnl += pnl;
    if (cumulativePnl > peakPnl) {
      peakPnl = cumulativePnl;
    }
    const currentDrawdown = peakPnl - cumulativePnl;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    equityCurve.push({
      index: index + 1,
      date: trade.entryDate,
      symbol: trade.symbol,
      tradeType: trade.tradeType,
      pnl: +pnl.toFixed(2),
      cumulativePnl: +cumulativePnl.toFixed(2),
      peakPnl: +peakPnl.toFixed(2),
      drawdown: +currentDrawdown.toFixed(2),
    });

    // Symbol Breakdown
    const sym = trade.symbol || 'UNKNOWN';
    if (!symbolStats[sym]) {
      symbolStats[sym] = { symbol: sym, trades: 0, wins: 0, losses: 0, totalPnl: 0, winPnl: 0, lossPnl: 0 };
    }
    symbolStats[sym].trades++;
    symbolStats[sym].totalPnl += pnl;
    if (isWin) {
      symbolStats[sym].wins++;
      symbolStats[sym].winPnl += pnl;
    } else if (isLoss) {
      symbolStats[sym].losses++;
      symbolStats[sym].lossPnl += pnl;
    }

    // Trade Type Breakdown
    const tType = trade.tradeType === 'Short' ? 'Short' : 'Long';
    typeStats[tType].count++;
    typeStats[tType].pnl += pnl;
    if (isWin) {
      typeStats[tType].wins++;
      typeStats[tType].winPnl += pnl;
    } else if (isLoss) {
      typeStats[tType].losses++;
      typeStats[tType].lossPnl += pnl;
    }
  });

  if (activeStreakBlock) {
    streakHistory.push(activeStreakBlock);
  }

  const currentStreak = activeStreakBlock
    ? {
        type: activeStreakBlock.type,
        count: activeStreakBlock.count,
        pnl: +activeStreakBlock.pnl.toFixed(2),
      }
    : { type: 'NONE', count: 0, pnl: 0 };

  const totalClosed = winCount + lossCount;
  const winRate = totalClosed > 0 ? +((winCount / totalClosed) * 100).toFixed(1) : 0;
  const lossRate = totalClosed > 0 ? +((lossCount / totalClosed) * 100).toFixed(1) : 0;
  const avgWinner = winCount > 0 ? +(totalWinPnl / winCount).toFixed(2) : 0;
  const avgLoser = lossCount > 0 ? +(totalLossPnl / lossCount).toFixed(2) : 0;
  const profitFactor =
    Math.abs(totalLossPnl) > 0
      ? +(totalWinPnl / Math.abs(totalLossPnl)).toFixed(2)
      : totalWinPnl > 0
      ? 999
      : 0;

  const symbolList = Object.values(symbolStats)
    .map((s) => ({
      ...s,
      totalPnl: +s.totalPnl.toFixed(2),
      winRate: s.trades > 0 ? +((s.wins / s.trades) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl);

  ['Long', 'Short'].forEach((k) => {
    typeStats[k].pnl = +typeStats[k].pnl.toFixed(2);
    typeStats[k].winRate = typeStats[k].count > 0 ? +((typeStats[k].wins / typeStats[k].count) * 100).toFixed(1) : 0;
  });

  return {
    closedTradesCount: totalClosed,
    winCount,
    lossCount,
    winRate,
    lossRate,
    totalWinPnl: +totalWinPnl.toFixed(2),
    totalLossPnl: +totalLossPnl.toFixed(2),
    netPnl: +(totalWinPnl + totalLossPnl).toFixed(2),
    avgWinner,
    avgLoser,
    profitFactor,
    maxDrawdown: +maxDrawdown.toFixed(2),
    highestProfitTrade,
    lowestProfitTrade,
    longestWinStreak,
    longestWinStreakPnl: +longestWinStreakPnl.toFixed(2),
    longestLossStreak,
    longestLossStreakPnl: +longestLossStreakPnl.toFixed(2),
    currentStreak,
    streakHistory,
    equityCurve,
    symbolList,
    typeStats,
  };
}

module.exports = {
  computeJournalAnalytics,
};
