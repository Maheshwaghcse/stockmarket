import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Award,
  Zap,
} from 'lucide-react'
import {
  formatINR,
  calculateStrategyMetrics,
  calculateDateWisePerformance,
  calculateMonthlyPerformance,
  calculateTradePnl,
} from '../../lib/journalAnalytics'

// Default trading strategies
export const PREDEFINED_STRATEGIES = [
  'Tiger Breakout',
  'Camarilla Pivot',
  'First Candle Close Range',
  'Breakout',
  'Pullback',
  'VWAP Reversal',
  'Support & Resistance',
  'Trend Following',
  'CPR / Pivot Bounce',
  'Chart Pattern',
  'Scalp Momentum',
]

export default function StrategyPerformanceDashboard({
  allTrades = [],
  initialStrategy = '',
  onClose,
  onSelectTrade,
}) {
  // ─── 1. DISCOVER STRATEGIES ──────────────────────────────────────────────
  const availableStrategies = useMemo(() => {
    const set = new Set()

    // Add predefined strategies first
    PREDEFINED_STRATEGIES.forEach((s) => set.add(s))

    // Add any custom strategies from trades
    if (Array.isArray(allTrades)) {
      allTrades.forEach((t) => {
        if (t.strategy && typeof t.strategy === 'string' && t.strategy.trim()) {
          set.add(t.strategy.trim())
        }
      })
    }

    return Array.from(set)
  }, [allTrades])

  // Current selected strategy

  const [selectedStrategy, setSelectedStrategy] = useState(() => {
    if (initialStrategy && availableStrategies.includes(initialStrategy)) {
      return initialStrategy
    }
    return availableStrategies[0] || 'Tiger Breakout'
  })

  // Strategy search filter
  const [strategySearch, setStrategySearch] = useState('')

  // Active view tab: 'overview' | 'datewise' | 'monthly' | 'trades' | 'compare'
  const [activeTab, setActiveTab] = useState('overview')

  // Date filters
  const [datePreset, setDatePreset] = useState('all') // 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Monthly filters
  const [selectedYear, setSelectedYear] = useState('all')

  // ─── 2. STRICT DATA SEPARATION: ISOLATE SELECTED STRATEGY TRADES ─────────
  // A trade belongs to this strategy ONLY if normalizeStrategy(t.strategy) matches.
  // NO DATA FROM ANY OTHER STRATEGY IS EVER MIXED.
  const isolatedStrategyTrades = useMemo(() => {
    if (!Array.isArray(allTrades)) return []
    const target = selectedStrategy.toLowerCase().trim()

    return allTrades.filter((t) => {
      const tradeStrat = (t.strategy || '').toLowerCase().trim()
      return tradeStrat === target
    })
  }, [allTrades, selectedStrategy])

  // Date-filtered strategy trades
  const dateFilteredStrategyTrades = useMemo(() => {
    if (datePreset === 'all') return isolatedStrategyTrades

    const now = new Date()
    let start = null
    let end = null

    if (datePreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()
    } else if (datePreset === '7d') {
      start = now.getTime() - 7 * 24 * 60 * 60 * 1000
    } else if (datePreset === '30d') {
      start = now.getTime() - 30 * 24 * 60 * 60 * 1000
    } else if (datePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    } else if (datePreset === 'custom') {
      if (customStartDate) start = new Date(customStartDate).setHours(0, 0, 0, 0)
      if (customEndDate) end = new Date(customEndDate).setHours(23, 59, 59, 999)
    }

    return isolatedStrategyTrades.filter((t) => {
      const d = new Date(t.entryDate || t.createdAt || 0).getTime()
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }, [isolatedStrategyTrades, datePreset, customStartDate, customEndDate])

  // ─── 3. METRICS COMPUTATION (10 REQUIRED PERFORMANCE METRICS) ────────────
  const metrics = useMemo(() => {
    return calculateStrategyMetrics(dateFilteredStrategyTrades)
  }, [dateFilteredStrategyTrades])

  // ─── 4. DATE-WISE BREAKDOWN ──────────────────────────────────────────────
  const dateWisePerformance = useMemo(() => {
    return calculateDateWisePerformance(isolatedStrategyTrades, {
      startDate: datePreset === 'custom' ? customStartDate : undefined,
      endDate: datePreset === 'custom' ? customEndDate : undefined,
    })
  }, [isolatedStrategyTrades, datePreset, customStartDate, customEndDate])

  // ─── 5. MONTHLY BREAKDOWN ────────────────────────────────────────────────
  const monthlyPerformance = useMemo(() => {
    return calculateMonthlyPerformance(isolatedStrategyTrades, {
      year: selectedYear !== 'all' ? selectedYear : undefined,
    })
  }, [isolatedStrategyTrades, selectedYear])

  // Available years from strategy trades
  const availableYears = useMemo(() => {
    const years = new Set()
    isolatedStrategyTrades.forEach((t) => {
      const d = t.entryDate || t.createdAt
      if (d) years.add(new Date(d).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [isolatedStrategyTrades])

  // ─── 6. MULTI-STRATEGY COMPARATIVE ANALYSIS ──────────────────────────────
  const allStrategiesComparison = useMemo(() => {
    return availableStrategies.map((stratName) => {
      const target = stratName.toLowerCase().trim()
      const stratTrades = allTrades.filter(
        (t) => (t.strategy || '').toLowerCase().trim() === target
      )
      const m = calculateStrategyMetrics(stratTrades)
      return {
        strategy: stratName,
        metrics: m,
      }
    })
  }, [availableStrategies, allTrades])

  // Filtered strategies list for sidebar/dropdown
  const filteredStrategies = useMemo(() => {
    if (!strategySearch.trim()) return availableStrategies
    const q = strategySearch.toLowerCase().trim()
    return availableStrategies.filter((s) => s.toLowerCase().includes(q))
  }, [availableStrategies, strategySearch])

  return (
    <div className="w-full bg-[#070c1a] border-2 border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 font-sans overflow-hidden">
      {/* ─── TOP HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-[#0b142c] p-4 sm:p-6 border-b-2 border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Target size={20} />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Independent Strategy Performance Dashboard
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              प्रत्येक Trading Strategy चा स्वतंत्र Win Rate आणि अचूक Performance Analysis
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Strict Isolation Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-sm">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Strict Data Isolation Active</span>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* ─── STRATEGY SELECTOR BAR ─────────────────────────────────────── */}
        <div className="mt-5 pt-4 border-t border-slate-700/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-blue-400" />
              <span>Select Trading Strategy:</span>
            </span>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search strategy..."
                value={strategySearch}
                onChange={(e) => setStrategySearch(e.target.value)}
                className="w-full bg-[#131f3f] border border-slate-600 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Quick Strategy Pills / Dropdown */}
          <div className="flex flex-wrap items-center gap-2 max-h-32 overflow-y-auto pr-1">
            {filteredStrategies.map((strat) => {
              const isSelected = strat.toLowerCase() === selectedStrategy.toLowerCase()
              const count = allTrades.filter(
                (t) => (t.strategy || '').toLowerCase().trim() === strat.toLowerCase().trim()
              ).length

              return (
                <button
                  type="button"
                  key={strat}
                  onClick={() => setSelectedStrategy(strat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-2 ring-blue-400'
                      : 'bg-[#121c38] border border-slate-700 text-slate-300 hover:text-white hover:bg-[#1a274c]'
                    }`}
                >
                  <span>{strat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                  >
                    {count} {count === 1 ? 'trade' : 'trades'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── ACTIVE STRATEGY BANNER & SUB-TABS ───────────────────────────── */}
      <div className="bg-[#0d1733] px-4 sm:px-6 py-3 border-b border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Currently Analyzing Strategy:
            </div>
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{selectedStrategy}</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {dateFilteredStrategyTrades.length} Trades Analyzed
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[#080e22] border border-slate-700/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Overview & Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('datewise')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'datewise'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Date-Wise Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'monthly'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Monthly Performance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'trades'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Trades Log ({dateFilteredStrategyTrades.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'compare'
                ? 'bg-purple-600 text-white shadow'
                : 'text-purple-300 hover:text-white'
              }`}
          >
            All Strategies Compare
          </button>
        </div>
      </div>

      {/* ─── DATE RANGE PRESET BAR (WHEN IN OVERVIEW OR TRADES TAB) ──────── */}
      {(activeTab === 'overview' || activeTab === 'trades') && (
        <div className="bg-[#091124] px-4 sm:px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
              <Calendar size={12} className="text-blue-400" />
              <span>Timeframe:</span>
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${datePreset === p.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-[#152244] border border-slate-600 rounded px-2 py-0.5 text-xs text-white outline-none"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-[#152244] border border-slate-600 rounded px-2 py-0.5 text-xs text-white outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* ─── MAIN CONTENT BODY ──────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: OVERVIEW & 10 REQUIRED PERFORMANCE METRICS               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* TOP SUMMARY HERO: WIN RATE & NET P&L */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* WIN RATE HERO GAUGE */}
              <div className="bg-[#0b142d] border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={15} className="text-amber-400" />
                    <span>Independent Win Rate</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {metrics.winningTrades}W / {metrics.losingTrades}L
                  </span>
                </div>

                <div className="py-4 flex items-center justify-between">
                  <div>
                    <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      {metrics.winRate}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Loss Rate: <span className="font-mono text-rose-400 font-bold">{metrics.lossRate}%</span>
                    </div>
                  </div>

                  {/* Circular/Progress Indicator */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={metrics.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}
                        strokeDasharray={`${metrics.winRate}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-xs font-mono font-bold text-white">
                      {metrics.winRate >= 50 ? 'WIN' : 'LOSS'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div
                    style={{ width: `${metrics.winRate}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`Win Rate: ${metrics.winRate}%`}
                  />
                  <div
                    style={{ width: `${metrics.lossRate}%` }}
                    className="bg-rose-500 h-full transition-all duration-500"
                    title={`Loss Rate: ${metrics.lossRate}%`}
                  />
                </div>
              </div>

              {/* NET P&L HERO */}
              <div className="bg-[#0b142d] border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={15} className="text-blue-400" />
                    <span>Total Net Profit & Loss</span>
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${metrics.totalPnl >= 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                  >
                    {metrics.totalPnl >= 0 ? 'PROFIT' : 'LOSS'}
                  </span>
                </div>

                <div className="py-3">
                  <div
                    className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${metrics.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                  >
                    {formatINR(metrics.totalPnl, { compact: false, showSign: true })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>Avg P&L per Trade:</span>
                    <span
                      className={`font-mono font-bold ${metrics.averagePnlPerTrade >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                    >
                      {formatINR(metrics.averagePnlPerTrade, { compact: false, showSign: true })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Gross Wins:</span>
                    <div className="font-mono text-emerald-400 font-bold">
                      {formatINR(metrics.totalProfit, { compact: false, showSign: false })}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Gross Losses:</span>
                    <div className="font-mono text-rose-400 font-bold">
                      {formatINR(metrics.totalLoss, { compact: false, showSign: false })}
                    </div>
                  </div>
                </div>
              </div>

              {/* RISK / REWARD & STREAKS HERO */}
              <div className="bg-[#0b142d] border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={15} className="text-purple-400" />
                    <span>Risk-Reward & Streaks</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Ratio: {metrics.riskRewardRatio}
                  </span>
                </div>

                <div className="py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold">Max Consecutive Wins:</span>
                    <span className="text-base font-black font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      {metrics.maxConsecutiveWins} in a row
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold">Max Consecutive Losses:</span>
                    <span className="text-base font-black font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                      {metrics.maxConsecutiveLosses} in a row
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Profit Factor:</span>
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {metrics.profitFactor}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── 10 METRIC CARDS GRID ───────────────────────────────────── */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-400" />
                  <span>10 Independent Performance Metrics ({selectedStrategy})</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Calculated exclusively from this strategy's trades
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Total Trades */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    1. Total Trades
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {metrics.totalTrades}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {metrics.openTrades > 0 ? `${metrics.openTrades} currently open` : 'All trades closed'}
                  </div>
                </div>

                {/* 2. Winning Trades */}
                <div className="bg-[#0b1328] border border-emerald-900/40 rounded-xl p-3.5 space-y-1 hover:border-emerald-700/60 transition-all">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>2. Winning Trades</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {metrics.winningTrades}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {metrics.totalTrades > 0
                      ? `${((metrics.winningTrades / metrics.totalTrades) * 100).toFixed(1)}% of total`
                      : '0%'}
                  </div>
                </div>

                {/* 3. Losing Trades */}
                <div className="bg-[#0b1328] border border-rose-900/40 rounded-xl p-3.5 space-y-1 hover:border-rose-700/60 transition-all">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1">
                    <XCircle size={12} />
                    <span>3. Losing Trades</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-rose-400">
                    {metrics.losingTrades}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {metrics.totalTrades > 0
                      ? `${((metrics.losingTrades / metrics.totalTrades) * 100).toFixed(1)}% of total`
                      : '0%'}
                  </div>
                </div>

                {/* 4. Win Rate (%) */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                    <Percent size={12} />
                    <span>4. Win Rate (%)</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-400">
                    {metrics.winRate}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {metrics.winningTrades} profitable trades
                  </div>
                </div>

                {/* 5. Loss Rate (%) */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Percent size={12} />
                    <span>5. Loss Rate (%)</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-rose-300">
                    {metrics.lossRate}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {metrics.losingTrades} losing trades
                  </div>
                </div>

                {/* 6. Total Profit & Loss */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    6. Total Net P&L
                  </div>
                  <div
                    className={`text-xl font-black font-mono ${metrics.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                  >
                    {formatINR(metrics.totalPnl, { compact: true, showSign: true })}
                  </div>
                  <div className="text-[10px] text-slate-500">Cumulative strategy return</div>
                </div>

                {/* 7. Average Profit per Trade */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                    <ArrowUpRight size={13} />
                    <span>7. Avg Profit / Win</span>
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-400">
                    {formatINR(metrics.averageProfit, { compact: false, showSign: false })}
                  </div>
                  <div className="text-[10px] text-slate-500">Per winning trade</div>
                </div>

                {/* 8. Average Loss per Trade */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1">
                    <ArrowDownRight size={13} />
                    <span>8. Avg Loss / Trade</span>
                  </div>
                  <div className="text-xl font-black font-mono text-rose-400">
                    {formatINR(metrics.averageLoss, { compact: false, showSign: false })}
                  </div>
                  <div className="text-[10px] text-slate-500">Per losing trade</div>
                </div>

                {/* 9. Risk-Reward Ratio */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wide">
                    9. Risk-Reward Ratio
                  </div>
                  <div className="text-xl font-black font-mono text-purple-400">
                    {metrics.riskRewardRatio}
                  </div>
                  <div className="text-[10px] text-slate-500">Avg Reward vs Avg Risk</div>
                </div>

                {/* 10. Max Consecutive Wins / Losses */}
                <div className="bg-[#0b1328] border border-slate-800 rounded-xl p-3.5 space-y-1 hover:border-slate-700 transition-all">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    10. Max Streaks
                  </div>
                  <div className="text-xs font-mono space-y-0.5">
                    <div className="text-emerald-400 font-bold">
                      Wins: {metrics.maxConsecutiveWins} in a row
                    </div>
                    <div className="text-rose-400 font-bold">
                      Losses: {metrics.maxConsecutiveLosses} in a row
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">Consecutive record</div>
                </div>
              </div>
            </div>

            {/* QUICK PREVIEW OF DATE-WISE & MONTHLY TRENDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Date-wise Mini Breakdown */}
              <div className="bg-[#0b142d] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-400" />
                    <span>Recent Daily Performance ({selectedStrategy})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('datewise')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    View All Days →
                  </button>
                </div>

                {dateWisePerformance.length > 0 ? (
                  <div className="divide-y divide-slate-800/80 text-xs">
                    {dateWisePerformance.slice(0, 5).map((day) => (
                      <div key={day.date} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-200">{day.displayDate}</div>
                          <div className="text-[10px] text-slate-400">
                            {day.totalTrades} {day.totalTrades === 1 ? 'trade' : 'trades'} • {day.winningTrades}W / {day.losingTrades}L
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-mono font-bold ${day.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {formatINR(day.totalPnl, { compact: false, showSign: true })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Win: <span className="font-mono text-amber-300">{day.winRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No trades recorded for this strategy yet.
                  </div>
                )}
              </div>

              {/* Monthly Mini Breakdown */}
              <div className="bg-[#0b142d] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-purple-400" />
                    <span>Monthly Strategy Breakdown ({selectedStrategy})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('monthly')}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    View All Months →
                  </button>
                </div>

                {monthlyPerformance.length > 0 ? (
                  <div className="divide-y divide-slate-800/80 text-xs">
                    {monthlyPerformance.slice(0, 5).map((m) => (
                      <div key={m.monthKey} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-200">{m.monthLabel}</div>
                          <div className="text-[10px] text-slate-400">
                            {m.totalTrades} trades • {m.winningTrades}W / {m.losingTrades}L
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-mono font-bold ${m.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {formatINR(m.totalPnl, { compact: false, showSign: true })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Win Rate: <span className="font-mono text-amber-300">{m.winRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No monthly data recorded for this strategy yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: DATE-WISE PERFORMANCE ANALYSIS                           */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'datewise' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0b142d] border border-slate-700/80 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  <span>Date-Wise Performance for {selectedStrategy}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a date range to analyze daily trade counts, win/loss rates, and P&L.
                </p>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  placeholder="From"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value)
                    setDatePreset('custom')
                  }}
                  className="bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  placeholder="To"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value)
                    setDatePreset('custom')
                  }}
                  className="bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none"
                />
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('')
                      setCustomEndDate('')
                      setDatePreset('all')
                    }}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Date-wise Table */}
            <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-[#0a1126]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111c3a] text-slate-300 font-bold uppercase tracking-wider border-b border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Total Trades</th>
                      <th className="py-3 px-4">Winning</th>
                      <th className="py-3 px-4">Losing</th>
                      <th className="py-3 px-4">Daily Win Rate (%)</th>
                      <th className="py-3 px-4">Daily Loss Rate (%)</th>
                      <th className="py-3 px-4 text-right">Daily P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {dateWisePerformance.length > 0 ? (
                      dateWisePerformance.map((day) => (
                        <tr key={day.date} className="hover:bg-[#131f42]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-white font-mono">
                            {day.displayDate}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            {day.totalTrades}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                            {day.winningTrades}
                          </td>
                          <td className="py-3 px-4 font-mono text-rose-400 font-bold">
                            {day.losingTrades}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-300">
                                {day.winRate}%
                              </span>
                              <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  style={{ width: `${day.winRate}%` }}
                                  className="bg-emerald-500 h-full"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {day.lossRate}%
                          </td>
                          <td
                            className={`py-3 px-4 font-mono font-black text-right ${day.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {formatINR(day.totalPnl, { compact: false, showSign: true })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                          No trades executed under "{selectedStrategy}" for the selected timeframe.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: MONTHLY STRATEGY PERFORMANCE                             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0b142d] border border-slate-700/80 rounded-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-400" />
                  <span>Monthly Strategy Performance for {selectedStrategy}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monthly win rates, profit & loss, and month-over-month trends.
                </p>
              </div>

              {/* Year Filter */}
              {availableYears.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Filter Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Monthly Cards and Table */}
            <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-[#0a1126]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111c3a] text-slate-300 font-bold uppercase tracking-wider border-b border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Total Trades</th>
                      <th className="py-3 px-4">Wins</th>
                      <th className="py-3 px-4">Losses</th>
                      <th className="py-3 px-4">Win Rate (%)</th>
                      <th className="py-3 px-4">Loss Rate (%)</th>
                      <th className="py-3 px-4 text-right">Net P&L</th>
                      <th className="py-3 px-4 text-right">Avg P&L / Trade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {monthlyPerformance.length > 0 ? (
                      monthlyPerformance.map((m) => (
                        <tr key={m.monthKey} className="hover:bg-[#131f42]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-white font-mono">
                            {m.monthLabel}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            {m.totalTrades}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                            {m.winningTrades}
                          </td>
                          <td className="py-3 px-4 font-mono text-rose-400 font-bold">
                            {m.losingTrades}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-300">
                                {m.winRate}%
                              </span>
                              <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  style={{ width: `${m.winRate}%` }}
                                  className="bg-emerald-500 h-full"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {m.lossRate}%
                          </td>
                          <td
                            className={`py-3 px-4 font-mono font-black text-right ${m.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {formatINR(m.totalPnl, { compact: false, showSign: true })}
                          </td>
                          <td
                            className={`py-3 px-4 font-mono font-bold text-right ${m.averagePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {formatINR(m.averagePnl, { compact: false, showSign: true })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">
                          No monthly data available for "{selectedStrategy}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 4: TRADES LOG FOR THIS STRATEGY                             */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#0b142d] border border-slate-700/80 rounded-xl text-xs">
              <span className="font-bold text-white">
                Trades Log: <span className="text-blue-400">{selectedStrategy}</span> ({dateFilteredStrategyTrades.length} trades)
              </span>
              <span className="text-slate-400">
                Sorted by most recent
              </span>
            </div>

            <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-[#0a1126]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111c3a] text-slate-300 font-bold uppercase tracking-wider border-b border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Symbol</th>
                      <th className="py-3 px-4">Side</th>
                      <th className="py-3 px-4">Lot Size</th>
                      <th className="py-3 px-4">Entry</th>
                      <th className="py-3 px-4">Exit</th>
                      <th className="py-3 px-4">R/R</th>
                      <th className="py-3 px-4 text-right">P&L (INR)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {dateFilteredStrategyTrades.length > 0 ? (
                      [...dateFilteredStrategyTrades]
                        .sort(
                          (a, b) =>
                            new Date(b.entryDate || b.createdAt || 0) -
                            new Date(a.entryDate || a.createdAt || 0)
                        )
                        .map((t, idx) => {
                          const pnl = calculateTradePnl(t)
                          const isWin = pnl > 0
                          const isLoss = pnl < 0
                          const isLong = (t.tradeType || 'Long').toLowerCase() === 'long'

                          return (
                            <tr
                              key={t._id || t.id || idx}
                              onClick={() => onSelectTrade && onSelectTrade(t)}
                              className={`hover:bg-[#131f42] transition-colors ${onSelectTrade ? 'cursor-pointer' : ''
                                }`}
                            >
                              <td className="py-3 px-4 text-slate-300 font-sans">
                                {t.entryDate
                                  ? new Date(t.entryDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }) + (t.time ? ` • ${t.time}` : '')
                                  : '—'}
                              </td>
                              <td className="py-3 px-4 font-bold text-white">
                                {t.symbol || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isLong
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-rose-500/20 text-rose-400'
                                    }`}
                                >
                                  {t.tradeType || 'Long'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {t.lotSize || t.quantity || '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-200">
                                {t.entryPrice ? `₹${t.entryPrice}` : '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-200">
                                {t.exitPrice ? `₹${t.exitPrice}` : 'OPEN'}
                              </td>
                              <td className="py-3 px-4 text-blue-400 font-bold">
                                {t.riskReward || '—'}
                              </td>
                              <td
                                className={`py-3 px-4 text-right font-black ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                                  }`}
                              >
                                {formatINR(pnl, { compact: false, showSign: true })}
                              </td>
                              <td className="py-3 px-4 text-center font-sans">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${isWin
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : isLoss
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                  {isWin ? 'WIN' : isLoss ? 'LOSS' : 'BREAKEVEN'}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                    ) : (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-slate-500 text-xs font-sans">
                          No trades found for "{selectedStrategy}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 5: ALL STRATEGIES COMPARISON (STRICTLY SEPARATED COLUMNS)   */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeTab === 'compare' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0b142d] border border-purple-500/30 rounded-xl space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-purple-400" />
                <span>Side-by-Side Strategy Comparison</span>
              </h3>
              <p className="text-xs text-slate-400">
                प्रत्येक Strategy चा Data पूर्णपणे स्वतंत्रपणे कॅल्क्युलेट केला गेला आहे. कोणत्याही Strategy चा Data Mix नाही.
              </p>
            </div>

            <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-[#0a1126]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111c3a] text-slate-300 font-bold uppercase tracking-wider border-b border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4">Strategy</th>
                      <th className="py-3 px-4 text-center">Total Trades</th>
                      <th className="py-3 px-4 text-center">W / L</th>
                      <th className="py-3 px-4 text-center">Win Rate (%)</th>
                      <th className="py-3 px-4 text-center">Loss Rate (%)</th>
                      <th className="py-3 px-4 text-right">Net P&L</th>
                      <th className="py-3 px-4 text-center">R/R</th>
                      <th className="py-3 px-4 text-center">Max Streak</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allStrategiesComparison.map(({ strategy, metrics: m }) => {
                      const isCurrent = strategy.toLowerCase() === selectedStrategy.toLowerCase()
                      return (
                        <tr
                          key={strategy}
                          className={`hover:bg-[#131f42]/60 transition-colors ${isCurrent ? 'bg-blue-900/20' : ''
                            }`}
                        >
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            {isCurrent && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            <span>{strategy}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                            {m.totalTrades}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            <span className="text-emerald-400 font-bold">{m.winningTrades}W</span>
                            {' / '}
                            <span className="text-rose-400 font-bold">{m.losingTrades}L</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">
                            {m.winRate}%
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {m.lossRate}%
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-black ${m.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {formatINR(m.totalPnl, { compact: false, showSign: true })}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-purple-300">
                            {m.riskRewardRatio}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs">
                            <span className="text-emerald-400 font-bold">{m.maxConsecutiveWins}W</span>
                            {' / '}
                            <span className="text-rose-400 font-bold">{m.maxConsecutiveLosses}L</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStrategy(strategy)
                                setActiveTab('overview')
                              }}
                              className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                            >
                              Analyze
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

