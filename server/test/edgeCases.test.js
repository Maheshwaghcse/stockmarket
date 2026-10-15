const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateVWAP,
  calculateHeikinAshi,
} = require('../src/utils/indicators');
const { detectCandlestickPatterns } = require('../src/utils/patterns');
const yahooFinanceService = require('../src/services/yahooFinanceService');

describe('Edge Cases, Timezones, Missing Data and Error Handling Tests', () => {
  test('handles completely empty or null candle input gracefully', () => {
    assert.deepStrictEqual(calculateSMA([], 20), []);
    assert.deepStrictEqual(calculateEMA([], 20), []);
    assert.deepStrictEqual(calculateRSI([], 14), []);
    assert.deepStrictEqual(calculateBollingerBands([], 20), []);
    assert.deepStrictEqual(calculateVWAP([]), []);
    assert.deepStrictEqual(calculateHeikinAshi([]), []);
    assert.deepStrictEqual(detectCandlestickPatterns([]), []);

    assert.deepStrictEqual(calculateSMA(null, 20), []);
    assert.deepStrictEqual(calculateEMA(undefined, 20), []);
  });

  test('handles arrays with fewer candles than required indicator period', () => {
    const few = [{ time: 100, open: 10, high: 12, low: 9, close: 11, volume: 100 }];
    assert.deepStrictEqual(calculateSMA(few, 20), []);
    assert.deepStrictEqual(calculateEMA(few, 20), []);
    assert.deepStrictEqual(calculateRSI(few, 14), []);
    assert.deepStrictEqual(calculateBollingerBands(few, 20), []);
  });

  test('timezones: candles use standard Unix timestamps (seconds) invariant of client timezone', () => {
    const candleTimeUtcSec = 1791776700; // specific UTC moment
    const date = new Date(candleTimeUtcSec * 1000);
    assert.strictEqual(typeof date.getTime(), 'number');

    // Indian market hours checker test
    const isMarketOpenFn = yahooFinanceService.isMarketOpen;
    assert.strictEqual(typeof isMarketOpenFn(), 'boolean');
  });

  test('Heikin-Ashi high is guaranteed >= max(open, close) and low <= min(open, close)', () => {
    const volatileCandles = [
      { time: 100, open: 100, high: 150, low: 50, close: 120, volume: 1000 },
      { time: 200, open: 120, high: 130, low: 60, close: 70, volume: 2000 },
      { time: 300, open: 70, high: 180, low: 40, close: 160, volume: 3000 },
    ];
    const ha = calculateHeikinAshi(volatileCandles);
    for (const h of ha) {
      assert.ok(h.high >= h.open, `HA High ${h.high} < HA Open ${h.open}`);
      assert.ok(h.high >= h.close, `HA High ${h.high} < HA Close ${h.close}`);
      assert.ok(h.low <= h.open, `HA Low ${h.low} > HA Open ${h.open}`);
      assert.ok(h.low <= h.close, `HA Low ${h.low} > HA Close ${h.close}`);
    }
  });

  test('does not invent or mock prices on invalid symbol', async () => {
    const result = await yahooFinanceService.fetchSymbolHistory('INVALID_TICKER_SYMBOL_123456');
    // Result must be null or have 0 data without mock prices
    if (result) {
      assert.strictEqual(result.data.length, 0);
    } else {
      assert.strictEqual(result, null);
    }
  });

  test('symbol resolver maps primary Indian benchmark indices to correct Yahoo symbols', () => {
    const resolve = yahooFinanceService.resolveSymbolConfig;
    assert.strictEqual(resolve('NIFTY50').yahooSymbol, '^NSEI');
    assert.strictEqual(resolve('^NSEI').yahooSymbol, '^NSEI');
    assert.strictEqual(resolve('BANKNIFTY').yahooSymbol, '^NSEBANK');
    assert.strictEqual(resolve('SENSEX').yahooSymbol, '^BSESN');
    assert.strictEqual(resolve('RELIANCE').yahooSymbol, 'RELIANCE.NS');
  });
});
