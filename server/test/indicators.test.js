const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  sanitizeCandles,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateVWAP,
  calculateHeikinAshi,
} = require('../src/utils/indicators');

describe('Technical Indicators Unit Tests', () => {
  // Mock standard candle series
  const sampleCandles = [
    { time: 100, open: 10, high: 12, low: 9, close: 11, volume: 1000 },
    { time: 200, open: 11, high: 13, low: 10, close: 12, volume: 1200 },
    { time: 300, open: 12, high: 14, low: 11, close: 13, volume: 1100 },
    { time: 400, open: 13, high: 15, low: 12, close: 14, volume: 1500 },
    { time: 500, open: 14, high: 16, low: 13, close: 15, volume: 2000 },
    { time: 600, open: 15, high: 17, low: 14, close: 16, volume: 1800 },
    { time: 700, open: 16, high: 18, low: 15, close: 17, volume: 1600 },
    { time: 800, open: 17, high: 19, low: 16, close: 18, volume: 1400 },
  ];

  test('sanitizeCandles cleans corrupt or unsorted candles', () => {
    const dirty = [
      { time: 300, open: 10, high: 12, low: 9, close: 11, volume: 100 },
      null,
      { time: 100, open: 8, high: 9, low: 7, close: '8.5', volume: '200' },
      { time: 200, open: 9, high: 10, low: 8, close: NaN }, // invalid
    ];
    const cleaned = sanitizeCandles(dirty);
    assert.strictEqual(cleaned.length, 2);
    assert.strictEqual(cleaned[0].time, 100);
    assert.strictEqual(cleaned[0].close, 8.5);
    assert.strictEqual(cleaned[1].time, 300);
  });

  test('calculateSMA computes correct rolling averages', () => {
    const sma3 = calculateSMA(sampleCandles, 3);
    // index 2 (time 300): (11 + 12 + 13)/3 = 12.00
    // index 3 (time 400): (12 + 13 + 14)/3 = 13.00
    assert.strictEqual(sma3.length, 6);
    assert.strictEqual(sma3[0].time, 300);
    assert.strictEqual(sma3[0].value, 12);
    assert.strictEqual(sma3[1].time, 400);
    assert.strictEqual(sma3[1].value, 13);
  });

  test('calculateSMA returns empty array when insufficient data', () => {
    const res = calculateSMA(sampleCandles, 50);
    assert.deepStrictEqual(res, []);
  });

  test('calculateEMA applies exponential smoothing formula', () => {
    const ema3 = calculateEMA(sampleCandles, 3);
    // k = 2 / (3 + 1) = 0.5
    // seed (index 2): (11 + 12 + 13)/3 = 12.00
    // next (index 3): 14 * 0.5 + 12 * 0.5 = 13.00
    // next (index 4): 15 * 0.5 + 13 * 0.5 = 14.00
    assert.strictEqual(ema3.length, 6);
    assert.strictEqual(ema3[0].time, 300);
    assert.strictEqual(ema3[0].value, 12);
    assert.strictEqual(ema3[1].time, 400);
    assert.strictEqual(ema3[1].value, 13);
    assert.strictEqual(ema3[2].time, 500);
    assert.strictEqual(ema3[2].value, 14);
  });

  test('calculateRSI returns values bounded between 0 and 100', () => {
    const longSeries = [];
    for (let i = 0; i < 30; i++) {
      longSeries.push({
        time: 1000 + i * 60,
        open: 100 + (i % 2 === 0 ? 2 : -1),
        high: 105,
        low: 95,
        close: 100 + i, // steady uptrend
        volume: 500,
      });
    }
    const rsi = calculateRSI(longSeries, 14);
    assert.ok(rsi.length > 0);
    for (const point of rsi) {
      assert.ok(point.value >= 0 && point.value <= 100, `RSI out of bounds: ${point.value}`);
    }
    // Uptrend should have high RSI (> 70)
    assert.ok(rsi[rsi.length - 1].value > 70);
  });

  test('calculateRSI handles flat zero-gain and zero-loss sequences gracefully', () => {
    const flat = [];
    for (let i = 0; i < 20; i++) {
      flat.push({ time: i * 60, open: 100, high: 100, low: 100, close: 100, volume: 10 });
    }
    const rsi = calculateRSI(flat, 14);
    assert.ok(rsi.length > 0);
    assert.strictEqual(rsi[0].value, 50);
  });

  test('calculateMACD produces valid macd, signal and histogram components', () => {
    const longSeries = [];
    for (let i = 0; i < 50; i++) {
      longSeries.push({
        time: 1000 + i * 60,
        open: 100 + i * 0.5,
        high: 102 + i * 0.5,
        low: 99 + i * 0.5,
        close: 100 + i * 0.5,
        volume: 1000,
      });
    }
    const macd = calculateMACD(longSeries, 12, 26, 9);
    assert.ok(macd.length > 0);
    const sample = macd[0];
    assert.ok(typeof sample.macd === 'number');
    assert.ok(typeof sample.signal === 'number');
    assert.ok(typeof sample.histogram === 'number');
    assert.strictEqual(+(sample.macd - sample.signal).toFixed(2), sample.histogram);
  });

  test('calculateBollingerBands computes upper, middle, and lower bands with correct symmetry', () => {
    const bb = calculateBollingerBands(sampleCandles, 5, 2);
    assert.strictEqual(bb.length, 4);
    const first = bb[0];
    assert.ok(first.upper > first.middle);
    assert.ok(first.lower < first.middle);
    // Symmetry check: (upper - middle) should equal (middle - lower) within rounding
    const upperDiff = +(first.upper - first.middle).toFixed(2);
    const lowerDiff = +(first.middle - first.lower).toFixed(2);
    assert.ok(Math.abs(upperDiff - lowerDiff) <= 0.05);
  });

  test('calculateATR computes non-negative true range volatility', () => {
    const atr = calculateATR(sampleCandles, 5);
    assert.ok(atr.length > 0);
    for (const a of atr) {
      assert.ok(a.value >= 0);
    }
  });

  test('calculateVWAP accurately accumulates typical price and volume', () => {
    // 2 candles on same day
    const candles = [
      { time: 1700000000, open: 100, high: 102, low: 98, close: 100, volume: 100 }, // TP = 100, TPV = 10000
      { time: 1700000300, open: 100, high: 104, low: 100, close: 102, volume: 200 }, // TP = 102, TPV = 20400
    ];
    // CumTPV = 30400, CumVol = 300, VWAP = 30400 / 300 = 101.33
    const vwap = calculateVWAP(candles);
    assert.strictEqual(vwap.length, 2);
    assert.strictEqual(vwap[0].value, 100);
    assert.strictEqual(vwap[1].value, 101.33);
    assert.strictEqual(vwap[1].hasVolume, true);
  });

  test('calculateVWAP handles zero-volume without NaN or dividing by zero', () => {
    const noVol = [
      { time: 1700000000, open: 100, high: 105, low: 95, close: 100, volume: 0 },
    ];
    const vwap = calculateVWAP(noVol);
    assert.strictEqual(vwap.length, 1);
    assert.strictEqual(isNaN(vwap[0].value), false);
    assert.strictEqual(vwap[0].hasVolume, false);
  });

  test('calculateHeikinAshi correctly transforms candles without altering raw exchange values', () => {
    const raw = [
      { time: 100, open: 10, high: 15, low: 8, close: 12, volume: 100 },
      { time: 200, open: 12, high: 16, low: 11, close: 14, volume: 150 },
    ];
    const ha = calculateHeikinAshi(raw);
    assert.strictEqual(ha.length, 2);
    // Bar 0:
    // HA_Close = (10 + 15 + 8 + 12) / 4 = 11.25
    // HA_Open = (10 + 12) / 2 = 11.00
    // HA_High = max(15, 11, 11.25) = 15.00
    // HA_Low = min(8, 11, 11.25) = 8.00
    assert.strictEqual(ha[0].close, 11.25);
    assert.strictEqual(ha[0].open, 11.0);
    assert.strictEqual(ha[0].high, 15.0);
    assert.strictEqual(ha[0].low, 8.0);
    assert.strictEqual(ha[0].originalClose, 12);
    assert.strictEqual(ha[0].isHeikinAshi, true);

    // Bar 1:
    // HA_Open = (11.00 + 11.25) / 2 = 11.13 (approx 11.125)
    assert.ok(Math.abs(ha[1].open - 11.13) <= 0.02);
  });
});
