import { useState, useMemo } from 'react'
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  Printer,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  Info,
} from 'lucide-react'
import { generateTradingJournalPdf, computePdfAuditStats } from '../../lib/journalPdfExport'
import { formatINR } from '../../lib/journalAnalytics'
import toast from 'react-hot-toast'

export default function JournalExportModal({
  isOpen,
  onClose,
  trades = [],
  user = null,
  initialFromDate = '',
  initialToDate = '',
}) {
  const [fromDate, setFromDate] = useState(initialFromDate || '')
  const [toDate, setToDate] = useState(initialToDate || '')
  const [outcomeFilter, setOutcomeFilter] = useState('all') // 'all', 'profit', 'loss', 'closed', 'open'
  const [selectedSymbol, setSelectedSymbol] = useState('ALL')
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeTable, setIncludeTable] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Distinct symbols available in trades
  const availableSymbols = useMemo(() => {
    const set = new Set()
    trades.forEach((t) => {
      if (t.symbol) set.add(t.symbol.toUpperCase())
    })
    return ['ALL', ...Array.from(set).sort()]
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
  }, [trades, fromDate, toDate, selectedSymbol, outcomeFilter])

  // Live preview metrics
  const previewStats = useMemo(() => {
    return computePdfAuditStats(filteredPreviewTrades)
  }, [filteredPreviewTrades])

  // Handle Export Action
  const handleDownloadPdf = async () => {
    if (filteredPreviewTrades.length === 0) {
      return toast.error('No trades match the selected date range and filter criteria.')
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
        includeSummary,
        includeTable,
        includeNotes,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-gradient-to-b from-[#0f172a] via-[#091124] to-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Download Trading Journal PDF</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
                  AUDIT REPORT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Generate an institutional-grade PDF report with an executive narrative describing each metric.
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
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Date Range Section */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} className="text-blue-400" />
              <span>1. Date Range Filter</span>
            </label>

            <div className="flex flex-wrap gap-1.5 pb-1">
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
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">From Date</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">To Date</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 2. Outcome Filter (Profit, Loss, All) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={13} className="text-indigo-400" />
              <span>2. Outcome &amp; Performance Filter</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'All Trades', icon: Layers, color: 'border-slate-700' },
                { id: 'profit', label: 'Profit Only ▲', icon: TrendingUp, color: 'border-emerald-600/60 text-emerald-300' },
                { id: 'loss', label: 'Loss Only ▼', icon: TrendingDown, color: 'border-rose-600/60 text-rose-300' },
                { id: 'closed', label: 'Closed Positions', icon: CheckCircle2, color: 'border-blue-600/60 text-blue-300' },
              ].map((tab) => {
                const isSelected = outcomeFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOutcomeFilter(tab.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Symbol Scope & Sections Inclusion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Instrument Scope
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
              >
                {availableSymbols.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym === 'ALL' ? 'All Instruments & Stocks' : sym}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Report Scope Inclusions
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Include Point-by-Point Analytical Narrative</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTable}
                  onChange={(e) => setIncludeTable(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Include Trade-by-Trade Table Log</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Include Trade Setup &amp; Lessons Learned</span>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" />
                <span>Live Audit Preview</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {filteredPreviewTrades.length} matching trades
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block uppercase">Net Realized P&amp;L</span>
                <span
                  className={`text-xs font-bold ${
                    previewStats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatINR(previewStats.netPnl, { showSign: true })}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block uppercase">Win Rate</span>
                <span
                  className={`text-xs font-bold ${
                    previewStats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {previewStats.winRate}% ({previewStats.winCount}W / {previewStats.lossCount}L)
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block uppercase">Profit Factor</span>
                <span className="text-xs font-bold text-slate-200">{previewStats.profitFactor}x</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block uppercase">Payoff Ratio</span>
                <span className="text-xs font-bold text-slate-200">{previewStats.payoffRatio} : 1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info size={13} className="text-slate-500" />
            <span>PDF formats currency, metrics, point-by-point narrative &amp; audit log.</span>
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
              disabled={isExporting || filteredPreviewTrades.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                isExporting || filteredPreviewTrades.length === 0
                  ? 'opacity-50 cursor-not-allowed bg-blue-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'
              }`}
            >
              {isExporting ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
