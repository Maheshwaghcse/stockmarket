import { useState, useMemo } from 'react'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  RotateCcw,
} from 'lucide-react'
import { formatINR } from '../../lib/journalAnalytics'

// Standard Indian Market Trading Hour Buckets
const TIME_BUCKETS = [
  { id: '09', label: '09:00 - 10:00 AM', shortLabel: '9 AM', session: 'Opening Bell & Initial Balance', icon: '🔔' },
  { id: '10', label: '10:00 - 11:00 AM', shortLabel: '10 AM', session: 'Morning Momentum Trend', icon: '🚀' },
  { id: '11', label: '11:00 - 12:00 PM', shortLabel: '11 AM', session: 'Late Morning Setup', icon: '📈' },
  { id: '12', label: '12:00 - 01:00 PM', shortLabel: '12 PM', session: 'Lunch Consolidation', icon: '🥪' },
  { id: '13', label: '01:00 - 02:00 PM', shortLabel: '1 PM', session: 'European Market Open', icon: '🌍' },
  { id: '14', label: '02:00 - 03:00 PM', shortLabel: '2 PM', session: 'Afternoon Institutional Flow', icon: '⚡' },
  { id: '15', label: '03:00 - 03:30 PM', shortLabel: '3 PM', session: 'Closing Power Hour & Settlement', icon: '🏁' },
  { id: 'other', label: 'Swing / Positional', shortLabel: 'Swing', session: 'Pre-market / Multi-day Holding', icon: '🌙' },
]

function getTradeHourIST(trade) {
  const dateVal = trade.entryDate || trade.createdAt
  if (!dateVal) return 'other'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return 'other'
    
    // Check if it's pure date without time (00:00:00 UTC)
    const hours = d.getUTCHours()
    const mins = d.getUTCMinutes()
    
    // Get hour in IST
    const hourIST = parseInt(
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
      }).format(d),
      10
    )

    // Map to bucket
    if (hourIST === 9) return '09'
    if (hourIST === 10) return '10'
    if (hourIST === 11) return '11'
    if (hourIST === 12) return '12'
    if (hourIST === 13) return '13'
    if (hourIST === 14) return '14'
    if (hourIST === 15) return '15'
    return 'other'
  } catch {
    return 'other'
  }
}

function formatExactTimeIST(dateVal) {
  if (!dateVal) return '--:--'
  try {
    const d = new Date(dateVal)
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short',
    }).format(d)
  } catch {
    return '--:--'
  }
}

export default function JournalTimingAnalysis({ trades = [] }) {
  const [viewMode, setViewMode] = useState('bars') // 'bars', 'pnl', 'timeline'
  const [selectedBucketId, setSelectedBucketId] = useState('09')
  const [filterType, setFilterType] = useState('ALL') // 'ALL', 'WIN', 'LOSS'

  // Closed trades
  const closedTrades = useMemo(() => {
    return trades.filter((t) => t && t.status === 'CLOSED')
  }, [trades])

  // Group trades by time bucket
  const bucketStats = useMemo(() => {
    const map = {}
    TIME_BUCKETS.forEach((b) => {
      map[b.id] = {
        ...b,
        trades: [],
        count: 0,
        winCount: 0,
        lossCount: 0,
        totalPnl: 0,
        symbols: new Set(),
      }
    })

    closedTrades.forEach((t) => {
      const pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0
      const bId = getTradeHourIST(t)
      const target = map[bId] || map['other']
      target.trades.push({ ...t, pnlNum: pnl })
      target.count++
      target.totalPnl += pnl
      if (pnl > 0) target.winCount++
      else if (pnl < 0) target.lossCount++
      if (t.symbol) target.symbols.add(t.symbol)
    })

    return TIME_BUCKETS.map((b) => {
      const data = map[b.id]
      const winRate = data.count > 0 ? Math.round((data.winCount / data.count) * 100) : 0
      return {
        ...data,
        winRate,
        symbolsList: Array.from(data.symbols),
      }
    })
  }, [closedTrades])

  // Key timing highlights (Best Timing, Worst Timing, Most Active)
  const highlights = useMemo(() => {
    const populated = bucketStats.filter((b) => b.count > 0)
    if (populated.length === 0) return null

    const bestPnl = [...populated].sort((a, b) => b.totalPnl - a.totalPnl)[0]
    const worstPnl = [...populated].sort((a, b) => a.totalPnl - b.totalPnl)[0]
    const mostActive = [...populated].sort((a, b) => b.count - a.count)[0]
    const bestWinRate = [...populated].filter((b) => b.count >= 2).sort((a, b) => b.winRate - a.winRate)[0] || bestPnl

    return { bestPnl, worstPnl, mostActive, bestWinRate }
  }, [bucketStats])

  // Active selected bucket data
  const selectedBucket = useMemo(() => {
    return bucketStats.find((b) => b.id === selectedBucketId) || bucketStats[0]
  }, [bucketStats, selectedBucketId])

  // Filtered trades for selected bucket
  const filteredBucketTrades = useMemo(() => {
    if (!selectedBucket) return []
    let list = selectedBucket.trades
    if (filterType === 'WIN') list = list.filter((t) => t.pnlNum > 0)
    if (filterType === 'LOSS') list = list.filter((t) => t.pnlNum < 0)
    return list.sort((a, b) => new Date(b.entryDate || 0) - new Date(a.entryDate || 0))
  }, [selectedBucket, filterType])

  // Max trade count and max P&L for bar chart scaling
  const maxTradeCount = useMemo(() => {
    return Math.max(...bucketStats.map((b) => b.count), 1)
  }, [bucketStats])

  const maxAbsPnl = useMemo(() => {
    return Math.max(...bucketStats.map((b) => Math.abs(b.totalPnl)), 1000)
  }, [bucketStats])

  return (
    <div className="space-y-5">
      {/* ── Header & Visual Mode Switcher ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d1a] border border-slate-800/80 rounded-2xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock size={16} />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Stock Entry Timing & Performance</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono font-bold border border-cyan-500/25">
                  Time-Wise Analysis
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Identify which timing you pick stocks, win-rates by hour, and review exact reasons
              </p>
            </div>
          </div>
        </div>

        {/* Visual View Modes */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {[
            { id: 'bars', label: 'Picks by Hour' },
            { id: 'pnl', label: 'P&L by Hour' },
            { id: 'timeline', label: 'Stock Timeline' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === mode.id
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Key Timing Insights Cards ─────────────────────────── */}
      {highlights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Best Timing */}
          <div className="card p-3 bg-gradient-to-br from-emerald-950/20 to-slate-950 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>🏆 Golden Trading Hour</span>
              <span className="text-emerald-400 font-bold font-mono">Top Profit</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {highlights.bestPnl.label}
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
              +{formatINR(highlights.bestPnl.totalPnl)} ({highlights.bestPnl.winRate}% Win)
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Stocks: {highlights.bestPnl.symbolsList.join(', ') || 'N/A'}
            </div>
          </div>

          {/* Highest Win Rate */}
          <div className="card p-3 bg-gradient-to-br from-blue-950/20 to-slate-950 border border-blue-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>🎯 Highest Win Rate</span>
              <span className="text-blue-400 font-bold font-mono">Accuracy</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {highlights.bestWinRate.label}
            </div>
            <div className="text-xs font-mono font-bold text-blue-400 mt-0.5">
              {highlights.bestWinRate.winRate}% Win Rate ({highlights.bestWinRate.winCount}W / {highlights.bestWinRate.lossCount}L)
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              Session: {highlights.bestWinRate.session}
            </div>
          </div>

          {/* Most Active Timing */}
          <div className="card p-3 bg-gradient-to-br from-purple-950/20 to-slate-950 border border-purple-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>⚡ Most Active Timing</span>
              <span className="text-purple-400 font-bold font-mono">Volume</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {highlights.mostActive.label}
            </div>
            <div className="text-xs font-mono font-bold text-purple-300 mt-0.5">
              {highlights.mostActive.count} Stocks Picked ({Math.round((highlights.mostActive.count / (closedTrades.length || 1)) * 100)}% of trades)
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              {highlights.mostActive.symbolsList.slice(0, 4).join(', ')}
            </div>
          </div>

          {/* Danger Zone Timing */}
          <div className="card p-3 bg-gradient-to-br from-rose-950/20 to-slate-950 border border-rose-500/20 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>⚠️ Caution Timing</span>
              <span className="text-rose-400 font-bold font-mono">Risk</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {highlights.worstPnl.totalPnl < 0 ? highlights.worstPnl.label : 'None (All Positive)'}
            </div>
            <div className={`text-xs font-mono font-bold mt-0.5 ${highlights.worstPnl.totalPnl < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {highlights.worstPnl.totalPnl < 0 ? formatINR(highlights.worstPnl.totalPnl) : 'Profitable Across All Hours!'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              {highlights.worstPnl.totalPnl < 0 ? 'Lower trade size or wait for confirmation' : 'Consistent execution throughout the day'}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Graphical Chart Area ─────────────────────────── */}
      <div className="bg-[#091124] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Chart Header & Instruction */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="text-xs">
            <span className="text-slate-200 font-bold text-sm block">
              {viewMode === 'bars' && 'Hourly Stock Pick Frequency & Win Rates'}
              {viewMode === 'pnl' && 'Net Realized P&L Generated by Trade Entry Hour'}
              {viewMode === 'timeline' && 'Chronological Stock Entry Timeline (09:15 - 15:30)'}
            </span>
            <span className="text-slate-400 text-[11px]">
              Click on any bar or timing to view exact stocks, prices, and reasons
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Profit / High Win</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" />
              <span>Loss / Drawdown</span>
            </span>
          </div>
        </div>

        {/* ── VIEW 1: Hourly Frequency Bar Chart ──────────────── */}
        {viewMode === 'bars' && (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 items-end min-h-[220px]">
              {bucketStats.map((bucket) => {
                const isSelected = selectedBucketId === bucket.id
                const heightPct = Math.max(12, Math.round((bucket.count / maxTradeCount) * 100))
                const isProfitable = bucket.totalPnl >= 0

                return (
                  <div
                    key={bucket.id}
                    onClick={() => setSelectedBucketId(bucket.id)}
                    className={`group cursor-pointer flex flex-col items-center justify-end h-full p-2 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Win rate badge on top of bar */}
                    {bucket.count > 0 && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded mb-1.5 ${
                        bucket.winRate >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {bucket.winRate}% W
                      </span>
                    )}

                    {/* Bar Column */}
                    <div className="w-full flex justify-center items-end h-32 py-1">
                      <div
                        className={`w-10 sm:w-12 rounded-t-lg transition-all duration-300 relative flex flex-col justify-between items-center py-1 ${
                          bucket.count === 0
                            ? 'bg-slate-800/40 h-2'
                            : isProfitable
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20'
                            : 'bg-gradient-to-t from-rose-600 to-red-400 shadow-md shadow-rose-500/20'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      >
                        {bucket.count > 0 && (
                          <span className="text-[11px] font-mono font-bold text-slate-950">
                            {bucket.count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Labels */}
                    <div className="text-center mt-2 w-full">
                      <span className="text-xs font-bold font-mono text-slate-200 block truncate">
                        {bucket.shortLabel}
                      </span>
                      <span className={`text-[10px] font-mono font-bold block truncate ${
                        bucket.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {bucket.count > 0 ? formatINR(bucket.totalPnl, { compact: true, showSign: true }) : '0'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── VIEW 2: Realized P&L by Hour ────────────────────── */}
        {viewMode === 'pnl' && (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 items-center min-h-[220px]">
              {bucketStats.map((bucket) => {
                const isSelected = selectedBucketId === bucket.id
                const isGain = bucket.totalPnl >= 0
                const barHeight = Math.max(8, Math.round((Math.abs(bucket.totalPnl) / maxAbsPnl) * 80))

                return (
                  <div
                    key={bucket.id}
                    onClick={() => setSelectedBucketId(bucket.id)}
                    className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-bold font-mono text-slate-300 block mb-1">
                      {bucket.shortLabel}
                    </span>

                    {/* P&L Directional Bar */}
                    <div className="h-28 w-full flex flex-col justify-center items-center">
                      <div
                        className={`w-10 sm:w-12 rounded-lg transition-all flex items-center justify-center ${
                          bucket.count === 0
                            ? 'bg-slate-800/30 h-2'
                            : isGain
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 text-slate-950 font-bold'
                            : 'bg-gradient-to-t from-rose-600 to-red-400 text-white font-bold'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      >
                        <span className="text-[10px] font-mono">
                          {bucket.count > 0 ? (isGain ? '▲' : '▼') : '-'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-mono font-bold mt-1.5 ${
                      isGain ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatINR(bucket.totalPnl, { compact: true, showSign: true })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {bucket.count} {bucket.count === 1 ? 'trade' : 'trades'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── VIEW 3: Chronological Stock Entry Timeline ──────── */}
        {viewMode === 'timeline' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>09:15 AM Open</span>
              <span>12:15 PM Midday</span>
              <span>15:30 PM Close</span>
            </div>

            {/* Scatter dots by time */}
            <div className="relative h-28 bg-slate-950/80 rounded-xl border border-slate-800 p-2 flex items-center overflow-x-auto no-scrollbar">
              <div className="absolute inset-x-0 h-0.5 bg-slate-800 top-1/2 -translate-y-1/2" />
              
              <div className="relative w-full h-full flex items-center">
                {closedTrades.map((t, idx) => {
                  const pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0
                  const isWin = pnl >= 0
                  const d = new Date(t.entryDate || t.createdAt || 0)
                  const hour = d.getUTCHours() + 5.5 // Approx IST
                  const min = d.getUTCMinutes()
                  const totalMins = Math.max(555, Math.min(930, hour * 60 + min)) // 9:15 to 15:30 = 555 to 930
                  const leftPct = ((totalMins - 555) / (930 - 555)) * 100

                  return (
                    <div
                      key={t._id || idx}
                      onClick={() => {
                        const bId = getTradeHourIST(t)
                        setSelectedBucketId(bId)
                      }}
                      className="absolute -translate-x-1/2 cursor-pointer group"
                      style={{ left: `${Math.max(2, Math.min(98, leftPct))}%` }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[9px] shadow-lg transition-transform group-hover:scale-125 ${
                          isWin
                            ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50'
                            : 'bg-rose-500 text-white ring-2 ring-rose-400/50'
                        }`}
                        title={`${t.symbol} at ${formatExactTimeIST(t.entryDate)}: ${pnl >= 0 ? '+' : ''}₹${pnl}`}
                      >
                        {t.symbol ? t.symbol.slice(0, 2) : 'ST'}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:block absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs whitespace-nowrap shadow-2xl">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{t.symbol}</span>
                          <span className={`text-[10px] px-1.5 rounded ${isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {isWin ? '+' : ''}₹{pnl}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Entry: {formatExactTimeIST(t.entryDate)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Drilldown Card: Stocks Picked in Selected Timing ─── */}
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Timing Header & Quick Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-white">
                  Stocks Picked at {selectedBucket.label}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono font-bold border border-cyan-500/25">
                  {selectedBucket.count} {selectedBucket.count === 1 ? 'Stock' : 'Stocks'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Session: {selectedBucket.session}
              </p>
            </div>
          </div>

          {/* Outcome Filter & Timing Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'WIN', label: 'Winners (▲)' },
                { id: 'LOSS', label: 'Losses (▼)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterType === f.id
                      ? 'bg-cyan-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick 1-Click Remove Filter Button */}
            {filterType !== 'ALL' && (
              <button
                onClick={() => setFilterType('ALL')}
                className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 hover:bg-rose-500/30 transition-all shadow-sm"
                title="1-Click: Remove outcome filter and show all trades"
              >
                <RotateCcw size={11} className="text-rose-400" />
                <span>Remove Filter</span>
              </button>
            )}

            {/* Quick Timing Switcher Dropdown */}
            <select
              value={selectedBucketId}
              onChange={(e) => setSelectedBucketId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 font-medium"
            >
              {TIME_BUCKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} ({bucketStats.find((s) => s.id === b.id)?.count || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timing Performance Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Total Net P&amp;L</span>
            <span className={`text-base font-bold ${selectedBucket.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatINR(selectedBucket.totalPnl, { showSign: true })}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Win Rate</span>
            <span className="text-base font-bold text-cyan-400">
              {selectedBucket.winRate}% ({selectedBucket.winCount}W / {selectedBucket.lossCount}L)
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Unique Tickers</span>
            <span className="text-base font-bold text-slate-200">
              {selectedBucket.symbolsList.length} Symbols
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Session Type</span>
            <span className="text-xs font-bold text-amber-400 block truncate mt-1">
              {selectedBucket.session.split('&')[0]}
            </span>
          </div>
        </div>

        {/* ── List / Cards of Stocks Picked with 3 Reasons ──── */}
        {filteredBucketTrades.length === 0 ? (
          <div className="card p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-2">
            <Info size={16} className="inline text-slate-500 mb-1" />
            <p>No trades found for {selectedBucket.label} with filter: <strong className="text-white">{filterType}</strong></p>
            {filterType !== 'ALL' && (
              <div>
                <button
                  onClick={() => setFilterType('ALL')}
                  className="px-3 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-600/30 transition-all inline-flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>Remove Filter (Show All)</span>
                </button>
              </div>
            )}
            <p className="text-[11px] text-slate-500">Pick another timing slot from the chart above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBucketTrades.map((t, idx) => {
              const isWin = t.pnlNum >= 0
              const isLong = (t.tradeType || 'Long').toLowerCase() === 'long'
              const formattedTime = formatExactTimeIST(t.entryDate || t.createdAt)

              return (
                <div
                  key={t._id || idx}
                  className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/90 rounded-xl p-3.5 sm:p-4 transition-all shadow-md space-y-3"
                >
                  {/* Top Row: Symbol, Timing, Prices, Outcome */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-8 rounded-full ${isWin ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono">{t.symbol}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                            isLong ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {isLong ? 'Long ▲' : 'Short ▼'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                            <Clock size={11} className="text-cyan-400" />
                            {formattedTime}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Entry: ₹{t.entryPrice?.toLocaleString('en-IN')} → Exit: ₹{t.exitPrice ? t.exitPrice.toLocaleString('en-IN') : 'Open'} (Qty: {t.quantity})
                        </div>
                      </div>
                    </div>

                    {/* Outcome PnL */}
                    <div className="text-right font-mono sm:border-l sm:border-slate-800 sm:pl-4">
                      <div className={`text-base font-bold flex items-center justify-end gap-1 ${
                        isWin ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isWin ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{isWin ? '+' : ''}{formatINR(t.pnlNum)}</span>
                      </div>
                      <span className={`text-[11px] font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWin ? '+' : ''}{t.pnlPercent ? `${t.pnlPercent.toFixed(2)}%` : ''}
                      </span>
                    </div>
                  </div>

                  {/* ── 3 Reasons Display: Entry Reason, Exit Reason, Lesson Learned ── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    {/* Reason 1: Entry Trigger */}
                    <div className="bg-[#070c17] border border-slate-800/60 rounded-lg p-2.5">
                      <div className="text-[10px] text-cyan-400 uppercase font-semibold flex items-center gap-1 mb-1">
                        <span>🎯 1. Entry Reason</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {t.entryReason || 'Technical setup / Price action breakout at this timing.'}
                      </p>
                    </div>

                    {/* Reason 2: Exit Execution */}
                    <div className="bg-[#070c17] border border-slate-800/60 rounded-lg p-2.5">
                      <div className="text-[10px] text-amber-400 uppercase font-semibold flex items-center gap-1 mb-1">
                        <span>🏁 2. Exit Reason</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {t.exitReason || 'Target reached or trailing stop loss executed.'}
                      </p>
                    </div>

                    {/* Reason 3: Key Takeaway / Lesson */}
                    <div className="bg-[#070c17] border border-slate-800/60 rounded-lg p-2.5">
                      <div className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1 mb-1">
                        <span>💡 3. Lesson Learned</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {t.lessonLearned || 'Strict risk management preserves trading capital.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
