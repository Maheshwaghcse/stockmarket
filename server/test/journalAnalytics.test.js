const test = require('node:test');
const assert = require('node:assert/strict');
const { computeJournalAnalytics } = require('../src/utils/journalAnalytics');

test('Trading Journal Analytics Unit Tests', async (t) => {
  await t.test('handles empty or non-array trades gracefully', () => {
    const emptyResult = computeJournalAnalytics([]);
    assert.equal(emptyResult.closedTradesCount, 0);
    assert.equal(emptyResult.highestProfitTrade, null);
    assert.equal(emptyResult.lowestProfitTrade, null);
    assert.equal(emptyResult.longestWinStreak, 0);
    assert.equal(emptyResult.longestLossStreak, 0);

    const nullResult = computeJournalAnalytics(null);
    assert.equal(nullResult.closedTradesCount, 0);
  });

  await t.test('computes highest profit and lowest profit trades accurately', () => {
    const trades = [
      { id: '1', symbol: 'RELIANCE', status: 'CLOSED', pnl: 2500, pnlPercent: 5.2, entryDate: '2026-10-01' },
      { id: '2', symbol: 'TCS', status: 'CLOSED', pnl: 14000, pnlPercent: 12.5, entryDate: '2026-10-02' },
      { id: '3', symbol: 'INFY', status: 'CLOSED', pnl: -4500, pnlPercent: -4.1, entryDate: '2026-10-03' },
      { id: '4', symbol: 'HDFCBANK', status: 'CLOSED', pnl: -1200, pnlPercent: -1.0, entryDate: '2026-10-04' },
      { id: '5', symbol: 'TATAMOTORS', status: 'OPEN', pnl: 0, pnlPercent: 0, entryDate: '2026-10-05' },
    ];

    const analytics = computeJournalAnalytics(trades);
    assert.equal(analytics.closedTradesCount, 4);
    assert.equal(analytics.highestProfitTrade.symbol, 'TCS');
    assert.equal(analytics.highestProfitTrade.pnl, 14000);
    assert.equal(analytics.lowestProfitTrade.symbol, 'INFY');
    assert.equal(analytics.lowestProfitTrade.pnl, -4500);
  });

  await t.test('computes longest profit streak and loss streak in chronological order', () => {
    // 3 wins, 2 losses, 4 wins, 1 loss
    const trades = [
      { id: '1', status: 'CLOSED', pnl: 1000, entryDate: '2026-10-01' },
      { id: '2', status: 'CLOSED', pnl: 2000, entryDate: '2026-10-02' },
      { id: '3', status: 'CLOSED', pnl: 1500, entryDate: '2026-10-03' },
      { id: '4', status: 'CLOSED', pnl: -800, entryDate: '2026-10-04' },
      { id: '5', status: 'CLOSED', pnl: -1200, entryDate: '2026-10-05' },
      { id: '6', status: 'CLOSED', pnl: 3000, entryDate: '2026-10-06' },
      { id: '7', status: 'CLOSED', pnl: 4000, entryDate: '2026-10-07' },
      { id: '8', status: 'CLOSED', pnl: 2500, entryDate: '2026-10-08' },
      { id: '9', status: 'CLOSED', pnl: 1800, entryDate: '2026-10-09' },
      { id: '10', status: 'CLOSED', pnl: -500, entryDate: '2026-10-10' },
    ];

    const analytics = computeJournalAnalytics(trades);
    assert.equal(analytics.longestWinStreak, 4);
    assert.equal(analytics.longestWinStreakPnl, 11300); // 3000 + 4000 + 2500 + 1800
    assert.equal(analytics.longestLossStreak, 2);
    assert.equal(analytics.longestLossStreakPnl, -2000); // -800 + -1200
    assert.equal(analytics.currentStreak.type, 'LOSS');
    assert.equal(analytics.currentStreak.count, 1);
  });

  await t.test('accurately calculates equity curve, peak capital, and maximum drawdown', () => {
    const trades = [
      { id: '1', status: 'CLOSED', pnl: 10000, entryDate: '2026-10-01' },
      { id: '2', status: 'CLOSED', pnl: 5000, entryDate: '2026-10-02' }, // Peak = 15000
      { id: '3', status: 'CLOSED', pnl: -4000, entryDate: '2026-10-03' }, // Drawdown = 4000
      { id: '4', status: 'CLOSED', pnl: -3000, entryDate: '2026-10-04' }, // Drawdown = 7000 (Max)
      { id: '5', status: 'CLOSED', pnl: 12000, entryDate: '2026-10-05' }, // Peak = 20000
    ];

    const analytics = computeJournalAnalytics(trades);
    assert.equal(analytics.equityCurve.length, 5);
    assert.equal(analytics.equityCurve[4].cumulativePnl, 20000);
    assert.equal(analytics.maxDrawdown, 7000);
  });

  await t.test('computes symbol breakdowns and Long vs Short metrics', () => {
    const trades = [
      { id: '1', symbol: 'RELIANCE', tradeType: 'Long', status: 'CLOSED', pnl: 5000, entryDate: '2026-10-01' },
      { id: '2', symbol: 'RELIANCE', tradeType: 'Long', status: 'CLOSED', pnl: -2000, entryDate: '2026-10-02' },
      { id: '3', symbol: 'TCS', tradeType: 'Short', status: 'CLOSED', pnl: 4000, entryDate: '2026-10-03' },
    ];

    const analytics = computeJournalAnalytics(trades);
    assert.equal(analytics.symbolList[0].symbol, 'TCS');
    assert.equal(analytics.symbolList[0].totalPnl, 4000);
    assert.equal(analytics.symbolList[1].symbol, 'RELIANCE');
    assert.equal(analytics.symbolList[1].totalPnl, 3000);

    assert.equal(analytics.typeStats.Long.count, 2);
    assert.equal(analytics.typeStats.Long.pnl, 3000);
    assert.equal(analytics.typeStats.Long.winRate, 50.0);

    assert.equal(analytics.typeStats.Short.count, 1);
    assert.equal(analytics.typeStats.Short.pnl, 4000);
    assert.equal(analytics.typeStats.Short.winRate, 100.0);
  });
});
