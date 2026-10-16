import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../lib/api'
import TechnicalAnalysisChart from '../components/chart/TechnicalAnalysisChart'

export default function StockDetailPage() {
  const { symbol } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => api.get(`/stocks/${symbol}`).then(r => r.data),
  })

  const s = data?.data
  const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '—'

  return (
    <div className="space-y-6 fade-in">
      <Link to="/stocks" className="flex items-center gap-1 text-sm muted hover:text-slate-200 transition-colors">
        <ArrowLeft size={14} /> All Stocks
      </Link>

      {isLoading && <div className="skeleton h-48 rounded-xl" />}
      {error && <p className="text-sm" style={{ color: 'var(--color-loss)' }}>Stock quote not found.</p>}

      {s && (
        <>
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{s.symbol}</h1>
                  {s.sector && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {s.sector}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                    {s.exchange || 'NSE'}
                  </span>
                </div>
                <p className="muted text-sm">{s.name}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Link
                    to={`/education?symbol=${s.symbol}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
                  >
                    Open in Chart
                  </Link>
                  <Link
                    to={`/journal?symbol=${s.symbol}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                  >
                    Log in Journal
                  </Link>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold mono">₹{fmt(s.price)}</p>
                <p className={`text-sm font-semibold flex items-center justify-start sm:justify-end gap-1 ${s.changePct >= 0 ? 'gain' : 'loss'}`}>
                  {s.changePct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {s.changePct >= 0 ? '+' : ''}{fmt(s.change)} ({s.changePct >= 0 ? '+' : ''}{s.changePct?.toFixed(2)}%)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {[
                { label: 'Open',        value: `₹${fmt(s.open)}` },
                { label: 'Prev Close',  value: `₹${fmt(s.prevClose)}` },
                { label: 'Day High',    value: `₹${fmt(s.dayHigh)}`,   cls: 'gain' },
                { label: 'Day Low',     value: `₹${fmt(s.dayLow)}`,    cls: 'loss' },
                { label: '52W High',    value: s.fiftyTwoWeekHigh ? `₹${fmt(s.fiftyTwoWeekHigh)}` : '—', cls: 'gain' },
                { label: '52W Low',     value: s.fiftyTwoWeekLow ? `₹${fmt(s.fiftyTwoWeekLow)}` : '—', cls: 'loss' },
                { label: 'Volume',      value: s.volume ? s.volume.toLocaleString('en-IN') : '—' },
                { label: 'P/E Ratio',   value: s.pe ?? '—' },
              ].map(({ label, value, cls }) => (
                <div key={label}>
                  <p className="text-xs muted mb-1">{label}</p>
                  <p className={`text-sm font-bold mono ${cls || ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* 52-Week Range Bar */}
            {s.fiftyTwoWeekLow && s.fiftyTwoWeekHigh && (
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs muted mono">
                  <span>52W Low: ₹{fmt(s.fiftyTwoWeekLow)}</span>
                  <span className="text-slate-300 font-semibold">52-Week Price Spectrum</span>
                  <span>52W High: ₹{fmt(s.fiftyTwoWeekHigh)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((s.price - s.fiftyTwoWeekLow) / (s.fiftyTwoWeekHigh - s.fiftyTwoWeekLow)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {/* Technical Analysis & 2-Year Historical Chart */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Interactive Chart &amp; Technical Analysis</h2>
                  <p className="text-xs muted">Live intraday candles up to 2-year multi-timeframe price history</p>
                </div>
              </div>
              <TechnicalAnalysisChart defaultSymbol={s.symbol} defaultTimeframe="2Y" height={420} />
            </div>
          </div>

          <div className="card text-xs muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Reference Ticker: <strong className="text-slate-300">{s.symbol} ({s.name})</strong></span>
            <span>Last Updated: <strong className="text-slate-300">{s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : '—'}</strong></span>
          </div>
        </>
      )}
    </div>
  )
}
