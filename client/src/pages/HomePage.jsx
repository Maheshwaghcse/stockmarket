import { useState, useMemo } from 'react'
import { useMarketStore } from '../store/marketStore'
import IndexCard from '../components/market/IndexCard'
import IndexChart from '../components/market/IndexChart'
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

      {/* ── Interactive Market Slicers Bar (Days, Time, Profit, Loss) ── */}
      <div className="card p-3 sm:p-4 bg-[#0b1329]/95 border border-slate-800/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-2 border-r border-slate-800">
            <SlidersHorizontal size={13} className="text-blue-400" />
            <span>Dashboard Slicers</span>
          </span>

          {/* Time / Days Slicer */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {[
              { id: '1D', label: 'Intraday (1D)' },
              { id: '5D', label: '5 Days' },
              { id: '1M', label: '1 Month' },
              { id: '1Y', label: '1 Year' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeSlicer(tf.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  timeSlicer === tf.id
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Profit / Loss Outcome Slicer */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {[
              { id: 'all', label: 'All Direction' },
              { id: 'profit', label: 'Profit (▲)', color: 'text-emerald-400' },
              { id: 'loss', label: 'Loss (▼)', color: 'text-rose-400' },
            ].map((out) => (
              <button
                key={out.id}
                onClick={() => setOutcomeSlicer(out.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  outcomeSlicer === out.id
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : out.color || 'text-slate-400 hover:text-white'
                }`}
              >
                {out.label}
              </button>
            ))}
          </div>

          {/* Benchmark Symbol Quick Slicer */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs hidden lg:inline-flex">
            {['NIFTY50', 'BANKNIFTY', 'SENSEX', 'FINNIFTY'].map((sym) => (
              <button
                key={sym}
                onClick={() => setActiveChartSymbol(sym)}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  activeChartSymbol === sym
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sym === 'NIFTY50' ? 'Nifty 50' : sym === 'BANKNIFTY' ? 'Bank Nifty' : sym === 'SENSEX' ? 'Sensex' : 'Fin Nifty'}
              </button>
            ))}
          </div>
        </div>

        {/* Live Breadth Quick Metric */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 hidden sm:inline">Market Breadth:</span>
          <span className="text-emerald-400 font-bold font-mono">
            ▲ {marketBreadth.advances} Adv
          </span>
          <span className="text-rose-400 font-bold font-mono">
            ▼ {marketBreadth.declines} Dec
          </span>
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

      {/* ── Main Chart + Sidebar ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:items-start">
        {/* Main Chart Card (Dynamic Symbol, Time Slicers & Market Breadth Gauge) */}
        <div className="xl:col-span-2 card bg-[#0b1329]/95 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-white">
                  {activeChartSymbol === 'NIFTY50' ? 'Nifty 50' : activeChartSymbol === 'BANKNIFTY' ? 'Bank Nifty' : activeChartSymbol === 'SENSEX' ? 'BSE Sensex' : activeChartSymbol === 'FINNIFTY' ? 'Nifty Fin Service' : activeChartSymbol}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold border border-blue-500/20">
                  {timeSlicer === '1D' ? 'Intraday (5m)' : timeSlicer === '5D' ? '5 Days (15m)' : timeSlicer === '1M' ? '1 Month (1h)' : '1 Year (1d)'}
                </span>
                {indices[activeChartSymbol] && (
                  <span className={`text-xs font-mono font-bold ${indices[activeChartSymbol].changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{indices[activeChartSymbol].value?.toLocaleString('en-IN', { maximumFractionDigits: 1 })} ({indices[activeChartSymbol].changePct >= 0 ? '+' : ''}{indices[activeChartSymbol].changePct?.toFixed(2)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {timeSlicer === '1D' ? 'Live intraday candles · Market Reference' : 'Extended historical candlestick view'}
              </p>
            </div>

            {/* In-Card Fast Slicers */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
                {['NIFTY50', 'BANKNIFTY', 'SENSEX', 'FINNIFTY'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setActiveChartSymbol(sym)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      activeChartSymbol === sym
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sym === 'NIFTY50' ? 'Nifty' : sym === 'BANKNIFTY' ? 'Bank' : sym === 'SENSEX' ? 'Sensex' : 'Fin'}
                  </button>
                ))}
              </div>

              <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
                {['1D', '5D', '1M', '1Y'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeSlicer(tf)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      timeSlicer === tf
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <Link
                to={`/indices/${activeChartSymbol}`}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span>Full</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Live Market Sentiment & Advance-Decline Meter (Eliminates empty space) */}
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

          {/* Interactive Index Chart */}
          <IndexChart symbol={activeChartSymbol} timeRange={timeSlicer} height={290} />

          {/* ── Down Area: My Watchlist Stocks ───────────────────── */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-400 fill-amber-400/20" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
                  {watchlistItems.length > 0 ? (activeWatchlist.name || 'My Watchlist Stocks') : 'My Wishlist Stocks'}
                </h3>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {filteredWatchlistStocks.length} {outcomeSlicer !== 'all' ? outcomeSlicer : 'tracked'}
                </span>
              </div>
              <Link
                to="/watchlist"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
              >
                <span>Edit Watchlist</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            {/* Grid of Watchlist Stocks */}
            {filteredWatchlistStocks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 text-center text-xs text-slate-400">
                No stocks match the current {outcomeSlicer} slicer in your watchlist.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {filteredWatchlistStocks.slice(0, 6).map((stk) => {
                  const isGain = (stk.changePct || 0) >= 0
                  return (
                    <Link
                      key={stk.symbol}
                      to={`/stocks/${stk.symbol}`}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100 group-hover:text-blue-400 transition-colors">
                            {stk.symbol}
                          </span>
                          {stk.sector && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {stk.sector.slice(0, 3)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] muted truncate mt-0.5" title={stk.name}>
                          {stk.name}
                        </p>
                      </div>

                      <div className="mt-1.5 pt-1 border-t border-slate-800/60 flex items-baseline justify-between">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {stk.price > 0 ? `₹${stk.price?.toLocaleString('en-IN', { maximumFractionDigits: 1 })}` : '—'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${isGain ? 'gain' : 'loss'}`}>
                          {isGain ? '+' : ''}{stk.changePct?.toFixed(1)}%
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Gainers / Losers Cards (Aligned dynamically with Slicer) */}
        <div className="space-y-4">
          {(outcomeSlicer === 'all' || outcomeSlicer === 'profit') && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <TrendingUp size={16} className="gain" /> Top Gainers
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  {gainers.length} profit leaders
                </span>
              </div>
              {gainers.slice(0, outcomeSlicer === 'profit' ? 8 : 5).map((g) => (
                <GainerLoserRow key={g.symbol} item={g} type="gain" />
              ))}
            </div>
          )}

          {(outcomeSlicer === 'all' || outcomeSlicer === 'loss') && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <TrendingDown size={16} className="loss" /> Top Losers
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold">
                  {losers.length} loss declines
                </span>
              </div>
              {losers.slice(0, outcomeSlicer === 'loss' ? 8 : 5).map((l) => (
                <GainerLoserRow key={l.symbol} item={l} type="loss" />
              ))}
            </div>
          )}
        </div>
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
