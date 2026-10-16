import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Check, 
  Zap, 
  Crown, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  Bell, 
  HelpCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Rocket, 
  Gift 
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const FAQS = [
  {
    q: 'Why are paid plans marked "Coming Soon"?',
    a: 'We are currently in open beta and integrating our secure Indian payment gateway with Razorpay. During this development phase, all core features—including the Trade Journal, analytics charts, and 5 financial calculators—are completely free for all registered users.',
  },
  {
    q: 'Will my logged trades be deleted when paid plans launch?',
    a: 'No. All trades, tags, notes, and metrics you record today will be permanently saved to your account and will remain completely accessible even after paid tiers launch.',
  },
  {
    q: 'Which payment methods will Razorpay support once live?',
    a: 'Through Razorpay, we will support all popular Indian payment channels including UPI (Google Pay, PhonePe, Paytm, CRED), RuPay, Visa & Mastercard debit/credit cards, and NetBanking across 50+ major Indian banks.',
  },
  {
    q: 'Will there always be a 100% Free plan?',
    a: 'Yes! Our Community Free tier will remain free forever with essential trade logging, calculators, and performance metrics for Indian retail traders.',
  },
  {
    q: 'What perk do I get by joining the Priority Waitlist today?',
    a: 'Early waitlist members receive an exclusive 30% lifetime discount on our Pro and Institutional plans as soon as Razorpay checkout goes live.',
  },
]

export default function PricingPage() {
  const { user } = useAuthStore()
  const [email, setEmail] = useState(user?.email || '')
  const [joinedWaitlist, setJoinedWaitlist] = useState(() => {
    return localStorage.getItem('stocksense_waitlist_joined') === 'true'
  })
  const [openFaq, setOpenFaq] = useState(0)

  const handleJoinWaitlist = (e) => {
    e?.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }

    localStorage.setItem('stocksense_waitlist_joined', 'true')
    localStorage.setItem('stocksense_waitlist_email', email)
    setJoinedWaitlist(true)
    toast.success('🎉 You have been added to the Priority Waitlist!')
  }

  return (
    <div className="space-y-12 fade-in max-w-6xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400">
          <Clock size={13} className="animate-pulse" />
          <span>Pro Plans & Razorpay Gateway · Coming Soon</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Transparent, Disciplined <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            Trading Tools for Everyone
          </span>
        </h1>

        <p className="muted text-sm sm:text-base leading-relaxed">
          We are currently operating in <strong className="text-slate-200">Open Public Beta</strong> while configuring our secure Razorpay Indian payment stack. Enjoy unrestricted access to our institutional journaling workspace today.
        </p>

        {/* Early Access Alert Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                100% Free Public Beta Access Active
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Unlocked
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Every registered trader gets full access to the Trade Journal, Daily P&L Heatmap, Risk Calculators, and Market Quotes at ₹0.
              </p>
            </div>
          </div>

          <Link
            to={user ? '/journal' : '/register'}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/25 shrink-0"
          >
            <span>{user ? 'Open Trading Desk' : 'Start Free Today'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Pricing Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* Tier 1: Community Free (LIVE) */}
        <div className="card relative flex flex-col justify-between border-slate-800 bg-[#0f172a]/90 hover:border-slate-700 transition-all shadow-xl">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Live & Active Now
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Forever Free
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Community</h2>
              <p className="text-xs muted mt-1">
                Essential journaling and risk analytics for developing retail traders.
              </p>
            </div>

            <div className="pt-2 pb-1 border-y border-slate-800/80">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">₹0</span>
                <span className="text-xs muted">/ free forever</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">
                No credit card or Razorpay checkout required
              </p>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Trade Journal logging with tags & P&L calculation</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Interactive Daily P&L calendar & trade day inspector</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>All 5 Institutional Calculators (Position, STT, Payoff, CAGR)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>NSE / BSE Market Indices & 106 reference stocks directory</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Personal Watchlist & technical study charts</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>StockSense Trading Academy & market news feed</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              to={user ? '/journal' : '/register'}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700"
            >
              <span>{user ? 'Go to Trading Journal' : 'Get Started Free'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Tier 2: StockSense Pro (COMING SOON) */}
        <div className="card relative flex flex-col justify-between border-blue-500/50 bg-[#0f172a]/95 ring-2 ring-blue-500/30 transition-all shadow-2xl scale-[1.01] sm:scale-105 z-10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-md">
            <Clock size={12} />
            <span>Coming Soon · In Development</span>
          </div>

          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <Zap size={15} />
                <span>Most Anticipated</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 uppercase">
                Razorpay Integration
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                StockSense Pro
                <Sparkles size={16} className="text-amber-400" />
              </h2>
              <p className="text-xs muted mt-1">
                For active intraday, swing, and F&O traders demanding deep automated edge.
              </p>
            </div>

            <div className="pt-2 pb-1 border-y border-slate-800">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-blue-400">₹499</span>
                <span className="text-xs muted">/ month (Planned)</span>
              </div>
              <p className="text-[11px] text-blue-300 font-medium mt-1">
                ₹4,999/year · Priority Early-Bird discount available
              </p>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Everything in Free</strong> with zero logging limits</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span>1-Click CSV Tradebook import (Zerodha, Groww, AngelOne)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span>AI Trade Mistake Tagging & emotional discipline scoring</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Advanced drawdown limits & maximum daily loss circuit alarms</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Detailed strategy win-rate & R-Multiple distributions</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Priority email & dedicated trader community access</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              onClick={() => {
                const el = document.getElementById('waitlist-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-blue-600/30"
            >
              <Bell size={14} />
              <span>Join Priority Pro Waitlist</span>
            </button>
          </div>
        </div>

        {/* Tier 3: Institutional Alpha (COMING SOON) */}
        <div className="card relative flex flex-col justify-between border-slate-800 bg-[#0f172a]/90 hover:border-slate-700 transition-all shadow-xl">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <Crown size={15} />
                <span>Institutional Alpha</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 uppercase">
                Enterprise Desk
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Alpha Desk</h2>
              <p className="text-xs muted mt-1">
                Proprietary desks, quant traders, and portfolio managers managing capital.
              </p>
            </div>

            <div className="pt-2 pb-1 border-y border-slate-800/80">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">₹999</span>
                <span className="text-xs muted">/ month (Planned)</span>
              </div>
              <p className="text-[11px] text-amber-300/80 font-medium mt-1">
                Multi-broker integration & automated trade capture
              </p>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Everything in Pro</strong> plus custom quant integrations</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>Direct broker API auto-sync (Zerodha Kite, Dhan, Fyers)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>Real-time Option Greeks & multi-leg strategy visualizer</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>Multi-account trading book aggregation</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>Quarterly 1-on-1 trading discipline & risk review</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              onClick={() => {
                const el = document.getElementById('waitlist-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs transition-all border border-amber-500/20"
            >
              <Bell size={14} />
              <span>Get Early Access Invite</span>
            </button>
          </div>
        </div>
      </div>

      {/* Priority Waitlist & Razorpay Roadmap Section */}
      <div id="waitlist-section" className="card relative overflow-hidden bg-gradient-to-br from-[#0c1630] via-[#0d1c44] to-[#0a1128] border border-blue-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
              <Rocket size={13} />
              <span>Launch Roadmap · Q2 2026</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Get Notified When Razorpay Checkout Launches
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              We are currently finalizing our merchant integration with <strong className="text-white">Razorpay</strong> to give Indian traders safe, instant payments via UPI (GPay, PhonePe, Paytm), RuPay/Visa/Mastercard cards, and NetBanking.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Razorpay 256-Bit SSL</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CreditCard size={16} className="text-blue-400 shrink-0" />
                <span>UPI, Cards & NetBanking</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Lock size={16} className="text-amber-400 shrink-0" />
                <span>Zero Stored Card Data</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Sparkles size={16} className="text-purple-400 shrink-0" />
                <span>30% Waitlist Discount</span>
              </div>
            </div>
          </div>

          {/* Waitlist Form or Success State */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#090f20]/90 border border-slate-800/80 backdrop-blur-xl">
            {joinedWaitlist ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">You are on the Priority Waitlist!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  We have saved your request. As soon as Razorpay payments and Pro tiers are activated, you will receive an early invite along with your exclusive 30% founding trader discount.
                </p>
                <div className="pt-2">
                  <Link
                    to="/journal"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    <span>Continue Trading in Beta</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">Reserve Your Early-Bird Spot</h3>
                  <p className="text-xs text-slate-400">
                    Join over 1,200+ Indian traders on the waitlist for priority access and discounts.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="waitlist-email" className="text-xs font-medium text-slate-300">
                    Email Address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Bell size={14} />
                  <span>Notify Me at Launch (Save 30%)</span>
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  🔒 Zero spam. We will only email you when paid plans launch.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-6 max-w-3xl mx-auto pt-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <HelpCircle size={14} />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs muted">
            Everything you need to know about our upcoming payment plans and beta access.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={faq.q}
                className="card p-0 overflow-hidden border-slate-800 hover:border-slate-700 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-semibold text-sm text-white hover:bg-slate-800/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-blue-400 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-300 border-t border-slate-800/70 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-6 rounded-2xl bg-[#090f20] border border-slate-800 text-center space-y-2">
        <p className="text-xs font-semibold text-slate-300">
          StockSense is an independent trading journal and discipline workspace designed specifically for Indian equity, F&O, and swing traders.
        </p>
        <p className="text-[11px] muted">
          Payments will be operated under Indian regulatory compliance via Razorpay. No advisory, tip sheets, or execution services are offered.
        </p>
      </div>
    </div>
  )
}
