import { useState, useMemo, useEffect, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Calendar, TrendingUp, TrendingDown, HelpCircle, 
  Trash2, X, ChevronLeft, ChevronRight, Info, CheckCircle2, 
  Clock, ArrowUpRight, ArrowDownRight, Filter, AlertCircle,
  Target, LogOut, Lightbulb, Image, ChevronDown, ChevronUp,
  Eye, FileText, Download
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import JournalAnalyticsCharts from '../components/journal/JournalAnalyticsCharts'
import JournalExportModal from '../components/journal/JournalExportModal'
import { formatINR } from '../lib/journalAnalytics'

// Quick suggested symbols
const SUGGESTED_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 
  'BHARTIARTL', 'ITC', 'LT', 'MARUTI', 'TATASTEEL', 'BEL', 'HAL', 
  'NIFTY50', 'BANKNIFTY'
]

export default function TradingJournalPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  // Filters & State
  const [modalOpen, setModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [expandedTradeId, setExpandedTradeId] = useState(null)
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

  // Auto-open modal if symbol param is provided in URL
  useEffect(() => {
    const symbolParam = searchParams.get('symbol')?.toUpperCase()
    if (symbolParam) {
      setForm((prev) => ({ ...prev, symbol: symbolParam }))
      setModalOpen(true)
    }
  }, [searchParams])

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

  // Helper to format date key to human readable title (e.g., 'Thursday, 15 October 2026')
  const formatDayTitle = (dateKey) => {
    if (!dateKey) return ''
    try {
      const [year, month, day] = dateKey.split('-')
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateKey
    }
  }

  // Trades and summary data for the selected calendar day
  const selectedDayData = useMemo(() => {
    if (!selectedDayKey) return null
    return calendarMap[selectedDayKey] || null
  }, [calendarMap, selectedDayKey])

  const selectedDayTrades = useMemo(() => {
    if (!selectedDayKey) return []
    return trades.filter((t) => {
      const d = new Date(t.entryDate).toISOString().split('T')[0]
      return d === selectedDayKey
    })
  }, [trades, selectedDayKey])

  // Filter trades by selected calendar day if user clicks a day
  const displayedTrades = useMemo(() => {
    if (!selectedDayKey) return trades
    return selectedDayTrades
  }, [trades, selectedDayKey, selectedDayTrades])

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

  // Heatmap consistency and streak summary for right-side dashboard
  const heatmapStats = useMemo(() => {
    let greenDays = 0
    let redDays = 0
    let breakEvenDays = 0
    let totalPnl = 0
    let maxGreenDay = { pnl: 0, dateKey: null }
    let maxRedDay = { pnl: 0, dateKey: null }

    Object.entries(calendarMap || {}).forEach(([dateKey, d]) => {
      if (d && d.count > 0) {
        totalPnl += d.pnl || 0
        if (d.pnl > 0) {
          greenDays++
          if (d.pnl > maxGreenDay.pnl) maxGreenDay = { pnl: d.pnl, dateKey }
        } else if (d.pnl < 0) {
          redDays++
          if (d.pnl < maxRedDay.pnl) maxRedDay = { pnl: d.pnl, dateKey }
        } else {
          breakEvenDays++
        }
      }
    })

    const totalActiveDays = greenDays + redDays + breakEvenDays
    const dayWinRate = totalActiveDays > 0 ? Math.round((greenDays / totalActiveDays) * 100) : 0

    return {
      greenDays,
      redDays,
      breakEvenDays,
      totalActiveDays,
      dayWinRate,
      totalPnl,
      maxGreenDay,
      maxRedDay,
    }
  }, [calendarMap])

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

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* New trade button */}
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
          >
            <Plus size={16} /> New trade
          </button>

          {/* Download PDF button */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 shadow transition-all cursor-pointer"
            title="Download Trading Journal PDF with date range, profit/loss filters, and professional summary"
          >
            <Download size={15} className="text-blue-400" />
            <span>Download PDF</span>
          </button>

          {/* How to use link */}
          <button
            onClick={() => setShowHowToUse((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1.5 rounded"
          >
            How to use <HelpCircle size={14} />
          </button>

          {/* Date range inputs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 bg-[#1e293b]/80 border border-slate-700/60 rounded-lg p-1.5 sm:p-1 text-xs w-full sm:w-auto">
            <span className="text-slate-400 pl-1 sm:pl-2">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none text-xs flex-1 sm:flex-initial min-w-[110px]"
            />
            <span className="text-slate-400">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none text-xs flex-1 sm:flex-initial min-w-[110px]"
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

      {/* ─── Top Section: Tradebook Heatmap ─────────── */}
      <div className="card bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">Tradebook 52-Week P&amp;L Heatmap</h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium hidden sm:inline">
              Daily Trading Consistency
            </span>
          </div>
          {selectedDayKey && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filtering day: <strong className="text-blue-400">{selectedDayKey}</strong></span>
              <button
                onClick={() => setSelectedDayKey(null)}
                className="text-xs text-rose-300 hover:text-white px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center gap-1 font-semibold transition-all shadow-sm"
                title="1-Click: Remove day filter"
              >
                <span>Remove Filter ✕</span>
              </button>
            </div>
          )}
        </div>

        {/* 2-Column Responsive Layout: Heatmap (centered) + Consistency Sidebar */}
        <div className="flex flex-col xl:flex-row items-stretch gap-6">
          {/* Main Heatmap Container - centered */}
          <div className="flex-1 overflow-x-auto touch-scroll pb-2 flex flex-col justify-center">
            <div className="min-w-[760px] mx-auto">
              <div className="flex gap-1.5 items-center justify-center">
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
                              if (count > 0) {
                                setSelectedDayKey(day.dateKey)
                                setDayModalOpen(true)
                              }
                            }}
                            title={`${day.dateKey}: ${count} trades, P&L: ₹${pnl.toLocaleString('en-IN')} (Click to view ${count} trades & 3 reasons)`}
                            className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer ${
                              isSelected ? 'ring-2 ring-white scale-110 shadow-lg shadow-blue-500/50' : 'hover:scale-125 hover:z-10'
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
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500">Tap any colored square to inspect daily trades &amp; 3 setup reasons</span>
                <div className="flex items-center gap-1.5">
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

          {/* Right Side Feature: Consistency & Day Distribution Metrics */}
          <div className="xl:w-72 2xl:w-80 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">Consistency Matrix</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {heatmapStats.dayWinRate}% Green Days
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-[#0b1329] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Green Days</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {heatmapStats.greenDays}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0b1329] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Red Days</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {heatmapStats.redDays}
                  </span>
                </div>
              </div>

              {heatmapStats.maxGreenDay.dateKey && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 mb-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-300 font-medium">Best Day P&amp;L</span>
                    <span className="font-bold font-mono text-emerald-400">
                      +₹{heatmapStats.maxGreenDay.pnl.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {heatmapStats.maxGreenDay.dateKey}
                  </span>
                </div>
              )}

              {heatmapStats.maxRedDay.dateKey && (
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 mb-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-rose-300 font-medium">Worst Day P&amp;L</span>
                    <span className="font-bold font-mono text-rose-400">
                      ₹{heatmapStats.maxRedDay.pnl.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {heatmapStats.maxRedDay.dateKey}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Active Sessions: <strong className="text-white font-mono">{heatmapStats.totalActiveDays}</strong></span>
              {selectedDayKey && (
                <button
                  onClick={() => setSelectedDayKey(null)}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Reset Filter
                </button>
              )}
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
                      if (hasTrade) {
                        setSelectedDayKey(item.dateKey)
                        setDayModalOpen(true)
                      }
                    }}
                    title={hasTrade ? `${item.dateKey}: ${item.data.count} trades, P&L: ₹${pnl.toLocaleString('en-IN')} (Click to view ${item.data.count} trades & 3 reasons)` : ''}
                    className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                      isSelected
                        ? 'ring-2 ring-blue-400 bg-blue-500/20 shadow-md'
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
              <div
                className={`text-xl font-bold font-mono truncate ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                title={`Exact Total: ₹${stats.totalPnl?.toLocaleString('en-IN')}`}
              >
                {formatINR(stats.totalPnl, { compact: Math.abs(stats.totalPnl || 0) >= 100000, showSign: true })}
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
              <div
                className="text-lg font-bold font-mono text-green-400 truncate"
                title={`Exact: ₹${stats.biggestWin?.toLocaleString('en-IN')}`}
              >
                {stats.biggestWin > 0
                  ? formatINR(stats.biggestWin, { compact: Math.abs(stats.biggestWin) >= 100000, showSign: true })
                  : '—'}
              </div>
            </div>

            {/* Biggest Loss */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Biggest Loss</span>
                <Info size={12} className="text-slate-500" title="Largest single loss trade" />
              </div>
              <div
                className="text-lg font-bold font-mono text-red-400 truncate"
                title={`Exact: ₹${stats.biggestLoss?.toLocaleString('en-IN')}`}
              >
                {stats.biggestLoss < 0
                  ? formatINR(stats.biggestLoss, { compact: Math.abs(stats.biggestLoss) >= 100000, showSign: true })
                  : '—'}
              </div>
            </div>

            {/* Avg. Winner */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Avg. Winner</span>
                <Info size={12} className="text-slate-500" title="Average profit per winning trade" />
              </div>
              <div
                className="text-lg font-bold font-mono text-green-400 truncate"
                title={`Exact: ₹${stats.avgWinner?.toLocaleString('en-IN')}`}
              >
                {stats.avgWinner > 0
                  ? formatINR(stats.avgWinner, { compact: Math.abs(stats.avgWinner) >= 100000, showSign: true })
                  : '—'}
              </div>
            </div>

            {/* Avg. Loser */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span>Avg. Loser</span>
                <Info size={12} className="text-slate-500" title="Average loss per losing trade" />
              </div>
              <div
                className="text-lg font-bold font-mono text-red-400 truncate"
                title={`Exact: ₹${stats.avgLoser?.toLocaleString('en-IN')}`}
              >
                {stats.avgLoser < 0
                  ? formatINR(stats.avgLoser, { compact: Math.abs(stats.avgLoser) >= 100000, showSign: true })
                  : '—'}
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
              <div
                className={`text-lg font-bold font-mono truncate ${stats.avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                title={`Exact: ₹${stats.avgPnl?.toLocaleString('en-IN')}`}
              >
                {formatINR(stats.avgPnl, { compact: Math.abs(stats.avgPnl || 0) >= 100000, showSign: true })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Win Rate: <strong className="text-slate-200">{stats.winRate}%</strong></span>
            <span>Open Positions: <strong className="text-blue-400">{stats.openTrades}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── Data Visualization Graphs Section (Highest / Lowest Profit, Streaks, Equity Curve) ─── */}
      <JournalAnalyticsCharts trades={trades} serverAnalytics={journalData?.analytics} />


      {/* ─── Bottom Section: Trade Log & History ───────────────────────────── */}
      <div className="card bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Selected Day Banner */}
        {selectedDayKey && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-[#0b1329] border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                {displayedTrades.length}
              </div>
              <div>
                <span className="font-bold text-slate-100 block text-sm flex items-center gap-2">
                  <span>{formatDayTitle(selectedDayKey)}</span>
                  {selectedDayData && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedDayData.pnl >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                    }`}>
                      {selectedDayData.pnl >= 0 ? 'Profitable Day' : 'Loss Day'}
                    </span>
                  )}
                </span>
                <span className="text-slate-400">
                  <strong className="text-slate-200">{displayedTrades.length} trades done</strong> on this day
                  {selectedDayData && (
                    <>
                      {' — '}
                      Net P&amp;L:{' '}
                      <strong className={`font-mono ${selectedDayData.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINR(selectedDayData.pnl, { compact: false, showSign: true })}
                      </strong>
                      {' '}({selectedDayData.wins || 0}W / {selectedDayData.losses || 0}L)
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDayModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Eye size={13} />
                <span>Inspect 3 Reasons Breakdown</span>
              </button>
              <button
                onClick={() => setSelectedDayKey(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Show All Days
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-200">Trade History</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
              {displayedTrades.length} trades
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-300 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 transition-all cursor-pointer shadow-sm"
              title="Download filtered trades and audit summary as PDF"
            >
              <Download size={13} />
              <span>Export PDF Report</span>
            </button>

            {selectedDayKey && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-400 font-mono">
                  Filtered: {selectedDayKey}
                </span>
                <button
                  onClick={() => setSelectedDayKey(null)}
                  className="text-xs text-rose-300 hover:text-white px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/30 font-semibold transition-all"
                  title="1-Click: Remove day filter"
                >
                  Remove Filter ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {displayedTrades.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Calendar size={32} className="mx-auto mb-2 opacity-40" />
            No trades recorded for this selection. Click <strong>+ New trade</strong> to record one!
          </div>
        ) : (
          <>
            {/* Desktop Table View - Full Scape with Sticky Aligned Headers */}
            <div className="hidden md:block overflow-x-auto touch-scroll border border-slate-800/90 rounded-2xl bg-[#080d1a] shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-20 bg-[#0d162d] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] backdrop-blur-md">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-left">Symbol</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Type</th>
                    <th className="py-3.5 px-3 font-semibold text-left">Entry Date</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Entry Price</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Exit Price</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Qty</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Net P&amp;L</th>
                    <th className="py-3.5 px-3 font-semibold text-center">3 Setup Reasons</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedTrades.map((trade) => {
                    const isClosed = trade.status === 'CLOSED'
                    const pnl = trade.pnl || 0
                    const isProfitable = pnl >= 0
                    const isExpanded = expandedTradeId === trade._id
                    const hasReasons = !!(trade.entryReason?.trim() || trade.exitReason?.trim() || trade.lessonLearned?.trim())

                    return (
                      <Fragment key={trade._id}>
                        <tr className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-100 text-left">
                            {trade.symbol}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                trade.tradeType === 'Long'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {trade.tradeType}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px] text-left">
                            {new Date(trade.entryDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-200 text-right">
                            ₹{trade.entryPrice?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-200 text-right">
                            {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-300 text-center">
                            {trade.quantity}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-right">
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
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => setExpandedTradeId(isExpanded ? null : trade._id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                isExpanded
                                  ? 'bg-blue-600 text-white'
                                  : hasReasons
                                  ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-500 hover:text-slate-400'
                              }`}
                              title="Click to view Entry Reason, Exit Reason, and Lesson Learned"
                            >
                              <span>3 Reasons</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              isClosed ? 'bg-slate-800 text-slate-300' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}>
                              {trade.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
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

                        {/* Expandable 3 Reasons Row */}
                        {isExpanded && (
                          <tr className="bg-slate-900/90 border-b border-slate-800">
                            <td colSpan="10" className="p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* 1. Entry Reason */}
                                <div className="p-3 rounded-lg bg-slate-950/80 border border-blue-500/20 space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                    <Target size={12} /> 1. Entry Reason / Setup
                                  </span>
                                  <p className="text-xs text-slate-200 leading-relaxed">
                                    {trade.entryReason?.trim() || <span className="text-slate-500 italic">No entry reason specified</span>}
                                  </p>
                                </div>

                                {/* 2. Exit Reason */}
                                <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/20 space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <LogOut size={12} /> 2. Exit Reason / Trigger
                                  </span>
                                  <p className="text-xs text-slate-200 leading-relaxed">
                                    {trade.exitReason?.trim() || <span className="text-slate-500 italic">No exit reason specified</span>}
                                  </p>
                                </div>

                                {/* 3. Lesson Learned */}
                                <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/20 space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                    <Lightbulb size={12} /> 3. Mistake / Lesson Learned
                                  </span>
                                  <p className="text-xs text-slate-200 leading-relaxed">
                                    {trade.lessonLearned?.trim() || <span className="text-slate-500 italic">No lesson recorded</span>}
                                  </p>
                                </div>
                              </div>

                              {trade.imageUrl && (
                                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                    <Image size={12} className="text-indigo-400" /> Chart Screenshot:
                                  </span>
                                  <a
                                    href={trade.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    View attached chart image ↗
                                  </a>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3">
              {displayedTrades.map((trade) => {
                const isClosed = trade.status === 'CLOSED'
                const pnl = trade.pnl || 0
                const isProfitable = pnl >= 0
                const isExpanded = expandedTradeId === trade._id
                const hasReasons = !!(trade.entryReason?.trim() || trade.exitReason?.trim() || trade.lessonLearned?.trim())

                return (
                  <div key={trade._id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{trade.symbol}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            trade.tradeType === 'Long'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {trade.tradeType}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isClosed ? 'bg-slate-800 text-slate-300' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}>
                          {trade.status}
                        </span>
                      </div>
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
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Entry</span>
                        <span className="text-slate-200">₹{trade.entryPrice?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Exit</span>
                        <span className="text-slate-200">{trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Quantity</span>
                        <span className="text-slate-300">{trade.quantity}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Net P&L</span>
                        {isClosed ? (
                          <span className={`font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfitable ? '+' : ''}₹{pnl.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] font-normal opacity-80">
                              ({trade.pnlPercent > 0 ? '+' : ''}{trade.pnlPercent}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-500">Open</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>{new Date(trade.entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <button
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade._id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                          isExpanded
                            ? 'bg-blue-600 text-white'
                            : hasReasons
                            ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        <span>3 Reasons</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-blue-500/20 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                            <Target size={11} /> 1. Entry Reason
                          </span>
                          <p className="text-slate-200">{trade.entryReason?.trim() || <span className="text-slate-500 italic">None</span>}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/20 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <LogOut size={11} /> 2. Exit Reason
                          </span>
                          <p className="text-slate-200">{trade.exitReason?.trim() || <span className="text-slate-500 italic">None</span>}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-500/20 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <Lightbulb size={11} /> 3. Mistake / Lesson
                          </span>
                          <p className="text-slate-200">{trade.lessonLearned?.trim() || <span className="text-slate-500 italic">None</span>}</p>
                        </div>
                        {trade.imageUrl && (
                          <div className="pt-1">
                            <a href={trade.imageUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]">
                              <Image size={12} /> View Chart Image ↗
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── Modal: New Trade (Pixel-perfect match to Screenshot 1) ────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm fade-in">
          <div className="bg-[#0b1329] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-slate-200 relative">
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
      {/* ─── Day Details & 3 Reasons Modal ───────────────────────────────── */}
      {dayModalOpen && selectedDayKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 p-4 sm:p-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Calendar size={13} />
                  Day Trade Inspection
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
                  <span>{formatDayTitle(selectedDayKey)}</span>
                </h3>
              </div>
              <button
                onClick={() => setDayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Day Summary Stats Banner */}
            {selectedDayData && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block font-sans">Trades</span>
                  <span className="text-sm sm:text-base font-bold text-slate-100">
                    {selectedDayData.count} {selectedDayData.count === 1 ? 'Trade' : 'Trades'}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-2 sm:pl-3">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block font-sans">Net P&amp;L</span>
                  <span className={`text-sm sm:text-base font-bold ${selectedDayData.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatINR(selectedDayData.pnl, { compact: false, showSign: true })}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-2 sm:pl-3">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block font-sans">Win / Loss</span>
                  <span className="text-sm sm:text-base font-bold text-slate-200">
                    <span className="text-emerald-400">{selectedDayData.wins || 0}W</span>
                    {' / '}
                    <span className="text-rose-400">{selectedDayData.losses || 0}L</span>
                  </span>
                </div>
              </div>
            )}

            {/* List of Trades on this Day with 3 Reasons */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText size={14} className="text-blue-400" />
                <span>Executed Trades &amp; 3 Setup Reasons ({selectedDayTrades.length})</span>
              </h4>

              {selectedDayTrades.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No trades found for this day.
                </div>
              ) : (
                selectedDayTrades.map((trade, idx) => {
                  const isClosed = trade.status === 'CLOSED'
                  const pnl = trade.pnl || 0
                  const isProfitable = pnl >= 0

                  return (
                    <div
                      key={trade._id || idx}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-3.5 hover:border-slate-700 transition-all"
                    >
                      {/* Trade Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{trade.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.tradeType === 'Long'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {trade.tradeType}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Qty: {trade.quantity}
                          </span>
                        </div>

                        <div className="text-right font-mono text-xs">
                          {isClosed ? (
                            <span className={`font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatINR(pnl, { compact: false, showSign: true })}
                              {trade.pnlPercent ? ` (${trade.pnlPercent > 0 ? '+' : ''}${trade.pnlPercent}%)` : ''}
                            </span>
                          ) : (
                            <span className="text-blue-400 font-semibold">OPEN POSITION</span>
                          )}
                        </div>
                      </div>

                      {/* Prices & Execution Timing */}
                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
                        <span>Entry: ₹{trade.entryPrice?.toLocaleString('en-IN')}</span>
                        <span>Exit: {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : '—'}</span>
                        <span>
                          Time: {new Date(trade.entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* THE 3 REASONS DISPLAY */}
                      <div className="space-y-2.5 pt-1">
                        {/* 1. Entry Reason */}
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-blue-500/20 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                            <Target size={13} className="text-blue-400 shrink-0" />
                            <span>1. Entry Reason / Setup Strategy</span>
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed pl-5">
                            {trade.entryReason?.trim() || <span className="text-slate-500 italic">No entry reason specified for this trade.</span>}
                          </p>
                        </div>

                        {/* 2. Exit Reason */}
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-amber-500/20 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <LogOut size={13} className="text-amber-400 shrink-0" />
                            <span>2. Exit Reason / Trigger Condition</span>
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed pl-5">
                            {trade.exitReason?.trim() || <span className="text-slate-500 italic">No exit reason specified (e.g. still open or not entered).</span>}
                          </p>
                        </div>

                        {/* 3. Lesson Learned */}
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-emerald-500/20 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <Lightbulb size={13} className="text-emerald-400 shrink-0" />
                            <span>3. Mistake Made / Lesson Learned</span>
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed pl-5">
                            {trade.lessonLearned?.trim() || <span className="text-slate-500 italic">No post-trade reflection recorded.</span>}
                          </p>
                        </div>

                        {/* Chart Screenshot if available */}
                        {trade.imageUrl && (
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
                              <Image size={12} className="text-indigo-400" />
                              Attached Chart Screenshot:
                            </span>
                            <a
                              href={trade.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block rounded-lg overflow-hidden border border-slate-700 hover:border-blue-400 transition-colors group relative"
                            >
                              <img
                                src={trade.imageUrl}
                                alt={`${trade.symbol} chart`}
                                className="max-h-40 max-w-xs object-cover rounded-lg group-hover:opacity-90"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDayModalOpen(false)
                  setForm({
                    ...form,
                    entryDate: `${selectedDayKey}T09:30`,
                    exitDate: `${selectedDayKey}T15:15`,
                  })
                  setModalOpen(true)
                }}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium"
              >
                <Plus size={14} /> Log Another Trade on This Date
              </button>

              <button
                type="button"
                onClick={() => setDayModalOpen(false)}
                className="px-4 py-2 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      <JournalExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        trades={trades}
        user={user}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />
    </div>
  )
}

