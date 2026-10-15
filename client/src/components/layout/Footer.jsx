import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t mt-auto py-8" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                <TrendingUp size={15} className="text-white" />
              </div>
              <span className="font-bold text-sm">Stock<span style={{ color: '#6366f1' }}>Sense</span></span>
            </div>
            <p className="text-xs leading-relaxed muted">
              Track Indian stock market indices in real time. Not SEBI registered.
              Demo data — not investment advice.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>Markets & Tools</h4>
            <ul className="space-y-2">
              {[['Indices', '/indices'], ['Stocks', '/stocks'], ['Trading Journal', '/journal'], ['Calculator', '/calculator'], ['Watchlist', '/watchlist']].map(([l, to]) => (
                <li key={l}><Link to={to} className="text-sm muted hover:text-slate-200 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>Learn</h4>
            <ul className="space-y-2">
              {[['News', '/news'], ['Education', '/education'], ['Pricing', '/pricing']].map(([l, to]) => (
                <li key={l}><Link to={to} className="text-sm muted hover:text-slate-200 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>Legal</h4>
            <ul className="space-y-2 text-sm muted">
              <li>For educational purposes only</li>
              <li>Demo data is not real</li>
              <li>Not SEBI registered</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
             style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs muted">© {new Date().getFullYear()} StockSense India. All rights reserved.</p>
          <div className="demo-badge">⚠ Demo Mode — Not Real Market Data</div>
        </div>
      </div>
    </footer>
  )
}
