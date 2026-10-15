/**
 * Technical Indicators and Chart Transformations (Frontend Client Library)
 */

export function sanitizeCandles(candles) {
  if (!Array.isArray(candles)) return []
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
    .sort((a, b) => a.time - b.time)
}

/**
 * SMA
 */
export function calculateSMA(candles, period = 20) {
  const data = sanitizeCandles(candles)
  if (data.length < period || period <= 0) return []

  const results = []
  let sum = 0

  for (let i = 0; i < data.length; i++) {
    sum += data[i].close
    if (i >= period) {
      sum -= data[i - period].close
    }
    if (i >= period - 1) {
      const val = sum / period
      results.push({
        time: data[i].time,
        value: +val.toFixed(2),
      })
    }
  }

  return results
}

/**
 * EMA
 */
export function calculateEMA(candles, period = 20) {
  const data = sanitizeCandles(candles)
  if (data.length < period || period <= 0) return []

  const k = 2 / (period + 1)
  const results = []

  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i].close
  }
  let prevEMA = sum / period
  results.push({
    time: data[period - 1].time,
    value: +prevEMA.toFixed(2),
  })

  for (let i = period; i < data.length; i++) {
    const currentEMA = data[i].close * k + prevEMA * (1 - k)
    results.push({
      time: data[i].time,
      value: +currentEMA.toFixed(2),
    })
    prevEMA = currentEMA
  }

  return results
}

/**
 * RSI (Wilder's Smoothing)
 */
export function calculateRSI(candles, period = 14) {
  const data = sanitizeCandles(candles)
  if (data.length <= period || period <= 0) return []

  const results = []
  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close
    if (diff >= 0) gains += diff
    else losses += Math.abs(diff)
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  let rsi = 50
  if (avgLoss === 0 && avgGain === 0) {
    rsi = 50
  } else if (avgLoss === 0) {
    rsi = 100
  } else if (avgGain === 0) {
    rsi = 0
  } else {
    const rs = avgGain / avgLoss
    rsi = 100 - 100 / (1 + rs)
  }

  results.push({
    time: data[period].time,
    value: +rsi.toFixed(2),
  })

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close
    const currentGain = diff > 0 ? diff : 0
    const currentLoss = diff < 0 ? Math.abs(diff) : 0

    avgGain = (avgGain * (period - 1) + currentGain) / period
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period

    if (avgLoss === 0) {
      rsi = avgGain === 0 ? 50 : 100
    } else {
      const rs = avgGain / avgLoss
      rsi = 100 - 100 / (1 + rs)
    }

    results.push({
      time: data[i].time,
      value: +rsi.toFixed(2),
    })
  }

  return results
}

/**
 * MACD
 */
export function calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const data = sanitizeCandles(candles)
  if (data.length < slowPeriod + signalPeriod) return []

  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)

  const fastMap = new Map(fastEMA.map((d) => [d.time, d.value]))
  const macdLinePoints = []

  for (const s of slowEMA) {
    const fastVal = fastMap.get(s.time)
    if (typeof fastVal === 'number') {
      macdLinePoints.push({
        time: s.time,
        close: +(fastVal - s.value).toFixed(2),
        value: +(fastVal - s.value).toFixed(2),
      })
    }
  }

  if (macdLinePoints.length < signalPeriod) return []

  const signalLine = calculateEMA(macdLinePoints, signalPeriod)
  const signalMap = new Map(signalLine.map((s) => [s.time, s.value]))

  const results = []
  for (const m of macdLinePoints) {
    const sig = signalMap.get(m.time)
    if (typeof sig === 'number') {
      const hist = +(m.value - sig).toFixed(2)
      results.push({
        time: m.time,
        macd: m.value,
        signal: sig,
        histogram: hist,
      })
    }
  }

  return results
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(candles, period = 20, multiplier = 2) {
  const data = sanitizeCandles(candles)
  if (data.length < period || period <= 0) return []

  const results = []

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close
    }
    const middle = sum / period

    let varianceSum = 0
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(data[j].close - middle, 2)
    }
    const stdDev = Math.sqrt(varianceSum / period)

    const upper = middle + multiplier * stdDev
    const lower = middle - multiplier * stdDev
    const bandwidth = middle > 0 ? ((upper - lower) / middle) * 100 : 0

    results.push({
      time: data[i].time,
      middle: +middle.toFixed(2),
      upper: +upper.toFixed(2),
      lower: +lower.toFixed(2),
      bandwidth: +bandwidth.toFixed(2),
    })
  }

  return results
}

/**
 * ATR
 */
export function calculateATR(candles, period = 14) {
  const data = sanitizeCandles(candles)
  if (data.length <= period || period <= 0) return []

  const trs = []
  trs.push(data[0].high - data[0].low)

  for (let i = 1; i < data.length; i++) {
    const hl = data[i].high - data[i].low
    const hc = Math.abs(data[i].high - data[i - 1].close)
    const lc = Math.abs(data[i].low - data[i - 1].close)
    trs.push(Math.max(hl, hc, lc))
  }

  const results = []
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += trs[i]
  }
  let prevATR = sum / period
  results.push({
    time: data[period - 1].time,
    value: +prevATR.toFixed(2),
  })

  for (let i = period; i < data.length; i++) {
    const currentATR = (prevATR * (period - 1) + trs[i]) / period
    results.push({
      time: data[i].time,
      value: +currentATR.toFixed(2),
    })
    prevATR = currentATR
  }

  return results
}

/**
 * VWAP
 */
export function calculateVWAP(candles) {
  const data = sanitizeCandles(candles)
  if (data.length === 0) return []

  const results = []
  let cumTPV = 0
  let cumVol = 0
  let lastDay = null

  for (let i = 0; i < data.length; i++) {
    const c = data[i]
    const dateObj = new Date(c.time * 1000)
    const dayKey = `${dateObj.getUTCFullYear()}-${dateObj.getUTCMonth()}-${dateObj.getUTCDate()}`

    if (dayKey !== lastDay) {
      cumTPV = 0
      cumVol = 0
      lastDay = dayKey
    }

    const tp = (c.high + c.low + c.close) / 3
    const vol = c.volume || 0

    cumTPV += tp * vol
    cumVol += vol

    if (cumVol > 0) {
      results.push({
        time: c.time,
        value: +(cumTPV / cumVol).toFixed(2),
        hasVolume: true,
      })
    } else {
      results.push({
        time: c.time,
        value: +tp.toFixed(2),
        hasVolume: false,
      })
    }
  }

  return results
}

/**
 * Heikin-Ashi
 */
export function calculateHeikinAshi(candles) {
  const data = sanitizeCandles(candles)
  if (data.length === 0) return []

  const results = []
  let prevHAOpen = 0
  let prevHAClose = 0

  for (let i = 0; i < data.length; i++) {
    const c = data[i]
    const haClose = +((c.open + c.high + c.low + c.close) / 4).toFixed(2)
    let haOpen = 0

    if (i === 0) {
      haOpen = +((c.open + c.close) / 2).toFixed(2)
    } else {
      haOpen = +((prevHAOpen + prevHAClose) / 2).toFixed(2)
    }

    const haHigh = +Math.max(c.high, haOpen, haClose).toFixed(2)
    const haLow = +Math.min(c.low, haOpen, haClose).toFixed(2)

    results.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
      originalClose: c.close,
      isHeikinAshi: true,
    })

    prevHAOpen = haOpen
    prevHAClose = haClose
  }

  return results
}
