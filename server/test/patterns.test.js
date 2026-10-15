const { test, describe } = require('node:test');
const assert = require('node:assert');
const { detectCandlestickPatterns } = require('../src/utils/patterns');

describe('Candlestick Pattern Recognition Unit Tests', () => {
  test('detects Doji candle when body is small relative to range', () => {
    const candles = [
      { time: 100, open: 98, high: 105, low: 95, close: 104, volume: 50 },
      { time: 200, open: 100, high: 106, low: 96, close: 105, volume: 50 },
      { time: 300, open: 100.0, high: 110.0, low: 90.0, close: 100.3, volume: 100 }, // range = 20, body = 0.3 (1.5% of range)
    ];
    const patterns = detectCandlestickPatterns(candles);
    const doji = patterns.find((p) => p.pattern === 'doji');
    assert.ok(doji, 'Doji pattern should be detected');
    assert.strictEqual(doji.type, 'neutral');
    assert.strictEqual(doji.time, 300);
  });

  test('detects Hammer after a prior downward price move', () => {
    const candles = [
      { time: 100, open: 120, high: 122, low: 118, close: 119, volume: 100 },
      { time: 200, open: 119, high: 120, low: 114, close: 115, volume: 100 },
      { time: 300, open: 115, high: 116, low: 110, close: 111, volume: 100 },
      { time: 400, open: 111, high: 112, low: 106, close: 107, volume: 100 },
      // Hammer: small body near high, long lower shadow >= 2x body, short upper shadow
      { time: 500, open: 107, high: 108.5, low: 98, close: 108, volume: 300 },
      // body = 1, lowerWick = 9 (9x body), upperWick = 0.5 (0.5x body)
    ];
    const patterns = detectCandlestickPatterns(candles);
    const hammer = patterns.find((p) => p.pattern === 'hammer');
    assert.ok(hammer, 'Hammer should be detected at index 4');
    assert.strictEqual(hammer.type, 'bullish');
    assert.strictEqual(hammer.time, 500);
  });

  test('detects Hanging Man after a prior upward price move', () => {
    const candles = [
      { time: 100, open: 100, high: 102, low: 99, close: 101, volume: 100 },
      { time: 200, open: 101, high: 105, low: 100, close: 104, volume: 100 },
      { time: 300, open: 104, high: 108, low: 103, close: 107, volume: 100 },
      { time: 400, open: 107, high: 112, low: 106, close: 111, volume: 100 },
      // Hanging man: occurs after uptrend, long lower shadow, small body at top
      { time: 500, open: 111, high: 112, low: 103, close: 111.8, volume: 200 },
      // body = 0.8, lowerWick = 8 (10x body), upperWick = 0.2
    ];
    const patterns = detectCandlestickPatterns(candles);
    const hangingMan = patterns.find((p) => p.pattern === 'hanging_man');
    assert.ok(hangingMan, 'Hanging Man should be detected');
    assert.strictEqual(hangingMan.type, 'bearish');
  });

  test('detects Shooting Star after a rally', () => {
    const candles = [
      { time: 100, open: 100, high: 103, low: 99, close: 102, volume: 100 },
      { time: 200, open: 102, high: 106, low: 101, close: 105, volume: 100 },
      { time: 300, open: 105, high: 109, low: 104, close: 108, volume: 100 },
      // Shooting star: long upper wick >= 2x body, small body near bottom, tiny lower wick
      { time: 400, open: 108.5, high: 118, low: 108, close: 108.2, volume: 250 },
      // body = 0.3, upperWick = 9.5 (31x body), lowerWick = 0.2
    ];
    const patterns = detectCandlestickPatterns(candles);
    const shootingStar = patterns.find((p) => p.pattern === 'shooting_star');
    assert.ok(shootingStar, 'Shooting Star should be detected');
    assert.strictEqual(shootingStar.type, 'bearish');
    assert.strictEqual(shootingStar.time, 400);
  });

  test('detects Bullish Engulfing pattern', () => {
    const candles = [
      { time: 100, open: 105, high: 106, low: 102, close: 103, volume: 100 },
      // prev: red candle from 105 to 101
      { time: 200, open: 105, high: 106, low: 100, close: 101, volume: 100 },
      // cur: green candle opening at or below 101 and closing above 105 (e.g. 100 to 107)
      { time: 300, open: 100.5, high: 108, low: 99, close: 106.5, volume: 250 },
    ];
    const patterns = detectCandlestickPatterns(candles);
    const engulfing = patterns.find((p) => p.pattern === 'bullish_engulfing');
    assert.ok(engulfing, 'Bullish Engulfing should be detected');
    assert.strictEqual(engulfing.type, 'bullish');
    assert.strictEqual(engulfing.time, 300);
  });

  test('detects Bearish Engulfing pattern', () => {
    const candles = [
      { time: 100, open: 98, high: 101, low: 97, close: 100, volume: 100 },
      // prev: green candle from 100 to 104
      { time: 200, open: 100, high: 105, low: 99, close: 104, volume: 100 },
      // cur: red candle opening above 104 and closing below 100 (e.g. 104.5 to 98.5)
      { time: 300, open: 104.5, high: 106, low: 97, close: 98.5, volume: 250 },
    ];
    const patterns = detectCandlestickPatterns(candles);
    const engulfing = patterns.find((p) => p.pattern === 'bearish_engulfing');
    assert.ok(engulfing, 'Bearish Engulfing should be detected');
    assert.strictEqual(engulfing.type, 'bearish');
    assert.strictEqual(engulfing.time, 300);
  });

  test('detects Morning Star 3-bar reversal', () => {
    const candles = [
      // Bar 1: long bearish bar (open 100, close 80, body = 20)
      { time: 100, open: 100, high: 101, low: 79, close: 80, volume: 100 },
      // Bar 2: small body star near bottom (open 78, close 79, body = 1 <= 0.4*20)
      { time: 200, open: 78, high: 80, low: 77, close: 79, volume: 100 },
      // Bar 3: strong bullish bar closing into upper half of Bar 1 (close >= 80 + 10 = 90)
      { time: 300, open: 80, high: 96, low: 79, close: 94, volume: 200 },
    ];
    const patterns = detectCandlestickPatterns(candles);
    const morningStar = patterns.find((p) => p.pattern === 'morning_star');
    assert.ok(morningStar, 'Morning Star should be detected');
    assert.strictEqual(morningStar.type, 'bullish');
    assert.strictEqual(morningStar.time, 300);
  });

  test('detects Evening Star 3-bar reversal', () => {
    const candles = [
      // Bar 1: long bullish bar (open 80, close 100, body = 20)
      { time: 100, open: 80, high: 101, low: 79, close: 100, volume: 100 },
      // Bar 2: small star at top (open 101, close 102, body = 1 <= 0.4*20)
      { time: 200, open: 101, high: 103, low: 100, close: 102, volume: 100 },
      // Bar 3: strong bearish bar closing deeply into lower half of Bar 1 (close <= 100 - 10 = 90)
      { time: 300, open: 101, high: 102, low: 84, close: 86, volume: 200 },
    ];
    const patterns = detectCandlestickPatterns(candles);
    const eveningStar = patterns.find((p) => p.pattern === 'evening_star');
    assert.ok(eveningStar, 'Evening Star should be detected');
    assert.strictEqual(eveningStar.type, 'bearish');
    assert.strictEqual(eveningStar.time, 300);
  });

  test('avoids look-ahead bias: detection at time t remains identical when future bars are appended', () => {
    const historicalSlice = [
      { time: 100, open: 100, high: 105, low: 95, close: 101, volume: 50 },
      { time: 200, open: 101, high: 106, low: 96, close: 102, volume: 50 },
      { time: 300, open: 100.0, high: 110.0, low: 90.0, close: 100.5, volume: 100 }, // Doji at 300
    ];
    const initialDetections = detectCandlestickPatterns(historicalSlice);

    // Append 5 future bars
    const withFutureBars = [
      ...historicalSlice,
      { time: 400, open: 101, high: 115, low: 100, close: 114, volume: 200 },
      { time: 500, open: 114, high: 120, low: 113, close: 119, volume: 300 },
      { time: 600, open: 119, high: 125, low: 118, close: 124, volume: 400 },
    ];
    const subsequentDetections = detectCandlestickPatterns(withFutureBars);

    const matchBefore = initialDetections.find((p) => p.time === 300);
    const matchAfter = subsequentDetections.find((p) => p.time === 300);

    assert.ok(matchBefore && matchAfter);
    assert.strictEqual(matchBefore.pattern, matchAfter.pattern);
    assert.strictEqual(matchBefore.type, matchAfter.type);
    assert.strictEqual(matchBefore.price, matchAfter.price);
  });
});
