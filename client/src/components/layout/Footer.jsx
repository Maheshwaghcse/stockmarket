import { Link } from 'react-router-dom'
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Activity,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Calculator,
  Layers,
  Heart,
  BarChart2,
  RefreshCw,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t mt-auto text-slate-400 select-none" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#070d1d' }}>
      {/* ── Top Trust & Feature Banner ────────────────────────────────────────── */}
      <div className="border-b border-slate-800/60 bg-[#091124]/60">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-200">SEBI Compliant</p>
                <p className="text-[11px] text-slate-500">Analytics &amp; journaling framework</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-200">256-Bit SSL Encryption</p>
                <p className="text-[11px] text-slate-500">Confidential trade journal data</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-200">Real-Time NSE Feeds</p>
                <p className="text-[11px] text-slate-500">Live benchmark quotes &amp; charts</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-200">100% Unbiased</p>
                <p className="text-[11px] text-slate-500">Zero broker kickbacks or conflicts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Multi-Column Links Section ──────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Col 1: Brand & Mission Statement */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
              >
                <TrendingUp size={20} className="text-white" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">
                  Stock<span className="text-indigo-400">Sense</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  INDIA
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              StockSense India is an institutional-grade trading journal and quantitative market analytics workspace for Indian equity and F&amp;O market participants. Record setups, evaluate mathematical expectancy, calculate position risk, and build disciplined trading habits.
            </p>

            {/* Live Operational Status Badge */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">All Systems Operational</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 font-mono font-semibold">99.98% Uptime</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">v2.4.0 Live</span>
            </div>
          </div>

          {/* Col 2: Markets & Indices */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Activity size={14} className="text-blue-400" /> Markets &amp; Indices
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                ['Nifty 50 Benchmark', '/indices'],
                ['Bank Nifty Derivatives', '/indices'],
                ['BSE Sensex 30', '/indices'],
                ['Nifty Financial (FinNifty)', '/indices'],
                ['Top 106 Equities Directory', '/stocks'],
                ['Market Breadth & Advances', '/stocks'],
              ].map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="text-slate-400 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-slate-600" />
                    <span>{l}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Trading Desk & Calculators */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Calculator size={14} className="text-emerald-400" /> Tools &amp; Desk
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                ['Trading Journal Desk', '/journal'],
                ['Tradebook P&L Heatmap', '/journal'],
                ['Risk & Position Sizing', '/calculator'],
                ['Option Lot Risk Tool', '/calculator'],
                ['CAGR Growth Engine', '/calculator'],
                ['SIP Investment Planner', '/calculator'],
                ['Multi-Asset Watchlists', '/watchlist'],
              ].map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="text-slate-400 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-slate-600" />
                    <span>{l}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Academy & Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-400" /> Academy &amp; Platform
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                ['Technical Analysis Sandbox', '/education'],
                ['Candlestick Patterns Guide', '/education'],
                ['Financial News & RBI', '/news'],
                ['Plans & Pricing', '/pricing'],
                ['Trader Profile & Settings', '/profile'],
              ].map(([l, to]) => (
                <li key={l}>
                  <Link to={to} className="text-slate-400 hover:text-white hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-slate-600" />
                    <span>{l}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Statutory Regulatory & SEBI Risk Warning ───────────────────────── */}
        <div className="mt-10 sm:mt-12 p-4 sm:p-5 rounded-2xl bg-[#0b1428] border border-amber-500/25 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="uppercase tracking-wider text-[11px]">Regulatory &amp; Statutory Risk Warning (SEBI Compliance Notice)</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            Securities trading in equities, futures, options (F&amp;O), and leveraged derivatives involves substantial risk of capital loss and is not suitable for every individual. In compliance with SEBI study findings, <strong className="text-slate-200">9 out of 10 individual traders in the equity F&amp;O segment incurred net financial losses</strong>, with an average loss exceeding ₹50,000 per trader.
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            StockSense India is an analytical trade journaling software and calculation platform built for self-directed traders. We are <strong className="text-slate-200">not a SEBI-registered Investment Advisor, Research Analyst, or Stock Broker</strong>. None of the statistics, charts, or pattern recognition outputs constitute investment recommendations or buy/sell advice. Past performance recorded in journal entries does not guarantee future returns.
          </p>
        </div>

        {/* ── Bottom Bar ────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <span>© {new Date().getFullYear()} StockSense Technologies India Pvt. Ltd. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <Link to="/pricing" className="hover:text-slate-200 transition-colors">Pricing</Link>
            <span className="text-slate-700">·</span>
            <Link to="/education" className="hover:text-slate-200 transition-colors">Curriculum</Link>
            <span className="text-slate-700">·</span>
            <Link to="/journal" className="hover:text-slate-200 transition-colors">Journal Desk</Link>
            <span className="text-slate-700">·</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              Made with <Heart size={12} className="text-rose-500 fill-rose-500" /> for Indian Traders
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
