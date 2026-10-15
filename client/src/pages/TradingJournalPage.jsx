import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Calendar, TrendingUp, TrendingDown, HelpCircle, 
  Trash2, X, ChevronLeft, ChevronRight, Info, CheckCircle2, 
  Clock, ArrowUpRight, ArrowDownRight, Filter, AlertCircle
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// Quick suggested symbols
const SUGGESTED_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'NIFTY50', 'BANKNIFTY']

export default function TradingJournalPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Filters & State
  const [modalOpen, setModalOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedDayKey, setSelectedDayKey] = useState(null)
  const [showHowToUse, setShowHowToUse] = useState(false)

  // Current calendar month navigation (default to October 2026 / current date)
  const [viewDate, setViewDate] = useState(new Date('2026-10-15'))

  // Form State for New Trade Modal
  const [form, setForm] = useState({
    symbol: '',
    tradeType: 'Long',
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: new Date().toISOString().slice(0, 16),
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    imageUrl: '',
    entryReason: '',
    exitReason: '',
    lessonLearned: '',
  })

  // Fetch Journal Trades & Stats
  const { data: journalData, isLoading } = useQuery({
    queryKey: ['journal', fromDate, toDate],
    queryFn: async () => {
      let url = '/journal'
      const params = new URLSearchParams()
      if (fromDate) params.append('from', fromDate)
      if (toDate) params.append('to', toDate)
      if (params.toString()) url += `?${params.toString()}`
      const { data } = await api.get(url)
      return data
    },
    enabled: !!user,
  })

  // Create Trade Mutation
  const createTradeMutation = useMutation({
    mutationFn: (newTrade) => api.post('/journal', newTrade),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal'])
      toast.success('Trade logged successfully!')
      setModalOpen(false)
      resetForm()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save trade')
    },
  })

  // Delete Trade Mutation
  const deleteTradeMutation = useMutation({
    mutationFn: (id) => api.delete(`/journal/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal'])
      toast.success('Trade deleted')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete trade')
    },
  })

  const resetForm = () => {
    setForm({
      symbol: '',
      tradeType: 'Long',
      entryDate: new Date().toISOString().slice(0, 16),
      exitDate: new Date().toISOString().slice(0, 16),
      entryPrice: '',
      exitPrice: '',
      quantity: '',
      imageUrl: '',
      entryReason: '',
      exitReason: '',
      lessonLearned: '',
    })
  }

  // Live P&L calculation in Modal
  const calculatedPnL = useMemo(() => {
    const entry = parseFloat(form.entryPrice)
    const exit = parseFloat(form.exitPrice)
    const qty = parseInt(form.quantity, 10)

    if (!entry || isNaN(entry) || !qty || isNaN(qty)) return null
    if (isNaN(exit)) return { status: 'OPEN', pnl: 0, pnlPercent: 0 }

    let pnl = 0
    if (form.tradeType === 'Long') {
      pnl = (exit - entry) * qty
    } else {
      pnl = (entry - exit) * qty
    }
    const invested = entry * qty
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0
    return { status: 'CLOSED', pnl: +pnl.toFixed(2), pnlPercent: +pnlPercent.toFixed(2) }
  }, [form.entryPrice, form.exitPrice, form.quantity, form.tradeType])

  const stats = journalData?.stats || {
    totalTrades: 0,
    totalPnl: 0,
    biggestWin: 0,
    biggestLoss: 0,
    avgWinner: 0,
    avgLoser: 0,
    riskReward: 0,
    avgPnl: 0,
  }

  const calendarMap = journalData?.calendarMap || {}
  const trades = journalData?.data || []

  // Filter trades by selected calendar day if user clicks a day
  const displayedTrades = useMemo(() => {
    if (!selectedDayKey) return trades
    return trades.filter((t) => {
      const d = new Date(t.entryDate).toISOString().split('T')[0]
      return d === selectedDayKey
    })
  }, [trades, selectedDayKey])

  // Month Calendar Calculations (Matches Screenshot 2)
  const currentMonthYear = useMemo(() => {
    return viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  }, [viewDate])

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    // Leading empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, key: `empty-${i}` })
    }
    // Days of month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0')
      const dayStr = String(d).padStart(2, '0')
      const dateKey = `${year}-${monthStr}-${dayStr}`
      const dayData = calendarMap[dateKey]

      days.push({
        dayNumber: d,
        dateKey,
        data: dayData || null,
      })
    }
    return days
  }, [viewDate, calendarMap])

  // Heatmap Weeks (Tradebook - 52 weeks or 12 months)
  const heatmapWeeks = useMemo(() => {
    const weeks = []
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
    // 365 days back
    const start = new Date(end)
    start.setDate(start.getDate() - 52 * 7)

    let current = new Date(start)
    // Align to Monday
    const dayOfWeek = (current.getDay() + 6) % 7
    current.setDate(current.getDate() - dayOfWeek)

    while (current <= end) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const dateKey = current.toISOString().split('T')[0]
        const data = calendarMap[dateKey]
        week.push({
          date: new Date(current),
          dateKey,
          data,
        })
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }, [viewDate, calendarMap])

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleSaveTrade = (e) => {
    e.preventDefault()
    if (!form.symbol.trim()) return toast.error('Please enter a symbol')
    if (!form.entryPrice) return toast.error('Please enter entry price')
    if (!form.quantity) return toast.error('Please enter quantity')

    createTradeMutation.mutate({
      ...form,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
      quantity: parseInt(form.quantity, 10),
    })
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20 bg-blue-500/10">
          <Calendar className="text-blue-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Trading Journal</h2>
        <p className="text-slate-400 max-w-md mb-6">
          Track your trades, analyze performance, visualize your P&L calendar, and build disciplined trading habits.
        </p>
        <Link to="/login" className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold">
          Log in to Access Journal
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in pb-16">
      {/* ─── Top Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mb-1">
            DESK
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            Trading Journal
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* New trade button */}
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
          >
            <Plus size={16} /> New trade
          </button>

          {/* How to use link */}
          <button
            onClick={() => setShowHowToUse((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1.5 rounded"
          >
            How to use <HelpCircle size={14} />
          </button>

          {/* Date range inputs */}
          <div className="flex items-center gap-2 bg-[#1e293b]/80 border border-slate-700/60 rounded-lg p-1 text-xs">
            <span className="text-slate-400 pl-2">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none text-xs"
            />
            <span className="text-slate-400">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none text-xs"
            />
            <button
              onClick={() => queryClient.invalidateQueries(['journal'])}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => { setFromDate(''); setToDate(''); setSelectedDayKey(null); }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors"
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* How to use information banner */}
      {showHowToUse && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 text-xs text-slate-300 leading-relaxed flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold text-blue-300">📖 How the Trading Journal Works:</p>
            <p>1. Click <strong className="text-white">+ New trade</strong> to record your buy (Long) or sell (Short) positions.</p>
            <p>2. Enter your entry and exit prices to automatically compute your P&L and percentage return.</p>
            <p>3. Use the <strong className="text-white">Tradebook Heatmap</strong> and <strong className="text-white">Monthly Calendar</strong> to see your winning streaks and red/green trading days.</p>
            <p>4. Review your <strong className="text-white">Risk-to-Reward</strong> and <strong className="text-white">Average Winner/Loser</strong> stats to sharpen your edge.</p>
          </div>
          <button onClick={() => setShowHowToUse(false)} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── Top Section: Tradebook Heatmap (Matches Screenshot 2) ─────────── */}
      <div className="card bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300">Tradebook</h2>
          {selectedDayKey && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filtering day: <strong className="text-blue-400">{selectedDayKey}</strong></span>
              <button
                onClick={() => setSelectedDayKey(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px]">
            <div className="flex gap-1.5 items-center">
              {/* Day Labels */}
              <div className="flex flex-col gap-1.5 text-[10px] text-slate-500 font-mono pr-2">
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
                <span>Su</span>
              </div>

              {/* Weeks */}
              <div className="flex gap-1">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((day, dIdx) => {
                      const pnl = day.data?.pnl || 0
                      const count = day.data?.count || 0
                      const isSelected = selectedDayKey === day.dateKey

                      let cellColor = '#151e32' // default no trade
                      if (count > 0) {
                        if (pnl > 5000) cellColor = '#15803d'
                        else if (pnl > 0) cellColor = '#22c55e'
                        else if (pnl < -2000) cellColor = '#b91c1c'
                        else cellColor = '#ef4444'
                      }

                      return (
                        <div
                          key={dIdx}
                          onClick={() => {
                            if (count > 0) setSelectedDayKey(isSelected ? null : day.dateKey)
                          }}
                          title={`${day.dateKey}: ${count} trades, P&L: ₹${pnl.toLocaleString('en-IN')}`}
                          className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer ${
                            isSelected ? 'ring-2 ring-white scale-110' : 'hover:scale-125 hover:z-10'
                          }`}
                          style={{ background: cellColor }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Months row */}
            <div className="flex justify-between text-[11px] text-slate-500 pt-3 pl-8 font-medium">
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sept</span>
              <span>Oct</span>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400 mt-2">
              <span>Max Loss</span>
              <div className="w-2.5 h-2.5 rounded-xs" style={{ background: '#b91c1c' }} />
              <div className="w-2.5 h-2.5 rounded-xs" style={{ background: '#ef4444' }} />
              <div className="w-2.5 h-2.5 rounded-xs" style={{ background: '#151e32' }} />
              <div className="w-2.5 h-2.5 rounded-xs" style={{ background: '#22c55e' }} />
              <div className="w-2.5 h-2.5 rounded-xs" style={{ background: '#15803d' }} />
              <span>Max Profit</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Middle Section: 2 Columns (Monthly Calendar & Statistics) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Calendar (Screenshot 2 left side) */}
        <div className="lg:col-span-5 card bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">
                {currentMonthYear}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day Header Mon - Sun */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 mb-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {monthDays.map((item, idx) => {
                if (item.empty) {
                  return <div key={idx} className="h-10" />
                }

                const hasTrade = !!item.data
                const pnl = item.data?.pnl || 0
                const isSelected = selectedDayKey === item.dateKey

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (hasTrade) setSelectedDayKey(isSelected ? null : item.dateKey)
                    }}
                    className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                      isSelected
                        ? 'ring-2 ring-blue-400 bg-blue-500/20'
                        : hasTrade
                        ? 'hover:bg-slate-800/80 cursor-pointer'
                        : 'text-slate-400 hover:bg-slate-800/30'
                    }`}
                  >
                    <span className="font-medium text-xs text-slate-300">{item.dayNumber}</span>
                    {hasTrade && (
                      <span
                        className={`text-[9px] font-bold ${
                          pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {pnl > 0 ? `+${pnl > 999 ? (pnl/1000).toFixed(1)+'k' : pnl}` : pnl < 0 ? `-${Math.abs(pnl) > 999 ? (Math.abs(pnl)/1000).toFixed(1)+'k' : Math.abs(pnl)}` : '0'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Click any traded day to view that day&apos;s trades</span>
            {selectedDayKey && (
              <button
                onClick={() => setSelectedDayKey(null)}
                className="text-blue-400 hover:underline font-medium"
              >
                Show all days
              </button>
            )}
          </div>
        </div>

        {/* Right: Statistics Grid (Screenshot 2 right side) */}
        <div className="lg:col-span-7 card bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Statistics</h3>
            <span className="text-xs text-slate-500">Live Computed Metrics</span>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-8 my-auto">
            {/* Total P&L */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Total P&amp;L</span>
                <Info size={12} className="text-slate-500" title="Sum of closed trade profits and losses" />
              </div>
              <div className={`text-xl font-bold font-mono ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.totalPnl >= 0 ? `+₹${stats.totalPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(stats.totalPnl).toLocaleString('en-IN')}`}
              </div>
            </div>

            {/* Total Trades */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Total Trades</span>
                <Info size={12} className="text-slate-500" title="Number of recorded trades" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100">
                {stats.totalTrades} <span className="text-xs text-slate-500 font-normal">({stats.winCount}W / {stats.lossCount}L)</span>
              </div>
            </div>

            {/* Biggest Win */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Biggest Win</span>
                <Info size={12} className="text-slate-500" title="Largest single profit trade" />
              </div>
              <div className="text-lg font-bold font-mono text-green-400">
                {stats.biggestWin > 0 ? `+₹${stats.biggestWin.toLocaleString('en-IN')}` : '—'}
              </div>
            </div>

            {/* Biggest Loss */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Biggest Loss</span>
                <Info size={12} className="text-slate-500" title="Largest single loss trade" />
              </div>
              <div className="text-lg font-bold font-mono text-red-400">
                {stats.biggestLoss < 0 ? `-₹${Math.abs(stats.biggestLoss).toLocaleString('en-IN')}` : '—'}
              </div>
            </div>

            {/* Avg. Winner */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Avg. Winner</span>
                <Info size={12} className="text-slate-500" title="Average profit per winning trade" />
              </div>
              <div className="text-lg font-bold font-mono text-green-400">
                {stats.avgWinner > 0 ? `+₹${stats.avgWinner.toLocaleString('en-IN')}` : '—'}
              </div>
            </div>

            {/* Avg. Loser */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Avg. Loser</span>
                <Info size={12} className="text-slate-500" title="Average loss per losing trade" />
              </div>
              <div className="text-lg font-bold font-mono text-red-400">
                {stats.avgLoser < 0 ? `-₹${Math.abs(stats.avgLoser).toLocaleString('en-IN')}` : '—'}
              </div>
            </div>

            {/* Risk to Reward */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Risk to Reward</span>
                <Info size={12} className="text-slate-500" title="Average Winner divided by Average Loser" />
              </div>
              <div className="text-lg font-bold font-mono text-blue-400">
                {stats.riskReward > 0 ? `1 : ${stats.riskReward}` : '—'}
              </div>
            </div>

            {/* Avg. P&L */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Avg. P&amp;L</span>
                <Info size={12} className="text-slate-500" title="Expected value per trade" />
              </div>
              <div className={`text-lg font-bold font-mono ${stats.avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.avgPnl >= 0 ? `+₹${stats.avgPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(stats.avgPnl).toLocaleString('en-IN')}`}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Win Rate: <strong className="text-slate-200">{stats.winRate}%</strong></span>
            <span>Open Positions: <strong className="text-blue-400">{stats.openTrades}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Trade Log & History ───────────────────────────── */}
      <div className="card bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-200">Trade History</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
              {displayedTrades.length} trades
            </span>
          </div>
          {selectedDayKey && (
            <span className="text-xs text-blue-400">Showing trades for {selectedDayKey}</span>
          )}
        </div>

        {displayedTrades.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Calendar size={32} className="mx-auto mb-2 opacity-40" />
            No trades recorded for this selection. Click <strong>+ New trade</strong> to record one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Entry Date</th>
                  <th className="py-3 px-3">Entry Price</th>
                  <th className="py-3 px-3">Exit Price</th>
                  <th className="py-3 px-3">Qty</th>
                  <th className="py-3 px-3">Net P&amp;L</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedTrades.map((trade) => {
                  const isClosed = trade.status === 'CLOSED'
                  const pnl = trade.pnl || 0
                  const isProfitable = pnl >= 0

                  return (
                    <tr key={trade._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-200 flex items-center gap-1.5">
                        {trade.symbol}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            trade.tradeType === 'Long'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {trade.tradeType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(trade.entryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        ₹{trade.entryPrice?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {trade.quantity}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {isClosed ? (
                          <span className={isProfitable ? 'text-green-400' : 'text-red-400'}>
                            {isProfitable ? '+' : ''}₹{pnl.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] font-normal opacity-80">
                              ({trade.pnlPercent > 0 ? '+' : ''}{trade.pnlPercent}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-500">Open</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isClosed ? 'bg-slate-800 text-slate-300' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete trade for ${trade.symbol}?`)) {
                              deleteTradeMutation.mutate(trade._id)
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete trade"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal: New Trade (Pixel-perfect match to Screenshot 1) ────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in">
          <div className="bg-[#0b1329] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">New trade</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTrade} className="space-y-4 pt-4">
              {/* Row 1: Symbol & Trade Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Symbol / Ticker
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Type or select symbol"
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    className="w-full bg-[#151e32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                  {/* Quick pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {SUGGESTED_SYMBOLS.slice(0, 4).map((sym) => (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => setForm({ ...form, symbol: sym })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Trade type
                  </label>
                  <div className="flex items-center gap-2 h-9">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, tradeType: 'Long' })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        form.tradeType === 'Long'
                          ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-400'
                          : 'bg-[#151e32] border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Long
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, tradeType: 'Short' })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        form.tradeType === 'Short'
                          ? 'bg-rose-950/80 border border-rose-500 text-rose-400'
                          : 'bg-[#151e32] border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Short
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Entry Date & Exit Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Entry date and time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.entryDate}
                    onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                    className="w-full bg-[#151e32] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Exit date and time (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.exitDate}
                    onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
                    className="w-full bg-[#151e32] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Entry Price & Exit Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Entry price
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    placeholder="0.00"
                    value={form.entryPrice}
                    onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                    className="w-full bg-[#151e32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Exit price
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="0.00 (leave blank if open)"
                    value={form.exitPrice}
                    onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
                    className="w-full bg-[#151e32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Quantity & Image Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full bg-[#151e32] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Upload image (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Chart image URL (optional)"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full bg-[#151e32] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">PNG, JPG, WebP, GIF - max 2 MB</span>
                </div>
              </div>

              {/* Real-time P&L Preview */}
              {calculatedPnL && calculatedPnL.status === 'CLOSED' && (
                <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  calculatedPnL.pnl >= 0 ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-red-950/30 border-red-500/30 text-red-400'
                }`}>
                  <span>Estimated Net P&amp;L:</span>
                  <span className="font-bold text-sm">
                    {calculatedPnL.pnl >= 0 ? '+' : ''}₹{calculatedPnL.pnl.toLocaleString('en-IN')} ({calculatedPnL.pnlPercent}%)
                  </span>
                </div>
              )}

              {/* Row 5: Entry Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Entry reason (optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Why did you enter this setup?"
                  value={form.entryReason}
                  onChange={(e) => setForm({ ...form, entryReason: e.target.value })}
                  className="w-full bg-[#151e32] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 6: Exit Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Exit reason (optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Target reached, stop loss hit, trailing stop triggered, etc."
                  value={form.exitReason}
                  onChange={(e) => setForm({ ...form, exitReason: e.target.value })}
                  className="w-full bg-[#151e32] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
              </div>

              {/* Row 7: Mistake made / Lesson learned */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Mistake made / lesson learned (optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Any behavioral or technical reflections from this trade?"
                  value={form.lessonLearned}
                  onChange={(e) => setForm({ ...form, lessonLearned: e.target.value })}
                  className="w-full bg-[#151e32] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTradeMutation.isPending}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  {createTradeMutation.isPending ? 'Saving...' : 'Save trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
