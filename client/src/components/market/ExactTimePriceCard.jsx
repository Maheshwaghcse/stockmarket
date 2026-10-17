import { useState, useMemo, useEffect, useCallback } from 'react'
import { Clock, Sliders, TrendingUp, TrendingDown, Calendar, Search, Crosshair, Sparkles, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import api from '../../lib/api'

// Common Indian trading session milestones
const MILESTONE_TIMES = [
  { id: '09:15', label: '09:15 Open 🔔', timeStr: '09:15', note: 'Opening Bell Price' },
  { id: '09:30', label: '09:30 Range', timeStr: '09:30', note: '15-min Opening Range' },
  { id: '10:00', label: '10:00 Trend', timeStr: '10:00', note: 'Morning Momentum' },
  { id: '11:30', label: '11:30 Midday', timeStr: '11:30', note: 'Pre-Europe Session' },
  { id: '13:00', label: '13:00 Lunch', timeStr: '13:00', note: 'European Open' },
  { id: '14:00', label: '14:00 Trend', timeStr: '14:00', note: 'Afternoon Trend' },
  { id: '15:00', label: '15:00 Power', timeStr: '15:00', note: 'Closing Power Hour' },
  { id: '15:25', label: '15:25 EOD 🏁', timeStr: '15:25', note: 'Final Intraday Candle' },
]

// Popular instruments for 1-click time lookup
const QUICK_INSTRUMENTS = [
  { symbol: 'NIFTY50', name: 'Nifty 50', type: 'index' },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', type: 'index' },
  { symbol: 'SENSEX', name: 'Sensex', type: 'index' },
  { symbol: 'RELIANCE', name: 'Reliance', type: 'stock' },
  { symbol: 'TCS', name: 'TCS', type: 'stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', type: 'stock' },
  { symbol: 'INFY', name: 'Infosys', type: 'stock' },
]

function formatTimeIST(unixSeconds) {
  if (!unixSeconds) return '--:--'
  const date = new Date(unixSeconds * 1000)
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatTime24IST(unixSeconds) {
  if (!unixSeconds) return '--:--'
  const date = new Date(unixSeconds * 1000)
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatDateIST(unixSeconds) {
  if (!unixSeconds) return ''
  const date = new Date(unixSeconds * 1000)
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getSessionPhase(time24) {
  if (!time24) return 'Trading Session'
  if (time24 <= '09:30') return 'Market Opening Bell & Initial Balance'
  if (time24 <= '11:00') return 'Morning Momentum & Breakout Window'
  if (time24 <= '13:00') return 'Midday Consolidation & Lunch Session'
  if (time24 <= '14:30') return 'European Markets Overlap Trend'
  if (time24 <= '15:15') return 'Closing Power Hour & Position Unwinding'
  return 'Pre-Close Intraday Settlement'
}

export default function ExactTimePriceCard({
  symbol = 'NIFTY50',
  candles = [],
  hoveredCandle = null,
  onSelectSymbol = null,
  watchlistStocks = [],
}) {
  // Dedicated state for 5-minute intraday candles
  const [fetchedCandles, setFetchedCandles] = useState([])
  const [fetchLoading, setFetchLoading] = useState(false)

  // Fetch true 5m intraday candles if the incoming candles are not intraday (e.g. daily when user selects 1Y chart)
  useEffect(() => {
    // Check if incoming candles already provide intraday 5m data
    const isIntraday =
      candles &&
      candles.length >= 10 &&
      candles.length > 1 &&
      candles[1].time - candles[0].time <= 1800 // <= 30 min spacing

    if (isIntraday) {
      setFetchedCandles([])
      return
    }

    let isCancelled = false
    setFetchLoading(true)

    const INDEX_SYMBOLS = ['NIFTY50', 'BANKNIFTY', 'SENSEX', 'FINNIFTY', 'NIFTYNEXT50', 'NIFTYIT', 'NIFTYPHARMA', 'NIFTYAUTO', 'NIFTYMIDCAP']
    const isIndex = INDEX_SYMBOLS.includes(symbol.toUpperCase())

    const url = isIndex
      ? `/market/indices/${symbol}/intraday?interval=5`
      : `/stocks/${symbol}/chart?range=1d&interval=5m`

    api
      .get(url)
      .then(({ data }) => {
        if (!isCancelled && data?.data && Array.isArray(data.data) && data.data.length > 0) {
          setFetchedCandles(data.data)
        }
      })
      .catch((err) => {
        console.error('ExactTimePriceCard intraday fetch error:', err)
      })
      .finally(() => {
        if (!isCancelled) setFetchLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [symbol, candles])

  // Resolve the active set of candles (prefer dedicated 5m intraday candles)
  const effectiveCandles = useMemo(() => {
    if (fetchedCandles && fetchedCandles.length > 0) {
      return fetchedCandles
    }
    return candles || []
  }, [fetchedCandles, candles])

  // Extract candles of the latest trading session for clean intraday 09:15 to 15:30 navigation
  const sessionCandles = useMemo(() => {
    if (!effectiveCandles || effectiveCandles.length === 0) return []
    // Find the latest candle's date in IST
    const lastCandle = effectiveCandles[effectiveCandles.length - 1]
    const lastDateStr = formatDateIST(lastCandle.time)
    
    // Filter candles that belong to this latest date
    const todayCandles = effectiveCandles.filter((c) => formatDateIST(c.time) === lastDateStr)
    return todayCandles.length > 0 ? todayCandles : effectiveCandles.slice(-75)
  }, [effectiveCandles])

  // Baseline 09:15 AM candle (day open)
  const openCandle = useMemo(() => {
    if (sessionCandles.length === 0) return null
    // Try to find exact 09:15 candle, or fallback to first candle of session
    const exactOpen = sessionCandles.find((c) => formatTime24IST(c.time) === '09:15')
    return exactOpen || sessionCandles[0]
  }, [sessionCandles])

  // State: selected candle index in sessionCandles
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [customTimeInput, setCustomTimeInput] = useState('09:15')
  const [isManualOverride, setIsManualOverride] = useState(false)

  // When sessionCandles change, default to the 09:15 candle if not manual
  useEffect(() => {
    if (sessionCandles.length > 0) {
      const idx915 = sessionCandles.findIndex((c) => formatTime24IST(c.time) === '09:15')
      const targetIdx = idx915 >= 0 ? idx915 : 0
      setSelectedIndex(targetIdx)
      setCustomTimeInput(formatTime24IST(sessionCandles[targetIdx].time))
    }
  }, [sessionCandles])

  // Synchronize when chart hover fires
  useEffect(() => {
    if (hoveredCandle && hoveredCandle.time) {
      setIsManualOverride(false)
      setCustomTimeInput(formatTime24IST(hoveredCandle.time))
    }
  }, [hoveredCandle])

  // The active candle to display:
  // - If user interacted manually with Direct Time / Milestones: use selectedIndex
  // - Else if actively hovering over chart: use hoveredCandle
  // - Fallback to selectedIndex or openCandle
  const activeCandle = useMemo(() => {
    if (!isManualOverride && hoveredCandle && hoveredCandle.time) {
      return hoveredCandle
    }
    if (sessionCandles.length > 0 && selectedIndex >= 0 && selectedIndex < sessionCandles.length) {
      return sessionCandles[selectedIndex]
    }
    return openCandle
  }, [isManualOverride, hoveredCandle, sessionCandles, selectedIndex, openCandle])

  // Handler for custom time input change
  const handleTimeChange = useCallback((timeStr) => {
    if (!timeStr) return
    setCustomTimeInput(timeStr)
    setIsManualOverride(true)

    if (!sessionCandles.length) return

    // Parse hour and minute safely
    const parts = timeStr.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (isNaN(h) || isNaN(m)) return

    const targetMins = h * 60 + m
    let bestIdx = 0
    let minDiff = Infinity

    sessionCandles.forEach((c, idx) => {
      const cTime24 = formatTime24IST(c.time)
      const cParts = cTime24.split(':')
      const ch = parseInt(cParts[0], 10)
      const cm = parseInt(cParts[1], 10)
      if (!isNaN(ch) && !isNaN(cm)) {
        const cMins = ch * 60 + cm
        const diff = Math.abs(cMins - targetMins)
        if (diff < minDiff) {
          minDiff = diff
          bestIdx = idx
        }
      }
    })

    setSelectedIndex(bestIdx)
    // Synchronize the input field with the exact candle time matched
    if (sessionCandles[bestIdx]) {
      setCustomTimeInput(formatTime24IST(sessionCandles[bestIdx].time))
    }
  }, [sessionCandles])

  // Step 5 minutes forward or backward
  const handleStep = useCallback((stepDelta) => {
    if (!sessionCandles.length) return
    setIsManualOverride(true)
    const nextIdx = Math.max(0, Math.min(sessionCandles.length - 1, selectedIndex + stepDelta))
    setSelectedIndex(nextIdx)
    if (sessionCandles[nextIdx]) {
      setCustomTimeInput(formatTime24IST(sessionCandles[nextIdx].time))
    }
  }, [sessionCandles, selectedIndex])

  // Handler for milestone click
  const handleMilestoneClick = (targetTime) => {
    handleTimeChange(targetTime)
  }

  if (!activeCandle) {
    return (
      <div className="card p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
        <Clock size={16} className="inline mr-1.5 animate-spin text-blue-400" />
        Loading intraday timestamp prices...
      </div>
    )
  }

  const isLiveHover = Boolean(hoveredCandle && hoveredCandle.time)
  const timeIST = formatTimeIST(activeCandle.time)
  const time24IST = formatTime24IST(activeCandle.time)
  const dateIST = formatDateIST(activeCandle.time)
  const sessionPhase = getSessionPhase(time24IST)

  // Calculations for active candle
  const openPrice = activeCandle.open ?? 0
  const highPrice = activeCandle.high ?? 0
  const lowPrice = activeCandle.low ?? 0
  const closePrice = activeCandle.close ?? 0
  const candleChange = closePrice - openPrice
  const candleChangePct = openPrice > 0 ? (candleChange / openPrice) * 100 : 0
  const candleSpread = highPrice - lowPrice
  const isBullish = candleChange >= 0

  // Comparison vs Day's 09:15 Open
  const baseOpen = openCandle ? openCandle.open : openPrice
  const vsDayOpen = closePrice - baseOpen
  const vsDayOpenPct = baseOpen > 0 ? (vsDayOpen / baseOpen) * 100 : 0

  return (
    <div className="card relative overflow-hidden bg-gradient-to-br from-[#0c1631] via-[#091124] to-[#070d1c] border border-cyan-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Decorative neon corner glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* ── Top Header & Status ──────────────────────────────── */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Clock size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>Exact Time & Price Explorer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono font-bold border border-cyan-500/25">
                  5m Resolution
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Instant OHLC quotes for any specific minute (e.g., 09:15 AM Market Open)
            </p>
          </div>
        </div>

        {/* Status Pill & Reset */}
        <div className="flex items-center gap-2">
          {isLiveHover && !isManualOverride ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
              <Crosshair size={12} />
              <span>Chart Cursor Hover</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Time Quote: {timeIST}</span>
            </span>
          )}

          <button
            onClick={() => handleTimeChange('09:15')}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Jump to 09:15 AM Opening Bell"
          >
            09:15 Open
          </button>
        </div>
      </div>

      {/* ── Instrument Switcher (Switch between Index & Stocks) ── */}
      {onSelectSymbol && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-medium whitespace-nowrap text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>Target:</span>
          </span>
          {QUICK_INSTRUMENTS.map((inst) => {
            const isCurrent = symbol.toUpperCase() === inst.symbol
            return (
              <button
                key={inst.symbol}
                onClick={() => onSelectSymbol(inst.symbol)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all font-medium ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {inst.name}
              </button>
            )
          })}

          {/* Quick access to Watchlist stocks if any */}
          {watchlistStocks && watchlistStocks.length > 0 && (
            <select
              value={QUICK_INSTRUMENTS.some((i) => i.symbol === symbol.toUpperCase()) ? '' : symbol.toUpperCase()}
              onChange={(e) => {
                if (e.target.value) onSelectSymbol(e.target.value)
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="" disabled>More Watchlist Stocks...</option>
              {watchlistStocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.name || s.symbol}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ── Quick Time Milestones & Direct Time Controls ──────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Sliders size={12} className="text-cyan-400" />
            <span>Key Market Milestones</span>
          </span>

          {/* Interactive Direct Time Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
              <Clock size={11} className="text-cyan-400" />
              <span>Direct Time:</span>
            </span>

            {/* Stepper + Time Input Combo */}
            <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="px-1.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-mono font-bold transition-colors"
                title="Step backward 5 minutes"
              >
                <ChevronLeft size={13} />
              </button>
              <input
                type="time"
                step="300"
                min="09:15"
                max="15:30"
                value={customTimeInput}
                onChange={(e) => handleTimeChange(e.target.value)}
                onInput={(e) => handleTimeChange(e.target.value)}
                className="bg-transparent px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none text-center cursor-pointer"
                title="Type or select exact trading hour (09:15 - 15:30 IST)"
              />
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="px-1.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-mono font-bold transition-colors"
                title="Step forward 5 minutes"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Candle Selector Dropdown */}
            {sessionCandles.length > 0 && (
              <select
                value={time24IST}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
                title="Pick exact 5m candle from today's session"
              >
                {sessionCandles.map((c) => {
                  const tStr = formatTime24IST(c.time)
                  return (
                    <option key={tStr} value={tStr}>
                      {tStr} · ₹{c.close?.toFixed(1)}
                    </option>
                  )
                })}
              </select>
            )}

            {/* Reset to 09:15 Open Button */}
            <button
              type="button"
              onClick={() => handleTimeChange('09:15')}
              className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-[11px] font-medium transition-colors"
              title="Reset to 09:15 AM Market Open"
            >
              Reset 09:15
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {MILESTONE_TIMES.map((m) => {
            const isCurrentMilestone = time24IST === m.timeStr
            return (
              <button
                key={m.id}
                onClick={() => handleMilestoneClick(m.timeStr)}
                className={`px-2 py-1.5 rounded-xl text-xs font-medium text-center transition-all border ${
                  isCurrentMilestone
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800/80 hover:border-slate-700'
                }`}
                title={m.note}
              >
                <div className="text-[11px] font-mono leading-tight">{m.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Precision Hero Display & OHLC Matrix ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        {/* Left: Hero Quote Box */}
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-cyan-400 font-mono font-bold flex items-center gap-1">
                <Clock size={12} />
                {timeIST} (IST)
              </span>
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Calendar size={11} />
                {dateIST}
              </span>
            </div>

            <div className="text-xs text-slate-400 font-medium line-clamp-1 mb-2">
              {sessionPhase}
            </div>

            {/* Exact Price */}
            <div className="mt-1">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Price at {time24IST}
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                ₹{closePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Candle Net & Comparison */}
          <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">5m Candle Move:</span>
              <span className={`font-bold flex items-center gap-0.5 ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isBullish ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isBullish ? '+' : ''}{candleChange.toFixed(2)} ({isBullish ? '+' : ''}{candleChangePct.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">vs 09:15 Open:</span>
              <span className={`font-bold ${vsDayOpen >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {vsDayOpen >= 0 ? '+' : ''}{vsDayOpen.toFixed(2)} ({vsDayOpen >= 0 ? '+' : ''}{vsDayOpenPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: 4-Box OHLC Matrix + Micro Analytics */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-3">
          {/* 4 OHLC Matrix Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Open */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Open (09:15+ Start)
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-slate-200 mt-1">
                ₹{openPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Candle entry price</div>
            </div>

            {/* High */}
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
                High (Peak)
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-1">
                ₹{highPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Period ceiling</div>
            </div>

            {/* Low */}
            <div className="bg-slate-900/80 border border-rose-500/20 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-400">
                Low (Trough)
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-rose-400 mt-1">
                ₹{lowPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Period support</div>
            </div>

            {/* Close */}
            <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400">
                Close (Settled)
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-cyan-300 mt-1">
                ₹{closePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">End of 5m window</div>
            </div>
          </div>

          {/* Micro Analytics & Volatility Insight */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-slate-400">Spread (High - Low): </span>
                <span className="text-slate-200 font-mono font-bold">
                  ₹{candleSpread.toFixed(2)} pts
                </span>
                <span className="text-slate-400 text-[11px] ml-1">
                  ({openPrice > 0 ? ((candleSpread / openPrice) * 100).toFixed(2) : '0'}% range)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                isBullish ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {isBullish ? '▲ Bullish Expansion' : '▼ Bearish Retracement'}
              </span>

              <span className="text-slate-400 text-[11px] hidden sm:inline">
                💡 Tip: Hover over the chart above to inspect any timestamp!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
