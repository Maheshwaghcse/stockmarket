import { Link } from 'react-router-dom'
import { TrendingUp, BookOpen, Calculator, Layers, ShieldCheck } from 'lucide-react'

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
              StockSense is an intelligent trading journal and analytics workspace. Record your setups, evaluate execution, track risk, and master your trading discipline.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>Journal & Markets</h4>
            <ul className="space-y-2">
              {[
                ['Trading Journal', '/journal'],
                ['Market Dashboard', '/'],
                ['Tracked Indices', '/indices'],
                ['Equities Watchlist', '/stocks'],
                ['Personal Watchlist', '/watchlist'],
              ].map(([l, to]) => (
                <li key={l}><Link to={to} className="text-sm muted hover:text-slate-200 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>Trading Calculators</h4>
            <ul className="space-y-2">
              {[
                ['Risk & Position Sizing', '/calculator'],
                ['Option Lot Calculator', '/calculator'],
                ['CAGR Growth Tool', '/calculator'],
                ['SIP Investment Plan', '/calculator'],
                ['Loan EMI Calculator', '/calculator'],
              ].map(([l, to]) => (
                <li key={l}><Link to={to} className="text-sm muted hover:text-slate-200 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>Resources</h4>
            <ul className="space-y-2">
              {[
                ['Market News', '/news'],
                ['Trading Education', '/education'],
                ['Plans & Pricing', '/pricing'],
                ['Trader Profile', '/profile'],
              ].map(([l, to]) => (
                <li key={l}><Link to={to} className="text-sm muted hover:text-slate-200 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
             style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs muted">© {new Date().getFullYear()} StockSense. Smart Trading Journal & Trade Analytics. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Trading Journal Workspace</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
