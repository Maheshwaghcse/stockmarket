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
  BarChart2,
  Newspaper,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useMarketStore } from '../../store/marketStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const NAV_LINKS = [
  { to: '/',           label: 'Dashboard',   icon: LayoutDashboard, badge: null },
  { to: '/indices',    label: 'Indices',     icon: Activity,        badge: null },
  { to: '/stocks',     label: 'Stocks',      icon: TrendingUp,      badge: '106' },
  { to: '/journal',    label: 'Journal',     icon: BookOpen,        badge: 'Desk' },
  { to: '/calculator', label: 'Calculator',  icon: Calculator,      badge: '5 Tools' },
  { to: '/news',       label: 'News',        icon: Newspaper,       badge: 'Live' },
  { to: '/education',  label: 'Learn',       icon: GraduationCap,   badge: null },
  { to: '/pricing',    label: 'Pricing',     icon: Sparkles,        badge: 'Soon' },
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
    <>
      <header className="sticky top-0 z-40 glass border-b select-none" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
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
    </header>

      {/* ── Mobile Slide-In Navigation (Backdrop + Off-Canvas Drawer) ────── */}
      {/* 1. Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* 2. Slide-In Off-Canvas Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[310px] max-w-[85vw] bg-[#0b1329] border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header with Logo & Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-[#080e1e] shrink-0">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
            >
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Stock<span className="text-indigo-400">Sense</span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close mobile menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Market Status Bar inside Drawer */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Activity size={13} className="text-blue-400" /> Market Hours:
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className={`pulse-dot ${marketStatus === 'OPEN' ? '' : 'closed'}`} />
            <span style={{ color: marketStatus === 'OPEN' ? 'var(--color-gain)' : 'var(--color-loss)' }}>
              NSE {marketStatus}
            </span>
          </span>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto touch-scroll px-3 py-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pt-1 pb-1.5">
            Trading Workspace
          </p>
          {NAV_LINKS.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className="opacity-80" />
                <span>{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {badge}
                  </span>
                )}
                <ChevronRight size={15} className="opacity-40" />
              </div>
            </NavLink>
          ))}

          {/* Quick Shortcuts Section */}
          <div className="pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
              Quick Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-2 px-1">
              <Link
                to="/watchlist"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px] text-xs font-semibold"
              >
                <Star size={14} className="text-amber-400 shrink-0" />
                <span>Watchlists</span>
              </Link>
              <button
                onClick={() => {
                  handleRefreshMarket()
                  setOpen(false)
                }}
                disabled={syncing}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px] text-xs font-semibold"
              >
                <RefreshCw size={14} className={`text-blue-400 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync Quotes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer with User Account / Auth CTAs */}
        <div className="p-4 border-t border-slate-800/90 bg-[#070d1d] shrink-0">
          {user ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  {subscription?.plan || 'Free'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 min-h-[40px] font-medium"
                >
                  <Settings size={13} className="text-indigo-400" />
                  <span>Profile</span>
                </Link>

                {isAdmin() ? (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 min-h-[40px] font-medium"
                  >
                    <LayoutDashboard size={13} />
                    <span>Admin</span>
                  </Link>
                ) : (
                  <Link
                    to="/pricing"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 min-h-[40px] font-medium"
                  >
                    <Sparkles size={13} />
                    <span>Pricing (Soon)</span>
                  </Link>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold text-xs hover:bg-rose-500/20 transition-all min-h-[44px]"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="btn-primary w-full text-center py-2.5 text-xs font-bold min-h-[44px] flex items-center justify-center rounded-xl"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="btn-ghost w-full text-center py-2 text-xs font-semibold min-h-[40px] flex items-center justify-center text-slate-300 rounded-xl"
              >
                Sign In to Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Navigation Bar (Always visible on mobile) ────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080e1e]/95 backdrop-blur-xl border-t border-slate-800/90 py-1.5 px-3 flex items-center justify-around shadow-2xl"
        aria-label="Mobile Quick Navigation"
      >
        {[
          { to: '/', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/indices', label: 'Indices', icon: Activity },
          { to: '/stocks', label: 'Stocks', icon: TrendingUp },
          { to: '/journal', label: 'Journal', icon: BookOpen },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
                isActive
                  ? 'text-blue-400 font-bold bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} />
            <span className="text-[10px] mt-0.5">{label}</span>
          </NavLink>
        ))}
        {/* Menu toggle button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
            open ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={18} />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>
    </>
  )
}
