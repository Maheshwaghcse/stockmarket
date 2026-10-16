import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

function fmt(n) {
  return n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '—'
}

export default function IndexCard({ index }) {
  if (!index) return <div className="card-sm skeleton h-36" />

  const { symbol, name, value, change, changePct, dayHigh, dayLow, marketStatus } = index
  const isGain = changePct >= 0

  return (
    <Link to={`/indices/${symbol}`}
          className="card-sm block hover:border-blue-500/40 transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide muted">{symbol}</p>
          <p className="text-sm font-medium mt-0.5 truncate max-w-full sm:max-w-40">{name}</p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
          isGain ? 'gain' : 'loss'
        }`} style={{ background: isGain ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
          {isGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isGain ? '+' : ''}{changePct?.toFixed(2)}%
        </span>
      </div>

      <p className="text-xl font-bold mono">{fmt(value)}</p>
      <p className={`text-xs mt-0.5 font-medium ${isGain ? 'gain' : 'loss'}`}>
        {isGain ? '+' : ''}{fmt(change)}
      </p>

      <div className="flex gap-4 mt-3 text-xs muted">
        <span>H: <span className="gain">{fmt(dayHigh)}</span></span>
        <span>L: <span className="loss">{fmt(dayLow)}</span></span>
      </div>
    </Link>
  )
}
