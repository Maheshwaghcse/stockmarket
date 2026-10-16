import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  TrendingUp,
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  LayoutDashboard,
  RefreshCw,
  BookOpen,
  Calculator,
  Star,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react'
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
  const location = useLocation()
  const userMenuRef = useRef(null)

  // Automatically close mobile menu and user dropdown on page navigation
  useEffect(() => {
    setOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Close menus on ESC key or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setUserMenuOpen(false)
      }
    }
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    setUserMenuOpen(false)
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleRefreshMarket = async () => {
    setSyncing(true)
    const toastId = toast.loading('Refreshing market quotes...')
    try {
      const { data } = await api.post('/market/sync-market')
      toast.success(`Updated ${data.count || 0} market quotes!`, { id: toastId })
      if (fetchIndices) fetchIndices()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh quotes', { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 glass border-b select-none" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0 min-h-[44px]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
            >
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-text)' }}>
              Stock<span style={{ color: '#6366f1' }}>Sense</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-400 bg-blue-400/10 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Market status pill (Hidden on very small screens to preserve space) */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className={`pulse-dot ${marketStatus === 'OPEN' ? '' : 'closed'}`} />
              <span style={{ color: marketStatus === 'OPEN' ? 'var(--color-gain)' : 'var(--color-loss)' }}>
                {marketStatus}
              </span>
            </div>

            {/* Live Quotes Refresh Button */}
            <button
              onClick={handleRefreshMarket}
              disabled={syncing}
              title="Refresh Market Quotes"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50 min-h-[36px]"
              aria-label="Refresh Market Quotes"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden md:inline">{syncing ? 'Updating…' : 'Live Quotes'}</span>
            </button>

            {/* Connection status indicator */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              title={isConnected ? 'Live WebSocket Active' : 'Disconnected / Reconnecting'}
              style={{ background: isConnected ? 'var(--color-gain)' : 'var(--color-loss)' }}
            />

            {/* User Profile or Auth Buttons (Desktop) */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1.5 rounded-lg hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] justify-center"
                  aria-label="Open user menu"
                  aria-expanded={userMenuOpen}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:block text-xs font-medium max-w-24 truncate text-slate-200">
                    {user.name}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-11 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl z-50 overflow-hidden fade-in border"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  >
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-sm font-semibold truncate text-slate-100">{user.name}</p>
                      <p className="text-xs muted truncate">{user.email}</p>
                      <span
                        className="text-[10px] capitalize px-2 py-0.5 rounded-full mt-1.5 inline-block font-bold"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
                      >
                        {subscription?.plan || 'Free'} Plan
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        to="/watchlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                      >
                        <Star size={14} className="text-amber-400" /> Watchlists
                      </Link>
                      <Link
                        to="/journal"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                      >
                        <BookOpen size={14} className="text-blue-400" /> Trading Journal
                      </Link>
                      <Link
                        to="/calculator"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                      >
                        <Calculator size={14} className="text-emerald-400" /> Financial Calculators
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                      >
                        <Settings size={14} className="text-indigo-400" /> Settings &amp; Profile
                      </Link>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-amber-400 transition-colors"
                        >
                          <LayoutDashboard size={14} /> Admin Portal
                        </Link>
                      )}
                      <div className="border-t border-slate-800 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 w-full text-left hover:bg-rose-500/10 text-rose-400 transition-colors font-semibold"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-xs px-3 py-1.5">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs px-3 py-1.5">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button (Touch Target >= 44x44) */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors min-w-[44px] min-h-[44px]"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer ──────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-x-0 top-14 bottom-0 z-40 bg-slate-950/80 backdrop-blur-md md:hidden overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            className="border-b shadow-2xl p-4 space-y-4 max-h-full overflow-y-auto"
            style={{ background: 'var(--color-surface)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* Market Status in Drawer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400">Market Hours Status:</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className={`pulse-dot ${marketStatus === 'OPEN' ? '' : 'closed'}`} />
                <span style={{ color: marketStatus === 'OPEN' ? 'var(--color-gain)' : 'var(--color-loss)' }}>
                  NSE {marketStatus}
                </span>
              </span>
            </div>

            {/* Main Navigation Links */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
                Navigation
              </p>
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                      isActive
                        ? 'text-white bg-blue-600 shadow-md shadow-blue-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`
                  }
                >
                  <span>{label}</span>
                  <ArrowRight size={14} className="opacity-60" />
                </NavLink>
              ))}
            </div>

            {/* User Profile or Auth in Drawer */}
            <div className="pt-3 border-t border-slate-800/80">
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-44">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
                    >
                      {subscription?.plan || 'Free'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to="/watchlist"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px]"
                    >
                      <Star size={14} className="text-amber-400" />
                      <span>Watchlists</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px]"
                    >
                      <Settings size={14} className="text-indigo-400" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {isAdmin() && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold min-h-[44px]"
                    >
                      <LayoutDashboard size={14} />
                      <span>Admin Management Portal</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold text-xs hover:bg-rose-500/20 transition-all min-h-[44px]"
                  >
                    <LogOut size={14} />
                    <span>Sign Out of Account</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 pt-2">
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full text-center py-3 text-sm min-h-[44px] flex items-center justify-center"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="btn-ghost w-full text-center py-2.5 text-sm min-h-[44px] flex items-center justify-center text-slate-300"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
