import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Clock,
  Upload,
  Image as ImageIcon,
  Star,
  Check,
  X,
  Maximize2,
  Trash2,
  Plus,
  Sparkles,
  Smile,
  BarChart3,
} from 'lucide-react'
import { formatINR } from '../../lib/journalAnalytics'
import { searchStockCatalog, DEFAULT_STOCK_LOT_SIZES } from '../../lib/stockCatalog'
import StrategyPerformanceDashboard from './StrategyPerformanceDashboard'

const SUGGESTED_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN',
  'BHARTIARTL', 'ITC', 'LT', 'MARUTI', 'TATASTEEL', 'BEL', 'HAL',
  'NIFTY50', 'BANKNIFTY'
]

export const BEFORE_TRADE_EMOTIONS = [
  {
    name: 'Calm',
    marathi: 'शांत',
    desc: 'मन स्थिर आहे, कोणताही ताण नाही.',
  },
  {
    name: 'Confident',
    marathi: 'आत्मविश्वास',
    desc: 'माझ्या Setup वर विश्वास आहे.',
  },
  {
    name: 'Fearful',
    marathi: 'भीती',
    desc: 'Loss होण्याची भीती वाटते.',
  },
  {
    name: 'Anxious',
    marathi: 'चिंता',
    desc: 'Market बद्दल चिंता वाटते.',
  },
  {
    name: 'Greedy',
    marathi: 'लोभ',
    desc: 'जास्त Profit मिळवण्याची इच्छा.',
  },
  {
    name: 'Excited',
    marathi: 'उत्साहित',
    desc: 'Trade घेण्याची खूप उत्सुकता.',
  },
  {
    name: 'Impatient',
    marathi: 'अधीर',
    desc: 'Setup पूर्ण होण्याआधी Entry घ्यायची घाई.',
  },
  {
    name: 'Doubtful',
    marathi: 'साशंक',
    desc: 'Setup योग्य आहे की नाही याबद्दल शंका.',
  },
  {
    name: 'FOMO',
    marathi: 'संधी गमावण्याची भीती',
    desc: 'Market निघून जाईल म्हणून घाई.',
  },
  {
    name: 'Frustrated',
    marathi: 'त्रस्त',
    desc: 'मागील Loss मुळे मन खराब आहे.',
  },
  {
    name: 'Revengeful',
    marathi: 'बदला घेण्याची भावना',
    desc: 'मागील Loss भरून काढण्याची इच्छा.',
  },
]

export const AFTER_TRADE_EMOTIONS = [
  {
    name: 'Satisfied',
    marathi: 'समाधानी',
    desc: 'Plan पाळला आणि Result स्वीकारला.',
  },
  {
    name: 'Regret',
    marathi: 'पश्चात्ताप',
    desc: 'लवकर Exit केला किंवा Trade Miss केला.',
  },
  {
    name: 'Frustrated',
    marathi: 'त्रस्त',
    desc: 'Loss किंवा स्वतःची चूक झाली.',
  },
  {
    name: 'Relieved',
    marathi: 'सुटकेचा आनंद',
    desc: 'Trade संपल्यावर तनाव कमी झाला.',
  },
  {
    name: 'Disappointed',
    marathi: 'निराश',
    desc: 'अपेक्षित Result मिळाला नाही.',
  },
  
  {
    name: 'Confident',
    marathi: 'आत्मविश्वास',
    desc: 'चांगला Trade झाल्याने आत्मविश्वास वाढला.',
  },
  {
    name: 'Overconfident',
    marathi: 'अतिआत्मविश्वास',
    desc: 'Profit मुळे स्वतःवर जास्त विश्वास बसला.',
  },
  {
    name: 'Greedy',
    marathi: 'लोभी',
    desc: 'अजून जास्त Profit हवा होता.',
  },
  {
    name: 'Fearful',
    marathi: 'भयभीत',
    desc: 'पुढचा Trade घेण्याची भीती वाटते.',
  },
  {
    name: 'Anxious',
    marathi: 'चिंताग्रस्त',
    desc: 'Loss किंवा पुढील Trading बद्दल चिंता.',
  },
  {
    name: 'Angry',
    marathi: 'रागावलेला',
    desc: 'Market किंवा स्वतःच्या चुकीमुळे राग.',
  },
  {
    name: 'Guilty',
    marathi: 'अपराधीपणा',
    desc: 'Trading Rules मोडले.',
  },
  {
    name: 'Jealous',
    marathi: 'मत्सरी',
    desc: 'दुसऱ्या Trader चा Profit पाहून वाईट वाटले.',
  },
  {
    name: 'Excited',
    marathi: 'उत्साहित',
    desc: 'मोठा Profit मिळाला.',
  },
  {
    name: 'Confused',
    marathi: 'गोंधळलेला',
    desc: 'Trade योग्य होता की चुकीचा हे समजत नाही.',
  },
  {
    name: 'Calm',
    marathi: 'शांत',
    desc: 'Result स्वीकारून मन स्थिर आहे.',
  },
  {
    name: 'Impatient',
    marathi: 'अधीर',
    desc: 'पुढचा Trade लगेच घेण्याची इच्छा.',
  },
]

const DEFAULT_ASSUMPTIONS = [
  'Market Bullish Sentiment',
  'High Volume Confirmation',
  'Sector Strength / Tailwind',
  'Favorable Risk-to-Reward',
  'Tight Stop Loss Setup',
  'RSI Oversold / Divergence',
  'Higher Timeframe Confluence',
  'Range-Bound Market',
  'Pre-Market Gap Fill',
]

const STRATEGY_OPTIONS = [
  'Tiger Breakout',
  'Camarilla Pivot',
  'First Candle Close Range',
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
  allTrades = [],
}) {
  const isEditing = mode === 'create' || mode === 'edit'
  const [zoomImage, setZoomImage] = useState(false)
  const [showStrategyDashboard, setShowStrategyDashboard] = useState(false)
  const fileInputRef = useRef(null)
  const symbolWrapperRef = useRef(null)

  // Symbol suggestion dropdown state
  const [symbolSuggestions, setSymbolSuggestions] = useState([])
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)

  // Emotion tabs & slicers state
  const [activeEmotionTab, setActiveEmotionTab] = useState('before') // 'before' | 'after'
  const [customBeforeEmotions, setCustomBeforeEmotions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_before_trade_emotions') || '[]')
    } catch {
      return []
    }
  })
  const [customAfterEmotions, setCustomAfterEmotions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_after_trade_emotions') || '[]')
    } catch {
      return []
    }
  })
  const [showAddEmotion, setShowAddEmotion] = useState(false)
  const [newEmotionName, setNewEmotionName] = useState('')
  const [newEmotionMarathi, setNewEmotionMarathi] = useState('')
  const [newEmotionDesc, setNewEmotionDesc] = useState('')

  // Custom assumptions state & inline add modal
  const [customAssumptions, setCustomAssumptions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_trade_assumptions') || '[]')
    } catch {
      return []
    }
  })
  const [newAssumptionInput, setNewAssumptionInput] = useState('')
  const [showAddAssumption, setShowAddAssumption] = useState(false)

  // Use either active formData (edit/create) or trade (view)
  const currentData = isEditing ? formData : trade

  // Normalize fields with clean fallbacks
  const symbol = currentData?.symbol || ''
  const tradeType = currentData?.tradeType || 'Long'
  const entryDate = currentData?.entryDate || ''
  const position = currentData?.position || 'Intraday'
  const time = currentData?.time || (entryDate ? new Date(entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '')
  const rawLot = currentData?.lotSize !== undefined && currentData?.lotSize !== null
    ? currentData.lotSize
    : (currentData?.quantity !== undefined && currentData?.quantity !== null ? currentData.quantity : '')
  // Default lot size is blank instead of 0 or 1 so user can freely type their value
  const lotSize = (rawLot === 0 || rawLot === '0' || rawLot === '' || rawLot === null || rawLot === undefined)
    ? ''
    : rawLot
  const instrumentType = currentData?.instrumentType || 'Equity'
  const rawOption = (currentData?.optionType || 'Call').toUpperCase().trim()
  const optionType = rawOption === 'PUT' || rawOption === 'PE' ? 'PUT' : 'CALL'
  const isOptions = instrumentType === 'Options' || instrumentType === 'Option'
  const strategy = currentData?.strategy || ''
  const imageUrl = currentData?.imageUrl || ''
  const chartNotes = currentData?.chartNotes || ''
  const entryPrice = currentData?.entryPrice !== undefined && currentData?.entryPrice !== null ? currentData?.entryPrice : ''
  const stopLoss = currentData?.stopLoss !== undefined && currentData?.stopLoss !== null ? currentData?.stopLoss : ''
  const exitPrice = currentData?.exitPrice !== undefined && currentData?.exitPrice !== null ? currentData?.exitPrice : ''
  const takeProfit = currentData?.takeProfit !== undefined && currentData?.takeProfit !== null ? currentData?.takeProfit : ''
  const riskReward = currentData?.riskReward || ''
  const beforeTradeEmotions = currentData?.beforeTradeEmotions || currentData?.beforeEmotions || currentData?.emotionsBefore || ''
  const afterTradeEmotions = currentData?.afterTradeEmotions || currentData?.afterEmotions || currentData?.emotionsAfter || ''
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
    const qty = parseInt(lotSize, 10)

    let calcPnl = null
    let calcPnlPercent = null
    if (!isNaN(entry) && !isNaN(exit) && entry > 0 && !isNaN(qty) && qty > 0) {
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

  // Compress large screenshots/images using HTML5 canvas
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const rawData = event.target?.result
        if (!rawData) return resolve(null)
        const img = new Image()
        img.onload = () => {
          const maxDim = 1600
          let width = img.width
          let height = img.height

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          try {
            const compressed = canvas.toDataURL('image/jpeg', 0.85)
            resolve(compressed)
          } catch {
            resolve(rawData)
          }
        }
        img.onerror = () => resolve(rawData)
        img.src = rawData
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  // Handle local image file upload -> Base64
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      alert('Image file is too large (max 20 MB).')
      return
    }
    const compressed = await compressImageFile(file)
    if (compressed) {
      onChange('imageUrl', compressed)
    }
  }

  // Handle paste screenshot from clipboard
  const handlePaste = async (e) => {
    if (!isEditing) return
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile()
        if (blob) {
          e.preventDefault()
          const compressed = await compressImageFile(blob)
          if (compressed) {
            onChange('imageUrl', compressed)
          }
        }
        break
      }
    }
  }

  // Helper to retrieve previous or default lot size for a stock
  const getPreviousLotSize = useCallback((targetSymbol) => {
    if (!targetSymbol) return null
    const sym = targetSymbol.toUpperCase().trim()

    // 1. Check local storage cache of user's customized lot sizes
    try {
      const savedMap = JSON.parse(localStorage.getItem('stock_last_lot_sizes') || '{}')
      if (savedMap[sym]) return Number(savedMap[sym])
    } catch { }

    // 2. Check trade history
    if (Array.isArray(allTrades) && allTrades.length > 0) {
      const match = allTrades.find(
        (t) => t.symbol?.toUpperCase().trim() === sym && (t.lotSize || t.quantity)
      )
      if (match) {
        return Number(match.lotSize || match.quantity)
      }
    }

    // 3. Fallback to official default lot sizes (NIFTY: 65, BANKNIFTY: 30, FINNIFTY: 60, MIDCPNIFTY: 120)
    if (DEFAULT_STOCK_LOT_SIZES[sym]) {
      return DEFAULT_STOCK_LOT_SIZES[sym]
    }

    return null
  }, [allTrades])

  // Trader's most recent stocks (from trade history + localStorage, falling back to popular market stocks)
  const traderRecentStocks = useMemo(() => {
    const list = []
    const seen = new Set()

    // 1. From allTrades in reverse chronological order
    if (Array.isArray(allTrades) && allTrades.length > 0) {
      const sorted = [...allTrades].sort(
        (a, b) => new Date(b.entryDate || b.createdAt || 0) - new Date(a.entryDate || a.createdAt || 0)
      )
      for (const t of sorted) {
        const sym = t.symbol?.toUpperCase()?.trim()
        if (sym && !seen.has(sym)) {
          seen.add(sym)
          list.push(sym)
          if (list.length >= 8) break
        }
      }
    }

    // 2. From localStorage trader_recent_stocks
    try {
      const stored = JSON.parse(localStorage.getItem('trader_recent_stocks') || '[]')
      if (Array.isArray(stored)) {
        for (const s of stored) {
          const sym = typeof s === 'string' ? s.toUpperCase().trim() : ''
          if (sym && !seen.has(sym)) {
            seen.add(sym)
            list.push(sym)
            if (list.length >= 8) break
          }
        }
      }
    } catch { }

    // 3. Fallback to market suggested symbols if fewer than 6
    for (const s of SUGGESTED_SYMBOLS) {
      if (!seen.has(s)) {
        seen.add(s)
        list.push(s)
        if (list.length >= 8) break
      }
    }

    return list
  }, [allTrades])

  // Record stock symbol into recent stocks
  const recordRecentStock = (sym) => {
    if (!sym || typeof sym !== 'string') return
    const upper = sym.toUpperCase().trim()
    if (!upper) return
    try {
      const existing = JSON.parse(localStorage.getItem('trader_recent_stocks') || '[]')
      const filtered = Array.isArray(existing) ? existing.filter((s) => s !== upper) : []
      const updated = [upper, ...filtered].slice(0, 15)
      localStorage.setItem('trader_recent_stocks', JSON.stringify(updated))
    } catch { }
  }

  // Current symbol's previous or default lot size suggestion
  const previousLotSize = useMemo(() => {
    return getPreviousLotSize(symbol)
  }, [symbol, getPreviousLotSize])

  // Save updated lot size to state and localStorage whenever changed
  const handleLotSizeChange = (val) => {
    onChange('lotSize', val)
    onChange('quantity', val)
    if (symbol && val && Number(val) > 0) {
      try {
        const savedMap = JSON.parse(localStorage.getItem('stock_last_lot_sizes') || '{}')
        savedMap[symbol.toUpperCase().trim()] = Number(val)
        localStorage.setItem('stock_last_lot_sizes', JSON.stringify(savedMap))
      } catch { }
    }
  }

  // Handle symbol change with autocomplete suggestions
  const handleSymbolChange = (val) => {
    const upper = val.toUpperCase()
    onChange('symbol', upper)

    if (upper.trim().length >= 1) {
      const results = searchStockCatalog(upper, 8)
      setSymbolSuggestions(results)
      setShowSymbolDropdown(results.length > 0)
    } else {
      setSymbolSuggestions([])
      setShowSymbolDropdown(false)
    }
  }

  // When a stock suggestion is selected: lot size remains blank for user to enter their value
  const handleSelectSymbol = (item) => {
    const sym = item.symbol?.toUpperCase()?.trim() || ''
    onChange('symbol', sym)
    setShowSymbolDropdown(false)
    recordRecentStock(sym)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (symbolWrapperRef.current && !symbolWrapperRef.current.contains(e.target)) {
        setShowSymbolDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to parse comma-separated or array emotions
  const getEmotionsList = useCallback((val) => {
    if (!val) return []
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean)
    if (typeof val === 'string') {
      return val.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return []
  }, [])

  const beforeEmotionsList = useMemo(() => getEmotionsList(beforeTradeEmotions), [beforeTradeEmotions, getEmotionsList])
  const afterEmotionsList = useMemo(() => getEmotionsList(afterTradeEmotions), [afterTradeEmotions, getEmotionsList])

  // Slicer handlers: Before Trade Emotions
  const isBeforeEmotionActive = useCallback((name) => {
    return beforeEmotionsList.some((e) => e.toLowerCase() === name.toLowerCase())
  }, [beforeEmotionsList])

  const toggleBeforeEmotion = (name) => {
    if (!isEditing) return
    const current = [...beforeEmotionsList]
    const idx = current.findIndex((e) => e.toLowerCase() === name.toLowerCase())
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push(name)
    }
    const val = current.join(', ')
    onChange('beforeTradeEmotions', val)
    if (currentData?.beforeEmotions !== undefined) {
      onChange('beforeEmotions', val)
    }
  }

  // Slicer handlers: After Trade Emotions
  const isAfterEmotionActive = useCallback((name) => {
    return afterEmotionsList.some((e) => e.toLowerCase() === name.toLowerCase())
  }, [afterEmotionsList])

  const toggleAfterEmotion = (name) => {
    if (!isEditing) return
    const current = [...afterEmotionsList]
    const idx = current.findIndex((e) => e.toLowerCase() === name.toLowerCase())
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push(name)
    }
    const val = current.join(', ')
    onChange('afterTradeEmotions', val)
    if (currentData?.afterEmotions !== undefined) {
      onChange('afterEmotions', val)
    }
  }

  const clearCurrentTabEmotions = () => {
    if (!isEditing) return
    if (activeEmotionTab === 'before') {
      onChange('beforeTradeEmotions', '')
      if (currentData?.beforeEmotions !== undefined) onChange('beforeEmotions', '')
    } else {
      onChange('afterTradeEmotions', '')
      if (currentData?.afterEmotions !== undefined) onChange('afterEmotions', '')
    }
  }

  const handleAddNewEmotion = () => {
    const name = newEmotionName.trim()
    if (!name) return
    const marathi = newEmotionMarathi.trim()
    const desc = newEmotionDesc.trim()
    const newEntry = { name, marathi: marathi || name, desc: desc || '' }

    if (activeEmotionTab === 'before') {
      const exists = [...BEFORE_TRADE_EMOTIONS, ...customBeforeEmotions].some(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      )
      if (!exists) {
        const updated = [...customBeforeEmotions, newEntry]
        setCustomBeforeEmotions(updated)
        try {
          localStorage.setItem('custom_before_trade_emotions', JSON.stringify(updated))
        } catch { }
      }
      toggleBeforeEmotion(name)
    } else {
      const exists = [...AFTER_TRADE_EMOTIONS, ...customAfterEmotions].some(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      )
      if (!exists) {
        const updated = [...customAfterEmotions, newEntry]
        setCustomAfterEmotions(updated)
        try {
          localStorage.setItem('custom_after_trade_emotions', JSON.stringify(updated))
        } catch { }
      }
      toggleAfterEmotion(name)
    }

    setNewEmotionName('')
    setNewEmotionMarathi('')
    setNewEmotionDesc('')
    setShowAddEmotion(false)
  }

  const allBeforeEmotions = useMemo(() => {
    return [...BEFORE_TRADE_EMOTIONS, ...customBeforeEmotions]
  }, [customBeforeEmotions])

  const allAfterEmotions = useMemo(() => {
    return [...AFTER_TRADE_EMOTIONS, ...customAfterEmotions]
  }, [customAfterEmotions])

  // Slicer handlers: Assumptions before trade
  const toggleAssumption = (text) => {
    const current = (assumptions || '').trim()
    if (!current) {
      onChange('assumptions', text)
      return
    }
    const parts = current.split(',').map((s) => s.trim()).filter(Boolean)
    const index = parts.findIndex((p) => p.toLowerCase() === text.toLowerCase())
    if (index >= 0) {
      parts.splice(index, 1)
      onChange('assumptions', parts.join(', '))
    } else {
      onChange('assumptions', `${current}, ${text}`)
    }
  }

  const isAssumptionActive = (text) => {
    if (!assumptions) return false
    return assumptions.toLowerCase().includes(text.toLowerCase())
  }

  const handleAddNewAssumption = () => {
    const val = newAssumptionInput.trim()
    if (!val) return
    if (
      !customAssumptions.some((a) => a.toLowerCase() === val.toLowerCase()) &&
      !DEFAULT_ASSUMPTIONS.some((a) => a.toLowerCase() === val.toLowerCase())
    ) {
      const updated = [...customAssumptions, val]
      setCustomAssumptions(updated)
      try {
        localStorage.setItem('custom_trade_assumptions', JSON.stringify(updated))
      } catch { }
    }
    toggleAssumption(val)
    setNewAssumptionInput('')
    setShowAddAssumption(false)
  }

  return (
    <div
      onPaste={handlePaste}
      className="w-full max-w-4xl mx-auto font-sans text-slate-100 select-text"
    >
      {/* ─── TEMPLATE CONTAINER ─────────────────────────────────────────── */}
      <div className="bg-[#0b1329] border-2 border-slate-700/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">

        {/* ─── TOP TOOLBAR: STRATEGY ANALYTICS SHORTCUT ───────────────────── */}
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trade Journal
            </span>
            {strategy && (
              <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                Strategy: {strategy}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowStrategyDashboard(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            title="Open Independent Strategy Performance & Win Rate Analysis"
          >
            <BarChart3 size={13} />
            <span>Strategy Analytics & Win Rate</span>
          </button>
        </div>

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

          {/* SYMBOL WITH AUTOCOMPLETE & STOCK NAME SUGGESTIONS */}
          <div className="flex items-center gap-3 relative" ref={symbolWrapperRef}>
            <span className="font-extrabold tracking-wider text-xs sm:text-sm text-slate-300 uppercase shrink-0">
              SYMBOL:
            </span>
            {isEditing ? (
              <div className="flex-1 space-y-1.5 relative">
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Search stock by symbol or name (e.g. REL, TATA, INFY)..."
                    value={symbol}
                    onChange={(e) => handleSymbolChange(e.target.value)}
                    onFocus={() => {
                      if (symbol) {
                        const results = searchStockCatalog(symbol, 8)
                        setSymbolSuggestions(results)
                        setShowSymbolDropdown(results.length > 0)
                      }
                    }}
                    className="w-full bg-[#152244] border border-slate-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white font-bold placeholder:text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 uppercase tracking-wider pr-7"
                  />
                  {symbol && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange('symbol', '')
                        setShowSymbolDropdown(false)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-0.5"
                      title="Clear"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List with Company Names */}
                {showSymbolDropdown && symbolSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#091124] border-2 border-blue-500/60 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
                    {symbolSuggestions.map((item) => {
                      const itemPrevLot = getPreviousLotSize(item.symbol)
                      return (
                        <div
                          key={item.symbol}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectSymbol(item)
                          }}
                          className="px-3 py-2 hover:bg-blue-600/20 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-white group-hover:text-blue-300">
                                {item.symbol}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                {item.sector || item.type}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {item.name}
                            </span>
                          </div>
                          {itemPrevLot && (
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                              Prev Lot: {itemPrevLot}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Quick Symbol Pills: Trader's Most Recent Stocks */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold mr-0.5 flex items-center gap-1">
                    <Clock size={10} className="text-blue-400" />
                    <span>Recent:</span>
                  </span>
                  {traderRecentStocks.slice(0, 7).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => handleSelectSymbol({ symbol: s })}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all cursor-pointer ${symbol === s
                        ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-400 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      title={`Select ${s}`}
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
                  className={`px-2 py-0.5 rounded text-[11px] font-extrabold font-mono uppercase ${tradeType === 'Long'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                >
                  {tradeType}
                </span>
                {isOptions && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${optionType === 'CALL'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                  >
                    {optionType}
                  </span>
                )}
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
                <div className="col-span-2 space-y-1">
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter lot size"
                        value={lotSize}
                        onChange={(e) => handleLotSizeChange(e.target.value)}
                        className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-400 font-mono"
                      />
                      {/* Previous or Default Lot Size Suggestion Pill */}
                      {previousLotSize && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleLotSizeChange(previousLotSize)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${Number(lotSize) === Number(previousLotSize)
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                              : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                              }`}
                            title={`Apply lot size (${previousLotSize}) for ${symbol || 'this stock'}`}
                          >
                            <Sparkles size={10} className="text-amber-400" />
                            <span>
                              {Number(lotSize) === Number(previousLotSize)
                                ? `Using ${DEFAULT_STOCK_LOT_SIZES[symbol?.toUpperCase()?.trim()] ? 'default' : 'previous'} lot for ${symbol || 'share'}: ${previousLotSize} units`
                                : `Default lot for ${symbol || 'share'} is ${previousLotSize} units (Click to apply)`}
                            </span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="font-mono font-bold text-slate-100">{lotSize || '—'}</span>
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
                        className={`flex-1 py-1 rounded text-xs font-bold transition-all ${tradeType === 'Long'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                          }`}
                      >
                        LONG
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange('tradeType', 'Short')}
                        className={`flex-1 py-1 rounded text-xs font-bold transition-all ${tradeType === 'Short'
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                          }`}
                      >
                        SHORT
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`font-black uppercase tracking-wider ${tradeType === 'Long' ? 'text-emerald-400' : 'text-rose-400'
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
                <div className="col-span-2 space-y-1.5">
                  {isEditing ? (
                    <>
                      <select
                        value={instrumentType}
                        onChange={(e) => {
                          const val = e.target.value
                          onChange('instrumentType', val)
                          if ((val === 'Options' || val === 'Option') && !currentData?.optionType) {
                            onChange('optionType', 'CALL')
                          }
                        }}
                        className="w-full bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-400"
                      >
                        {INSTRUMENT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      {/* CALL / PUT buttons on downside when TYPE is Options */}
                      {isOptions && (
                        <div className="flex items-center gap-2 pt-0.5 animate-in fade-in duration-150">
                          <button
                            type="button"
                            onClick={() => onChange('optionType', 'CALL')}
                            className={`flex-1 py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${optionType === 'CALL'
                              ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400'
                              : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                              }`}
                          >
                            CALL
                          </button>
                          <button
                            type="button"
                            onClick={() => onChange('optionType', 'PUT')}
                            className={`flex-1 py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${optionType === 'PUT'
                              ? 'bg-rose-600 text-white shadow ring-1 ring-rose-400'
                              : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                              }`}
                          >
                            PUT
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{instrumentType || 'Equity'}</span>
                      {isOptions && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${optionType === 'CALL'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                        >
                          {optionType}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* STRATEGY */}
              <div className="grid grid-cols-3 items-center px-3 sm:px-4 py-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  STRATEGY:
                </span>
                <div className="col-span-2 space-y-1">
                  {isEditing ? (
                    <input
                      type="text"
                      list="strategy-list"
                      placeholder="e.g. Tiger Breakout, Camarilla Pivot"
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
                  {strategy && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowStrategyDashboard(true)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 px-2 py-0.5 rounded transition-all cursor-pointer"
                        title={`View independent win rate and performance for ${strategy}`}
                      >
                        <BarChart3 size={10} />
                        <span>View Win Rate & Analytics ({strategy})</span>
                      </button>
                    </div>
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
                      className={`font-mono font-black text-sm ${computedMetrics.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
            {/* ─── EMOTIONS SECTION WITH BEFORE & AFTER TRADE SLICERS ─── */}
            <div className="p-3 sm:p-5 space-y-4">
              {/* Header with Title, Tab Slicers, and Add New */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-700/70">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-200 uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5">
                    <Smile size={16} className="text-purple-400" />
                    <span>EMOTIONS:</span>
                  </span>

                  {/* Badges showing counts */}
                  {beforeEmotionsList.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Before: {beforeEmotionsList.length}
                    </span>
                  )}
                  {afterEmotionsList.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      After: {afterEmotionsList.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                  {/* Segmented Slicer Tabs */}
                  <div className="inline-flex p-1 rounded-xl bg-[#070d1e] border border-slate-700/80 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setActiveEmotionTab('before')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeEmotionTab === 'before'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span>1) Before Trade Emotions</span>
                      {beforeEmotionsList.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                          {beforeEmotionsList.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveEmotionTab('after')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeEmotionTab === 'after'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span>2) After Trade Emotions</span>
                      {afterEmotionsList.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                          {afterEmotionsList.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Actions in Edit Mode: Add Custom / Clear */}
                  {isEditing && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddEmotion((v) => !v)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                        title="Add custom emotion"
                      >
                        <Plus size={11} />
                        <span>Add Custom</span>
                      </button>

                      {((activeEmotionTab === 'before' && beforeEmotionsList.length > 0) ||
                        (activeEmotionTab === 'after' && afterEmotionsList.length > 0)) && (
                        <button
                          type="button"
                          onClick={clearCurrentTabEmotions}
                          className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition-colors cursor-pointer"
                          title="Clear selections in current tab"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Add Custom Emotion Form */}
              {showAddEmotion && isEditing && (
                <div className="bg-[#091124] border border-purple-500/40 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                    <span>Add Custom Emotion ({activeEmotionTab === 'before' ? 'Before Trade' : 'After Trade'})</span>
                    <button
                      type="button"
                      onClick={() => setShowAddEmotion(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="English Name (e.g. Hopeful)"
                      value={newEmotionName}
                      onChange={(e) => setNewEmotionName(e.target.value)}
                      className="bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-400"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Marathi Meaning (e.g. आशावादी)"
                      value={newEmotionMarathi}
                      onChange={(e) => setNewEmotionMarathi(e.target.value)}
                      className="bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-400"
                    />
                    <input
                      type="text"
                      placeholder="Description / Context"
                      value={newEmotionDesc}
                      onChange={(e) => setNewEmotionDesc(e.target.value)}
                      className="bg-[#152244] border border-slate-600 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddEmotion(false)}
                      className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewEmotion}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                    >
                      Add & Select
                    </button>
                  </div>
                </div>
              )}

              {/* ─── OPTION 1: BEFORE TRADE EMOTIONS SLICER ─── */}
              {activeEmotionTab === 'before' && (
                <div className="bg-[#050811] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  {/* Header matching Picture 1 */}
                  <div className="space-y-1">
                    <h3 className="font-serif italic text-xl sm:text-2xl text-white font-medium tracking-wide">
                      Before Trade Emotions
                    </h3>
                    <p className="font-serif italic text-xs sm:text-sm text-slate-400">
                      Trade घेण्यापूर्वी तुझी मानसिक स्थिती निवड.
                    </p>
                  </div>

                  {/* Slicer Cards 2-column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allBeforeEmotions.map((item) => {
                      const active = isBeforeEmotionActive(item.name)
                      return (
                        <div
                          key={item.name}
                          onClick={() => isEditing && toggleBeforeEmotion(item.name)}
                          className={`rounded-2xl p-3.5 sm:p-4 border transition-all select-none relative ${
                            isEditing ? 'cursor-pointer' : 'cursor-default'
                          } ${
                            active
                              ? 'bg-[#0f1d38] border-blue-400 shadow-lg shadow-blue-950/70 ring-1 ring-blue-400/80'
                              : isEditing
                              ? 'bg-[#070b14] border-slate-800/90 hover:border-slate-700 hover:bg-[#0c1222]'
                              : 'bg-[#070b14]/60 border-slate-800/60 opacity-60'
                          }`}
                        >
                          {/* Active checkmark */}
                          {active && (
                            <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}

                          {/* 1. English Emotion Name: Large, bold, italic serif */}
                          <div className="font-serif italic font-bold text-lg sm:text-xl text-white tracking-wide pr-6">
                            {item.name}
                          </div>

                          {/* 2. Marathi Meaning: Directly below, bold */}
                          <div className="font-sans font-bold text-sm sm:text-base text-slate-100 mt-1">
                            {item.marathi}
                          </div>

                          {/* 3. Description: Muted */}
                          <div className="font-sans text-xs sm:text-[13px] text-slate-400 font-normal mt-1 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── OPTION 2: AFTER TRADE EMOTIONS SLICER ─── */}
              {activeEmotionTab === 'after' && (
                <div className="bg-[#050811] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  {/* Header matching Picture 2 */}
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 font-serif italic">2. After Trade Emotions</div>
                    <h3 className="font-serif italic text-xl sm:text-2xl text-white font-medium tracking-wide">
                      After Trade Emotions
                    </h3>
                    <p className="font-serif italic text-xs sm:text-sm text-slate-400">
                      Trade संपल्यानंतर तुला काय जाणवले ते निवड.
                    </p>
                  </div>

                  {/* Slicer Cards 2-column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allAfterEmotions.map((item) => {
                      const active = isAfterEmotionActive(item.name)
                      return (
                        <div
                          key={item.name}
                          onClick={() => isEditing && toggleAfterEmotion(item.name)}
                          className={`rounded-2xl p-3.5 sm:p-4 border transition-all select-none relative ${
                            isEditing ? 'cursor-pointer' : 'cursor-default'
                          } ${
                            active
                              ? 'bg-[#1b1236] border-purple-400 shadow-lg shadow-purple-950/70 ring-1 ring-purple-400/80'
                              : isEditing
                              ? 'bg-[#070b14] border-slate-800/90 hover:border-slate-700 hover:bg-[#0c1222]'
                              : 'bg-[#070b14]/60 border-slate-800/60 opacity-60'
                          }`}
                        >
                          {/* Active checkmark */}
                          {active && (
                            <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}

                          {/* 1. English Emotion Name: Large, bold, italic serif */}
                          <div className="font-serif italic font-bold text-lg sm:text-xl text-white tracking-wide pr-6">
                            {item.name}
                          </div>

                          {/* 2. Marathi Meaning: Directly below, bold */}
                          <div className="font-sans font-bold text-sm sm:text-base text-slate-100 mt-1">
                            {item.marathi}
                          </div>

                          {/* 3. Description: Muted */}
                          <div className="font-sans text-xs sm:text-[13px] text-slate-400 font-normal mt-1 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── SUMMARY DISPLAY OF SELECTED EMOTIONS ─── */}
              <div className="bg-[#091124]/70 border border-slate-800/90 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-400 uppercase tracking-wide">
                      Before Trade:
                    </span>
                    {beforeEmotionsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {beforeEmotionsList.map((em) => {
                          const meta = allBeforeEmotions.find((b) => b.name.toLowerCase() === em.toLowerCase())
                          return (
                            <span
                              key={em}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            >
                              <span className="font-bold">{em}</span>
                              {meta && <span className="opacity-80">({meta.marathi})</span>}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">None selected</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-400 uppercase tracking-wide">
                      After Trade:
                    </span>
                    {afterEmotionsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {afterEmotionsList.map((em) => {
                          const meta = allAfterEmotions.find((a) => a.name.toLowerCase() === em.toLowerCase())
                          return (
                            <span
                              key={em}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            >
                              <span className="font-bold">{em}</span>
                              {meta && <span className="opacity-80">({meta.marathi})</span>}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">None selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ASSUMPTIONS BEFORE TRADE WITH PRESET SLICERS & ADD NEW */}
            <div className="p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-300 uppercase tracking-wider text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-400" />
                  <span>ASSUMPTIONS BEFORE TRADE:</span>
                </span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowAddAssumption((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded transition-all cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {/* Slicers Pills */}
              {isEditing && (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[...DEFAULT_ASSUMPTIONS, ...customAssumptions].map((a) => {
                      const active = isAssumptionActive(a)
                      return (
                        <button
                          type="button"
                          key={a}
                          onClick={() => toggleAssumption(a)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${active
                            ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/30 ring-1 ring-purple-400'
                            : 'bg-[#152244] border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                          {active && <Check size={11} className="text-white" />}
                          <span>{a}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Add New Assumption Inline Input */}
                  {showAddAssumption && (
                    <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                      <input
                        type="text"
                        placeholder="Type new assumption (e.g. Earnings Momentum Continuation)..."
                        value={newAssumptionInput}
                        onChange={(e) => setNewAssumptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddNewAssumption()
                          }
                        }}
                        className="flex-1 bg-[#152244] border border-purple-500/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-purple-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddNewAssumption}
                        className="px-2.5 py-1 rounded bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddAssumption(false)
                          setNewAssumptionInput('')
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isEditing ? (
                <textarea
                  rows="2"
                  placeholder="Market conditions, macro sentiment, risk factors, or click preset slicers above..."
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
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${disciplined === 'Y'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                        }`}
                    >
                      Y
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange('disciplined', 'N')}
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${disciplined === 'N'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                        }`}
                    >
                      N
                    </button>
                  </div>
                ) : (
                  <span
                    className={`font-black text-sm px-2.5 py-0.5 rounded border ${disciplined === 'Y'
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
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${followedRules === 'Y'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                        }`}
                    >
                      Y
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange('followedRules', 'N')}
                      className={`px-3 py-1 rounded font-bold text-xs transition-all ${followedRules === 'N'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-[#152244] border border-slate-600 text-slate-400 hover:text-white'
                        }`}
                    >
                      N
                    </button>
                  </div>
                ) : (

                  <span
           
                  className={`font-black text-sm px-2.5 py-0.5 rounded border ${followedRules === 'Y'
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
                      className={`p-1 rounded transition-transform ${isEditing ? 'cursor-pointer hover:scale-125' : 'cursor-default'
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

      {/* ─── STRATEGY PERFORMANCE DASHBOARD MODAL ───────────────────────── */}
      {showStrategyDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
            <StrategyPerformanceDashboard
              allTrades={allTrades}
              initialStrategy={strategy || 'Tiger Breakout'}
              onClose={() => setShowStrategyDashboard(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export { StrategyPerformanceDashboard }
