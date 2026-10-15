import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../lib/api'

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
      {error && <p className="text-sm" style={{ color: 'var(--color-loss)' }}>Stock not found in demo set.</p>}

      {s && (
        <>
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{s.symbol}</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Yahoo Finance (NSE)
                  </span>
                </div>
                <p className="muted text-sm">{s.name}</p>
                <p className="text-xs muted mt-1">{s.sector} · {s.exchange} ({s.yahooSymbol})</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold mono">₹{fmt(s.price)}</p>
                <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${s.changePct >= 0 ? 'gain' : 'loss'}`}>
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
          </div>

          <div className="card text-xs muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Market Data Source: <strong className="text-slate-300">Yahoo Finance ({s.yahooSymbol})</strong></span>
            <span>Last Trade Time: <strong className="text-slate-300">{s.sourceTimestamp ? new Date(s.sourceTimestamp).toLocaleString() : s.timestamp ? new Date(s.timestamp).toLocaleString() : '—'}</strong></span>
          </div>
        </>
      )}
    </div>
  )
}
