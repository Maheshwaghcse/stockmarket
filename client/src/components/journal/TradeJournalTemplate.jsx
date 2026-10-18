import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Upload,
  Image as ImageIcon,
  Star,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Info,
  Maximize2,
  Trash2,
} from 'lucide-react'
import { formatINR } from '../../lib/journalAnalytics'

const SUGGESTED_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN',
  'BHARTIARTL', 'ITC', 'LT', 'MARUTI', 'TATASTEEL', 'BEL', 'HAL',
  'NIFTY50', 'BANKNIFTY'
]

const STRATEGY_OPTIONS = [
  'Breakout',
  'Pullback',
  'VWAP Reversal',
  'Support & Resistance',
  'Trend Following',
  'CPR / Pivot Bounce',
  'Chart Pattern',
  'Scalp Momentum',
  'Other',
]

const POSITION_OPTIONS = ['Intraday', 'Swing', 'Positional', 'Scalp']
const INSTRUMENT_OPTIONS = ['Equity', 'Futures', 'Options', 'Forex', 'Crypto']

export default function TradeJournalTemplate({
  mode = 'view', // 'view' | 'create' | 'edit'
  trade = {},
  formData,
  onChange,
  onSave,
  onCancel,
  isSubmitting = false,
}) {
  const isEditing = mode === 'create' || mode === 'edit'
  const [zoomImage, setZoomImage] = useState(false)
  const fileInputRef = useRef(null)

  // Use either active formData (edit/create) or trade (view)
  const currentData = isEditing ? formData : trade

  // Normalize fields with clean fallbacks
  const symbol = currentData?.symbol || ''
  const tradeType = currentData?.tradeType || 'Long'
  const entryDate = currentData?.entryDate || ''
  const position = currentData?.position || 'Intraday'
  const time = currentData?.time || (entryDate ? new Date(entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '')
  const lotSize = currentData?.lotSize || currentData?.quantity || 1
  const instrumentType = currentData?.instrumentType || 'Equity'
  const strategy = currentData?.strategy || ''
  const imageUrl = currentData?.imageUrl || ''
  const chartNotes = currentData?.chartNotes || ''
  const entryPrice = currentData?.entryPrice !== undefined && currentData?.entryPrice !== null ? currentData?.entryPrice : ''
  const stopLoss = currentData?.stopLoss !== undefined && currentData?.stopLoss !== null ? currentData?.stopLoss : ''
  const exitPrice = currentData?.exitPrice !== undefined && currentData?.exitPrice !== null ? currentData?.exitPrice : ''
  const takeProfit = currentData?.takeProfit !== undefined && currentData?.takeProfit !== null ? currentData?.takeProfit : ''
  const riskReward = currentData?.riskReward || ''
  const entryReason = currentData?.entryReason || ''
  const assumptions = currentData?.assumptions || ''
  const disciplined = currentData?.disciplined || 'Y'
  const followedRules = currentData?.followedRules || 'Y'
  const rating = currentData?.rating !== undefined ? Number(currentData?.rating) : 5

  // Real-time computed R/R and P&L in edit mode
  const computedMetrics = useMemo(() => {
    const entry = parseFloat(entryPrice)
    const exit = parseFloat(exitPrice)
    const sl = parseFloat(stopLoss)
    const tp = parseFloat(takeProfit)
    const qty = parseInt(lotSize, 10) || 1

    let calcPnl = null
    let calcPnlPercent = null
    if (!isNaN(entry) && !isNaN(exit) && entry > 0) {
      if (tradeType === 'Long') {
        calcPnl = (exit - entry) * qty
      } else {
        calcPnl = (entry - exit) * qty
      }
      calcPnlPercent = (calcPnl / (entry * qty)) * 100
    } else if (!isEditing && currentData?.pnl !== undefined) {
      calcPnl = currentData.pnl
      calcPnlPercent = currentData.pnlPercent || 0
    }

    let calcRR = riskReward
    if (isEditing && !isNaN(entry) && !isNaN(sl)) {
      const target = !isNaN(tp) ? tp : !isNaN(exit) ? exit : null
      if (target !== null) {
        let risk = 0
        let reward = 0
        if (tradeType === 'Long') {
          risk = entry - sl
          reward = target - entry
        } else {
          risk = sl - entry
          reward = entry - target
        }
        if (risk > 0 && reward > 0) {
          calcRR = `1 : ${(reward / risk).toFixed(2)}`
        }
      }
    }

    return {
      pnl: calcPnl,
      pnlPercent: calcPnlPercent,
      rr: calcRR || (riskReward ? riskReward : '—'),
    }
  }, [entryPrice, exitPrice, stopLoss, takeProfit, lotSize, tradeType, riskReward, isEditing, currentData])

  // Handle local image file upload -> Base64
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert('Image file is too large (max 3 MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      onChange('imageUrl', event.target?.result)
    }
    reader.readAsDataURL(file)
  }

  // Handle paste screenshot from clipboard
  const handlePaste = (e) => {
    if (!isEditing) return
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile()
        const reader = new FileReader()
        reader.onload = (event) => {
          onChange('imageUrl', event.target?.result)
        }
        reader.readAsDataURL(blob)
        e.preventDefault()
        break
      }
    }
  }

  return (
    <div
      onPaste={handlePaste}
      className="w-full max-w-4xl mx-auto font-sans text-slate-100 select-text"
    >
      {/* ─── TEMPLATE CONTAINER ─────────────────────────────────────────── */}
      <div className="bg-[#0b1329] border-2 border-slate-700/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">

        {/* ─── 1. TOP HEADER BOX: DATE & SYMBOL ───────────────────────────── */}
        <div className="border-2 border-slate-700/90 rounded-xl p-3 sm:p-4 bg-[#0f1a36]/90 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* DATE */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-wider text-xs sm:text-sm text-slate-300 uppercase shrink-0">
              DATE:
            </span>
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="datetime-local"
                  required
                  value={entryDate ? entryDate.slice(0, 16) : ''}
                  onChange={(e) => {
                    onChange('entryDate', e.target.value)
                    // Auto-set time field if not set
                    if (e.target.value) {
                      const t = e.target.value.split('T')[1]
                      if (t && (!formData.time || formData.time === '')) {
                        onChange('time', t)
                      }
                    }
                  }}
                  className="w-full bg-[#152244] border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-mono"
                />
              </div>
            ) : (
              <span className="font-bold text-sm sm:text-base text-white font-mono">
                {entryDate
                  ? new Date(entryDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) + (time ? ` • ${time}` : '')
                  : '—'}
              </span>
            )}
          </div>

          {/* SYMBOL */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-wider text-xs sm:text-sm text-slate-300 uppercase shrink-0">
              SYMBOL:
            </span>
            {isEditing ? (
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. RELIANCE, NIFTY50"
                  value={symbol}
                  onChange={(e) => onChange('symbol', e.target.value.toUpperCase())}
                  className="w-full bg-[#152244] border border-slate-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white font-bold placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 uppercase tracking-wider"
                />
                {/* Quick Symbol Pills */}
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_SYMBOLS.slice(0, 5).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => onChange('symbol', s)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                        symbol === s
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white font-mono tracking-wider">
                  {symbol || '—'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-extrabold font-mono uppercase ${
                    tradeType === 'Long'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {tradeType}
                </span>
                {currentData?.status && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    {currentData.status}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. MIDDLE 2-COLUMN SECTION: TRADING SETUP & CHART ANALYSIS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* LEFT BOX: TRADING SETUP */}
          <div className="border-2 border-slate-700/90 rounded-xl overflow-hidden bg-[#0f1a36]/60 flex flex-col justify-between">
            {/* Header with lavender highlight underline matching screenshot */}
            <div className="py-2.5 px-4 border-b-2 border-slate-700/90 text-center bg-[#132042]">
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-slate-100 border-b-2 border-purple-400 pb-0.5 inline-block">
                TRADING SETUP
              </span>
            </div>

            {/* Rows list */}
            <div className="divide-y divide-slate-700/80 text-xs sm:text-sm">
              {/* POSITION */}
              <div className="grid grid-cols-3 items-center px-3 sm:px-4 py-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  POSITION:
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <select
                      value={position}
                      onChange={(e) => onChange('position', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-400"
                    >
                      {POSITION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-100">{position || 'Intraday'}</span>
                  )}
                </div>
              </div>

              {/* TIME */}
              <div className="grid grid-cols-3 items-center px-3 sm:px-4 py-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  TIME:
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. 09:30 AM"
                      value={time}
                      onChange={(e) => onChange('time', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-400 font-mono"
                    />
                  ) : (
                    <span className="font-mono text-slate-100">{time || '—'}</span>
                  )}
                </div>
              </div>

              {/* LOT SIZE (with lavender highlight from screenshot) */}
              <div className="grid grid-cols-3 items-center px-3 sm:px-4 py-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  <span className="bg-purple-950/60 text-purple-200 px-1 py-0.5 rounded border border-purple-500/30">
                    LOT SIZE:
                  </span>
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Units / Quantity"
                      value={lotSize}
                      onChange={(e) => {
                        onChange('lotSize', e.target.value)
                        onChange('quantity', e.target.value)
                      }}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-400 font-mono"
                    />
                  ) : (
                    <span className="font-mono font-bold text-slate-100">{lotSize}</span>
                  )}
                </div>
              </div>

              {/* LONG/SHORT (with lavender highlight from screenshot) */}
              <div className="grid grid-cols-3 items-center px-3 sm:px-4 py-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  <span className="bg-purple-950/60 text-purple-200 px-1 py-0.5 rounded border border-purple-500/30">
                    LONG/SHORT:
                  </span>
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onChange('tradeType', 'Long')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                          tradeType === 'Long'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                        }`}
                      >
                        LONG
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange('tradeType', 'Short')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                          tradeType === 'Short'
                            ? 'bg-rose-600 text-white shadow'
                            : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                        }`}
                      >
                        SHORT
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`font-black uppercase tracking-wider ${
                        tradeType === 'Long' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tradeType}
                    </span>
                  )}
                </div>
              </div>

              {/* TYPE */}
              <div className="grid grid-cols-3 items-center px-3 sm:px-4 py-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  TYPE:
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <select
                      value={instrumentType}
                      onChange={(e) => onChange('instrumentType', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-400"
                    >
                      {INSTRUMENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-100">{instrumentType || 'Equity'}</span>
                  )}
                </div>
              </div>

              {/* STRATEGY */}
              <div className="grid grid-cols-3 items-center px-3 sm:px-4 py-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  STRATEGY:
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      list="strategy-list"
                      placeholder="e.g. Breakout, Pullback"
                      value={strategy}
                      onChange={(e) => onChange('strategy', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-400"
                    />
                  ) : (
                    <span className="font-semibold text-slate-100">{strategy || '—'}</span>
                  )}
                  {isEditing && (
                    <datalist id="strategy-list">
                      {STRATEGY_OPTIONS.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT BOX: CHART ANALYSIS */}
          <div className="border-2 border-slate-700/90 rounded-xl overflow-hidden bg-[#0f1a36]/60 flex flex-col justify-between">
            {/* Header with lavender highlight underline */}
            <div className="py-2.5 px-4 border-b-2 border-slate-700/90 text-center bg-[#132042]">
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-slate-100 border-b-2 border-purple-400 pb-0.5 inline-block">
                CHART ANALYSIS
              </span>
            </div>

            {/* Chart Area */}
            <div className="p-3 sm:p-4 flex-1 flex flex-col items-center justify-center min-h-[220px] bg-[#091024]/50 relative">
              {imageUrl ? (
                <div className="w-full flex-1 flex flex-col items-center justify-center relative group">
                  <img
                    src={imageUrl}
                    alt="Chart Analysis"
                    onClick={() => setZoomImage(true)}
                    className="max-h-48 sm:max-h-56 w-auto max-w-full object-contain rounded-lg border border-slate-700 cursor-zoom-in hover:brightness-105 transition-all shadow-md"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setZoomImage(true)}
                      className="p-1 rounded bg-black/70 hover:bg-black text-white text-xs backdrop-blur-sm"
                      title="Enlarge Chart"
                    >
                      <Maximize2 size={13} />
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => onChange('imageUrl', '')}
                        className="p-1 rounded bg-rose-900/80 hover:bg-rose-700 text-white text-xs backdrop-blur-sm"
                        title="Remove Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center py-6 text-center text-slate-500 space-y-2">
                  <ImageIcon size={36} className="opacity-40" />
                  <p className="text-xs font-medium text-slate-400">
                    {isEditing
                      ? 'Upload chart screenshot, paste image (Ctrl+V), or enter URL'
                      : 'No chart image attached for this trade'}
                  </p>
                </div>
              )}

              {/* Upload Controls in Edit Mode */}
              {isEditing && (
                <div className="w-full pt-3 mt-2 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1 px-2.5 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Upload size={12} />
                      <span>Upload Chart Image</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Or paste chart image URL here..."
                    value={imageUrl}
                    onChange={(e) => onChange('imageUrl', e.target.value)}
                    className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-400"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3. TRADE MANAGEMENT SECTION ───────────────────────────────── */}
        <div className="border-2 border-slate-700/90 rounded-xl overflow-hidden bg-[#0f1a36]/60">
          {/* Header with lavender highlight */}
          <div className="py-2.5 px-4 border-b-2 border-slate-700/90 text-center bg-[#132042]">
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-slate-100 border-b-2 border-purple-400 pb-0.5 inline-block">
              TRADE MANAGEMENT
            </span>
          </div>

          {/* 2x3 Grid Table with dividing lines */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-slate-700/80 text-xs sm:text-sm">
            {/* Column 1: ENTRY, EXIT, R/R */}
            <div className="divide-y divide-slate-700/80">
              {/* ENTRY */}
              <div className="grid grid-cols-3 items-center px-4 py-2.5">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  ENTRY:
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.05"
                      required
                      placeholder="0.00"
                      value={entryPrice}
                      onChange={(e) => onChange('entryPrice', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-blue-400"
                    />
                  ) : (
                    <span className="font-mono font-bold text-slate-100">
                      {entryPrice ? `₹${Number(entryPrice).toLocaleString('en-IN')}` : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* EXIT */}
              <div className="grid grid-cols-3 items-center px-4 py-2.5">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  EXIT:
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.05"
                      placeholder="0.00 (leave blank if open)"
                      value={exitPrice}
                      onChange={(e) => onChange('exitPrice', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-blue-400"
                    />
                  ) : (
                    <span className="font-mono font-bold text-slate-100">
                      {exitPrice ? `₹${Number(exitPrice).toLocaleString('en-IN')}` : 'OPEN'}
                    </span>
                  )}
                </div>
              </div>

              {/* R/R (with lavender highlight from screenshot) */}
              <div className="grid grid-cols-3 items-center px-4 py-2.5">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  <span className="bg-purple-950/60 text-purple-200 px-1 py-0.5 rounded border border-purple-500/30">
                    R/R:
                  </span>
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. 1 : 2.5"
                      value={computedMetrics.rr !== '—' ? computedMetrics.rr : riskReward}
                      onChange={(e) => onChange('riskReward', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-blue-400"
                    />
                  ) : (
                    <span className="font-mono font-bold text-blue-400">
                      {computedMetrics.rr}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: STOP LOSS, TAKE PROFIT, PROFIT/LOSS */}
            <div className="divide-y divide-slate-700/80">
              {/* STOP LOSS (with lavender highlight from screenshot) */}
              <div className="grid grid-cols-3 items-center px-4 py-2.5">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  <span className="bg-purple-950/60 text-purple-200 px-1 py-0.5 rounded border border-purple-500/30">
                    STOP LOSS:
                  </span>
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.05"
                      placeholder="0.00"
                      value={stopLoss}
                      onChange={(e) => onChange('stopLoss', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-blue-400"
                    />
                  ) : (
                    <span className="font-mono font-bold text-rose-400">
                      {stopLoss ? `₹${Number(stopLoss).toLocaleString('en-IN')}` : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* TAKE PROFIT (with lavender highlight from screenshot) */}
              <div className="grid grid-cols-3 items-center px-4 py-2.5">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  <span className="bg-purple-950/60 text-purple-200 px-1 py-0.5 rounded border border-purple-500/30">
                    TAKE PROFIT:
                  </span>
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.05"
                      placeholder="0.00"
                      value={takeProfit}
                      onChange={(e) => onChange('takeProfit', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-blue-400"
                    />
                  ) : (
                    <span className="font-mono font-bold text-emerald-400">
                      {takeProfit ? `₹${Number(takeProfit).toLocaleString('en-IN')}` : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* PROFIT/LOSS */}
              <div className="grid grid-cols-3 items-center px-4 py-2.5">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  PROFIT/LOSS:
                </span>
                <div className="col-span-2">
                  {computedMetrics.pnl !== null ? (
                    <span
                      className={`font-mono font-black text-sm ${
                        computedMetrics.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatINR(computedMetrics.pnl, { compact: false, showSign: true })}
                      {computedMetrics.pnlPercent !== null && (
                        <span className="text-xs ml-1.5 opacity-90">
                          ({computedMetrics.pnlPercent > 0 ? '+' : ''}
                          {computedMetrics.pnlPercent.toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-xs italic">
                      {isEditing ? 'Calculated on exit price' : 'OPEN POSITION'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. TRADE ANALYSIS SECTION ─────────────────────────────────── */}
        <div className="border-2 border-slate-700/90 rounded-xl overflow-hidden bg-[#0f1a36]/60">
          {/* Header */}
          <div className="py-2.5 px-4 border-b-2 border-slate-700/90 text-center bg-[#132042]">
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-slate-100 border-b-2 border-purple-400 pb-0.5 inline-block">
              TRADE ANALYSIS
            </span>
          </div>

          <div className="divide-y divide-slate-700/80 text-xs sm:text-sm">
            {/* REASON FOR TRADE */}
            <div className="p-3 sm:p-4 space-y-1.5">
              <span className="font-extrabold text-slate-300 uppercase tracking-wider block">
                REASON FOR TRADE:
              </span>
              {isEditing ? (
                <textarea
                  rows="2"
                  placeholder="Detail the technical setup trigger, chart pattern, support/resistance, or indicator confluence..."
                  value={entryReason}
                  onChange={(e) => onChange('entryReason', e.target.value)}
                  className="w-full bg-[#152244] border border-slate-600 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-400 leading-relaxed"
                />
              ) : (
                <p className="text-slate-200 leading-relaxed bg-[#091024]/50 p-2.5 rounded-lg border border-slate-800 font-sans">
                  {entryReason || <span className="text-slate-500 italic">No trade reason specified.</span>}
                </p>
              )}
            </div>

            {/* ASSUMPTIONS BEFORE TRADE */}
            <div className="p-3 sm:p-4 space-y-1.5">
              <span className="font-extrabold text-slate-300 uppercase tracking-wider block">
                ASSUMPTIONS BEFORE TRADE:
              </span>
              {isEditing ? (
                <textarea
                  rows="2"
                  placeholder="Market conditions, macro sentiment, risk factors, or sector momentum assumed prior to execution..."
                  value={assumptions}
                  onChange={(e) => onChange('assumptions', e.target.value)}
                  className="w-full bg-[#152244] border border-slate-600 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-400 leading-relaxed"
                />
              ) : (
                <p className="text-slate-200 leading-relaxed bg-[#091024]/50 p-2.5 rounded-lg border border-slate-800 font-sans">
                  {assumptions || (
                    <span className="text-slate-500 italic">
                      No pre-trade assumptions recorded.
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── 5. FEEDBACK SECTION ───────────────────────────────────────── */}
        <div className="border-2 border-slate-700/90 rounded-xl overflow-hidden bg-[#0f1a36]/60">
          {/* Header */}
          <div className="py-2.5 px-4 border-b-2 border-slate-700/90 text-center bg-[#132042]">
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-slate-100 border-b-2 border-purple-400 pb-0.5 inline-block">
              FEEDBACK
            </span>
          </div>

          <div className="divide-y divide-slate-700/80 text-xs sm:text-sm">
            {/* Row 1: DISCIPLINED (Y/N) | FOLLOWED RULES (Y/N) */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-slate-700/80">
              {/* DISCIPLINED */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-extrabold text-slate-300 uppercase tracking-wider">
                  DISCIPLINED
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChange('disciplined', 'Y')}
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                        disciplined === 'Y'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                      }`}
                    >
                      Y
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange('disciplined', 'N')}
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                        disciplined === 'N'
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                      }`}
                    >
                      N
                    </button>
                  </div>
                ) : (
                  <span
                    className={`font-black text-sm px-2.5 py-0.5 rounded border ${
                      disciplined === 'Y'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {disciplined === 'Y' ? 'YES' : 'NO'}
                  </span>
                )}
              </div>

              {/* FOLLOWED RULES */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-extrabold text-slate-300 uppercase tracking-wider">
                  FOLLOWED RULES
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChange('followedRules', 'Y')}
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                        followedRules === 'Y'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                      }`}
                    >
                      Y
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange('followedRules', 'N')}
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                        followedRules === 'N'
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                      }`}
                    >
                      N
                    </button>
                  </div>
                ) : (
                  <span
                    className={`font-black text-sm px-2.5 py-0.5 rounded border ${
                      followedRules === 'Y'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {followedRules === 'Y' ? 'YES' : 'NO'}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: RATING (Interactive 5 Stars) */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-extrabold text-slate-300 uppercase tracking-wider">
                RATING
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isActive = starIdx <= rating
                  return (
                    <button
                      type="button"
                      key={starIdx}
                      disabled={!isEditing}
                      onClick={() => isEditing && onChange('rating', starIdx)}
                      className={`p-1 rounded transition-transform ${
                        isEditing ? 'cursor-pointer hover:scale-125' : 'cursor-default'
                      }`}
                      title={`${starIdx} Star${starIdx > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={22}
                        className={
                          isActive
                            ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                            : 'text-slate-600 fill-slate-800'
                        }
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── ACTION BUTTONS (IN EDIT/CREATE MODE) ───────────────────────── */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/80">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? 'Saving Trade...' : mode === 'edit' ? 'Update Trade' : 'Save Trade'}
            </button>
          </div>
        )}
      </div>

      {/* ─── FULL IMAGE LIGHTBOX MODAL ──────────────────────────────────── */}
      {zoomImage && imageUrl && (
        <div
          onClick={() => setZoomImage(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={imageUrl}
              alt="Full Chart Analysis"
              className="max-h-[85vh] max-w-full object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setZoomImage(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
