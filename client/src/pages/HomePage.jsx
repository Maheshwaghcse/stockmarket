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
            <span className={`font-bold px-2 py-0.5 rounded font-mono ${
              outcomeSlicer === 'profit' ? 'text-emerald-400 bg-emerald-500/10' : outcomeSlicer === 'loss' ? 'text-rose-400 bg-rose-500/10' : 'text-indigo-400 bg-indigo-500/10'
            }`}>
              {outcomeSlicer === 'profit' ? '▲ Profit Leaders Only' : outcomeSlicer === 'loss' ? '▼ Declining Stocks Only' : 'All Market Direction'}
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

      {/* ── Main Workspace Grid (Chart & Inspector Left + Balanced Right Column) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:items-start">
        {/* Left Column (xl:col-span-2): Main Benchmark Chart + Exact Time Explorer */}
        <div className="xl:col-span-2 space-y-5">
          {/* Main Chart Card */}
          <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
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

            {/* Interactive Candlestick Chart */}
            <IndexChart
              symbol={activeChartSymbol}
              timeRange={timeSlicer}
              height={280}
              onDataLoaded={setChartCandles}
              onCrosshairMove={setHoveredCandle}
            />
          </div>

          {/* Exact Time & Price Explorer Card */}
          <ExactTimePriceCard
            symbol={activeChartSymbol}
            candles={chartCandles}
            hoveredCandle={hoveredCandle}
            onSelectSymbol={(sym) => setActiveChartSymbol(sym)}
            watchlistStocks={displayWatchlistStocks}
          />
        </div>

        {/* Right Column: Balanced Height & Zero Empty Space */}
        <div className="space-y-5">
          {/* Card 1: Top Movers (Gainers & Losers with Tabs) */}
          <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
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
              {(moversTab === 'gainers' ? stockGainers : moversTab === 'losers' ? stockLosers : [...stockGainers.slice(0, 3), ...stockLosers.slice(0, 3)]).map((item) => {
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
                      <p className="text-[11px] text-slate-400 truncate max-w-[130px]" title={item.name}>
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

          {/* Card 2: NSE Sector Performance */}
          <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
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

          {/* Card 3: Market News Pulse */}
          {newsData?.data?.length > 0 && (
            <div className="card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Market Pulse News</h3>
                </div>
                <Link to="/news" className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                  <span>More</span>
                  <ArrowRight size={10} />
                </Link>
              </div>

              <div className="space-y-2.5">
                {newsData.data.slice(0, 2).map((article) => (
                  <Link
                    key={article._id}
                    to={`/news/${article.slug}`}
                    className="block p-2 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800"
                  >
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {article.category || 'MARKET'}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mt-0.5">
                      {article.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Just now'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
          <div className="p-4 rounded-xl bg-slate-900/40 text-center text-xs text-slate-400">
            No stocks match the current {outcomeSlicer} filter in your watchlist.
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
