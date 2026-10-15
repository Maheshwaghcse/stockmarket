import { Check, Zap, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const PLANS = [
  {
    name: 'Free',
    icon: null,
    monthly: 0,
    yearly: 0,
    color: '#94a3b8',
    features: [
      'Trade Journal logging (Up to 100 trades)',
      'Market reference quotes & charts',
      'All 5 Trading Calculators',
      'Personal Watchlist',
      'Market news & education',
    ],
    cta: 'Get Started Free',
    to: '/register',
  },
  {
    name: 'Basic',
    icon: Zap,
    monthly: 499,
    yearly: 4999,
    color: '#3b82f6',
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited Trade Journal entries',
      'Win-rate & P&L Analytics',
      'Risk & Position Sizing Tools',
      'Priority email support',
    ],
    cta: 'Start Basic',
    to: '/register',
    planKey: 'basic_monthly',
  },
  {
    name: 'Premium',
    icon: Crown,
    monthly: 999,
    yearly: 9999,
    color: '#fbbf24',
    features: [
      'Everything in Basic',
      'Tradebook CSV Data Export',
      'Advanced Risk Matrix & Metrics',
      'Strategy & Emotion Tagging',
      'Early access to new tools',
    ],
    cta: 'Go Premium',
    to: '/register',
    planKey: 'premium_monthly',
  },
]

export default function PricingPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-10 fade-in max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Simple, Transparent Pricing</h1>
        <p className="muted mt-2 text-sm">Choose the trading journal plan that fits your trading journey. Cancel anytime.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div key={plan.name}
               className={`card relative flex flex-col transition-transform hover:-translate-y-1 ${plan.popular ? 'ring-2 ring-blue-500/50' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                   style={{ background: '#3b82f6', color: '#fff' }}>
                Most Popular
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              {plan.icon && <plan.icon size={18} style={{ color: plan.color }} />}
              <h2 className="text-lg font-bold" style={{ color: plan.color }}>{plan.name}</h2>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {plan.monthly === 0 ? 'Free' : `₹${plan.monthly.toLocaleString('en-IN')}`}
              </span>
              {plan.monthly > 0 && <span className="muted text-sm">/month</span>}
              {plan.yearly > 0 && (
                <p className="text-xs muted mt-1">₹{plan.yearly.toLocaleString('en-IN')}/year · Save 17%</p>
              )}
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-gain)' }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link to={user ? '/profile' : plan.to}
                  className={plan.popular ? 'btn-primary text-center' : 'btn-ghost text-center'}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="card text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <p className="text-sm muted">
          StockSense is a dedicated trading journal and performance tracking suite. Subscriptions include full access to trade logging, analytics, and risk calculators.
        </p>
      </div>
    </div>
  )
}
