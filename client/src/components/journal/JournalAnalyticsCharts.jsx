import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  Flame,
  Shield,
  Activity,
  BarChart3,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { formatINR, computeJournalAnalytics } from '../../lib/journalAnalytics'

export default function JournalAnalyticsCharts({ trades = [], serverAnalytics = null }) {
  const [activeTab, setActiveTab] = useState('equity') // 'equity', 'waterfall', 'streaks', 'ratios', 'symbols'
  const [waterfallSort, setWaterfallSort] = useState('chrono') // 'chrono' or 'ranked'
  const [hoveredTrade, setHoveredTrade] = useState(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Compute analytics dynamically from active trades or fallback to server
  const analytics = useMemo(() => {
    return computeJournalAnalytics(trades)
  }, [trades])

  const {
    closedTradesCount,
    winCount,
    lossCount,
    winRate,
    lossRate,
    netPnl,
    totalWinPnl,
    totalLossPnl,
    avgWinner,
    avgLoser,
    profitFactor,
    maxDrawdown,
    highestProfitTrade,
    lowestProfitTrade,
    longestWinStreak,
    longestWinStreakPnl,
    longestLossStreak,
    longestLossStreakPnl,
    currentStreak,
    streakHistory,
    equityCurve,
    symbolList,
    typeStats,
  } = analytics

  // Closed trades sorted chronologically for charts
  const closedTrades = useMemo(() => {
    return trades
      .filter((t) => t && t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate || a.createdAt || 0) - new Date(b.entryDate || b.createdAt || 0))
  }, [trades])

  // Waterfall bars (chrono or ranked by P&L)
  const waterfallBars = useMemo(() => {
    if (closedTrades.length === 0) return []
    const list = closedTrades.map((t, idx) => ({
      ...t,
      pnlNum: typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0,
      origIndex: idx + 1,
    }))

    if (waterfallSort === 'ranked') {
      return [...list].sort((a, b) => b.pnlNum - a.pnlNum)
    }
    return list
  }, [closedTrades, waterfallSort])

  // Calculate SVG Dimensions & Path for Equity Curve
  const svgWidth = 800
  const svgHeight = 260
  const padding = { top: 25, right: 30, bottom: 35, left: 60 }
  const plotWidth = svgWidth - padding.left - padding.right
  const plotHeight = svgHeight - padding.top - padding.bottom

  const equityPoints = useMemo(() => {
    if (equityCurve.length === 0) return []
    const pnls = equityCurve.map((p) => p.cumulativePnl)
    const minPnl = Math.min(0, ...pnls)
    const maxPnl = Math.max(0, ...pnls)
    const range = maxPnl - minPnl || 1

    return equityCurve.map((point, i) => {
      const x = padding.left + (i / Math.max(1, equityCurve.length - 1)) * plotWidth
      const y = padding.top + plotHeight - ((point.cumulativePnl - minPnl) / range) * plotHeight
      return {
        ...point,
        x,
        y,
      }
    })
  }, [equityCurve, plotWidth, plotHeight, padding.left, padding.top])

  const zeroY = useMemo(() => {
    if (equityCurve.length === 0) return padding.top + plotHeight
    const pnls = equityCurve.map((p) => p.cumulativePnl)
    const minPnl = Math.min(0, ...pnls)
    const maxPnl = Math.max(0, ...pnls)
    const range = maxPnl - minPnl || 1
    return padding.top + plotHeight - ((0 - minPnl) / range) * plotHeight
  }, [equityCurve, plotHeight, padding.top])

  const equityPathD = useMemo(() => {
    if (equityPoints.length === 0) return ''
    if (equityPoints.length === 1) {
      return `M ${padding.left} ${equityPoints[0].y} L ${padding.left + plotWidth} ${equityPoints[0].y}`
    }
    return equityPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
    }, '')
  }, [equityPoints, padding.left, plotWidth])

  const equityAreaD = useMemo(() => {
    if (equityPoints.length === 0) return ''
    const firstX = equityPoints[0].x
    const lastX = equityPoints[equityPoints.length - 1].x
    return `${equityPathD} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`
  }, [equityPathD, equityPoints, zeroY])

  // Waterfall Chart Max Value
  const maxAbsPnl = useMemo(() => {
    if (waterfallBars.length === 0) return 1
    const maxVal = Math.max(...waterfallBars.map((b) => Math.abs(b.pnlNum)))
    return maxVal || 1
  }, [waterfallBars])

  if (closedTradesCount === 0) {
    return (
      <div className="card bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-8 shadow-2xl text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <BarChart3 size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-200">No Closed Trades For Analytics</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Log trades with entry and exit prices in your journal to unlock data visualizations including highest
          profits, lowest losses, win/loss streaks, and equity growth curves.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Top Record KPI Highlights (Highest Profit, Lowest Profit, Longest Streak) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Highest Profit Trade Card */}
        <div className="relative overflow-hidden card bg-gradient-to-br from-emerald-950/40 via-[#0b1329] to-[#0b1329] border border-emerald-500/30 rounded-2xl p-4.5 shadow-xl transition-all hover:border-emerald-500/50">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Trophy size={11} className="text-amber-400" />
              Highest Profit
            </span>
            <span className="text-[10px] text-slate-500 font-mono">ALL-TIME BEST</span>
          </div>

          {highestProfitTrade ? (
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                  {formatINR(highestProfitTrade.pnl, { compact: true, showSign: true })}
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  +{highestProfitTrade.pnlPercent}%
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1">
                  <strong>{highestProfitTrade.symbol}</strong>
                  <span className="text-[10px] text-slate-400">({highestProfitTrade.tradeType})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(highestProfitTrade.entryDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate" title={`Full P&L: ${formatINR(highestProfitTrade.pnl)}`}>
                Exact: {formatINR(highestProfitTrade.pnl)}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-2">No closed winning trade</div>
          )}
        </div>

        {/* 2. Lowest Profit (Biggest Loss) Card */}
        <div className="relative overflow-hidden card bg-gradient-to-br from-rose-950/40 via-[#0b1329] to-[#0b1329] border border-rose-500/30 rounded-2xl p-4.5 shadow-xl transition-all hover:border-rose-500/50">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <AlertTriangle size={11} className="text-rose-400" />
              Lowest Profit (Max Loss)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">LARGEST DIP</span>
          </div>

          {lowestProfitTrade ? (
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-2xl font-black font-mono text-rose-400 tracking-tight">
                  {formatINR(lowestProfitTrade.pnl, { compact: true, showSign: true })}
                </span>
                <span className="text-xs font-bold text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  {lowestProfitTrade.pnlPercent}%
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1">
                  <strong>{lowestProfitTrade.symbol}</strong>
                  <span className="text-[10px] text-slate-400">({lowestProfitTrade.tradeType})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(lowestProfitTrade.entryDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate" title={`Full P&L: ${formatINR(lowestProfitTrade.pnl)}`}>
                Exact: {formatINR(lowestProfitTrade.pnl)}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-2">No closed losing trade</div>
          )}
        </div>

        {/* 3. Longest Profit Streak Card */}
        <div className="relative overflow-hidden card bg-gradient-to-br from-amber-950/30 via-[#0b1329] to-[#0b1329] border border-amber-500/30 rounded-2xl p-4.5 shadow-xl transition-all hover:border-amber-500/50">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Flame size={11} className="text-amber-400" />
              Longest Profit Streak
            </span>
            <span className="text-[10px] text-slate-500 font-mono">MOMENTUM</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                {longestWinStreak} <span className="text-sm font-medium text-slate-400">Wins in a row</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Streak Gains:</span>
              <span className="font-mono font-bold text-emerald-400">
                +{formatINR(longestWinStreakPnl, { compact: true })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Max Loss Streak:</span>
              <span className="font-mono text-rose-400 font-medium">
                {longestLossStreak} {longestLossStreak === 1 ? 'Loss' : 'Losses'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Current Streak & Profit Factor Card */}
        <div className="relative overflow-hidden card bg-gradient-to-br from-blue-950/30 via-[#0b1329] to-[#0b1329] border border-blue-500/30 rounded-2xl p-4.5 shadow-xl transition-all hover:border-blue-500/50">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
              <Activity size={11} className="text-blue-400" />
              Current Active Streak
            </span>
            <span className="text-[10px] text-slate-500 font-mono">STATUS</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                currentStreak.type === 'WIN' ? 'text-emerald-400' : currentStreak.type === 'LOSS' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {currentStreak.count > 0 ? (
                  <>
                    {currentStreak.count} {currentStreak.type === 'WIN' ? 'Win Streak 🔥' : 'Loss Streak ❄️'}
                  </>
                ) : (
                  'Neutral'
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Profit Factor:</span>
              <span className="font-mono font-bold text-blue-300">
                {profitFactor > 50 ? '> 50x' : `${profitFactor}x`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Max Drawdown:</span>
              <span className="font-mono text-rose-300">
                -{formatINR(maxDrawdown, { compact: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Visualization Graph Workspace ─── */}
      <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-5">
        {/* Visualization Tabs Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Journal Data Visualizations</h3>
              <p className="text-[11px] text-slate-400">
                Interactive graphical views for trade outcomes, equity trajectory, and streak distributions.
              </p>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'equity', label: 'Equity Curve', icon: TrendingUp },
              { id: 'waterfall', label: 'Trade-by-Trade P&L', icon: BarChart3 },
              { id: 'streaks', label: 'Streak Visualizer', icon: Flame },
              { id: 'ratios', label: 'Win/Loss & Risk', icon: PieChart },
              { id: 'symbols', label: 'Symbol Breakdown', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : 'text-blue-400'} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── TAB 1: Equity Curve (Cumulative Growth) ── */}
        {activeTab === 'equity' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px]">Net Cumulative P&amp;L</span>
                  <span className={`text-base font-bold font-mono ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatINR(netPnl, { compact: true, showSign: true })}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 block text-[11px]">Closed Trades</span>
                  <span className="text-base font-bold font-mono text-slate-200">{closedTradesCount}</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 block text-[11px]">Max Drawdown</span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    -{formatINR(maxDrawdown, { compact: true })}
                  </span>
                </div>
              </div>

              {hoveredPoint && (
                <div className="bg-slate-900/90 border border-blue-500/40 px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-2 shadow-lg">
                  <span className="text-blue-300 font-bold">{hoveredPoint.symbol}</span>
                  <span className="text-slate-400">Trade P&L:</span>
                  <span className={hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {formatINR(hoveredPoint.pnl, { compact: true, showSign: true })}
                  </span>
                  <span className="text-slate-400">| Cumulative:</span>
                  <span className="font-bold text-white">
                    {formatINR(hoveredPoint.cumulativePnl, { compact: true, showSign: true })}
                  </span>
                </div>
              )}
            </div>

            {/* SVG Interactive Area Chart */}
            <div className="relative overflow-x-auto bg-[#080d1a] rounded-xl border border-slate-800/80 p-2">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto min-w-[640px] select-none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="equityGradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="equityGradRed" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left + plotWidth}
                  y2={padding.top}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <line
                  x1={padding.left}
                  y1={zeroY}
                  x2={padding.left + plotWidth}
                  y2={zeroY}
                  stroke="#334155"
                  strokeWidth="1.5"
                />
                <line
                  x1={padding.left}
                  y1={padding.top + plotHeight}
                  x2={padding.left + plotWidth}
                  y2={padding.top + plotHeight}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />

                {/* Zero label */}
                <text
                  x={padding.left - 8}
                  y={zeroY + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  ₹0
                </text>

                {/* Shaded Area under Curve */}
                {equityAreaD && (
                  <path
                    d={equityAreaD}
                    fill={netPnl >= 0 ? 'url(#equityGradGreen)' : 'url(#equityGradRed)'}
                  />
                )}

                {/* Curve Line */}
                {equityPathD && (
                  <path
                    d={equityPathD}
                    fill="none"
                    stroke={netPnl >= 0 ? '#10b981' : '#ef4444'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Data Points */}
                {equityPoints.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.index === pt.index ? 6 : 3.5}
                      fill={pt.pnl >= 0 ? '#10b981' : '#ef4444'}
                      stroke="#080d1a"
                      strokeWidth="2"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Date label at bottom for selected milestones */}
                    {(i === 0 || i === equityPoints.length - 1 || i % Math.ceil(equityPoints.length / 5) === 0) && (
                      <text
                        x={pt.x}
                        y={padding.top + plotHeight + 18}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {new Date(pt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Trajectory shows chronological account growth as positions close.</span>
              <span>Hover points to inspect individual trade impacts.</span>
            </div>
          </div>
        )}

        {/* ── TAB 2: Trade-by-Trade P&L Waterfall (With Highest / Lowest Callouts) ── */}
        {activeTab === 'waterfall' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Order by:</span>
                <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setWaterfallSort('chrono')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      waterfallSort === 'chrono' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Chronological
                  </button>
                  <button
                    onClick={() => setWaterfallSort('ranked')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      waterfallSort === 'ranked' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ranked (Best to Worst)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  Winner
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  Loser
                </span>
                <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <Trophy size={11} className="text-amber-400" />
                  Highest Win
                </span>
                <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                  <AlertTriangle size={11} className="text-rose-400" />
                  Max Loss
                </span>
              </div>
            </div>

            {/* Waterfall Bars Container */}
            <div className="bg-[#080d1a] rounded-xl border border-slate-800/80 p-4 overflow-x-auto">
              <div className="min-w-[620px] flex items-end gap-2 h-52 relative border-b border-slate-700/60 pb-1">
                {/* Zero Reference Line */}
                <div
                  className="absolute w-full border-b border-slate-600/80 border-dashed z-0"
                  style={{ bottom: '50%' }}
                />

                {waterfallBars.map((bar, idx) => {
                  const isWin = bar.pnlNum >= 0
                  const heightPercent = Math.min(100, Math.max(8, (Math.abs(bar.pnlNum) / maxAbsPnl) * 100))
                  const isHighest = highestProfitTrade && bar.id === highestProfitTrade.id
                  const isLowest = lowestProfitTrade && bar.id === lowestProfitTrade.id

                  return (
                    <div
                      key={bar.id || idx}
                      className="flex-1 flex flex-col items-center justify-center relative group cursor-pointer z-10"
                      style={{ height: '100%' }}
                      onMouseEnter={() => setHoveredTrade(bar)}
                      onMouseLeave={() => setHoveredTrade(null)}
                    >
                      {/* Callout Pins for Highest and Lowest */}
                      {isHighest && (
                        <div className="absolute top-0 flex flex-col items-center animate-bounce z-20">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                            🏆 Highest
                          </span>
                        </div>
                      )}
                      {isLowest && (
                        <div className="absolute bottom-0 flex flex-col items-center z-20">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md">
                            ⚠️ Max Loss
                          </span>
                        </div>
                      )}

                      {/* Bar body anchored at 50% */}
                      <div
                        className="w-full relative flex items-center justify-center"
                        style={{ height: '100%' }}
                      >
                        <div
                          className={`w-full max-w-[32px] rounded-sm transition-all ${
                            isWin
                              ? isHighest
                                ? 'bg-gradient-to-t from-emerald-600 to-amber-300 ring-2 ring-amber-400/80 shadow-lg shadow-emerald-500/30'
                                : 'bg-emerald-500 hover:bg-emerald-400'
                              : isLowest
                              ? 'bg-gradient-to-b from-rose-600 to-rose-900 ring-2 ring-rose-400/80 shadow-lg shadow-rose-500/30'
                              : 'bg-rose-500 hover:bg-rose-400'
                          } ${hoveredTrade?.id === bar.id ? 'brightness-125 scale-105' : ''}`}
                          style={{
                            height: `${heightPercent * 0.45}%`,
                            position: 'absolute',
                            bottom: isWin ? '50%' : 'auto',
                            top: !isWin ? '50%' : 'auto',
                          }}
                        />
                      </div>

                      {/* Symbol label */}
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[42px] absolute -bottom-5">
                        {bar.symbol}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Hover Inspection Drawer */}
              {hoveredTrade && (
                <div className="mt-6 p-3 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{hoveredTrade.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      hoveredTrade.tradeType === 'Long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {hoveredTrade.tradeType}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(hoveredTrade.entryDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-slate-400">
                      Entry: ₹{hoveredTrade.entryPrice} → Exit: ₹{hoveredTrade.exitPrice || '—'}
                    </span>
                    <span className={`font-bold ${hoveredTrade.pnlNum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatINR(hoveredTrade.pnlNum, { compact: false, showSign: true })}
                      {hoveredTrade.pnlPercent ? ` (${hoveredTrade.pnlPercent > 0 ? '+' : ''}${hoveredTrade.pnlPercent}%)` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: Streak Visualizer & Timeline ── */}
        {activeTab === 'streaks' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" />
                  Longest Winning Streak
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {longestWinStreak} Trades
                </div>
                <p className="text-[11px] text-slate-400">
                  Generated <strong className="text-emerald-300">+{formatINR(longestWinStreakPnl, { compact: true })}</strong> in cumulative gains.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-rose-500/20 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Shield size={14} className="text-rose-400" />
                  Longest Losing Streak
                </span>
                <div className="text-xl font-bold font-mono text-rose-400">
                  {longestLossStreak} Trades
                </div>
                <p className="text-[11px] text-slate-400">
                  Drew down <strong className="text-rose-300">{formatINR(longestLossStreakPnl, { compact: true })}</strong> before recovery.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-blue-500/20 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Activity size={14} className="text-blue-400" />
                  Current Active Run
                </span>
                <div className={`text-xl font-bold font-mono ${
                  currentStreak.type === 'WIN' ? 'text-emerald-400' : currentStreak.type === 'LOSS' ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {currentStreak.count > 0 ? `${currentStreak.count} ${currentStreak.type}` : 'None'}
                </div>
                <p className="text-[11px] text-slate-400">
                  Active momentum: {formatINR(currentStreak.pnl, { compact: true, showSign: true })}
                </p>
              </div>
            </div>

            {/* Streak Timeline Strip */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Sequential Streak Timeline
              </span>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#080d1a] border border-slate-800">
                {streakHistory.map((streak, i) => {
                  const isWin = streak.type === 'WIN'
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                        isWin
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                          : 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:border-rose-400'
                      }`}
                    >
                      {isWin ? <Flame size={13} className="text-amber-400" /> : <Shield size={13} className="text-rose-400" />}
                      <span className="font-bold">
                        {streak.count} {isWin ? 'W' : 'L'}
                      </span>
                      <span className="text-[10px] opacity-80">
                        ({formatINR(streak.pnl, { compact: true, showSign: true })})
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Win/Loss Donut & Risk Ratios ── */}
        {activeTab === 'ratios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: SVG Donut Chart */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#080d1a] border border-slate-800/80">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="14"
                  />
                  {/* Loss Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="14"
                    strokeDasharray={`${lossRate * 2.513} 251.3`}
                    strokeDashoffset="0"
                  />
                  {/* Win Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeDasharray={`${winRate * 2.513} 251.3`}
                    strokeDashoffset={`-${lossRate * 2.513}`}
                  />
                </svg>

                {/* Donut Center */}
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-white font-mono">{winRate}%</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                    Win Rate
                  </span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  {winCount} Wins ({winRate}%)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  {lossCount} Losses ({lossRate}%)
                </span>
              </div>
            </div>

            {/* Right: Expectancy & Risk Statistics */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Profit Factor (Gains / Losses)</span>
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {profitFactor > 50 ? '> 50x' : `${profitFactor}x`}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${Math.min(100, (profitFactor / 3) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Values &gt; 1.5x indicate a robust positive statistical expectancy.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Average Winner vs Average Loser</span>
                  <span className="font-mono font-bold text-slate-200">
                    <span className="text-emerald-400">+{formatINR(avgWinner, { compact: true })}</span>
                    {' / '}
                    <span className="text-rose-400">{formatINR(avgLoser, { compact: true })}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Gross Profits: <strong className="text-emerald-400 font-mono">+{formatINR(totalWinPnl, { compact: true })}</strong></span>
                  <span>Gross Losses: <strong className="text-rose-400 font-mono">{formatINR(totalLossPnl, { compact: true })}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: Performance by Symbol & Long/Short ── */}
        {activeTab === 'symbols' && (
          <div className="space-y-6">
            {/* Long vs Short Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Long', 'Short'].map((type) => {
                const data = typeStats[type]
                return (
                  <div
                    key={type}
                    className="p-4 rounded-xl bg-[#080d1a] border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {type} Positions
                      </span>
                      <span className="text-xs font-mono text-slate-400">{data.count} Trades</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={`text-xl font-bold font-mono ${data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINR(data.pnl, { compact: true, showSign: true })}
                      </span>
                      <span className="text-xs font-bold text-blue-400">
                        {data.winRate}% Win Rate
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Symbol Ranking Horizontal Bars */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Profitability by Instrument / Symbol
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {symbolList.map((item) => {
                  const isNetPositive = item.totalPnl >= 0
                  return (
                    <div
                      key={item.symbol}
                      className="p-3 rounded-lg bg-[#080d1a] border border-slate-800/70 flex items-center justify-between gap-4 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <span className="font-bold text-slate-200">{item.symbol}</span>
                        <span className="text-[10px] text-slate-500">({item.trades} trades)</span>
                      </div>

                      <div className="flex-1 max-w-xs hidden sm:block">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isNetPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.max(10, item.winRate))}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-bold block ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatINR(item.totalPnl, { compact: true, showSign: true })}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.wins}W / {item.losses}L ({item.winRate}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
