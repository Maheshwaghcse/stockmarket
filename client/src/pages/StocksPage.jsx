import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../lib/api'

export default function StocksPage() {
  const [q, setQ] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stocks', q],
    queryFn: () => api.get(`/stocks?q=${q}`).then(r => r.data),
    staleTime: 30_000,
  })

  const stocks = data?.data || []

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold">Stocks</h1>
        <p className="text-sm muted mt-1">NSE listed stocks · <span className="demo-badge">Demo Data</span></p>
      </div>

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbol or name…"
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-2"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                   color: 'var(--color-text)', '--tw-ring-color': 'rgba(99,102,241,0.4)' }}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs muted border-b" style={{ borderColor: 'var(--color-border)' }}>
              {['Symbol', 'Company', 'LTP', 'Change', 'Sector', ''].map((h) => (
                <th key={h} className={`pb-3 font-medium ${h === '' || h === 'LTP' || h === 'Change' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="py-3"><div className="skeleton h-5 rounded" /></td></tr>
                ))
              : stocks.map((s) => {
                  const isGain = s.changePct >= 0
                  return (
                    <tr key={s.symbol} className="border-b hover:bg-white/2 transition-colors"
                        style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
                      <td className="py-3 font-bold">{s.symbol}</td>
                      <td className="py-3 text-sm muted max-w-40 truncate">{s.name}</td>
                      <td className="py-3 text-right mono font-semibold">{s.price?.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right">
                        <span className={`text-xs font-bold flex items-center justify-end gap-1 ${isGain ? 'gain' : 'loss'}`}>
                          {isGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isGain ? '+' : ''}{s.changePct?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 text-xs muted">{s.sector}</td>
                      <td className="py-3 text-right">
                        <Link to={`/stocks/${s.symbol}`} className="text-xs text-blue-400 hover:text-blue-300">Detail →</Link>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
