import { Link } from 'react-router-dom'
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Activity,
  Sparkles,
  Heart,
  Calculator,
  BookOpen,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t mt-auto text-slate-400 select-none" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#070d1d' }}>
      {/* ── Top Trust & Security Strip ─────────────────────────────────── */}
      <div className="border-b border-slate-800/60 bg-[#091124]/40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck size={15} />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-slate-200 block text-xs">SEBI Framework</span>
                <span className="text-[10px] text-slate-500">Compliance &amp; audit ready</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock size={15} />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-slate-200 block text-xs">256-Bit SSL Encrypted</span>
                <span className="text-[10px] text-slate-500">Private trade records</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Activity size={15} />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-slate-200 block text-xs">Real-Time NSE Feeds</span>
                <span className="text-[10px] text-slate-500">Live tick benchmarks</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles size={15} />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-slate-200 block text-xs">100% Unbiased</span>
                <span className="text-[10px] text-slate-500">Zero broker kickbacks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Navigation & Brand Section ───────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Col 1 & 2: Brand & Platform Overview */}
          <div className="lg:col-span-2 space-y-3.5">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
              >
                <TrendingUp size={18} className="text-white" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">
                  Stock<span className="text-indigo-400">Sense</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  INDIA
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Institutional-grade trading journal and quantitative market analytics workspace engineered for Indian equity, futures, and options market participants.
            </p>

            {/* Operational Status Pill */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">All Systems Operational</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 font-mono font-semibold">99.98% Uptime</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">v2.4.0</span>
            </div>
          </div>

          {/* Col 3: Markets & Benchmarks */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Activity size={13} className="text-blue-400" />
              <span>Markets</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              {[
                ['Nifty 50 Benchmark', '/indices'],
                ['Bank Nifty Derivatives', '/indices'],
                ['BSE Sensex 30', '/indices'],
                ['Nifty Financial (FinNifty)', '/indices'],
                ['Top 106 Equities Directory', '/stocks'],
                ['Market Breadth & Heatmap', '/stocks'],
              ].map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="text-slate-400 hover:text-white transition-colors duration-150 block py-0.5">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Trading Desk & Calculators */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Calculator size={13} className="text-emerald-400" />
              <span>Trading Desk</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              {[
                ['Trading Journal Desk', '/journal'],
                ['Performance & P&L Analytics', '/journal'],
                ['Position Sizing Calculator', '/calculator'],
                ['Option Risk & Lot Calculator', '/calculator'],
                ['CAGR & SIP Growth Engine', '/calculator'],
                ['Multi-Asset Watchlists', '/watchlist'],
              ].map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="text-slate-400 hover:text-white transition-colors duration-150 block py-0.5">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Academy & Platform */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <BookOpen size={13} className="text-indigo-400" />
              <span>Platform</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              {[
                ['Candlestick Patterns Guide', '/education'],
                ['Technical Analysis Sandbox', '/education'],
                ['Financial News & Macro RBI', '/news'],
                ['Pricing Plans & Pro Access', '/pricing'],
                ['Trader Profile & Settings', '/profile'],
              ].map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="text-slate-400 hover:text-white transition-colors duration-150 block py-0.5">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Compact Institutional Regulatory & SEBI Risk Notice ────────── */}
        <div className="mt-8 p-3.5 sm:p-4 rounded-xl bg-[#091122] border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="uppercase tracking-wide text-[10px]">SEBI Statutory Risk Warning &amp; Regulatory Notice</span>
          </div>
          <p>
            Securities trading in equities, derivatives (Futures &amp; Options), and leveraged instruments involves substantial risk of capital loss. Per SEBI study findings, <strong className="text-slate-200 font-medium">9 out of 10 individual traders in the equity F&amp;O segment incurred net financial losses</strong>, with an average loss exceeding ₹50,000 per trader.
          </p>
          <p className="text-slate-500 text-[10px]">
            StockSense India is an analytical trade journaling and quantitative calculation workspace for self-directed traders. We are <strong className="text-slate-400">not a SEBI-registered Investment Advisor, Research Analyst, or Broker</strong>. Outputs, charts, and patterns do not constitute investment recommendations or buy/sell advice. Past performance recorded does not guarantee future results.
          </p>
        </div>

        {/* ── Sleek Bottom Copyright & Links Bar ────────────────────────── */}
        <div className="border-t border-slate-800/60 mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>© {new Date().getFullYear()} StockSense Technologies India Pvt. Ltd. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 text-slate-400 text-[11px]">
            <Link to="/pricing" className="hover:text-slate-200 transition-colors">Pricing</Link>
            <span className="text-slate-700">·</span>
            <Link to="/education" className="hover:text-slate-200 transition-colors">Academy</Link>
            <span className="text-slate-700">·</span>
            <Link to="/journal" className="hover:text-slate-200 transition-colors">Journal Desk</Link>
            <span className="text-slate-700">·</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              Made with <Heart size={11} className="text-rose-500 fill-rose-500" /> for Indian Traders
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}

