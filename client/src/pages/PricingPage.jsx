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
      'Demo market indices (clearly labelled)',
      'Basic charts',
      '5 watchlist items',
      'Market news access',
      'Educational content',
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
      '20 watchlist items',
      'Stock alerts',
      'Advanced news filters',
      'Priority support',
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
      '100 watchlist items',
      'Advanced charts',
      'Data export (CSV)',
      'Early access features',
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
        <p className="muted mt-2 text-sm">Choose the plan that fits your needs. Cancel anytime.</p>
        <div className="demo-badge mx-auto mt-3">Currently in Demo Mode — Payments not yet active</div>
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

      <div className="card text-center" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
        <p className="text-sm" style={{ color: '#f59e0b' }}>
          ⚠️ Payments are powered by Razorpay (India). All subscriptions are subject to SEBI compliance.
          Live data features require a separately licensed NSE/BSE data provider.
        </p>
      </div>
    </div>
  )
}
