import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.email, form.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-sm muted mt-1">Welcome back to StockSense</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 muted">Email</label>
            <input type="email" required value={form.email}
                   onChange={(e) => setForm({ ...form, email: e.target.value })}
                   placeholder="you@example.com"
                   className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2"
                   style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 muted">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} required value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })}
                     placeholder="Min 8 characters"
                     className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none focus:ring-2"
                     style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 muted hover:text-slate-200">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
                  className="btn-primary w-full py-2.5 disabled:opacity-50">
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  )
}
