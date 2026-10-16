import { useMarketStore } from '../store/marketStore'
import IndexCard from '../components/market/IndexCard'
import IndexChart from '../components/market/IndexChart'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Zap, BookOpen, BarChart2, ArrowRight } from 'lucide-react'
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

  const { data: newsData } = useQuery({
    queryKey: ['featured-news'],
    queryFn: () => api.get('/news/featured').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  return (
    <div className="space-y-8 fade-in">
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

      {/* ── Index Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURED_INDICES.map((sym) => (
          <IndexCard key={sym} index={indices[sym]} />
        ))}
      </div>

      {/* ── Main Chart + Sidebar ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:items-start">
        {/* Chart */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold text-base">Nifty 50 — Intraday</h2>
              <p className="text-xs muted">5-minute candles · Market Reference</p>
            </div>
            <Link to="/indices/NIFTY50" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium">
              Full view <ArrowRight size={12} />
            </Link>
          </div>
          <IndexChart symbol="NIFTY50" height={300} />
        </div>

        {/* Gainers / Losers */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="gain" /> Top Gainers
            </h2>
            {gainers.map((g) => <GainerLoserRow key={g.symbol} item={g} type="gain" />)}
          </div>
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="loss" /> Top Losers
            </h2>
            {losers.map((l) => <GainerLoserRow key={l.symbol} item={l} type="loss" />)}
          </div>
        </div>
      </div>

      {/* ── All Indices Table ──────────────────────────────── */}
      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><BarChart2 size={16} /> All Indices</h2>
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
            {allIndices.map((idx) => {
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
