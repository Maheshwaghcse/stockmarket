/**
 * Candlestick Pattern Recognition Engine (Frontend Client Library)
 */
import { sanitizeCandles } from './indicators'

export const PATTERN_DISCLAIMER =
  'Pattern recognition is probabilistic and not a guarantee of future movement. Always confirm with volume, multi-timeframe context, and defined stop-loss risk.'

export function detectCandlestickPatterns(candles) {
  const data = sanitizeCandles(candles)
  if (data.length < 3) return []

  const detected = []

  for (let i = 0; i < data.length; i++) {
    const cur = data[i]
    const prev = i > 0 ? data[i - 1] : null
    const prev2 = i > 1 ? data[i - 2] : null

    const range = cur.high - cur.low
    const body = Math.abs(cur.close - cur.open)
    const upperWick = cur.high - Math.max(cur.open, cur.close)
    const lowerWick = Math.min(cur.open, cur.close) - cur.low
    const isBullish = cur.close > cur.open
    const isBearish = cur.close < cur.open

    if (range <= 0) continue

    // 1. DOJI
    if (body <= 0.10 * range) {
      detected.push({
        time: cur.time,
        index: i,
        pattern: 'doji',
        name: 'Doji',
        type: 'neutral',
        confidence: 'medium',
        price: cur.close,
        description: `Open (${cur.open}) and Close (${cur.close}) virtually identical (body ${((body / range) * 100).toFixed(1)}% of range).`,
        confirmationRule: 'Wait for the next candle to break above high for bullish continuation or below low for bearish reversal.',
        disclaimer: PATTERN_DISCLAIMER,
      })
    }

    // Trend context check over preceding 3-5 bars
    let isPriorDowntrend = false
    let isPriorUptrend = false
    if (i >= 4) {
      isPriorDowntrend = data[i - 1].close < data[i - 4].close
      isPriorUptrend = data[i - 1].close > data[i - 4].close
    } else if (i >= 2) {
      isPriorDowntrend = data[i - 1].close < data[0].close
      isPriorUptrend = data[i - 1].close > data[0].close
    }

    // 2. HAMMER & HANGING MAN
    const isHammerShape =
      lowerWick >= 2 * body &&
      upperWick <= Math.max(0.6 * body, 0.08 * range) &&
      body >= 0.02 * range

    if (isHammerShape) {
      if (isPriorDowntrend) {
        detected.push({
          time: cur.time,
          index: i,
          pattern: 'hammer',
          name: 'Hammer',
          type: 'bullish',
          confidence: 'high',
          price: cur.close,
          description: `Long lower shadow (${lowerWick.toFixed(1)}) at least double the real body (${body.toFixed(1)}) following a downward move. Sellers rejected.`,
          confirmationRule: 'Requires the subsequent candle to close above the Hammer body or high with expansion in volume.',
          disclaimer: PATTERN_DISCLAIMER,
        })
      } else if (isPriorUptrend) {
        detected.push({
          time: cur.time,
          index: i,
          pattern: 'hanging_man',
          name: 'Hanging Man',
          type: 'bearish',
          confidence: 'medium',
          price: cur.close,
          description: `Long lower shadow with small body at the top of range after an uptrend. Suggests sudden heavy intra-candle selling.`,
          confirmationRule: 'Requires next candle to open lower and close below the hanging man body.',
          disclaimer: PATTERN_DISCLAIMER,
        })
      }
    }

    // 3. SHOOTING STAR
    const isShootingStarShape =
      upperWick >= 2 * body &&
      lowerWick <= Math.max(0.6 * body, 0.08 * range) &&
      body >= 0.02 * range

    if (isShootingStarShape && isPriorUptrend) {
      detected.push({
        time: cur.time,
        index: i,
        pattern: 'shooting_star',
        name: 'Shooting Star',
        type: 'bearish',
        confidence: 'high',
        price: cur.close,
        description: `Long upper wick (${upperWick.toFixed(1)}) rejecting higher prices after an advance, closing near low of the bar.`,
        confirmationRule: 'Confirmed if the next candle gaps down or closes below the Shooting Star real body.',
        disclaimer: PATTERN_DISCLAIMER,
      })
    }

    // 4. BULLISH & BEARISH ENGULFING
    if (prev) {
      const prevRange = prev.high - prev.low
      const prevBody = Math.abs(prev.close - prev.open)
      const prevBearish = prev.close < prev.open
      const prevBullish = prev.close > prev.open

      if (
        prevBearish &&
        isBullish &&
        cur.open <= prev.close &&
        cur.close >= prev.open &&
        body > prevBody
      ) {
        detected.push({
          time: cur.time,
          index: i,
          pattern: 'bullish_engulfing',
          name: 'Bullish Engulfing',
          type: 'bullish',
          confidence: 'high',
          price: cur.close,
          description: `Bullish green candle (${cur.open} to ${cur.close}) completely engulfs previous bearish red candle (${prev.open} to ${prev.close}).`,
          confirmationRule: 'Confirmed when price holds above the midpoint of the engulfing bar in the following session.',
          disclaimer: PATTERN_DISCLAIMER,
        })
      }

      if (
        prevBullish &&
        isBearish &&
        cur.open >= prev.close &&
        cur.close <= prev.open &&
        body > prevBody
      ) {
        detected.push({
          time: cur.time,
          index: i,
          pattern: 'bearish_engulfing',
          name: 'Bearish Engulfing',
          type: 'bearish',
          confidence: 'high',
          price: cur.close,
          description: `Bearish red candle (${cur.open} to ${cur.close}) completely engulfs previous bullish green candle (${prev.open} to ${prev.close}).`,
          confirmationRule: 'Confirmed when subsequent candle trades below the low of the engulfing candle.',
          disclaimer: PATTERN_DISCLAIMER,
        })
      }
    }

    // 5. MORNING STAR & EVENING STAR
    if (prev && prev2) {
      const b1 = prev2
      const b2 = prev
      const b3 = cur

      const b1Body = Math.abs(b1.close - b1.open)
      const b2Body = Math.abs(b2.close - b2.open)
      const b3Body = Math.abs(b3.close - b3.open)

      const b1Bearish = b1.close < b1.open
      const b1Bullish = b1.close > b1.open
      const b3Bullish = b3.close > b3.open
      const b3Bearish = b3.close < b3.open

      if (
        b1Bearish &&
        b3Bullish &&
        b2Body <= 0.4 * b1Body &&
        Math.max(b2.open, b2.close) <= b1.close * 1.002 &&
        b3.close >= b1.close + 0.5 * b1Body
      ) {
        detected.push({
          time: b3.time,
          index: i,
          pattern: 'morning_star',
          name: 'Morning Star',
          type: 'bullish',
          confidence: 'high',
          price: b3.close,
          description: `3-bar bullish reversal: Long bearish bar, indecision star near base, followed by strong bullish bar closing into upper half of first bar.`,
          confirmationRule: 'Confirmed on follow-through buying breaking above the high of the 3-bar formation.',
          disclaimer: PATTERN_DISCLAIMER,
        })
      }

      if (
        b1Bullish &&
        b3Bearish &&
        b2Body <= 0.4 * b1Body &&
        Math.min(b2.open, b2.close) >= b1.close * 0.998 &&
        b3.close <= b1.close - 0.5 * b1Body
      ) {
        detected.push({
          time: b3.time,
          index: i,
          pattern: 'evening_star',
          name: 'Evening Star',
          type: 'bearish',
          confidence: 'high',
          price: b3.close,
          description: `3-bar bearish reversal: Long bullish bar, exhausted star at top, followed by strong bearish bar penetrating deeply into first bar.`,
          confirmationRule: 'Confirmed on follow-through selling breaking below the lowest point of the 3-bar structure.',
          disclaimer: PATTERN_DISCLAIMER,
        })
      }
    }
  }

  return detected
}
