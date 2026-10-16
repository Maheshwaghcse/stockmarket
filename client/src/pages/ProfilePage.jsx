import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { Settings, CreditCard, User } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, subscription, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name || '')

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => api.get('/subscription/my').then(r => r.data),
  })

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put('/auth/profile', { name })
      updateProfile(data.user)
      toast.success('Profile updated')
    } catch { toast.error('Failed to save') }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <h1 className="text-2xl font-bold flex items-center gap-2"><User size={22} /> Profile & Settings</h1>

      {/* Profile card */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Settings size={16} /> Account Details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs muted mb-1.5">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
                   className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                   style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div>
            <label className="block text-xs muted mb-1.5">Email</label>
            <input value={user?.email} disabled
                   className="w-full px-3 py-2.5 rounded-lg text-sm opacity-50 cursor-not-allowed"
                   style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      </div>

      {/* Subscription card */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard size={16} /> Subscription</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold capitalize text-lg">{subscription?.plan || 'free'} Plan</p>
            <p className="text-xs muted capitalize">Status: {subscription?.status || 'active'}</p>
            {subscription?.currentPeriodEnd && (
              <p className="text-xs muted">
                Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
            {subscription?.plan || 'free'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-sm">
          {Object.entries(subscription?.features || {}).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between card-sm">
              <span className="text-xs muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className={`text-xs font-bold ${val === true ? 'gain' : val === false ? 'loss' : ''}`}>
                {typeof val === 'boolean' ? (val ? '✓' : '✗') : val}
              </span>
            </div>
          ))}
        </div>

        <a href="/pricing" className="btn-ghost w-full text-center mt-4 block text-sm">Upgrade Plan →</a>
      </div>

      {/* Payment history */}
      {subData?.payments?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Payment History</h2>
          <div className="space-y-2">
            {subData.payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                   style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <p className="font-medium">₹{(p.amount / 100).toLocaleString('en-IN')}</p>
                  <p className="text-xs muted">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.status === 'paid' ? 'gain' : 'loss'}`}
                      style={{ background: p.status === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
