import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    const result = await register(form.name, form.email, form.password)
    if (result.success) {
      toast.success('Account created!')
      navigate('/')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <TrendingUp size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm muted mt-1">Join StockSense India — Free forever</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { field: 'name', label: 'Full Name', type: 'text', placeholder: 'Mahesh Wagh' },
            { field: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium mb-1.5 muted">{label}</label>
              <input type={type} required value={form[field]}
                     onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                     placeholder={placeholder}
                     className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2"
                     style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium mb-1.5 muted">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} required value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })}
                     placeholder="Min 8 chars, 1 uppercase, 1 number"
                     className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none focus:ring-2"
                     style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 muted hover:text-slate-200">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 disabled:opacity-50">
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs muted text-center mt-4">
          By registering you agree to our terms of service. Not SEBI registered.
        </p>
        <p className="text-center text-sm muted mt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
