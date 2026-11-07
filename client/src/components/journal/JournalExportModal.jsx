import { useState, useMemo } from 'react'
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  Info,
  BarChart3,
  PieChart,
  Image as ImageIcon,
  BookOpen,
  Check,
  CheckSquare,
  Square,
  Smile,
  Target,
} from 'lucide-react'
import { generateTradingJournalPdf, computePdfAuditStats } from '../../lib/journalPdfExport'
import { formatINR } from '../../lib/journalAnalytics'
import {
  BEFORE_TRADE_EMOTIONS,
  AFTER_TRADE_EMOTIONS,
} from './TradeJournalTemplate'
import toast from 'react-hot-toast'

export default function JournalExportModal({
  isOpen,
  onClose,
  trades = [],
  user = null,
  initialFromDate = '',
  initialToDate = '',
  initialStrategy = 'ALL',
  initialEmotion = 'ALL',
  availableStrategies = [],
}) {
  const [fromDate, setFromDate] = useState(initialFromDate || '')
  const [toDate, setToDate] = useState(initialToDate || '')
  const [outcomeFilter, setOutcomeFilter] = useState('all') // 'all', 'profit', 'loss', 'closed', 'open'
  const [selectedSymbol, setSelectedSymbol] = useState('ALL')
  const [selectedStrategy, setSelectedStrategy] = useState(initialStrategy || 'ALL')
  const [selectedEmotion, setSelectedEmotion] = useState(initialEmotion || 'ALL')

  // Section Inclusions (User selects what data to include in PDF)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeStrategiesBreakdown, setIncludeStrategiesBreakdown] = useState(true)
  const [includeTable, setIncludeTable] = useState(true)
  const [includeJournalDetails, setIncludeJournalDetails] = useState(true)
  const [includeChartImages, setIncludeChartImages] = useState(true)
  const [includeNarrative, setIncludeNarrative] = useState(true)

  const [isExporting, setIsExporting] = useState(false)

  // Distinct symbols available in trades
  const availableSymbols = useMemo(() => {
    const set = new Set()
    trades.forEach((t) => {
      if (t.symbol) set.add(t.symbol.toUpperCase().trim())
    })
    return ['ALL', ...Array.from(set).sort()]
  }, [trades])

  // Distinct strategies list (built-in + from trades)
  const strategiesList = useMemo(() => {
    const set = new Set(
      availableStrategies && availableStrategies.length > 0
        ? availableStrategies
        : [
            'Fibonacci Setup',
            'Inside Candle Strategy',
            'Parallel Channel Breakout',
            'Parallel Channel Middle line Entry',
            'Parallel Channel Upper Line Entry',
            'Parallel Channel Lower Line Entry',
            'Cup and Handle',
            'Head and Shoulder',
            'V shape Recovery',
            'No set-up / Random Trade',
          ]
    )
    trades.forEach((t) => {
      if (t.strategy?.trim()) set.add(t.strategy.trim())
    })
    return ['ALL', ...Array.from(set).filter(Boolean)]
  }, [trades, availableStrategies])

  // Distinct emotions list (Before + After + from trades)
  const emotionsList = useMemo(() => {
    const map = new Map()
    BEFORE_TRADE_EMOTIONS.forEach((e) => {
      map.set(e.name.toLowerCase(), { name: e.name, marathi: e.marathi || '' })
    })
    AFTER_TRADE_EMOTIONS.forEach((e) => {
      if (!map.has(e.name.toLowerCase())) {
        map.set(e.name.toLowerCase(), { name: e.name, marathi: e.marathi || '' })
      }
    })
    trades.forEach((t) => {
      const b = (
        t.emotions?.before ||
        t.emotionBefore ||
        t.beforeTradeEmotions ||
        t.beforeEmotions ||
        t.beforeTradeEmotion ||
        t.beforeEmotion ||
        ''
      ).trim()
      const a = (
        t.emotions?.after ||
        t.emotionAfter ||
        t.afterTradeEmotions ||
        t.afterEmotions ||
        t.afterTradeEmotion ||
        t.afterEmotion ||
        ''
      ).trim()
      if (b && !map.has(b.toLowerCase())) map.set(b.toLowerCase(), { name: b, marathi: '' })
      if (a && !map.has(a.toLowerCase())) map.set(a.toLowerCase(), { name: a, marathi: '' })
    })
    return ['ALL', ...Array.from(map.values())]
  }, [trades])

  // Quick Date Preset Handlers
  const applyDatePreset = (preset) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (preset === 'all') {
      setFromDate('')
      setToDate('')
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setFromDate(firstDay.toISOString().split('T')[0])
      setToDate(todayStr)
    } else if (preset === '30d') {
      const past30 = new Date(today)
      past30.setDate(past30.getDate() - 30)
      setFromDate(past30.toISOString().split('T')[0])
      setToDate(todayStr)
    } else if (preset === '90d') {
      const past90 = new Date(today)
      past90.setDate(past90.getDate() - 90)
      setFromDate(past90.toISOString().split('T')[0])
      setToDate(todayStr)
    } else if (preset === 'ytd') {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      setFromDate(startOfYear.toISOString().split('T')[0])
      setToDate(todayStr)
    }
  }

  // Quick Section Select Handlers
  const handleSelectAllSections = () => {
    setIncludeSummary(true)
    setIncludeCharts(true)
    setIncludeStrategiesBreakdown(true)
    setIncludeTable(true)
    setIncludeJournalDetails(true)
    setIncludeChartImages(true)
    setIncludeNarrative(true)
  }

  const handleDeselectAllSections = () => {
    setIncludeSummary(false)
    setIncludeCharts(false)
    setIncludeStrategiesBreakdown(false)
    setIncludeTable(false)
    setIncludeJournalDetails(false)
    setIncludeChartImages(false)
    setIncludeNarrative(false)
  }

  // Filtered trades for live preview
  const filteredPreviewTrades = useMemo(() => {
    let result = [...trades]

    if (fromDate) {
      const fromTime = new Date(fromDate).getTime()
      result = result.filter((t) => new Date(t.entryDate || t.createdAt || 0).getTime() >= fromTime)
    }
    if (toDate) {
      const toObj = new Date(toDate)
      toObj.setHours(23, 59, 59, 999)
      const toTime = toObj.getTime()
      result = result.filter((t) => new Date(t.entryDate || t.createdAt || 0).getTime() <= toTime)
    }

    if (selectedSymbol && selectedSymbol !== 'ALL') {
      result = result.filter((t) => t.symbol?.toUpperCase() === selectedSymbol.toUpperCase())
    }

    if (selectedStrategy && selectedStrategy !== 'ALL') {
      result = result.filter(
        (t) => (t.strategy?.trim() || '').toLowerCase() === selectedStrategy.toLowerCase().trim()
      )
    }

    if (selectedEmotion && selectedEmotion !== 'ALL') {
      const target = selectedEmotion.toLowerCase().trim()
      result = result.filter((t) => {
        const b = (
          t.emotions?.before ||
          t.emotionBefore ||
          t.beforeTradeEmotions ||
          t.tradeAnalysis?.beforeEmotion ||
          ''
        ).toLowerCase()
        const a = (
          t.emotions?.after ||
          t.emotionAfter ||
          t.afterTradeEmotions ||
          t.tradeAnalysis?.afterEmotion ||
          ''
        ).toLowerCase()
        return b.includes(target) || a.includes(target)
      })
    }

    if (outcomeFilter === 'profit') {
      result = result.filter((t) => (t.pnl || 0) > 0)
    } else if (outcomeFilter === 'loss') {
      result = result.filter((t) => (t.pnl || 0) < 0)
    } else if (outcomeFilter === 'closed') {
      result = result.filter((t) => t.status === 'CLOSED')
    } else if (outcomeFilter === 'open') {
      result = result.filter((t) => t.status !== 'CLOSED')
    }

    return result
  }, [trades, fromDate, toDate, selectedSymbol, selectedStrategy, selectedEmotion, outcomeFilter])

  // Live preview metrics
  const previewStats = useMemo(() => {
    return computePdfAuditStats(filteredPreviewTrades)
  }, [filteredPreviewTrades])

  // Count active sections selected
  const selectedSectionsCount = [
    includeSummary,
    includeCharts,
    includeStrategiesBreakdown,
    includeTable,
    includeJournalDetails,
    includeChartImages,
    includeNarrative,
  ].filter(Boolean).length

  // Handle Export Action
  const handleDownloadPdf = async () => {
    if (filteredPreviewTrades.length === 0) {
      return toast.error('No trades match the selected filter criteria.')
    }

    if (selectedSectionsCount === 0) {
      return toast.error('Please select at least one data section to include in the PDF.')
    }

    try {
      setIsExporting(true)
      const result = await generateTradingJournalPdf({
        trades,
        user,
        fromDate,
        toDate,
        outcomeFilter,
        selectedSymbol,
        selectedStrategy,
        selectedEmotion,
        includeSummary,
        includeCharts,
        includeStrategiesBreakdown,
        includeTable,
        includeJournalDetails,
        includeChartImages,
        includeNarrative,
      })

      if (result.success) {
        toast.success(`PDF downloaded successfully! (${result.totalPages} pages)`)
        onClose()
      }
    } catch (err) {
      console.error('PDF export error:', err)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-gradient-to-b from-[#0f172a] via-[#091124] to-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 shadow-sm">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Export Custom Trading Journal PDF</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
                  WITH CHARTS &amp; SLICERS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose exactly what data, charts, strategy breakdowns, and journal notes to compile into your PDF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* SECTION 1: Scope & Filter Controls */}
          <div className="space-y-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            {/* Header: Date Range Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-400" />
                  <span>1. Date Range Filter</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'All History' },
                    { id: 'month', label: 'This Month' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: '90d', label: 'Last 90 Days' },
                    { id: 'ytd', label: 'Year to Date' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyDatePreset(preset.id)}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">From Date</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">To Date</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Outcome Filter Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={12} className="text-indigo-400" />
                <span>Trade Outcome</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Trades', icon: Layers },
                  { id: 'profit', label: 'Profit Only ▲', icon: TrendingUp },
                  { id: 'loss', label: 'Loss Only ▼', icon: TrendingDown },
                  { id: 'closed', label: 'Closed Positions', icon: CheckCircle2 },
                ].map((tab) => {
                  const isSelected = outcomeFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOutcomeFilter(tab.id)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/25 border-blue-500 text-white ring-2 ring-blue-500/30 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <tab.icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Granular Slicers: Symbol, Strategy, Emotion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Instrument Scope */}
              <div>
                <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Instrument / Stock
                </label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                >
                  {availableSymbols.map((sym) => (
                    <option key={sym} value={sym}>
                      {sym === 'ALL' ? 'All Instruments' : sym}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strategy Setup Filter */}
              <div>
                <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Strategy Setup
                </label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                >
                  {strategiesList.map((st) => (
                    <option key={st} value={st}>
                      {st === 'ALL' ? 'All Strategies' : st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Emotion Filter */}
              <div>
                <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Emotion
                </label>
                <select
                  value={selectedEmotion}
                  onChange={(e) => setSelectedEmotion(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ALL">All Emotions</option>
                  {emotionsList
                    .filter((item) => item !== 'ALL' && item.name)
                    .map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name} {item.marathi ? `(${item.marathi})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Interactive Data Inclusions Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-emerald-400" />
                  <span>2. Choose What Data To Include in PDF</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Select or deselect the sections you want rendered into your PDF report:
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllSections}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 transition-all cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllSections}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Checkbox Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Executive Summary & KPIs */}
              <div
                onClick={() => setIncludeSummary(!includeSummary)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  includeSummary
                    ? 'bg-blue-600/15 border-blue-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-0.5 ${includeSummary ? 'text-blue-400' : 'text-slate-500'}`}>
                  {includeSummary ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-blue-400" />
                    <span className="text-xs font-bold text-white">Executive Summary &amp; KPI Stats</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Net P&amp;L, Win Rate %, Profit Factor, Payoff Ratio, Max Drawdown, and Win/Loss Streaks.
                  </p>
                </div>
              </div>

              {/* Option 2: Visual Performance & Equity Charts */}
              <div
                onClick={() => setIncludeCharts(!includeCharts)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  includeCharts
                    ? 'bg-indigo-600/15 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-0.5 ${includeCharts ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {includeCharts ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={13} className="text-indigo-400" />
                    <span className="text-xs font-bold text-white">Visual Performance &amp; Equity Charts</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Cumulative Equity Curve with peak/drawdown markers, plus Win/Loss volume distribution bars.
                  </p>
                </div>
              </div>

              {/* Option 3: Strategy Performance Breakdown Table */}
              <div
                onClick={() => setIncludeStrategiesBreakdown(!includeStrategiesBreakdown)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  includeStrategiesBreakdown
                    ? 'bg-amber-600/15 border-amber-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-0.5 ${includeStrategiesBreakdown ? 'text-amber-400' : 'text-slate-500'}`}>
                  {includeStrategiesBreakdown ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <PieChart size={13} className="text-amber-400" />
                    <span className="text-xs font-bold text-white">Strategy Performance Breakdown</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Independent win rate %, win/loss counts, net P&amp;L, and trade frequency per strategy setup.
                  </p>
                </div>
              </div>

              {/* Option 4: Trade-by-Trade Table Log */}
              <div
                onClick={() => setIncludeTable(!includeTable)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  includeTable
                    ? 'bg-emerald-600/15 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-0.5 ${includeTable ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {includeTable ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <FileText size={13} className="text-emerald-400" />
                    <span className="text-xs font-bold text-white">Trade-by-Trade Table Log</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Tabular audit log with date, symbol, side, setup, entry/exit prices, quantity, and net P&amp;L.
                  </p>
                </div>
              </div>

              {/* Option 5: Per-Trade Journal Cards & Chosen Emotions */}
              <div
                onClick={() => setIncludeJournalDetails(!includeJournalDetails)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  includeJournalDetails
                    ? 'bg-purple-600/15 border-purple-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-0.5 ${includeJournalDetails ? 'text-purple-400' : 'text-slate-500'}`}>
                  {includeJournalDetails ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-purple-400" />
                    <span className="text-xs font-bold text-white">Per-Trade Journal &amp; Chosen Emotions</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Full trade cards showing strictly the user-chosen Before &amp; After emotions, exit reasons, and mistakes.
                  </p>
                </div>
              </div>

              {/* Option 6: Attached Chart Screenshot Images */}
              <div
                onClick={() => setIncludeChartImages(!includeChartImages)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  includeChartImages
                    ? 'bg-cyan-600/15 border-cyan-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-0.5 ${includeChartImages ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {includeChartImages ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-cyan-400" />
                    <span className="text-xs font-bold text-white">Attached Chart Screenshot Images</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Embeds high-resolution chart screenshots attached to your trades directly into the report.
                  </p>
                </div>
              </div>

              {/* Option 7: Analytical Narrative & Strategic Recommendations */}
              <div
                onClick={() => setIncludeNarrative(!includeNarrative)}
                className={`sm:col-span-2 p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  includeNarrative
                    ? 'bg-rose-600/15 border-rose-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`mt-0.5 ${includeNarrative ? 'text-rose-400' : 'text-slate-500'}`}>
                  {includeNarrative ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-rose-400" />
                    <span className="text-xs font-bold text-white">Analytical Narrative &amp; Strategic Insights</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Institutional-grade point-by-point narrative explaining edge, streak endurance, and tactical rules.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Live Audit Preview Bar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" />
                <span>Live Audit Preview</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  {selectedSectionsCount} / 7 Sections Selected
                </span>
                <span className="text-[11px] text-slate-300 font-mono font-bold">
                  {filteredPreviewTrades.length} matching trades
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[9px] text-slate-400 block uppercase font-sans">Net Realized P&amp;L</span>
                <span
                  className={`text-xs font-bold ${
                    previewStats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatINR(previewStats.netPnl, { showSign: true })}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[9px] text-slate-400 block uppercase font-sans">Win Rate</span>
                <span
                  className={`text-xs font-bold ${
                    previewStats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {previewStats.winRate}% ({previewStats.winCount}W / {previewStats.lossCount}L)
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[9px] text-slate-400 block uppercase font-sans">Profit Factor</span>
                <span className="text-xs font-bold text-slate-200">{previewStats.profitFactor}x</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[9px] text-slate-400 block uppercase font-sans">Payoff Ratio</span>
                <span className="text-xs font-bold text-slate-200">{previewStats.payoffRatio} : 1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-800 bg-slate-900/70">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info size={13} className="text-slate-500" />
            <span>PDF formats vector graphics, INR currency, chosen emotions, and audit log.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting || filteredPreviewTrades.length === 0 || selectedSectionsCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                isExporting || filteredPreviewTrades.length === 0 || selectedSectionsCount === 0
                  ? 'opacity-50 cursor-not-allowed bg-blue-600'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25'
              }`}
            >
              {isExporting ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Generating Custom PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download Custom PDF ({selectedSectionsCount} Sections)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
