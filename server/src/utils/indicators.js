/**
 * Technical Indicators and Chart Transformations
 *
 * Provides mathematically validated technical indicator algorithms:
 * - SMA (Simple Moving Average)
 * - EMA (Exponential Moving Average)
 * - RSI (Relative Strength Index via Wilder's Smoothing)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands (SMA + Standard Deviation Bands)
 * - ATR (Average True Range)
 * - VWAP (Volume Weighted Average Price, session-aware)
 * - Heikin-Ashi Candle Transformations
 */

/**
 * Validates and normalizes candles array
 */
function sanitizeCandles(candles) {
  if (!Array.isArray(candles)) return [];
  return candles
    .filter((c) => c && typeof c.time === 'number' && !isNaN(c.close))
    .map((c) => ({
      time: c.time,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume) || 0,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * 1. Simple Moving Average (SMA)
 * SMA_t = (1 / period) * sum_{i=0}^{period-1} Close_{t-i}
 */
function calculateSMA(candles, period = 20) {
  const data = sanitizeCandles(candles);
  if (data.length < period || period <= 0) return [];

  const results = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) {
      sum -= data[i - period].close;
    }
    if (i >= period - 1) {
      const val = sum / period;
      results.push({
        time: data[i].time,
        value: +val.toFixed(2),
      });
    }
  }

  return results;
}

/**
 * 2. Exponential Moving Average (EMA)
 * Multiplier k = 2 / (period + 1)
 * Initial EMA = SMA of first period bars
 * EMA_t = (Close_t * k) + (EMA_{t-1} * (1 - k))
 */
function calculateEMA(candles, period = 20) {
  const data = sanitizeCandles(candles);
  if (data.length < period || period <= 0) return [];

  const k = 2 / (period + 1);
  const results = [];

  // Seed with initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEMA = sum / period;
  results.push({
    time: data[period - 1].time,
    value: +prevEMA.toFixed(2),
  });

  for (let i = period; i < data.length; i++) {
    const currentEMA = data[i].close * k + prevEMA * (1 - k);
    results.push({
      time: data[i].time,
      value: +currentEMA.toFixed(2),
    });
    prevEMA = currentEMA;
  }

  return results;
}

/**
 * 3. Relative Strength Index (RSI) using Wilder's Smoothing
 * RS = AvgGain / AvgLoss
 * RSI = 100 - (100 / (1 + RS))
 */
function calculateRSI(candles, period = 14) {
  const data = sanitizeCandles(candles);
  if (data.length <= period || period <= 0) return [];

  const results = [];
  let gains = 0;
  let losses = 0;

  // First period changes
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rsi = 50;
  if (avgLoss === 0 && avgGain === 0) {
    rsi = 50;
  } else if (avgLoss === 0) {
    rsi = 100;
  } else if (avgGain === 0) {
    rsi = 0;
  } else {
    const rs = avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
  }

  results.push({
    time: data[period].time,
    value: +rsi.toFixed(2),
  });

  // Wilder's smoothing for subsequent bars
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi = avgGain === 0 ? 50 : 100;
    } else {
      rs = avgGain / avgLoss;
      rsi = 100 - 100 / (1 + rs);
    }

    results.push({
      time: data[i].time,
      value: +rsi.toFixed(2),
    });
  }

  return results;
}

/**
 * 4. Moving Average Convergence Divergence (MACD)
 * MACD Line = FastEMA(12) - SlowEMA(26)
 * Signal Line = EMA(MACD Line, 9)
 * Histogram = MACD Line - Signal Line
 */
function calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const data = sanitizeCandles(candles);
  if (data.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Map slowEMA times to find intersection with fastEMA
  const fastMap = new Map(fastEMA.map((d) => [d.time, d.value]));
  const macdLinePoints = [];

  for (const s of slowEMA) {
    const fastVal = fastMap.get(s.time);
    if (typeof fastVal === 'number') {
      macdLinePoints.push({
        time: s.time,
        close: +(fastVal - s.value).toFixed(2), // formatted as candle-like for EMA helper
        value: +(fastVal - s.value).toFixed(2),
      });
    }
  }

  if (macdLinePoints.length < signalPeriod) return [];

  const signalLine = calculateEMA(macdLinePoints, signalPeriod);
  const signalMap = new Map(signalLine.map((s) => [s.time, s.value]));

  const results = [];
  for (const m of macdLinePoints) {
    const sig = signalMap.get(m.time);
    if (typeof sig === 'number') {
      const hist = +(m.value - sig).toFixed(2);
      results.push({
        time: m.time,
        macd: m.value,
        signal: sig,
        histogram: hist,
      });
    }
  }

  return results;
}

/**
 * 5. Bollinger Bands
 * Middle Band = SMA(period)
 * Upper Band = Middle + (multiplier * stdDev)
 * Lower Band = Middle - (multiplier * stdDev)
 * Bandwidth = ((Upper - Lower) / Middle) * 100
 */
function calculateBollingerBands(candles, period = 20, multiplier = 2) {
  const data = sanitizeCandles(candles);
  if (data.length < period || period <= 0) return [];

  const results = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    const middle = sum / period;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(data[j].close - middle, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    const upper = middle + multiplier * stdDev;
    const lower = middle - multiplier * stdDev;
    const bandwidth = middle > 0 ? ((upper - lower) / middle) * 100 : 0;

    results.push({
      time: data[i].time,
      middle: +middle.toFixed(2),
      upper: +upper.toFixed(2),
      lower: +lower.toFixed(2),
      bandwidth: +bandwidth.toFixed(2),
    });
  }

  return results;
}

/**
 * 6. Average True Range (ATR)
 * TR = max(High - Low, |High - PrevClose|, |Low - PrevClose|)
 * ATR = Wilder's smoothing of True Range
 */
function calculateATR(candles, period = 14) {
  const data = sanitizeCandles(candles);
  if (data.length <= period || period <= 0) return [];

  const trs = [];
  trs.push(data[0].high - data[0].low);

  for (let i = 1; i < data.length; i++) {
    const hl = data[i].high - data[i].low;
    const hc = Math.abs(data[i].high - data[i - 1].close);
    const lc = Math.abs(data[i].low - data[i - 1].close);
    trs.push(Math.max(hl, hc, lc));
  }

  const results = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trs[i];
  }
  let prevATR = sum / period;
  results.push({
    time: data[period - 1].time,
    value: +prevATR.toFixed(2),
  });

  for (let i = period; i < data.length; i++) {
    const currentATR = (prevATR * (period - 1) + trs[i]) / period;
    results.push({
      time: data[i].time,
      value: +currentATR.toFixed(2),
    });
    prevATR = currentATR;
  }

  return results;
}

/**
 * 7. Volume Weighted Average Price (VWAP)
 * Resets each trading session (calendar date).
 * VWAP = cumSum(TypicalPrice * Volume) / cumSum(Volume)
 * TypicalPrice = (High + Low + Close) / 3
 */
function calculateVWAP(candles) {
  const data = sanitizeCandles(candles);
  if (data.length === 0) return [];

  const results = [];
  let cumTPV = 0;
  let cumVol = 0;
  let lastDay = null;

  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    // Check day for session reset (UTC day transition)
    const dateObj = new Date(c.time * 1000);
    const dayKey = `${dateObj.getUTCFullYear()}-${dateObj.getUTCMonth()}-${dateObj.getUTCDate()}`;

    if (dayKey !== lastDay) {
      cumTPV = 0;
      cumVol = 0;
      lastDay = dayKey;
    }

    const tp = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 0;

    cumTPV += tp * vol;
    cumVol += vol;

    if (cumVol > 0) {
      results.push({
        time: c.time,
        value: +(cumTPV / cumVol).toFixed(2),
        hasVolume: true,
      });
    } else {
      // If volume is zero or unavailable, fallback to typical price with hasVolume = false
      results.push({
        time: c.time,
        value: +tp.toFixed(2),
        hasVolume: false,
      });
    }
  }

  return results;
}

/**
 * 8. Heikin-Ashi Candle Transformation
 * HA_Close = (Open + High + Low + Close) / 4
 * HA_Open[0] = (Open[0] + Close[0]) / 2
 * HA_Open[t] = (HA_Open[t-1] + HA_Close[t-1]) / 2
 * HA_High = max(High, HA_Open, HA_Close)
 * HA_Low = min(Low, HA_Open, HA_Close)
 * Note: Keeps volume and preserves original raw close for reference.
 */
function calculateHeikinAshi(candles) {
  const data = sanitizeCandles(candles);
  if (data.length === 0) return [];

  const results = [];
  let prevHAOpen = 0;
  let prevHAClose = 0;

  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const haClose = +((c.open + c.high + c.low + c.close) / 4).toFixed(2);
    let haOpen = 0;

    if (i === 0) {
      haOpen = +((c.open + c.close) / 2).toFixed(2);
    } else {
      haOpen = +((prevHAOpen + prevHAClose) / 2).toFixed(2);
    }

    const haHigh = +Math.max(c.high, haOpen, haClose).toFixed(2);
    const haLow = +Math.min(c.low, haOpen, haClose).toFixed(2);

    results.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
      originalClose: c.close,
      isHeikinAshi: true,
    });

    prevHAOpen = haOpen;
    prevHAClose = haClose;
  }

  return results;
}

module.exports = {
  sanitizeCandles,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateVWAP,
  calculateHeikinAshi,
};
