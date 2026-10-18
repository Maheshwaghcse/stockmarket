import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
  Trash2,
  Plus,
  Calendar,
  Layers,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import TradeJournalTemplate from './TradeJournalTemplate'

export default function TradeViewerModal({
  isOpen,
  onClose,
  trades = [], // All trades made in all time (sorted chronologically or reverse-chronologically)
  initialTradeIndex = 0,
  selectedDayKey = null,
  onUpdateTrade,
  onDeleteTrade,
  onOpenNewTradeForDate,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialTradeIndex)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync initial index whenever modal opens or initialTradeIndex changes
  useEffect(() => {
    if (isOpen) {
      if (initialTradeIndex >= 0 && initialTradeIndex < trades.length) {
        setCurrentIndex(initialTradeIndex)
      } else {
        setCurrentIndex(0)
      }
      setIsEditing(false)
    }
  }, [isOpen, initialTradeIndex, trades.length])

  const totalTrades = trades.length
  const currentTrade = trades[currentIndex] || null

  // Initialize edit form data when editing is toggled or current trade changes
  useEffect(() => {
    if (currentTrade) {
      setEditFormData({
        symbol: currentTrade.symbol || '',
        tradeType: currentTrade.tradeType || 'Long',
        entryDate: currentTrade.entryDate ? new Date(currentTrade.entryDate).toISOString().slice(0, 16) : '',
        exitDate: currentTrade.exitDate ? new Date(currentTrade.exitDate).toISOString().slice(0, 16) : '',
        entryPrice: currentTrade.entryPrice ?? '',
        exitPrice: currentTrade.exitPrice ?? '',
        quantity: currentTrade.quantity ?? 1,
        lotSize: currentTrade.lotSize ?? currentTrade.quantity ?? 1,
        position: currentTrade.position || 'Intraday',
        time: currentTrade.time || (currentTrade.entryDate ? new Date(currentTrade.entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''),
        instrumentType: currentTrade.instrumentType || 'Equity',
        strategy: currentTrade.strategy || '',
        stopLoss: currentTrade.stopLoss ?? '',
        takeProfit: currentTrade.takeProfit ?? '',
        riskReward: currentTrade.riskReward || '',
        imageUrl: currentTrade.imageUrl || '',
        entryReason: currentTrade.entryReason || '',
        assumptions: currentTrade.assumptions || '',
        disciplined: currentTrade.disciplined || 'Y',
        followedRules: currentTrade.followedRules || 'Y',
        rating: currentTrade.rating ?? 5,
        chartNotes: currentTrade.chartNotes || '',
      })
    }
  }, [currentTrade])

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsEditing(false)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < totalTrades - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsEditing(false)
    }
  }, [currentIndex, totalTrades])

  // Keyboard arrow navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing inside an input/textarea
      const tag = e.target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext, onClose])

  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveEdit = async () => {
    if (!currentTrade || !onUpdateTrade) return
    setIsSubmitting(true)
    try {
      await onUpdateTrade(currentTrade._id, editFormData)
      setIsEditing(false)
    } catch {
      // Handled by caller toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!currentTrade || !onDeleteTrade) return
    if (window.confirm(`Are you sure you want to delete this ${currentTrade.symbol} trade?`)) {
      onDeleteTrade(currentTrade._id)
      if (currentIndex >= totalTrades - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    }
  }

  if (!isOpen) return null

  // Format date helper
  const formatTradeDate = (d) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }

  const currentTradeDateKey = currentTrade?.entryDate
    ? new Date(currentTrade.entryDate).toISOString().split('T')[0]
    : null
  const isTradeOnSelectedDay = selectedDayKey && currentTradeDateKey === selectedDayKey

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#080d1c] border-2 border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto">

        {/* ─── MODAL TOP CONTROL BAR: PREV / NEXT & STATUS ───────────── */}
        <div className="p-3 sm:p-4 bg-[#0d162d] border-b-2 border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">

          {/* Left: Previous Trade Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-100 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              title="Previous trade in all time (Left Arrow ←)"
            >
              <ChevronLeft size={16} />
              <span>PREV</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= totalTrades - 1}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-100 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              title="Next trade in all time (Right Arrow →)"
            >
              <span>NEXT</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Center: Trade Index & Jump to Trade Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            {totalTrades > 0 ? (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  Trade {currentIndex + 1} of {totalTrades}
                </span>

                {/* Quick Trade Selector Dropdown */}
                <select
                  value={currentIndex}
                  onChange={(e) => {
                    setCurrentIndex(Number(e.target.value))
                    setIsEditing(false)
                  }}
                  className="hidden sm:block bg-[#152244] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-blue-400 font-mono"
                  title="Jump directly to any trade across all time"
                >
                  {trades.map((t, idx) => (
                    <option key={t._id || idx} value={idx}>
                      #{idx + 1} — {t.symbol} ({formatTradeDate(t.entryDate)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-slate-400">No trades recorded</span>
            )}
          </div>

          {/* Right: Actions & Close */}
          <div className="flex items-center gap-2">
            {currentTrade && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1.5"
                  title="Edit this trade"
                >
                  <Edit3 size={13} />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
                  title="Delete this trade"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── OPTIONAL DAY CONTEXT BANNER ─────────────────────────────── */}
        {selectedDayKey && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-[#0d162d] border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-blue-400 shrink-0" />
              <span className="text-slate-300">
                Selected Day: <strong className="text-white">{selectedDayKey}</strong>
              </span>
              {isTradeOnSelectedDay ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle size={10} /> Matching clicked day
                </span>
              ) : (
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  (Showing trade from {formatTradeDate(currentTrade?.entryDate)} • Use Prev/Next to browse all)
                </span>
              )}
            </div>

            {onOpenNewTradeForDate && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenNewTradeForDate(selectedDayKey)
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus size={12} />
                <span>+ Log Trade on {selectedDayKey}</span>
              </button>
            )}
          </div>
        )}

        {/* ─── MODAL BODY: TRADE JOURNAL TEMPLATE ────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {totalTrades === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Calendar size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">No Trades Recorded Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You haven't logged any trades yet. Click the button below to record your first trade with this template!
              </p>
              {onOpenNewTradeForDate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenNewTradeForDate(selectedDayKey || new Date().toISOString().split('T')[0])
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Log First Trade Now</span>
                </button>
              )}
            </div>
          ) : (
            <TradeJournalTemplate
              mode={isEditing ? 'edit' : 'view'}
              trade={currentTrade}
              formData={editFormData}
              onChange={handleEditChange}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* ─── MODAL FOOTER WITH SECONDARY PREV/NEXT ─────────────────────── */}
        {totalTrades > 0 && (
          <div className="p-3 sm:p-4 bg-[#0d162d] border-t-2 border-slate-700/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800 transition-all font-semibold cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Previous Trade</span>
            </button>

            <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
              Use arrow keys <strong>← Left</strong> and <strong>Right →</strong> to navigate
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= totalTrades - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800 transition-all font-semibold cursor-pointer"
            >
              <span>Next Trade</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
