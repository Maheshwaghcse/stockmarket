import { useParams, Link } from 'react-router-dom'
import { useMarketStore } from '../store/marketStore'
import IndexChart from '../components/market/IndexChart'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'

export default function IndexDetailPage() {
  const { symbol } = useParams()
  const { indices } = useMarketStore()
  const idx = indices[symbol?.toUpperCase()]

  if (!idx) {
    return (
      <div className="space-y-4 fade-in">
        <Link to="/indices" className="flex items-center gap-1 text-sm muted hover:text-slate-200">
          <ArrowLeft size={14} /> Back to Indices
        </Link>
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-80 rounded-lg" />
      </div>
    )
  }

  const isGain = idx.changePct >= 0
  const fmt = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '—'

  return (
    <div className="space-y-6 fade-in">
      <Link to="/indices" className="flex items-center gap-1 text-sm muted hover:text-slate-200 transition-colors">
        <ArrowLeft size={14} /> All Indices
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{idx.name}</h1>
          <p className="text-sm muted flex items-center gap-2 mt-1">
            <span>{idx.symbol} · {idx.exchange}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Yahoo Finance
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold mono">{fmt(idx.value)}</p>
          <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${isGain ? 'gain' : 'loss'}`}>
            {isGain ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isGain ? '+' : ''}{fmt(idx.change)} ({isGain ? '+' : ''}{idx.changePct?.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open',       value: fmt(idx.open),      color: 'inherit' },
          { label: 'Prev Close', value: fmt(idx.prevClose), color: 'inherit' },
          { label: 'Day High',   value: fmt(idx.dayHigh),   color: 'var(--color-gain)' },
          { label: 'Day Low',    value: fmt(idx.dayLow),    color: 'var(--color-loss)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-sm">
            <p className="text-xs muted mb-1">{label}</p>
            <p className="text-base font-bold mono" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Intraday Chart — 5 min candles</h2>
          <span className="text-xs text-slate-400">Latest available Yahoo Finance data</span>
        </div>
        <IndexChart symbol={symbol.toUpperCase()} height={360} />
      </div>

      {/* Market status & timestamps */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs muted gap-2">
        <span>Source: <strong className="text-slate-300">Yahoo Finance</strong> ({idx.yahooSymbol || '^' + idx.symbol})</span>
        <div className="flex items-center gap-3">
          <span>Market: <strong className={idx.marketStatus === 'OPEN' ? 'gain' : 'loss'}>{idx.marketStatus}</strong></span>
          <span>Trade Time: <strong className="text-slate-300">{idx.sourceTimestamp ? new Date(idx.sourceTimestamp).toLocaleString() : idx.timestamp ? new Date(idx.timestamp).toLocaleTimeString() : '—'}</strong></span>
        </div>
      </div>
    </div>
  )
}
