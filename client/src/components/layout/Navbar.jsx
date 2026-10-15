import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { TrendingUp, Search, Bell, User, Menu, X, LogOut, Settings, LayoutDashboard, RefreshCw, BookOpen, Calculator } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useMarketStore } from '../../store/marketStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const NAV_LINKS = [
  { to: '/',           label: 'Dashboard'  },
  { to: '/indices',    label: 'Indices'    },
  { to: '/stocks',     label: 'Stocks'     },
  { to: '/journal',    label: 'Journal'    },
  { to: '/calculator', label: 'Calculator' },
  { to: '/news',       label: 'News'       },
  { to: '/education',  label: 'Learn'      },
  { to: '/pricing',    label: 'Pricing'    },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { user, subscription, logout, isAdmin } = useAuthStore()
  const { marketStatus, isConnected, fetchIndices } = useMarketStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const handleSyncApify = async () => {
    setSyncing(true)
    const toastId = toast.loading('Syncing real Indian market prices from Apify...')
    try {
      const { data } = await api.post('/market/sync-apify')
      toast.success(`Updated ${data.count || 0} symbols with live Apify prices!`, { id: toastId })
      if (fetchIndices) fetchIndices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Apify sync failed', { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-base hidden sm:block" style={{ color: 'var(--color-text)' }}>
              Stock<span style={{ color: '#6366f1' }}>Sense</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-400 bg-blue-400/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Market status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className={`pulse-dot ${marketStatus === 'OPEN' ? '' : 'closed'}`} />
              <span style={{ color: marketStatus === 'OPEN' ? 'var(--color-gain)' : 'var(--color-loss)' }}>
                {marketStatus}
              </span>
            </div>

            {/* Apify Live Sync Button */}
            <button
              onClick={handleSyncApify}
              disabled={syncing}
              title="Sync Live Indian Market Prices via Apify"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Apify Live'}</span>
            </button>

            {/* Connection status */}
            <div className="w-2 h-2 rounded-full" title={isConnected ? 'Live' : 'Disconnected'}
                 style={{ background: isConnected ? 'var(--color-gain)' : 'var(--color-loss)' }} />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                       style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-24 truncate">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-52 rounded-xl shadow-xl z-50 overflow-hidden fade-in"
                       style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs muted truncate">{user.email}</p>
                      <span className="text-xs capitalize px-1.5 py-0.5 rounded mt-1 inline-block font-medium"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                        {subscription?.plan || 'free'} plan
                      </span>
                    </div>
                    <div className="py-1">
                      <Link to="/watchlist" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors">
                        <Bell size={14} /> Watchlist
                      </Link>
                      <Link to="/journal" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors">
                        <BookOpen size={14} /> Trading Journal
                      </Link>
                      <Link to="/calculator" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors">
                        <Calculator size={14} /> Calculator
                      </Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors">
                        <Settings size={14} /> Settings
                      </Link>
                      {isAdmin() && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 transition-colors"
                              style={{ color: '#fbbf24' }}>
                          <LayoutDashboard size={14} /> Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout}
                              className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left hover:bg-white/5 transition-colors"
                              style={{ color: 'var(--color-loss)' }}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-1.5 rounded-md hover:bg-white/5 transition-colors"
                    onClick={() => setOpen((v) => !v)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden border-t fade-in" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'var(--color-surface)' }}>
          <nav className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-blue-400 bg-blue-400/10' : 'text-slate-400 hover:text-slate-200'
                  }`
                }>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
