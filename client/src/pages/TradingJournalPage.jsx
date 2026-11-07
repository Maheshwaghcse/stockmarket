import { useState, useMemo, useEffect, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Calendar, TrendingUp, TrendingDown, HelpCircle,
  Trash2, X, ChevronLeft, ChevronRight, Info, CheckCircle2,
  Clock, ArrowUpRight, ArrowDownRight, Filter, AlertCircle,
  Target, LogOut, Lightbulb, Image, ChevronDown, ChevronUp,
  Eye, FileText, Download, LayoutGrid, CalendarDays, Tag, Sparkles,
  Smile, Layers, ShieldAlert, Check
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import JournalAnalyticsCharts from '../components/journal/JournalAnalyticsCharts'
import JournalExportModal from '../components/journal/JournalExportModal'
import TradeJournalTemplate, {
  BEFORE_TRADE_EMOTIONS,
  AFTER_TRADE_EMOTIONS,
  STRATEGY_OPTIONS,
  extractBeforeEmotion,
  extractAfterEmotion,
} from '../components/journal/TradeJournalTemplate'
import TradeViewerModal from '../components/journal/TradeViewerModal'
import { formatINR } from '../lib/journalAnalytics'

// Helper to look up Marathi name & description for an emotion
const getEmotionMeta = (emotionName, type = 'before') => {
  if (!emotionName) return null
  const list = type === 'before' ? BEFORE_TRADE_EMOTIONS : AFTER_TRADE_EMOTIONS
  const str = typeof emotionName === 'string' ? emotionName : String(emotionName)
  const found = list.find((e) => e.name.toLowerCase() === str.toLowerCase().trim())
  if (found) return found
  return { name: str, marathi: '', desc: '' }
}

// Quick suggested symbols
const SUGGESTED_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN',
  'BHARTIARTL', 'ITC', 'LT', 'MARUTI', 'TATASTEEL', 'BEL', 'HAL',
  'NIFTY50', 'BANKNIFTY'
]

// Helper to get local date time formatted as YYYY-MM-DDTHH:mm
const getLocalDateTimeString = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TradingJournalPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  // Filters & State
  const [modalOpen, setModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [viewerModalOpen, setViewerModalOpen] = useState(false)
  const [viewerTradeIndex, setViewerTradeIndex] = useState(0)
  const [expandedTradeId, setExpandedTradeId] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedDayKey, setSelectedDayKey] = useState(null)
  const [showHowToUse, setShowHowToUse] = useState(false)
  const [heatmapTimeSlicer, setHeatmapTimeSlicer] = useState('1Y') // '7D' | '1M' | '6M' | '1Y' | 'ALL'
  const [desktopHeatmapView, setDesktopHeatmapView] = useState('matrix') // 'matrix' | 'cards'
  const [tradeOutcomeFilter, setTradeOutcomeFilter] = useState('ALL') // 'ALL' | 'WIN' | 'LOSS' | 'OPEN'
  const [tradeStrategyFilter, setTradeStrategyFilter] = useState('ALL')
  const [tradeEmotionFilter, setTradeEmotionFilter] = useState('ALL')
  const [tradeReasonFilter, setTradeReasonFilter] = useState('ALL')
  const [adjustingEmotion, setAdjustingEmotion] = useState(null) // { tradeId, type: 'before' | 'after' }

  // Current calendar month navigation (defaults to today's date)
  const [viewDate, setViewDate] = useState(new Date())

  // Form State for New Trade Modal (default lotSize & quantity blank)
  const [form, setForm] = useState({
    symbol: '',
    tradeType: 'Long',
    entryDate: getLocalDateTimeString(),
    exitDate: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    lotSize: '',
    position: 'Intraday',
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    instrumentType: 'Equity',
    optionType: 'CALL',
    strategy: '',
    beforeTradeEmotions: '',
    afterTradeEmotions: '',
    stopLoss: '',
    takeProfit: '',
    riskReward: '',
    imageUrl: '',
    entryReason: '',
    exitReason: '',
    mistakes: '',
    assumptions: '',
    customSections: [],
    disciplined: 'Y',
    followedRules: 'Y',
    rating: 5,
    chartNotes: '',
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

  // Update Trade Mutation
  const updateTradeMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/journal/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['journal'])
      toast.success('Trade updated successfully!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update trade')
    },
  })

  // Quick 1-click Emotion Adjustment directly from Trade History Details
  const handleQuickUpdateEmotion = async (tradeId, type, emotionName) => {
    try {
      const targetTrade = trades.find((t) => t._id === tradeId)
      if (!targetTrade) return

      const otherEmotion =
        type === 'before'
          ? extractAfterEmotion(targetTrade)
          : extractBeforeEmotion(targetTrade)

      const payload = {
        ...targetTrade,
        ...(type === 'before'
          ? {
              beforeTradeEmotions: emotionName,
              beforeEmotions: emotionName,
              beforeTradeEmotion: emotionName,
              beforeEmotion: emotionName,
              emotions: { before: emotionName, after: otherEmotion },
              tradeAnalysis: { emotions: { before: emotionName, after: otherEmotion } },
            }
          : {
              afterTradeEmotions: emotionName,
              afterEmotions: emotionName,
              afterTradeEmotion: emotionName,
              afterEmotion: emotionName,
              emotions: { before: otherEmotion, after: emotionName },
              tradeAnalysis: { emotions: { before: otherEmotion, after: emotionName } },
            }),
      }

      await updateTradeMutation.mutateAsync({ id: tradeId, data: payload })
      setAdjustingEmotion(null)
      toast.success(`${type === 'before' ? 'Before' : 'After'} trade emotion set to "${emotionName}"!`)
    } catch (err) {
      console.error('Failed to adjust emotion:', err)
      toast.error('Failed to adjust emotion. Please try again.')
    }
  }

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
      entryDate: getLocalDateTimeString(),
      exitDate: '',
      entryPrice: '',
      exitPrice: '',
      quantity: '',
      lotSize: '',
      position: 'Intraday',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      instrumentType: 'Equity',
      optionType: 'CALL',
      strategy: '',
      beforeTradeEmotions: '',
      afterTradeEmotions: '',
      stopLoss: '',
      takeProfit: '',
      riskReward: '',
      imageUrl: '',
      entryReason: '',
      exitReason: '',
      mistakes: '',
      assumptions: '',
      customSections: [],
      disciplined: 'Y',
      followedRules: 'Y',
      rating: 5,
      chartNotes: '',
      lessonLearned: '',
    })
  }

  const handleFormFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Live P&L calculation in Modal
  const calculatedPnL = useMemo(() => {
    const entry = parseFloat(form.entryPrice)
    const exit = parseFloat(form.exitPrice)
    const qty = parseInt(form.lotSize !== undefined && form.lotSize !== '' ? form.lotSize : form.quantity, 10) || 0

    if (!entry || isNaN(entry) || !qty || qty <= 0) return null
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
  }, [form.entryPrice, form.exitPrice, form.quantity, form.lotSize, form.tradeType])

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

  // Available strategies for slicer (10 default strategies + any custom logged in trades)
  const availableStrategies = useMemo(() => {
    const set = new Set(STRATEGY_OPTIONS)
    trades.forEach((t) => {
      if (t.strategy?.trim()) set.add(t.strategy.trim())
    })
    return ['ALL', ...Array.from(set)]
  }, [trades])

  // Available emotions for slicer (from trades or default popular emotions)
  const availableEmotions = useMemo(() => {
    const set = new Set()
    trades.forEach((t) => {
      const b = extractBeforeEmotion(t)
      const a = extractAfterEmotion(t)
      if (b) b.split(',').forEach((s) => s.trim() && set.add(s.trim()))
      if (a) a.split(',').forEach((s) => s.trim() && set.add(s.trim()))
    })
    if (set.size === 0) {
      ;['Calm', 'Confident', 'FOMO', 'Satisfied', 'Regret', 'Frustrated'].forEach((e) => set.add(e))
    }
    return ['ALL', ...Array.from(set)]
  }, [trades])

  // Filter trades by selected calendar day and slicer filters (Outcome, Strategy, Emotion)
  const displayedTrades = useMemo(() => {
    let list = selectedDayKey ? selectedDayTrades : trades
    if (tradeOutcomeFilter === 'WIN') {
      list = list.filter((t) => t.status === 'CLOSED' && (t.pnl || 0) > 0)
    } else if (tradeOutcomeFilter === 'LOSS') {
      list = list.filter((t) => t.status === 'CLOSED' && (t.pnl || 0) < 0)
    } else if (tradeOutcomeFilter === 'OPEN') {
      list = list.filter((t) => t.status === 'OPEN')
    }

    if (tradeStrategyFilter && tradeStrategyFilter !== 'ALL') {
      list = list.filter((t) => t.strategy && t.strategy.toLowerCase() === tradeStrategyFilter.toLowerCase())
    }

    if (tradeEmotionFilter && tradeEmotionFilter !== 'ALL') {
      const lower = tradeEmotionFilter.toLowerCase()
      list = list.filter((t) => {
        const b = extractBeforeEmotion(t).toLowerCase()
        const a = extractAfterEmotion(t).toLowerCase()
        return b.includes(lower) || a.includes(lower)
      })
    }

    if (tradeReasonFilter && tradeReasonFilter !== 'ALL') {
      const lower = tradeReasonFilter.toLowerCase()
      list = list.filter((t) =>
        t.entryReason?.toLowerCase().includes(lower) ||
        t.mistakes?.toLowerCase().includes(lower) ||
        t.assumptions?.toLowerCase().includes(lower) ||
        t.strategy?.toLowerCase().includes(lower) ||
        t.exitReason?.toLowerCase().includes(lower)
      )
    }
    return list
  }, [trades, selectedDayKey, selectedDayTrades, tradeOutcomeFilter, tradeStrategyFilter, tradeEmotionFilter, tradeReasonFilter])

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

  // Heatmap Weeks (Tradebook - slicer: 7D, 1M, 6M, 1Y, ALL)
  const heatmapWeeks = useMemo(() => {
    let weeksCount = 52
    if (heatmapTimeSlicer === '7D') weeksCount = 2
    else if (heatmapTimeSlicer === '1M') weeksCount = 5
    else if (heatmapTimeSlicer === '6M') weeksCount = 26
    else if (heatmapTimeSlicer === '1Y') weeksCount = 52
    else weeksCount = 52

    const weeks = []
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
    const start = new Date(end)
    start.setDate(start.getDate() - weeksCount * 7)

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
  }, [viewDate, calendarMap, heatmapTimeSlicer])

  // Traded days list (filtered by heatmapTimeSlicer) - for Mobile view without horizontal scrolling
  const tradedDaysList = useMemo(() => {
    let daysCutoff = 365
    if (heatmapTimeSlicer === '7D') daysCutoff = 7
    else if (heatmapTimeSlicer === '1M') daysCutoff = 30
    else if (heatmapTimeSlicer === '6M') daysCutoff = 180
    else if (heatmapTimeSlicer === '1Y') daysCutoff = 365
    else daysCutoff = 99999

    const now = new Date()
    const cutoffDate = new Date()
    cutoffDate.setDate(now.getDate() - daysCutoff)

    return Object.entries(calendarMap || {})
      .filter(([dateKey, d]) => {
        if (!d || d.count === 0) return false
        if (daysCutoff < 99999) {
          const dayDate = new Date(dateKey)
          return dayDate >= cutoffDate
        }
        return true
      })
      .map(([dateKey, d]) => ({
        dateKey,
        data: d,
        pnl: d.pnl || 0,
        count: d.count || 0,
        wins: d.wins || 0,
        losses: d.losses || 0,
      }))
      .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey))
  }, [calendarMap, heatmapTimeSlicer])

  // Dynamic month / date labels computed directly from visible heatmapWeeks
  const heatmapMonthLabels = useMemo(() => {
    if (!heatmapWeeks || heatmapWeeks.length === 0) return []
    if (heatmapTimeSlicer === '7D' || heatmapTimeSlicer === '1M') {
      return heatmapWeeks.map((week) => {
        const firstDay = week[0].date
        return {
          label: firstDay.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        }
      })
    }

    const labels = []
    let lastMonth = -1
    heatmapWeeks.forEach((week) => {
      const m = week[0].date.getMonth()
      if (m !== lastMonth) {
        lastMonth = m
        labels.push({
          label: week[0].date.toLocaleDateString('en-IN', { month: 'short' }),
        })
      }
    })
    return labels
  }, [heatmapWeeks, heatmapTimeSlicer])

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

  const handleDayClick = (dateKey) => {
    setSelectedDayKey(dateKey)
    if (trades && trades.length > 0) {
      // Find trade matching that date (entryDate starts with dateKey)
      const matchIdx = trades.findIndex((t) => {
        if (!t?.entryDate) return false
        const d = new Date(t.entryDate).toISOString().split('T')[0]
        return d === dateKey
      })

      if (matchIdx !== -1) {
        setViewerTradeIndex(matchIdx)
      } else {
        // Find closest trade by entry date
        let closestIdx = 0
        let minDiff = Infinity
        const targetTime = new Date(dateKey).getTime()
        trades.forEach((t, idx) => {
          if (t?.entryDate) {
            const tradeTime = new Date(t.entryDate).getTime()
            const diff = Math.abs(tradeTime - targetTime)
            if (diff < minDiff) {
              minDiff = diff
              closestIdx = idx
            }
          }
        })
        setViewerTradeIndex(closestIdx)
      }
      setViewerModalOpen(true)
    } else {
      // No trades in journal yet: open new trade modal pre-filled with this date
      handleOpenNewTradeForDate(dateKey)
    }
  }

  const handleOpenNewTradeForDate = (dateKey) => {
    const dateStr = dateKey || new Date().toISOString().split('T')[0]
    setForm((prev) => ({
      ...prev,
      entryDate: `${dateStr}T09:30`,
      exitDate: `${dateStr}T15:15`,
    }))
    setModalOpen(true)
  }

  const handleSaveTrade = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!form.symbol?.trim()) return toast.error('Please enter a symbol / ticker')
    if (!form.entryPrice) return toast.error('Please enter entry price')
    const qty = parseInt(form.lotSize !== undefined && form.lotSize !== '' ? form.lotSize : form.quantity, 10)
    if (isNaN(qty) || qty <= 0) return toast.error('Please enter quantity / lot size (must be greater than 0)')

    const bEmotion =
      form.beforeTradeEmotions ||
      form.beforeEmotions ||
      form.beforeTradeEmotion ||
      form.beforeEmotion ||
      form.emotions?.before ||
      ''
    const aEmotion =
      form.afterTradeEmotions ||
      form.afterEmotions ||
      form.afterTradeEmotion ||
      form.afterEmotion ||
      form.emotions?.after ||
      ''

    createTradeMutation.mutate({
      ...form,
      symbol: form.symbol.toUpperCase().trim(),
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: form.exitPrice !== undefined && form.exitPrice !== '' && form.exitPrice !== null ? parseFloat(form.exitPrice) : null,
      stopLoss: form.stopLoss !== undefined && form.stopLoss !== '' && form.stopLoss !== null ? parseFloat(form.stopLoss) : null,
      takeProfit: form.takeProfit !== undefined && form.takeProfit !== '' && form.takeProfit !== null ? parseFloat(form.takeProfit) : null,
      quantity: qty,
      lotSize: qty,
      rating: form.rating ? parseInt(form.rating, 10) : 5,
      beforeTradeEmotions: bEmotion,
      beforeEmotions: bEmotion,
      beforeTradeEmotion: bEmotion,
      beforeEmotion: bEmotion,
      afterTradeEmotions: aEmotion,
      afterEmotions: aEmotion,
      afterTradeEmotion: aEmotion,
      afterEmotion: aEmotion,
      emotions: {
        before: bEmotion,
        after: aEmotion,
      },
      tradeAnalysis: {
        emotions: {
          before: bEmotion,
          after: aEmotion,
        },
      },
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-slate-200">Tradebook P&amp;L Heatmap</h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium hidden sm:inline">
              Daily Trading Consistency
            </span>
          </div>

          {/* Desktop View Switcher: Matrix Heatmap vs Only Traded Days */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDesktopHeatmapView('matrix')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${desktopHeatmapView === 'matrix'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              title="View full calendar heatmap matrix"
            >
              <LayoutGrid size={13} />
              <span>Matrix View</span>
            </button>
            <button
              type="button"
              onClick={() => setDesktopHeatmapView('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${desktopHeatmapView === 'cards'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              title="View only active traded days without blank gaps"
            >
              <CalendarDays size={13} />
              <span>Traded Days ({tradedDaysList.length})</span>
            </button>
          </div>

          {/* Heatmap Slicer: 7D, 1M, 6M, 1Y, All */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase tracking-wider hidden sm:inline">
              Slicer:
            </span>
            {[
              { id: '7D', label: '7D' },
              { id: '1M', label: '1M' },
              { id: '6M', label: '6M' },
              { id: '1Y', label: '1Y' },
              { id: 'ALL', label: 'All' },
            ].map((sl) => (
              <button
                key={sl.id}
                type="button"
                onClick={() => setHeatmapTimeSlicer(sl.id)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${heatmapTimeSlicer === sl.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                {sl.label}
              </button>
            ))}
          </div>

          {selectedDayKey && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filtering day: <strong className="text-blue-400">{selectedDayKey}</strong></span>
              <button
                onClick={() => setSelectedDayKey(null)}
                className="text-xs text-rose-300 hover:text-white px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center gap-1 font-semibold transition-all shadow-sm cursor-pointer"
                title="1-Click: Remove day filter"
              >
                <span>Remove Filter ✕</span>
              </button>
            </div>
          )}
        </div>

        {/* 2-Column Responsive Layout: Heatmap (centered) + Consistency Sidebar */}
        <div className="flex flex-col xl:flex-row items-stretch gap-6">

          {/* ── MOBILE VIEW: Fit without scrolling right, only show traded days, no blank spaces ── */}
          <div className="md:hidden flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-200">
                Active Traded Days ({tradedDaysList.length})
              </span>
              <span className="text-[11px] text-blue-400 font-mono font-medium">
                {heatmapTimeSlicer === '7D'
                  ? 'Last 7 Days'
                  : heatmapTimeSlicer === '1M'
                    ? 'Last 30 Days'
                    : heatmapTimeSlicer === '6M'
                      ? 'Last 6 Months'
                      : heatmapTimeSlicer === '1Y'
                        ? 'Last 1 Year'
                        : 'All Time'}
              </span>
            </div>

            {tradedDaysList.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <Calendar size={28} className="mx-auto text-slate-500 opacity-60" />
                <p className="text-xs text-slate-400">
                  No trades recorded during the selected {heatmapTimeSlicer} window.
                </p>
                <button
                  type="button"
                  onClick={() => setHeatmapTimeSlicer('ALL')}
                  className="text-xs text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Switch slicer to All Time
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {tradedDaysList.map((day) => {
                  const isProfitable = day.pnl >= 0
                  const isSelected = selectedDayKey === day.dateKey
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => handleDayClick(day.dateKey)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${isSelected
                        ? 'ring-2 ring-blue-400 bg-blue-950/60 border-blue-500 shadow-lg'
                        : isProfitable
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30'
                          : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-500/30'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white font-mono">
                          {new Date(day.dateKey).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold font-mono">
                          {day.count} {day.count === 1 ? 'trade' : 'trades'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-slate-800/60">
                        <span
                          className={`text-xs sm:text-sm font-extrabold font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                          {formatINR(day.pnl, { compact: false, showSign: true })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {day.wins}W/{day.losses}L
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-500 text-center pt-1">
              Tap any day card to inspect in trade template with Prev / Next
            </p>
          </div>

          {/* ── DESKTOP VIEW: Full Calendar Matrix Heatmap OR Traded Days Only (Zero Blank Days) ── */}
          {desktopHeatmapView === 'cards' ? (
            <div className="hidden md:flex flex-1 flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                <span className="font-bold text-slate-200">
                  Active Traded Days ({tradedDaysList.length}) — Only Traded Days (Zero Blank Days)
                </span>
                <span className="text-[11px] text-blue-400 font-mono font-medium">
                  {heatmapTimeSlicer === '7D'
                    ? 'Last 7 Days'
                    : heatmapTimeSlicer === '1M'
                      ? 'Last 30 Days'
                      : heatmapTimeSlicer === '6M'
                        ? 'Last 6 Months'
                        : heatmapTimeSlicer === '1Y'
                          ? 'Last 1 Year'
                          : 'All Time'}
                </span>
              </div>

              {tradedDaysList.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2 my-auto">
                  <Calendar size={32} className="mx-auto text-slate-500 opacity-60" />
                  <p className="text-xs text-slate-400">
                    No trades recorded during the selected {heatmapTimeSlicer} window.
                  </p>
                  <button
                    type="button"
                    onClick={() => setHeatmapTimeSlicer('ALL')}
                    className="text-xs text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Switch slicer to All Time
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
                  {tradedDaysList.map((day) => {
                    const isProfitable = day.pnl >= 0
                    const isSelected = selectedDayKey === day.dateKey
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => handleDayClick(day.dateKey)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${isSelected
                          ? 'ring-2 ring-blue-400 bg-blue-950/70 border-blue-500 shadow-lg'
                          : isProfitable
                            ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30'
                            : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-500/30'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-white font-mono">
                            {new Date(day.dateKey).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold font-mono">
                            {day.count} {day.count === 1 ? 'trade' : 'trades'}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-1 pt-1.5 border-t border-slate-800/60">
                          <span
                            className={`text-sm font-extrabold font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {formatINR(day.pnl, { compact: false, showSign: true })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {day.wins}W / {day.losses}L
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              <p className="text-[10px] text-slate-500 text-center pt-0.5">
                Click any day card to inspect in trade template with Prev / Next
              </p>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 overflow-x-auto touch-scroll pb-2 flex-col justify-center">
              <div className={heatmapWeeks.length < 10 ? 'w-auto max-w-fit mx-auto' : 'min-w-[760px] mx-auto'}>
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
                              onClick={() => handleDayClick(day.dateKey)}
                              title={`${day.dateKey}: ${count} trades, P&L: ₹${pnl.toLocaleString('en-IN')} (Click to inspect trade template with Prev/Next)`}
                              className={`${heatmapWeeks.length <= 5 ? 'w-5 h-5 rounded-md' : 'w-3.5 h-3.5 rounded-sm'
                                } transition-all cursor-pointer ${isSelected ? 'ring-2 ring-white scale-110 shadow-lg shadow-blue-500/50' : 'hover:scale-125 hover:z-10'
                                }`}
                              style={{ background: cellColor }}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Months / Dates row */}
                <div className="flex justify-between text-[11px] text-slate-400 pt-3 pl-8 font-mono">
                  {heatmapMonthLabels.map((item, idx) => (
                    <span key={idx} className="hover:text-blue-400 transition-colors">
                      {item.label}
                    </span>
                  ))}
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500">Tap any colored square to inspect daily trades &amp; journal details</span>
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
          )}

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
                    onClick={() => handleDayClick(item.dateKey)}
                    title={
                      hasTrade
                        ? `${item.dateKey}: ${item.data.count} trades, P&L: ₹${pnl.toLocaleString('en-IN')} (Click to view trade template with Prev/Next)`
                        : `${item.dateKey}: Click to browse trades or log trade`
                    }
                    className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all relative cursor-pointer ${isSelected
                      ? 'ring-2 ring-blue-400 bg-blue-500/20 shadow-md'
                      : hasTrade
                        ? 'hover:bg-slate-800/80 bg-slate-800/20'
                        : 'text-slate-400 hover:bg-slate-800/40'
                      }`}
                  >
                    <span className="font-medium text-xs text-slate-300">{item.dayNumber}</span>
                    {hasTrade && (
                      <span
                        className={`text-[9px] font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                      >
                        {pnl > 0 ? `+${pnl > 999 ? (pnl / 1000).toFixed(1) + 'k' : pnl}` : pnl < 0 ? `-${Math.abs(pnl) > 999 ? (Math.abs(pnl) / 1000).toFixed(1) + 'k' : Math.abs(pnl)}` : '0'}
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedDayData.pnl >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
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
                onClick={() => handleDayClick(selectedDayKey)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                title="View trade journal template with Prev/Next buttons"
              >
                <Eye size={13} />
                <span>View Trade Template (Prev / Next)</span>
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

        {/* Trade History Slicers: Outcome, Strategy & Emotions (Desktop & Mobile) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
          {/* Row 1: Outcome Slicers & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Outcome:
              </span>
              {[
                { id: 'ALL', label: 'All', count: (selectedDayKey ? selectedDayTrades : trades).length },
                {
                  id: 'WIN',
                  label: '🟢 Wins',
                  count: (selectedDayKey ? selectedDayTrades : trades).filter(
                    (t) => t.status === 'CLOSED' && (t.pnl || 0) > 0
                  ).length,
                },
                {
                  id: 'LOSS',
                  label: '🔴 Losses',
                  count: (selectedDayKey ? selectedDayTrades : trades).filter(
                    (t) => t.status === 'CLOSED' && (t.pnl || 0) < 0
                  ).length,
                },
                {
                  id: 'OPEN',
                  label: '⏳ Open',
                  count: (selectedDayKey ? selectedDayTrades : trades).filter(
                    (t) => t.status === 'OPEN'
                  ).length,
                },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setTradeOutcomeFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    tradeOutcomeFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {(tradeOutcomeFilter !== 'ALL' ||
              tradeStrategyFilter !== 'ALL' ||
              tradeEmotionFilter !== 'ALL' ||
              tradeReasonFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setTradeOutcomeFilter('ALL')
                  setTradeStrategyFilter('ALL')
                  setTradeEmotionFilter('ALL')
                  setTradeReasonFilter('ALL')
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-all hover:bg-rose-500/20"
              >
                <span>Reset All Slicers ✕</span>
              </button>
            )}
          </div>

          {/* Row 2: Strategy Slicers (Latest Journal Strategies) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-2 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              Strategy:
            </span>
            {availableStrategies.map((strat) => {
              const active = tradeStrategyFilter === strat
              return (
                <button
                  key={strat}
                  type="button"
                  onClick={() => setTradeStrategyFilter(strat)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30 ring-1 ring-amber-400'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {strat === 'ALL' ? 'All Strategies' : strat}
                </button>
              )
            })}
          </div>

          {/* Row 3: Emotion Slicers (Latest Journal Emotions: Before / After) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1.5 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
              <Smile size={12} className="text-cyan-400" />
              Emotions:
            </span>
            {availableEmotions.map((em) => {
              const active = tradeEmotionFilter === em
              return (
                <button
                  key={em}
                  type="button"
                  onClick={() => setTradeEmotionFilter(em)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {em === 'ALL' ? 'All Emotions' : em}
                </button>
              )
            })}
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
                    <th className="py-3.5 px-3 font-semibold text-left">Strategy</th>
                    <th className="py-3.5 px-3 font-semibold text-left">Entry Date</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Entry Price</th>
                    <th className="py-3.5 px-3 font-semibold text-right">Exit Price</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Qty</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Net P&amp;L</th>
                    <th className="py-3.5 px-3 font-semibold text-left">Emotions (B / A)</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Journal Details</th>
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

                    const beforeEmotion = extractBeforeEmotion(trade)
                    const afterEmotion = extractAfterEmotion(trade)
                    const beforeMeta = getEmotionMeta(beforeEmotion, 'before')
                    const afterMeta = getEmotionMeta(afterEmotion, 'after')

                    const hasJournalDetails = !!(
                      trade.strategy?.trim() ||
                      beforeEmotion.trim() ||
                      afterEmotion.trim() ||
                      trade.exitReason?.trim() ||
                      trade.mistakes?.trim() ||
                      trade.lessonLearned?.trim() ||
                      (Array.isArray(trade.customSections) && trade.customSections.length > 0) ||
                      trade.imageUrl?.trim()
                    )

                    return (
                      <Fragment key={trade._id}>
                        <tr className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-100 text-left">
                            <div className="flex items-center gap-1.5">
                              <span>{trade.symbol}</span>
                              {(trade.instrumentType === 'Options' || trade.instrumentType === 'Option') && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    String(trade.optionType).toUpperCase() === 'PUT'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {String(trade.optionType).toUpperCase() === 'PUT' ? 'PUT' : 'CALL'}
                                </span>
                              )}
                            </div>
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
                          <td className="py-3.5 px-3 text-left">
                            {trade.strategy ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                <Sparkles size={10} className="text-amber-400" />
                                <span className="truncate max-w-[130px]">{trade.strategy}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">—</span>
                            )}
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
                          <td className="py-3.5 px-3 text-left">
                            <div className="flex flex-col gap-1 items-start">
                              {beforeEmotion ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 border border-blue-500/30 text-blue-300"
                                  title={`Before Trade: ${beforeEmotion}${beforeMeta?.marathi ? ` (${beforeMeta.marathi})` : ''}`}
                                >
                                  <span className="text-[9px] font-bold text-blue-400 uppercase">B:</span>
                                  <span className="font-semibold">{beforeEmotion}</span>
                                </span>
                              ) : null}
                              {afterEmotion ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300"
                                  title={`After Trade: ${afterEmotion}${afterMeta?.marathi ? ` (${afterMeta.marathi})` : ''}`}
                                >
                                  <span className="text-[9px] font-bold text-purple-400 uppercase">A:</span>
                                  <span className="font-semibold">{afterEmotion}</span>
                                </span>
                              ) : null}
                              {!beforeEmotion && !afterEmotion && (
                                <span className="text-slate-600 text-[11px]">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => setExpandedTradeId(isExpanded ? null : trade._id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                isExpanded
                                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-1 ring-blue-400'
                                  : hasJournalDetails
                                  ? 'bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700'
                                  : 'bg-slate-800/60 text-slate-500 hover:text-slate-400'
                              }`}
                              title="Click to view Strategy, Emotions, Exit Reason, Mistakes, and Custom Sections"
                            >
                              <Layers size={12} />
                              <span>Details</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                isClosed ? 'bg-slate-800 text-slate-300' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {trade.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = trades.findIndex((t) => t._id === trade._id)
                                  setViewerTradeIndex(idx !== -1 ? idx : 0)
                                  setViewerModalOpen(true)
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-300 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                title="Open in Trade Journal Template with Prev/Next buttons"
                              >
                                <Eye size={12} />
                                <span>Template</span>
                              </button>
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
                          </td>
                        </tr>

                        {/* Expandable Latest Journal Details Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#070b16] border-b border-slate-800">
                            <td colSpan="12" className="p-4 sm:p-5">
                              <div className="rounded-xl bg-[#0b1224] border border-blue-500/25 p-4 sm:p-5 space-y-4 shadow-xl">
                                {/* Drawer Top Status Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                                    <span className="font-bold text-sm text-white">{trade.symbol}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        trade.tradeType === 'Long'
                                          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                                          : 'bg-red-500/15 text-red-400 border border-red-500/25'
                                      }`}
                                    >
                                      {trade.tradeType}
                                    </span>
                                    {trade.strategy && (
                                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                        <Sparkles size={10} className="text-amber-400" />
                                        {trade.strategy}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                                    <span>
                                      {new Date(trade.entryDate).toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    {isClosed && (
                                      <span className={`font-bold px-2 py-0.5 rounded ${isProfitable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                        {isProfitable ? '+' : ''}₹{pnl.toLocaleString('en-IN')} ({trade.pnlPercent > 0 ? '+' : ''}{trade.pnlPercent}%)
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const idx = trades.findIndex((t) => t._id === trade._id)
                                        setViewerTradeIndex(idx !== -1 ? idx : 0)
                                        setViewerModalOpen(true)
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-300 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer ml-1"
                                      title="Open in Trade Journal Template to view/edit full trade"
                                    >
                                      <Eye size={12} />
                                      <span>Edit in Template</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Current Journal Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                  {/* 1. Trading Strategy & Risk Setup */}
                                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/25 space-y-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                      <Sparkles size={13} className="text-amber-400" />
                                      1. Trading Strategy & Setup
                                    </span>
                                    <div className="space-y-1 text-xs">
                                      <div className="font-semibold text-slate-100 flex items-center justify-between">
                                        <span>Strategy:</span>
                                        <span className="text-amber-300 font-mono">{trade.strategy || 'No Strategy Set'}</span>
                                      </div>
                                      <div className="text-slate-400 flex items-center justify-between font-mono text-[11px]">
                                        <span>Position / Type:</span>
                                        <span className="text-slate-200">{trade.position || 'Intraday'} • {trade.instrumentType || 'Equity'}</span>
                                      </div>
                                      <div className="text-slate-400 flex items-center justify-between font-mono text-[11px] pt-1 border-t border-slate-800">
                                        <span>Stop Loss / Target:</span>
                                        <span className="text-slate-200">
                                          SL: ₹{trade.stopLoss ?? '—'} | TP: ₹{trade.takeProfit ?? '—'}
                                        </span>
                                      </div>
                                      <div className="text-slate-400 flex items-center justify-between font-mono text-[11px]">
                                        <span>Risk-Reward:</span>
                                        <span className="text-slate-200">{trade.riskReward || '—'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2. Before Trade Emotion */}
                                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-blue-500/25 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                        <Smile size={13} className="text-blue-400" />
                                        2. Before Trade Emotion
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        {beforeEmotion && (
                                          <span className="text-[10px] text-blue-400/80 font-mono">Recorded</span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setAdjustingEmotion(
                                              adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'before'
                                                ? null
                                                : { tradeId: trade._id, type: 'before' }
                                            )
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/35 border border-blue-500/30 transition-all cursor-pointer"
                                          title="Click to adjust or choose emotion"
                                        >
                                          <Smile size={10} />
                                          <span>{beforeEmotion ? 'Adjust' : '+ Add Emotion'}</span>
                                        </button>
                                      </div>
                                    </div>

                                    {adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'before' ? (
                                      <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/40 space-y-2 animate-in fade-in">
                                        <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                                          <span>Select Before Emotion (मनस्थिती निवडा):</span>
                                          <button
                                            type="button"
                                            onClick={() => setAdjustingEmotion(null)}
                                            className="p-0.5 text-slate-400 hover:text-white"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                                          {BEFORE_TRADE_EMOTIONS.map((em) => (
                                            <button
                                              key={em.name}
                                              type="button"
                                              onClick={() => handleQuickUpdateEmotion(trade._id, 'before', em.name)}
                                              className={`p-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                                                beforeEmotion.toLowerCase() === em.name.toLowerCase()
                                                  ? 'bg-blue-600/30 border-blue-400 text-white font-bold'
                                                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-blue-500 hover:text-white'
                                              }`}
                                            >
                                              <div className="text-xs font-semibold">{em.name}</div>
                                              <div className="text-[10px] text-blue-300">{em.marathi}</div>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : beforeEmotion ? (
                                      <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-bold text-white">{beforeEmotion}</span>
                                          {beforeMeta?.marathi && (
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                              {beforeMeta.marathi}
                                            </span>
                                          )}
                                        </div>
                                        {beforeMeta?.desc && (
                                          <p className="text-xs text-slate-300 italic">
                                            "{beforeMeta.desc}"
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        <span className="text-xs text-slate-500 italic block">No before-trade emotion recorded</span>
                                        <button
                                          type="button"
                                          onClick={() => setAdjustingEmotion({ tradeId: trade._id, type: 'before' })}
                                          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/35 border border-blue-500/30 transition-all cursor-pointer"
                                        >
                                          <Smile size={11} />
                                          <span>+ Add / Adjust Emotion (निवडा)</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* 3. After Trade Emotion */}
                                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/25 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                        <Smile size={13} className="text-purple-400" />
                                        3. After Trade Emotion
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        {afterEmotion && (
                                          <span className="text-[10px] text-purple-400/80 font-mono">Recorded</span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setAdjustingEmotion(
                                              adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'after'
                                                ? null
                                                : { tradeId: trade._id, type: 'after' }
                                            )
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/35 border border-purple-500/30 transition-all cursor-pointer"
                                          title="Click to adjust or choose emotion"
                                        >
                                          <Smile size={10} />
                                          <span>{afterEmotion ? 'Adjust' : '+ Add Emotion'}</span>
                                        </button>
                                      </div>
                                    </div>

                                    {adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'after' ? (
                                      <div className="p-2.5 rounded-lg bg-slate-900 border border-purple-500/40 space-y-2 animate-in fade-in">
                                        <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                                          <span>Select After Emotion (निकालानंतरची मनस्थिती):</span>
                                          <button
                                            type="button"
                                            onClick={() => setAdjustingEmotion(null)}
                                            className="p-0.5 text-slate-400 hover:text-white"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                                          {AFTER_TRADE_EMOTIONS.map((em) => (
                                            <button
                                              key={em.name}
                                              type="button"
                                              onClick={() => handleQuickUpdateEmotion(trade._id, 'after', em.name)}
                                              className={`p-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                                                afterEmotion.toLowerCase() === em.name.toLowerCase()
                                                  ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                                                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-purple-500 hover:text-white'
                                              }`}
                                            >
                                              <div className="text-xs font-semibold">{em.name}</div>
                                              <div className="text-[10px] text-purple-300">{em.marathi}</div>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : afterEmotion ? (
                                      <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-bold text-white">{afterEmotion}</span>
                                          {afterMeta?.marathi && (
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                              {afterMeta.marathi}
                                            </span>
                                          )}
                                        </div>
                                        {afterMeta?.desc && (
                                          <p className="text-xs text-slate-300 italic">
                                            "{afterMeta.desc}"
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        <span className="text-xs text-slate-500 italic block">No after-trade emotion recorded</span>
                                        <button
                                          type="button"
                                          onClick={() => setAdjustingEmotion({ tradeId: trade._id, type: 'after' })}
                                          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/35 border border-purple-500/30 transition-all cursor-pointer"
                                        >
                                          <Smile size={11} />
                                          <span>+ Add / Adjust Emotion (निवडा)</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* 4. Exit Reason */}
                                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/25 space-y-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                      <LogOut size={13} className="text-amber-400" />
                                      4. Exit Reason
                                    </span>
                                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                      {trade.exitReason?.trim() || (
                                        <span className="text-slate-500 italic">No exit reason specified</span>
                                      )}
                                    </p>
                                  </div>

                                  {/* 5. Mistakes / Lessons */}
                                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/25 space-y-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                      <ShieldAlert size={13} className="text-rose-400" />
                                      5. Trading Mistakes / Discipline
                                    </span>
                                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                      {trade.mistakes?.trim() || trade.lessonLearned?.trim() || (
                                        <span className="text-slate-500 italic">No mistakes logged — clean discipline</span>
                                      )}
                                    </p>
                                  </div>

                                  {/* 6. Custom Sections (if user created any) */}
                                  {Array.isArray(trade.customSections) && trade.customSections.length > 0 && (
                                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/25 space-y-2">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                        <Layers size={13} className="text-emerald-400" />
                                        6. Custom Sections
                                      </span>
                                      <div className="space-y-1.5 text-xs text-slate-200">
                                        {trade.customSections.map((sec, sIdx) => (
                                          <div key={sIdx} className="p-2 rounded bg-slate-900 border border-slate-800">
                                            <div className="font-bold text-[11px] text-emerald-300">{sec.title}</div>
                                            {sec.content && <p className="text-slate-300 text-[11px] mt-0.5">{sec.content}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Attached Chart Screenshot / Notes if present */}
                                {(trade.imageUrl || trade.chartNotes) && (
                                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    {trade.imageUrl ? (
                                      <a
                                        href={trade.imageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline font-semibold"
                                      >
                                        <Image size={13} />
                                        <span>View Attached Chart Screenshot ↗</span>
                                      </a>
                                    ) : <div />}
                                    {trade.chartNotes && (
                                      <div className="text-slate-400 italic text-[11px]">
                                        Chart Note: {trade.chartNotes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View - Updated with Latest Journal Version */}
            <div className="md:hidden flex flex-col gap-3">
              {displayedTrades.map((trade) => {
                const isClosed = trade.status === 'CLOSED'
                const pnl = trade.pnl || 0
                const isProfitable = pnl >= 0
                const isExpanded = expandedTradeId === trade._id

                const beforeEmotion = extractBeforeEmotion(trade)
                const afterEmotion = extractAfterEmotion(trade)
                const beforeMeta = getEmotionMeta(beforeEmotion, 'before')
                const afterMeta = getEmotionMeta(afterEmotion, 'after')

                return (
                  <div key={trade._id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    {/* Top Row: Symbol, Call/Put, Long/Short, Status & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">{trade.symbol}</span>
                        {(trade.instrumentType === 'Options' || trade.instrumentType === 'Option') && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              String(trade.optionType).toUpperCase() === 'PUT'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {String(trade.optionType).toUpperCase() === 'PUT' ? 'PUT' : 'CALL'}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            trade.tradeType === 'Long'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {trade.tradeType}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            isClosed ? 'bg-slate-800 text-slate-300' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const idx = trades.findIndex((t) => t._id === trade._id)
                            setViewerTradeIndex(idx !== -1 ? idx : 0)
                            setViewerModalOpen(true)
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-300 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          title="Open Template"
                        >
                          <Eye size={11} />
                          <span>Template</span>
                        </button>
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
                    </div>

                    {/* Strategy Pill (Latest Journal) */}
                    {trade.strategy && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        <Sparkles size={11} className="text-amber-400" />
                        <span>Strategy: {trade.strategy}</span>
                      </div>
                    )}

                    {/* Financial Stats Grid */}
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

                    {/* Emotions Summary Row on Card */}
                    {(beforeEmotion || afterEmotion) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1 border-t border-slate-800/60">
                        {beforeEmotion && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium">
                            <span className="text-[9px] font-bold uppercase text-blue-400">Before:</span>
                            <span>{beforeEmotion}{beforeMeta?.marathi ? ` (${beforeMeta.marathi})` : ''}</span>
                          </span>
                        )}
                        {afterEmotion && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-medium">
                            <span className="text-[9px] font-bold uppercase text-purple-400">After:</span>
                            <span>{afterEmotion}{afterMeta?.marathi ? ` (${afterMeta.marathi})` : ''}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Date & Details Toggle Button */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>{new Date(trade.entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <button
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade._id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                            : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        <Layers size={11} />
                        <span>Journal Details</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    {/* Mobile Expanded Drawer with Full Current Journal Details */}
                    {isExpanded && (
                      <div className="space-y-2.5 pt-2.5 border-t border-slate-800 text-xs">
                        {/* Strategy Card */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/25 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <Sparkles size={11} /> 1. Strategy & Setup
                          </span>
                          <div className="font-semibold text-slate-100">{trade.strategy || 'No Strategy Set'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            SL: ₹{trade.stopLoss ?? '—'} | TP: ₹{trade.takeProfit ?? '—'} | R:R: {trade.riskReward || '—'}
                          </div>
                        </div>

                        {/* Before Trade Emotion */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-blue-500/25 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                              <Smile size={11} /> 2. Before Trade Emotion
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAdjustingEmotion(
                                  adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'before'
                                    ? null
                                    : { tradeId: trade._id, type: 'before' }
                                )
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 cursor-pointer"
                            >
                              {beforeEmotion ? 'Adjust' : '+ Add Emotion'}
                            </button>
                          </div>

                          {adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'before' ? (
                            <div className="p-2 rounded bg-slate-900 border border-blue-500/40 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold border-b border-slate-800 pb-1">
                                <span>Select Before Emotion:</span>
                                <button
                                  type="button"
                                  onClick={() => setAdjustingEmotion(null)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                                {BEFORE_TRADE_EMOTIONS.map((em) => (
                                  <button
                                    key={em.name}
                                    type="button"
                                    onClick={() => handleQuickUpdateEmotion(trade._id, 'before', em.name)}
                                    className={`p-1 rounded text-left border text-[11px] ${
                                      beforeEmotion.toLowerCase() === em.name.toLowerCase()
                                        ? 'bg-blue-600/30 border-blue-400 text-white font-bold'
                                        : 'bg-slate-950 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div>{em.name}</div>
                                    <div className="text-[9px] text-blue-300">{em.marathi}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : beforeEmotion ? (
                            <div>
                              <div className="font-semibold text-white">
                                {beforeEmotion}{beforeMeta?.marathi ? ` (${beforeMeta.marathi})` : ''}
                              </div>
                              {beforeMeta?.desc && <p className="text-[11px] text-slate-300 italic mt-0.5">"{beforeMeta.desc}"</p>}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-slate-500 italic text-xs block">No before-trade emotion recorded</span>
                              <button
                                type="button"
                                onClick={() => setAdjustingEmotion({ tradeId: trade._id, type: 'before' })}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 cursor-pointer flex items-center gap-1"
                              >
                                <Smile size={10} />
                                <span>+ Add / Adjust Emotion (निवडा)</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* After Trade Emotion */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-purple-500/25 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                              <Smile size={11} /> 3. After Trade Emotion
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAdjustingEmotion(
                                  adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'after'
                                    ? null
                                    : { tradeId: trade._id, type: 'after' }
                                )
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30 cursor-pointer"
                            >
                              {afterEmotion ? 'Adjust' : '+ Add Emotion'}
                            </button>
                          </div>

                          {adjustingEmotion?.tradeId === trade._id && adjustingEmotion?.type === 'after' ? (
                            <div className="p-2 rounded bg-slate-900 border border-purple-500/40 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold border-b border-slate-800 pb-1">
                                <span>Select After Emotion:</span>
                                <button
                                  type="button"
                                  onClick={() => setAdjustingEmotion(null)}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                                {AFTER_TRADE_EMOTIONS.map((em) => (
                                  <button
                                    key={em.name}
                                    type="button"
                                    onClick={() => handleQuickUpdateEmotion(trade._id, 'after', em.name)}
                                    className={`p-1 rounded text-left border text-[11px] ${
                                      afterEmotion.toLowerCase() === em.name.toLowerCase()
                                        ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                                        : 'bg-slate-950 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div>{em.name}</div>
                                    <div className="text-[9px] text-purple-300">{em.marathi}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : afterEmotion ? (
                            <div>
                              <div className="font-semibold text-white">
                                {afterEmotion}{afterMeta?.marathi ? ` (${afterMeta.marathi})` : ''}
                              </div>
                              {afterMeta?.desc && <p className="text-[11px] text-slate-300 italic mt-0.5">"{afterMeta.desc}"</p>}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-slate-500 italic text-xs block">No after-trade emotion recorded</span>
                              <button
                                type="button"
                                onClick={() => setAdjustingEmotion({ tradeId: trade._id, type: 'after' })}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30 cursor-pointer flex items-center gap-1"
                              >
                                <Smile size={10} />
                                <span>+ Add / Adjust Emotion (निवडा)</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Exit Reason */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/25 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <LogOut size={11} /> 4. Exit Reason
                          </span>
                          <p className="text-slate-200">{trade.exitReason?.trim() || <span className="text-slate-500 italic">None</span>}</p>
                        </div>

                        {/* Mistakes */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/25 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                            <ShieldAlert size={11} /> 5. Mistakes / Discipline
                          </span>
                          <p className="text-slate-200">{trade.mistakes?.trim() || trade.lessonLearned?.trim() || <span className="text-slate-500 italic">None</span>}</p>
                        </div>

                        {/* Custom Sections */}
                        {Array.isArray(trade.customSections) && trade.customSections.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-500/25 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              <Layers size={11} /> 6. Custom Sections
                            </span>
                            {trade.customSections.map((sec, idx) => (
                              <div key={idx} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                                <div className="font-semibold text-emerald-300">{sec.title}</div>
                                {sec.content && <p className="text-slate-300 mt-0.5">{sec.content}</p>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Chart Screenshot */}
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

      {/* ─── Modal: New Trade (Using User Trading Journal Template) ────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#080d1c] border-2 border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-[#0d162d] border-b-2 border-slate-700/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  New Trade — Trading Journal Template
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              <TradeJournalTemplate
                mode="create"
                formData={form}
                onChange={handleFormFieldChange}
                onSave={handleSaveTrade}
                onCancel={() => setModalOpen(false)}
                isSubmitting={createTradeMutation.isPending}
                allTrades={trades}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Trade Viewer & Inspector Modal with PREV & NEXT Buttons ──────── */}
      <TradeViewerModal
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
        trades={trades}
        initialTradeIndex={viewerTradeIndex}
        selectedDayKey={selectedDayKey}
        onUpdateTrade={async (id, data) => await updateTradeMutation.mutateAsync({ id, data })}
        onDeleteTrade={(id) => deleteTradeMutation.mutate(id)}
        onOpenNewTradeForDate={(dateKey) => handleOpenNewTradeForDate(dateKey)}
      />

      {/* PDF Export Modal */}
      <JournalExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        trades={trades}
        user={user}
        initialFromDate={fromDate}
        initialToDate={toDate}
        initialStrategy={tradeStrategyFilter}
        initialEmotion={tradeEmotionFilter}
        availableStrategies={availableStrategies}
      />
    </div>
  )
}

