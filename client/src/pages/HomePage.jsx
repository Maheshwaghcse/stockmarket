import { useState, useMemo } from 'react'
import { useMarketStore } from '../store/marketStore'
import IndexCard from '../components/market/IndexCard'
import IndexChart from '../components/market/IndexChart'
import ExactTimePriceCard from '../components/market/ExactTimePriceCard'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  BookOpen,
  BarChart2,
  ArrowRight,
  Star,
  SlidersHorizontal,
  Activity,
  Layers,
  Clock,
  PieChart,
  Sparkles,
  Filter,
  RotateCcw,
  Compass,
  Calculator,
  Target,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { formatDistanceToNow } from 'date-fns'

const FEATURED_INDICES = ['NIFTY50', 'SENSEX', 'BANKNIFTY', 'FINNIFTY']

function GainerLoserRow({ item, type }) {
  const isGain = item.changePct >= 0
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0"
         style={{ borderColor: 'var(--color-border)' }}>
      <div>
        <p className="text-sm font-semibold">{item.symbol}</p>
        <p className="text-xs muted">{item.name}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold mono">{item.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        <p className={`text-xs font-bold ${isGain ? 'gain' : 'loss'}`}>
          {isGain ? '+' : ''}{item.changePct?.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { indices, marketStatus, isConnected, lastUpdate } = useMarketStore()
  const featuredIndices = FEATURED_INDICES.map((s) => indices[s]).filter(Boolean)
  const allIndices = Object.values(indices)
  const gainers = [...allIndices].sort((a, b) => b.changePct - a.changePct).slice(0, 5)
  const losers  = [...allIndices].sort((a, b) => a.changePct - b.changePct).slice(0, 5)

  // Interactive Dashboard Slicers
  const [activeChartSymbol, setActiveChartSymbol] = useState('NIFTY50')
  const [timeSlicer, setTimeSlicer] = useState('1D') // '1D', '5D', '1M', '1Y'
  const [outcomeSlicer, setOutcomeSlicer] = useState('all') // 'all', 'profit', 'loss'

  // Exact time price inspection state synced with chart candles & crosshair
  const [chartCandles, setChartCandles] = useState([])
  const [hoveredCandle, setHoveredCandle] = useState(null)

  // Market Radar & Quick Risk Sizer state
  const [radarTab, setRadarTab] = useState('mood') // 'mood' or 'calculator'
  const [miniCapital, setMiniCapital] = useState(100000)
  const [miniRiskPct, setMiniRiskPct] = useState(1)
  const [miniSlPct, setMiniSlPct] = useState(1.5)

  const { data: newsData } = useQuery({
    queryKey: ['featured-news'],
    queryFn: () => api.get('/news/featured').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const { data: watchlistData } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => api.get('/watchlist').then(r => r.data).catch(() => ({ data: [] })),
  })

  const { data: stocksData } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => api.get('/stocks').then(r => r.data),
    staleTime: 30_000,
  })

  const allStocks = stocksData?.data || []
  const userLists = watchlistData?.data || []
  const activeWatchlist = userLists[0]
  const watchlistItems = activeWatchlist?.items || []

  // Market Breadth calculation
  const marketBreadth = useMemo(() => {
    let advances = 0
    let declines = 0
    let unchanged = 0
    allStocks.forEach((s) => {
      const chg = s.changePct || 0
      if (chg > 0.05) advances++
      else if (chg < -0.05) declines++
      else unchanged++
    })
    const total = advances + declines + unchanged || 1
    const advancePct = Math.round((advances / total) * 100)
    const declinePct = Math.round((declines / total) * 100)
    return { advances, declines, unchanged, advancePct, declinePct, total }
  }, [allStocks])

  // Dynamic Market Mood Score calculated from market breadth and index movement
  const marketMoodScore = useMemo(() => {
    const adv = marketBreadth.advancePct || 50
    const nifty = indices['NIFTY50']
    const niftyChange = nifty?.changePct || 0
    const score = Math.round(adv * 0.8 + 10 + niftyChange * 4)
    return Math.min(95, Math.max(12, score))
  }, [marketBreadth, indices])

  const moodData = useMemo(() => {
    if (marketMoodScore >= 75) {
      return { label: 'Extreme Greed', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
    }
    if (marketMoodScore >= 55) {
      return { label: 'Greed / Bullish', color: 'text-teal-400', bg: 'bg-teal-500/20' }
    }
    if (marketMoodScore >= 45) {
      return { label: 'Neutral', color: 'text-amber-400', bg: 'bg-amber-500/20' }
    }
    if (marketMoodScore >= 30) {
      return { label: 'Fear / Cautious', color: 'text-orange-400', bg: 'bg-orange-500/20' }
    }
    return { label: 'Extreme Fear', color: 'text-rose-400', bg: 'bg-rose-500/20' }
  }, [marketMoodScore])

  const miniRiskAmount = useMemo(() => {
    return Math.round((miniCapital * miniRiskPct) / 100)
  }, [miniCapital, miniRiskPct])

  const miniPositionSize = useMemo(() => {
    return miniSlPct > 0 ? Math.round(miniRiskAmount / (miniSlPct / 100)) : 0
  }, [miniRiskAmount, miniSlPct])

  // Filtered indices based on outcomeSlicer
  const displayedIndices = useMemo(() => {
    if (outcomeSlicer === 'profit') return allIndices.filter((idx) => (idx.changePct || 0) >= 0)
    if (outcomeSlicer === 'loss') return allIndices.filter((idx) => (idx.changePct || 0) < 0)
    return allIndices
  }, [allIndices, outcomeSlicer])

  const defaultWishlistSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN']
  const displayWatchlistStocks = useMemo(() => {
    if (watchlistItems.length > 0) {
      return watchlistItems.map((item) => {
        const found = allStocks.find((s) => s.symbol === item.symbol)
        return found || {
          symbol: item.symbol,
          name: item.name || item.symbol,
          price: 0,
          changePct: 0,
          sector: item.exchange || 'NSE',
        }
      })
    }
    return defaultWishlistSymbols.map((sym) => {
      const found = allStocks.find((s) => s.symbol === sym)
      return found || { symbol: sym, name: sym, price: 0, changePct: 0 }
    })
  }, [watchlistItems, allStocks])

  // Filtered watchlist stocks based on outcomeSlicer
  const filteredWatchlistStocks = useMemo(() => {
    if (outcomeSlicer === 'profit') return displayWatchlistStocks.filter((s) => (s.changePct || 0) >= 0)
    if (outcomeSlicer === 'loss') return displayWatchlistStocks.filter((s) => (s.changePct || 0) < 0)
    return displayWatchlistStocks
  }, [displayWatchlistStocks, outcomeSlicer])

  // Movers tab state for sidebar
  const [moversTab, setMoversTab] = useState('all') // 'all', 'gainers', 'losers'

  // Top stock movers
  const stockGainers = useMemo(() => {
    return [...allStocks].sort((a, b) => (b.changePct || 0) - (a.changePct || 0)).slice(0, 6)
  }, [allStocks])

  const stockLosers = useMemo(() => {
    return [...allStocks].sort((a, b) => (a.changePct || 0) - (b.changePct || 0)).slice(0, 6)
  }, [allStocks])

  // Sector Performance from allStocks
  const sectorPerformance = useMemo(() => {
    const map = {}
    allStocks.forEach((s) => {
      const sec = s.sector || 'General'
      if (!map[sec]) {
        map[sec] = { name: sec, totalChange: 0, count: 0, gainers: 0, losers: 0 }
      }
      const chg = s.changePct || 0
      map[sec].totalChange += chg
      map[sec].count++
      if (chg >= 0) map[sec].gainers++
      else map[sec].losers++
    })

    return Object.values(map)
      .filter((sec) => sec.count >= 2)
      .map((sec) => ({
        ...sec,
        avgChange: sec.count > 0 ? sec.totalChange / sec.count : 0,
      }))
      .sort((a, b) => b.avgChange - a.avgChange)
      .slice(0, 4)
  }, [allStocks])

  return (
    <div className="space-y-6 sm:space-y-7 fade-in">
      {/* ── Hero Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Market Dashboard</h1>
          <p className="text-sm muted mt-1">
            Indian stock market overview · 
            <span className={`ml-1 font-semibold ${marketStatus === 'OPEN' ? 'gain' : 'loss'}`}>
              {marketStatus}
            </span>
            {lastUpdate && (
              <span className="ml-2 text-xs">
                · Updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
               style={{ background: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: isConnected ? 'var(--color-gain)' : 'var(--color-loss)',
                        border: `1px solid ${isConnected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <Zap size={11} />
            {isConnected ? 'Live stream' : 'Reconnecting…'}
          </div>
        </div>
      </div>

      {/* ── Simple, Crystal-Clear Slicers Bar (One-Visit Intuitive) ── */}
      <div className="card p-3.5 sm:p-4 bg-gradient-to-r from-[#0b1329] via-[#091124] to-[#070d1c] border border-slate-800 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Slicer Group 1: Timeframe */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} className="text-blue-400" />
              <span>Timeframe:</span>
            </span>
            <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
              {[
                { id: '1D', label: 'Today (1D)' },
                { id: '5D', label: '5 Days' },
                { id: '1M', label: '1 Month' },
                { id: '1Y', label: '1 Year' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeSlicer(tf.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    timeSlicer === tf.id
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slicer Group 2: Direction / Outcome */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={13} className="text-indigo-400" />
              <span>Filter:</span>
            </span>
            <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
              {[
                { id: 'all', label: 'All Stocks' },
                { id: 'profit', label: '▲ Profit Only' },
                { id: 'loss', label: '▼ Loss Only' },
              ].map((out) => {
                const isActive = outcomeSlicer === out.id
                return (
                  <button
                    key={out.id}
                    onClick={() => {
                      setOutcomeSlicer(out.id)
                      if (out.id === 'profit') setMoversTab('gainers')
                      else if (out.id === 'loss') setMoversTab('losers')
                    }}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      isActive
                        ? out.id === 'profit'
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : out.id === 'loss'
                          ? 'bg-rose-600 text-white font-bold shadow-sm'
                          : 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {out.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slicer Group 3: Benchmark Index */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={13} className="text-cyan-400" />
              <span>Benchmark:</span>
            </span>
            <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
              {[
                { id: 'NIFTY50', label: 'Nifty 50' },
                { id: 'BANKNIFTY', label: 'Bank Nifty' },
                { id: 'SENSEX', label: 'Sensex' },
                { id: 'FINNIFTY', label: 'Fin Nifty' },
              ].map((sym) => (
                <button
                  key={sym.id}
                  onClick={() => setActiveChartSymbol(sym.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeChartSymbol === sym.id
                      ? 'bg-slate-700 text-white font-bold shadow-sm ring-1 ring-slate-600'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick 1-Click Remove Filter Action Button */}
          <div className="flex items-center gap-2 ml-auto">
            {outcomeSlicer !== 'all' ? (
              <button
                onClick={() => {
                  setOutcomeSlicer('all')
                  setMoversTab('all')
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all shadow-sm"
                title="1-Click: Remove filter and show all stocks"
              >
                <RotateCcw size={12} className="text-rose-400" />
                <span>Remove Filter</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setOutcomeSlicer('all')
                  setTimeSlicer('1D')
                  setActiveChartSymbol('NIFTY50')
                  setMoversTab('all')
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                title="Reset all chart and slicer filters to default view"
              >
                <RotateCcw size={11} className="text-slate-400" />
                <span>Reset View</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Active Slicer Summary Banner */}
        <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <span>Active View:</span>
            <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 font-mono">
              {activeChartSymbol}
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 font-mono">
              {timeSlicer === '1D' ? 'Intraday (5m)' : timeSlicer === '5D' ? '5 Days (15m)' : timeSlicer === '1M' ? '1 Month (1h)' : '1 Year (1d)'}
            </span>
            <span className="text-slate-600">·</span>
            <span className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded font-mono ${
              outcomeSlicer === 'profit' ? 'text-emerald-400 bg-emerald-500/10' : outcomeSlicer === 'loss' ? 'text-rose-400 bg-rose-500/10' : 'text-indigo-400 bg-indigo-500/10'
            }`}>
              <span>{outcomeSlicer === 'profit' ? '▲ Profit Leaders Only' : outcomeSlicer === 'loss' ? '▼ Declining Stocks Only' : 'All Market Direction'}</span>
              {outcomeSlicer !== 'all' && (
                <button
                  onClick={() => {
                    setOutcomeSlicer('all')
                    setMoversTab('all')
                  }}
                  className="ml-1 text-[10px] text-rose-300 hover:text-white bg-rose-500/25 hover:bg-rose-500/40 px-1 rounded transition-colors"
                  title="Click to remove filter"
                >
                  ✕ Clear
                </button>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400 font-bold">
              ▲ {marketBreadth.advances} Adv ({marketBreadth.advancePct}%)
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold">
              ▼ {marketBreadth.declines} Dec ({marketBreadth.declinePct}%)
            </span>
          </div>
        </div>
      </div>

      {/* ── Index Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURED_INDICES.map((sym) => {
          const isSelected = activeChartSymbol === sym
          return (
            <div
              key={sym}
              onClick={() => setActiveChartSymbol(sym)}
              className={`cursor-pointer transition-all rounded-2xl ${
                isSelected ? 'ring-2 ring-blue-500/80 shadow-lg shadow-blue-500/20' : ''
              }`}
            >
              <IndexCard index={indices[sym]} />
            </div>
          )
        })}
      </div>

      {/* ── Row 1: Nifty 50 Main Chart Card & Market Movers (Identical Height) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        {/* Left Column (xl:col-span-2): Main Benchmark Chart (Nifty 50) */}
        <div className="xl:col-span-2 flex flex-col">
          <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl h-full flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-base sm:text-lg text-white">
                      {activeChartSymbol === 'NIFTY50' ? 'Nifty 50' : activeChartSymbol === 'BANKNIFTY' ? 'Bank Nifty' : activeChartSymbol === 'SENSEX' ? 'BSE Sensex' : activeChartSymbol === 'FINNIFTY' ? 'Nifty Fin Service' : activeChartSymbol}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold border border-blue-500/20">
                      {timeSlicer === '1D' ? 'Intraday (5m)' : timeSlicer === '5D' ? '5 Days (15m)' : timeSlicer === '1M' ? '1 Month (1h)' : '1 Year (1d)'}
                    </span>
                    {indices[activeChartSymbol] ? (
                      <span className={`text-xs font-mono font-bold ${indices[activeChartSymbol].changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{indices[activeChartSymbol].value?.toLocaleString('en-IN', { maximumFractionDigits: 1 })} ({indices[activeChartSymbol].changePct >= 0 ? '+' : ''}{indices[activeChartSymbol].changePct?.toFixed(2)}%)
                      </span>
                    ) : (
                      (() => {
                        const st = allStocks.find((s) => s.symbol === activeChartSymbol)
                        if (!st) return null
                        const isUp = (st.changePct || 0) >= 0
                        return (
                          <span className={`text-xs font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₹{st.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({isUp ? '+' : ''}{st.changePct?.toFixed(2)}%)
                          </span>
                        )
                      })()
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {timeSlicer === '1D' ? 'Live intraday candles · Market Reference' : 'Extended historical candlestick view'}
                  </p>
                </div>

                <Link
                  to={indices[activeChartSymbol] ? `/indices/${activeChartSymbol}` : `/stocks/${activeChartSymbol}`}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                >
                  <span>Full Chart</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {/* Live Market Sentiment & Advance-Decline Meter */}
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Advances: {marketBreadth.advances} ({marketBreadth.advancePct}%)
                  </span>
                  <span className="text-slate-400 hidden sm:inline">
                    Market Breadth Ratio
                  </span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    Declines: {marketBreadth.declines} ({marketBreadth.declinePct}%)
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${marketBreadth.advancePct}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
                    style={{ width: `${marketBreadth.declinePct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Candlestick Chart */}
            <div className="flex-1 flex flex-col justify-center min-h-[290px] pt-1">
              <IndexChart
                symbol={activeChartSymbol}
                timeRange={timeSlicer}
                height={290}
                onDataLoaded={setChartCandles}
                onCrosshairMove={setHoveredCandle}
              />
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-1): Market Movers (Exact Same Height as Nifty 50 Card) */}
        <div className="xl:col-span-1 flex flex-col">
          <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" />
                  <h3 className="font-bold text-sm text-white">Market Movers</h3>
                </div>
                
                {/* Movers Tabs */}
                <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'gainers', label: '▲ Gain' },
                    { id: 'losers', label: '▼ Loss' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setMoversTab(tab.id)}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        moversTab === tab.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Rows */}
              <div className="space-y-1">
                {(moversTab === 'gainers'
                  ? stockGainers.slice(0, 7)
                  : moversTab === 'losers'
                  ? stockLosers.slice(0, 7)
                  : [...stockGainers.slice(0, 4), ...stockLosers.slice(0, 4)]
                ).map((item) => {
                  const isGain = (item.changePct || 0) >= 0
                  return (
                    <Link
                      key={item.symbol}
                      to={`/stocks/${item.symbol}`}
                      className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800 group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white group-hover:text-blue-400 font-mono">
                            {item.symbol}
                          </span>
                          {item.sector && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {item.sector.slice(0, 4)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]" title={item.name}>
                          {item.name}
                        </p>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-semibold text-white">
                          ₹{item.price?.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                        </div>
                        <div className={`text-[11px] font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isGain ? '+' : ''}{item.changePct?.toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
              <span className="text-[11px] font-mono">Live NSE Leaders</span>
              <Link to="/stocks" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors text-[11px]">
                <span>All 106 Equities</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Exact Time & Price Explorer & [Sector Performance + Market Radar] (Combined Equal Height) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        {/* Left Column (xl:col-span-2): Exact Time & Price Explorer Card */}
        <div className="xl:col-span-2 flex flex-col">
          <ExactTimePriceCard
            symbol={activeChartSymbol}
            candles={chartCandles}
            hoveredCandle={hoveredCandle}
            onSelectSymbol={(sym) => setActiveChartSymbol(sym)}
            watchlistStocks={displayWatchlistStocks}
          />
        </div>

        {/* Right Column (xl:col-span-1): Sector Performance + Market Radar (Combined Height Equals Left Card) */}
        <div className="xl:col-span-1 flex flex-col justify-between gap-5 h-full">
          {/* Card 2: NSE Sector Performance */}
          <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex-1 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <PieChart size={15} className="text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Sector Performance</h3>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Avg Move</span>
              </div>

              <div className="space-y-2.5">
                {sectorPerformance.map((sec) => {
                  const isUp = sec.avgChange >= 0
                  return (
                    <div key={sec.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">{sec.name}</span>
                        <span className={`font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}{sec.avgChange.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isUp ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}
                          style={{ width: `${Math.min(100, Math.max(15, Math.abs(sec.avgChange) * 30))}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Market Sentiment Radar & Quick Risk Sizer */}
          <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex-1 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Market Radar</h3>
                </div>

                {/* Tab Selector */}
                <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setRadarTab('mood')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      radarTab === 'mood' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sentiment
                  </button>
                  <button
                    type="button"
                    onClick={() => setRadarTab('calculator')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                      radarTab === 'calculator' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Risk Sizer
                  </button>
                </div>
              </div>

              {radarTab === 'mood' ? (
                <div className="space-y-3">
                  {/* Sentiment Gauge Bar */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Market Mood Index:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${moodData.bg} ${moodData.color} border border-current/20`}>
                        {marketMoodScore}/100 · {moodData.label}
                      </span>
                    </div>

                    {/* Gradient Progress Gauge Bar */}
                    <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-700"
                        style={{ width: `${marketMoodScore}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span>0 (Extreme Fear)</span>
                      <span>50 (Neutral)</span>
                      <span>100 (Extreme Greed)</span>
                    </div>
                  </div>

                  {/* 2x2 Indicator Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-sans">India VIX</span>
                      <span className="font-bold text-slate-200">13.48</span>
                      <span className="text-[10px] text-emerald-400 block">Low Volatility</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-sans">FII / DII Flow Bias</span>
                      <span className="font-bold text-emerald-400">+₹1,420 Cr</span>
                      <span className="text-[10px] text-slate-400 block">Net Buyers</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-sans">Breadth Dominance</span>
                      <span className="font-bold text-slate-200">{marketBreadth.advancePct}% Adv</span>
                      <span className="text-[10px] text-slate-400 block">Positive</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-sans">Trading Edge</span>
                      <span className="font-bold text-cyan-300">Trend Friendly</span>
                      <span className="text-[10px] text-slate-400 block">Breakouts</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs font-mono">
                  {/* Mini Risk Calculator */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Capital (₹)</span>
                      <input
                        type="number"
                        value={miniCapital}
                        onChange={(e) => setMiniCapital(Math.max(1000, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Risk (%)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={miniRiskPct}
                        onChange={(e) => setMiniRiskPct(Math.max(0.1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Stop Loss (%)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={miniSlPct}
                        onChange={(e) => setMiniSlPct(Math.max(0.1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Computed Sizing Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Max Allowed Loss</span>
                      <span className="font-bold text-rose-400 text-xs">
                        -₹{miniRiskAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Max Position Size</span>
                      <span className="font-bold text-emerald-400 text-xs">
                        ₹{miniPositionSize?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">1:2 R:R Target: <strong className="text-emerald-400">+₹{(miniRiskAmount * 2)?.toLocaleString('en-IN')}</strong></span>
                    <Link to="/calculator" className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                      <span>Full Tool</span>
                      <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Desk Shortcuts */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs mt-2">
              <Link
                to="/calculator"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors text-[11px]"
              >
                <Calculator size={12} />
                <span>Risk Calculator</span>
              </Link>
              <Link
                to="/journal"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors text-[11px]"
              >
                <span>Trade Journal</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* ── Full-Width Section: My Watchlist & Wishlist Stocks ────────── */}
      <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-400 fill-amber-400/20" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              {watchlistItems.length > 0 ? (activeWatchlist.name || 'My Watchlist Stocks') : 'My Tracked Stocks'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {filteredWatchlistStocks.length} {outcomeSlicer !== 'all' ? outcomeSlicer : 'tracked'}
            </span>
          </div>
          <Link
            to="/watchlist"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Manage Watchlist</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* 6-Column Grid of Watchlist Stocks */}
        {filteredWatchlistStocks.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/40 text-center text-xs text-slate-400 space-y-2">
            <p>No stocks match the current {outcomeSlicer} filter in your watchlist.</p>
            <button
              onClick={() => {
                setOutcomeSlicer('all')
                setMoversTab('all')
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 transition-all inline-flex items-center gap-1"
            >
              <RotateCcw size={11} />
              <span>Remove Filter (Show All)</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {filteredWatchlistStocks.slice(0, 6).map((stk) => {
              const isGain = (stk.changePct || 0) >= 0
              return (
                <Link
                  key={stk.symbol}
                  to={`/stocks/${stk.symbol}`}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100 group-hover:text-blue-400 transition-colors font-mono">
                        {stk.symbol}
                      </span>
                      {stk.sector && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {stk.sector.slice(0, 4)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1" title={stk.name}>
                      {stk.name}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-baseline justify-between">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {stk.price > 0 ? `₹${stk.price?.toLocaleString('en-IN', { maximumFractionDigits: 1 })}` : '—'}
                    </span>
                    <span className={`text-[11px] font-mono font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isGain ? '+' : ''}{stk.changePct?.toFixed(1)}%
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── All Indices Table (Sliced by Outcome) ────────────── */}
      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold flex items-center gap-2"><BarChart2 size={16} /> All Indices</h2>
            {outcomeSlicer !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize font-medium">
                Showing {outcomeSlicer} only
              </span>
            )}
          </div>
          <Link to="/indices" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs muted border-b" style={{ borderColor: 'var(--color-border)' }}>
              <th className="text-left pb-3 font-medium">Index</th>
              <th className="text-right pb-3 font-medium">Value</th>
              <th className="text-right pb-3 font-medium">Change</th>
              <th className="text-right pb-3 font-medium hidden md:table-cell">High</th>
              <th className="text-right pb-3 font-medium hidden md:table-cell">Low</th>
              <th className="text-right pb-3 font-medium hidden lg:table-cell">Prev Close</th>
            </tr>
          </thead>
          <tbody>
            {displayedIndices.map((idx) => {
              const isGain = idx.changePct >= 0
              return (
                <tr key={idx.symbol} className="border-b hover:bg-white/2 transition-colors"
                    style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
                  <td className="py-3">
                    <Link to={`/indices/${idx.symbol}`} className="hover:text-blue-400 transition-colors">
                      <p className="font-semibold text-xs">{idx.symbol}</p>
                      <p className="text-xs muted">{idx.name}</p>
                    </Link>
                  </td>
                  <td className="py-3 text-right mono font-semibold">
                    {idx.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`text-xs font-bold ${isGain ? 'gain' : 'loss'}`}>
                      {isGain ? '+' : ''}{idx.changePct?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 text-right text-xs gain hidden md:table-cell mono">
                    {idx.dayHigh?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-xs loss hidden md:table-cell mono">
                    {idx.dayLow?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-xs muted hidden lg:table-cell mono">
                    {idx.prevClose?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── News preview ──────────────────────────────────── */}
      {newsData?.data?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><BookOpen size={16} /> Market News</h2>
            <Link to="/news" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              All articles <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsData.data.slice(0, 3).map((article) => (
              <Link key={article._id} to={`/news/${article.slug}`}
                    className="card hover:border-blue-500/30 transition-all hover:-translate-y-0.5 block">
                <span className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6366f1' }}>{article.category}</span>
                <h3 className="font-semibold text-sm mt-2 mb-1 line-clamp-2">{article.title}</h3>
                <p className="text-xs muted line-clamp-2">{article.summary}</p>
                <p className="text-xs muted mt-3">
                  {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Draft'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
