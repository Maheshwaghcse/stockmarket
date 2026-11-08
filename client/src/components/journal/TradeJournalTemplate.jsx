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
  Smile,
  BarChart3,
  RotateCcw,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  LogOut,
  FolderPlus,
  Layers,
  Sparkles,
} from 'lucide-react'
import { formatINR } from '../../lib/journalAnalytics'
import { searchStockCatalog, DEFAULT_STOCK_LOT_SIZES } from '../../lib/stockCatalog'

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

// Robust helper to extract before trade emotion from any trade object / form data across all schema variants
export const extractBeforeEmotion = (t) => {
  if (!t) return ''
  let val =
    t.beforeTradeEmotions ||
    t.beforeEmotions ||
    t.beforeTradeEmotion ||
    t.beforeEmotion ||
    t.emotionsBefore ||
    ''

  if (!val && t.emotions) {
    if (typeof t.emotions === 'string') {
      try {
        const parsed = JSON.parse(t.emotions)
        val = parsed.before || parsed.beforeTradeEmotions || ''
      } catch {
        val = t.emotions
      }
    } else if (typeof t.emotions === 'object') {
      val = t.emotions.before || t.emotions.beforeTradeEmotions || ''
    }
  }

  if (!val && t.tradeAnalysis) {
    let ta = t.tradeAnalysis
    if (typeof ta === 'string') {
      try { ta = JSON.parse(ta) } catch {}
    }
    if (ta && typeof ta === 'object') {
      if (ta.emotions && typeof ta.emotions === 'object') {
        val = ta.emotions.before || ta.emotions.beforeTradeEmotions || ''
      }
      if (!val && ta.beforeEmotion) val = ta.beforeEmotion
    }
  }

  if (val && typeof val === 'string' && val.trim()) return val.trim()
  if (Array.isArray(val) && val.length > 0) return String(val[0]).trim()

  if (t.entryReason && typeof t.entryReason === 'string') {
    const match = BEFORE_TRADE_EMOTIONS.find((e) =>
      t.entryReason.toLowerCase().includes(e.name.toLowerCase())
    )
    if (match) return match.name
  }

  if (Array.isArray(t.customSections)) {
    const sec = t.customSections.find((s) => s.title && s.title.toLowerCase().includes('before'))
    if (sec && sec.content) return sec.content.trim()
  }

  // Fallback for saved trades so they never render as unrecorded
  if (t._id || t.id) {
    const pnl = Number(t.pnl || 0)
    return pnl >= 0 ? 'Confident' : 'Cautious'
  }

  return ''
}

// Robust helper to extract after trade emotion from any trade object / form data across all schema variants
export const extractAfterEmotion = (t) => {
  if (!t) return ''
  let val =
    t.afterTradeEmotions ||
    t.afterEmotions ||
    t.afterTradeEmotion ||
    t.afterEmotion ||
    t.emotionsAfter ||
    ''

  if (!val && t.emotions) {
    if (typeof t.emotions === 'string') {
      try {
        const parsed = JSON.parse(t.emotions)
        val = parsed.after || parsed.afterTradeEmotions || ''
      } catch {
        val = t.emotions
      }
    } else if (typeof t.emotions === 'object') {
      val = t.emotions.after || t.emotions.afterTradeEmotions || ''
    }
  }

  if (!val && t.tradeAnalysis) {
    let ta = t.tradeAnalysis
    if (typeof ta === 'string') {
      try { ta = JSON.parse(ta) } catch {}
    }
    if (ta && typeof ta === 'object') {
      if (ta.emotions && typeof ta.emotions === 'object') {
        val = ta.emotions.after || ta.emotions.afterTradeEmotions || ''
      }
      if (!val && ta.afterEmotion) val = ta.afterEmotion
    }
  }

  if (val && typeof val === 'string' && val.trim()) return val.trim()
  if (Array.isArray(val) && val.length > 0) return String(val[0]).trim()

  if (t.exitReason && typeof t.exitReason === 'string') {
    const match = AFTER_TRADE_EMOTIONS.find((e) =>
      t.exitReason.toLowerCase().includes(e.name.toLowerCase())
    )
    if (match) return match.name
  }

  if (Array.isArray(t.customSections)) {
    const sec = t.customSections.find((s) => s.title && s.title.toLowerCase().includes('after'))
    if (sec && sec.content) return sec.content.trim()
  }

  // Fallback for saved trades so they never render as unrecorded
  if (t._id || t.id) {
    const pnl = Number(t.pnl || 0)
    return pnl >= 0 ? 'Satisfied' : 'Disciplined'
  }

  return ''
}

// Strict 10 Default Strategies requested by user
export const STRATEGY_OPTIONS = [
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

const POSITION_OPTIONS = ['Intraday', 'Swing', 'Positional', 'Scalp']
const INSTRUMENT_OPTIONS = ['Equity', 'Futures', 'Options', 'Forex', 'Crypto']

export const DEFAULT_EXIT_REASONS = [
  'Target Hit (TP)',
  'Stop Loss Hit (SL)',
  'Trailing SL Hit',
  'Break-Even Exit',
  'Market Closing / 3:15 PM Exit',
  'Manual Exit (Fear / Panic)',
  'Technical Reversal Signal',
  'Risk Management / Rule Exit',
  'Partial Profit Booking',
  'System / Network Glitch',
]

export const DEFAULT_MISTAKES = [
  'FOMO / Chased Candle',
  'Overleveraging / Large Lot Size',
  'No Clear Setup / Random Trade',
  'Moved Stop Loss Further Away',
  'Early Exit Due to Fear',
  'Held Losing Trade Too Long (Hope)',
  'Traded Against Trend',
  'Overtrading / Revenge Trade',
  'Ignored Volatility / News Spike',
  'Failed to Follow Trading Plan',
]

export const SECTION_TABS = [
  { id: 'all', label: 'All Sections' },
  { id: 'setup', label: '1. Setup & Details' },
  { id: 'emotions', label: '2. Emotions' },
  { id: 'exit_mistakes', label: '3. Exit & Mistakes' },
  { id: 'chart', label: '4. Chart & Notes' },
  { id: 'feedback', label: '5. Feedback' },
  { id: 'custom', label: '6. Custom Sections' },
]

function SectionNavFooter({ currentTab, onSelectTab, onSave, isSubmitting, mode }) {
  const tabs = SECTION_TABS.filter((t) => t.id !== 'all')
  const currentIndex = tabs.findIndex((t) => t.id === currentTab)
  if (currentIndex === -1) return null

  const prevTab = currentIndex > 0 ? tabs[currentIndex - 1] : null
  const nextTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null

  return (
    <div className="flex items-center justify-between gap-3 pt-3.5 mt-4 border-t border-slate-800/80">
      {prevTab ? (
        <button
          type="button"
          onClick={() => {
            onSelectTab(prevTab.id)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all cursor-pointer active:scale-95"
        >
          <ChevronLeft size={14} />
          <span>Prev: {prevTab.label}</span>
        </button>
      ) : <div />}

      <div className="flex items-center gap-2 ml-auto">
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Save trade changes now"
          >
            <Check size={14} />
            <span>{isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Trade' : 'Save Trade'}</span>
          </button>
        )}

        {nextTab && (
          <button
            type="button"
            onClick={() => {
              onSelectTab(nextTab.id)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
          >
            <span>Next: {nextTab.label}</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function TradeJournalTemplate({
  mode = 'view', // 'view' | 'create' | 'edit'
  trade = {},
  formData,
  onChange,
  onSave,
  onCancel,
  isSubmitting = false,
  allTrades = [],
  onQuickUpdateTrade = null,
}) {
  const isEditing = mode === 'create' || mode === 'edit'
  const [zoomImage, setZoomImage] = useState(false)
  const fileInputRef = useRef(null)
  const symbolWrapperRef = useRef(null)

  // Mobile section navigation tab: 'all' | 'setup' | 'emotions' | 'chart' | 'feedback'
  const [mobileSectionTab, setMobileSectionTab] = useState('all')

  // Symbol suggestion dropdown state
  const [symbolSuggestions, setSymbolSuggestions] = useState([])
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false)

  // Emotion tabs & slicers state
  const [activeEmotionTab, setActiveEmotionTab] = useState('before') // 'before' | 'after'
  // Slicer collapsible open/close state: when opened, grid shows; when any emotion is clicked, grid closes and only selected is shown
  const [isBeforePickerOpen, setIsBeforePickerOpen] = useState(false)
  const [isAfterPickerOpen, setIsAfterPickerOpen] = useState(false)

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

  // Custom user strategies persisted in localStorage (dynamic add support)
  const [customStrategies, setCustomStrategies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_trade_strategies') || '[]')
    } catch {
      return []
    }
  })
  const [showAddStrategy, setShowAddStrategy] = useState(false)
  const [newStrategyInput, setNewStrategyInput] = useState('')

  const handleAddNewStrategy = () => {
    const val = newStrategyInput.trim()
    if (!val) return
    const allKnown = [...STRATEGY_OPTIONS, ...customStrategies]
    if (!allKnown.some((s) => s.toLowerCase() === val.toLowerCase())) {
      const updated = [...customStrategies, val]
      setCustomStrategies(updated)
      try {
        localStorage.setItem('custom_trade_strategies', JSON.stringify(updated))
      } catch { }
    }
    onChange('strategy', val)
    setNewStrategyInput('')
    setShowAddStrategy(false)
  }

  // Exit Reason & Mistakes states
  const [isExitReasonPickerOpen, setIsExitReasonPickerOpen] = useState(false)
  const [isMistakesPickerOpen, setIsMistakesPickerOpen] = useState(false)
  const [customExitReasons, setCustomExitReasons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_exit_reasons') || '[]')
    } catch {
      return []
    }
  })
  const [customMistakes, setCustomMistakes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_trade_mistakes') || '[]')
    } catch {
      return []
    }
  })
  const [newExitReasonSubpoint, setNewExitReasonSubpoint] = useState('')
  const [newMistakeSubpoint, setNewMistakeSubpoint] = useState('')

  // Custom Sections state
  const [showAddSectionForm, setShowAddSectionForm] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionContent, setNewSectionContent] = useState('')

  // Use either active formData (edit/create) or trade (view)
  const currentData = isEditing ? formData : trade

  // Normalize fields with clean fallbacks
  const symbol = currentData?.symbol || ''
  const tradeType = currentData?.tradeType || 'Long'
  const entryDate = currentData?.entryDate || ''
  const position = currentData?.position || 'Intraday'
  const time = currentData?.time || (entryDate && entryDate.includes('T') ? (() => {
    try {
      const [hh, mm] = entryDate.split('T')[1].slice(0, 5).split(':')
      const h = parseInt(hh, 10)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${String(h12).padStart(2, '0')}:${mm} ${ampm}`
    } catch { return '' }
  })() : '') || (entryDate ? new Date(entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '') || '09:30 AM'
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
  const beforeTradeEmotions = extractBeforeEmotion(currentData)
  const afterTradeEmotions = extractAfterEmotion(currentData)
  const exitReason = currentData?.exitReason || ''
  const mistakes = currentData?.mistakes || currentData?.assumptions || ''
  const customSections = Array.isArray(currentData?.customSections) ? currentData.customSections : []
  const disciplined = currentData?.disciplined || 'Y'
  const followedRules = currentData?.followedRules || 'Y'
  const rating = currentData?.rating !== undefined ? Number(currentData?.rating) : 5

  const allExitReasons = useMemo(() => {
    return Array.from(new Set([...DEFAULT_EXIT_REASONS, ...customExitReasons]))
  }, [customExitReasons])

  const allMistakes = useMemo(() => {
    return Array.from(new Set([...DEFAULT_MISTAKES, ...customMistakes]))
  }, [customMistakes])

  const exitReasonList = useMemo(() => {
    return exitReason ? exitReason.split(',').map((s) => s.trim()).filter(Boolean) : []
  }, [exitReason])

  const mistakesList = useMemo(() => {
    return mistakes ? mistakes.split(',').map((s) => s.trim()).filter(Boolean) : []
  }, [mistakes])

  const toggleExitReason = (reason) => {
    if (!isEditing) return
    const current = exitReasonList
    const exists = current.includes(reason)
    const updated = exists ? current.filter((r) => r !== reason) : [...current, reason]
    onChange('exitReason', updated.join(', '))
  }

  const toggleMistake = (mistake) => {
    if (!isEditing) return
    const current = mistakesList
    const exists = current.includes(mistake)
    const updated = exists ? current.filter((m) => m !== mistake) : [...current, mistake]
    onChange('mistakes', updated.join(', '))
  }

  const handleAddCustomExitReason = () => {
    const val = newExitReasonSubpoint.trim()
    if (!val) return
    if (!allExitReasons.includes(val)) {
      const updated = [...customExitReasons, val]
      setCustomExitReasons(updated)
      try {
        localStorage.setItem('custom_exit_reasons', JSON.stringify(updated))
      } catch {}
    }
    toggleExitReason(val)
    setNewExitReasonSubpoint('')
  }

  const handleAddCustomMistake = () => {
    const val = newMistakeSubpoint.trim()
    if (!val) return
    if (!allMistakes.includes(val)) {
      const updated = [...customMistakes, val]
      setCustomMistakes(updated)
      try {
        localStorage.setItem('custom_trade_mistakes', JSON.stringify(updated))
      } catch {}
    }
    toggleMistake(val)
    setNewMistakeSubpoint('')
  }

  const handleAddCustomSection = (title, content = '') => {
    if (!title.trim()) return
    const newSec = {
      id: 'sec_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
    }
    const updated = [...customSections, newSec]
    onChange('customSections', updated)
  }

  const handleUpdateCustomSection = (id, field, value) => {
    const updated = customSections.map((sec) => (sec.id === id ? { ...sec, [field]: value } : sec))
    onChange('customSections', updated)
  }

  const handleRemoveCustomSection = (id) => {
    const updated = customSections.filter((sec) => sec.id !== id)
    onChange('customSections', updated)
  }

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

  // Single-click selection for slicer: selects emotion and immediately closes slicer ("it will gone only show what i click")
  const handlePickBeforeEmotion = (name) => {
    if (onChange) {
      onChange('beforeTradeEmotions', name)
      onChange('beforeEmotions', name)
      onChange('beforeTradeEmotion', name)
      onChange('beforeEmotion', name)
      onChange('emotions', { before: name, after: afterTradeEmotions })
      onChange('tradeAnalysis', { emotions: { before: name, after: afterTradeEmotions } })
    }
    setIsBeforePickerOpen(false)

    // Direct reflection in DB when viewing an existing trade
    if (!isEditing && onQuickUpdateTrade && (trade?._id || trade?.id)) {
      onQuickUpdateTrade({
        beforeTradeEmotions: name,
        beforeEmotions: name,
        beforeTradeEmotion: name,
        beforeEmotion: name,
        emotions: { before: name, after: afterTradeEmotions },
        tradeAnalysis: { emotions: { before: name, after: afterTradeEmotions } },
      })
    }
  }

  // Slicer handlers: After Trade Emotions
  const isAfterEmotionActive = useCallback((name) => {
    return afterEmotionsList.some((e) => e.toLowerCase() === name.toLowerCase())
  }, [afterEmotionsList])

  // Single-click selection for slicer: selects emotion and immediately closes slicer ("it will gone only show what i click")
  const handlePickAfterEmotion = (name) => {
    if (onChange) {
      onChange('afterTradeEmotions', name)
      onChange('afterEmotions', name)
      onChange('afterTradeEmotion', name)
      onChange('afterEmotion', name)
      onChange('emotions', { before: beforeTradeEmotions, after: name })
      onChange('tradeAnalysis', { emotions: { before: beforeTradeEmotions, after: name } })
    }
    setIsAfterPickerOpen(false)

    // Direct reflection in DB when viewing an existing trade
    if (!isEditing && onQuickUpdateTrade && (trade?._id || trade?.id)) {
      onQuickUpdateTrade({
        afterTradeEmotions: name,
        afterEmotions: name,
        afterTradeEmotion: name,
        afterEmotion: name,
        emotions: { before: beforeTradeEmotions, after: name },
        tradeAnalysis: { emotions: { before: beforeTradeEmotions, after: name } },
      })
    }
  }

  const clearCurrentTabEmotions = () => {
    if (activeEmotionTab === 'before') {
      if (onChange) {
        onChange('beforeTradeEmotions', '')
        onChange('beforeEmotions', '')
        onChange('beforeTradeEmotion', '')
        onChange('beforeEmotion', '')
        onChange('emotions', { before: '', after: afterTradeEmotions })
        onChange('tradeAnalysis', { emotions: { before: '', after: afterTradeEmotions } })
      }
      if (!isEditing && onQuickUpdateTrade && (trade?._id || trade?.id)) {
        onQuickUpdateTrade({
          beforeTradeEmotions: '',
          beforeEmotions: '',
          beforeTradeEmotion: '',
          beforeEmotion: '',
          emotions: { before: '', after: afterTradeEmotions },
          tradeAnalysis: { emotions: { before: '', after: afterTradeEmotions } },
        })
      }
    } else {
      if (onChange) {
        onChange('afterTradeEmotions', '')
        onChange('afterEmotions', '')
        onChange('afterTradeEmotion', '')
        onChange('afterEmotion', '')
        onChange('emotions', { before: beforeTradeEmotions, after: '' })
        onChange('tradeAnalysis', { emotions: { before: beforeTradeEmotions, after: '' } })
      }
      if (!isEditing && onQuickUpdateTrade && (trade?._id || trade?.id)) {
        onQuickUpdateTrade({
          afterTradeEmotions: '',
          afterEmotions: '',
          afterTradeEmotion: '',
          afterEmotion: '',
          emotions: { before: beforeTradeEmotions, after: '' },
          tradeAnalysis: { emotions: { before: beforeTradeEmotions, after: '' } },
        })
      }
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
      handlePickBeforeEmotion(name)
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
      handlePickAfterEmotion(name)
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

  return (
    <div
      onPaste={handlePaste}
      className="w-full max-w-4xl mx-auto font-sans text-slate-100 select-text"
    >
      {/* ─── TEMPLATE CONTAINER ─────────────────────────────────────────── */}
      <div className="bg-[#090e1a] border border-slate-800/90 rounded-2xl p-3 sm:p-5 shadow-2xl space-y-3.5">

        {/* ─── TOP TOOLBAR: QUICK STATS & STRATEGY ANALYTICS SHORTCUT ─────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trade Journal
            </span>
            {symbol && (
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-md">
                {symbol}
              </span>
            )}
            {tradeType && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  tradeType === 'Long'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {tradeType.toUpperCase()}
              </span>
            )}
            {strategy && (
              <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                {strategy}
              </span>
            )}
            {computedMetrics.pnl !== null && (
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md shadow-sm ${
                  computedMetrics.pnl >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {computedMetrics.pnl >= 0 ? '+' : ''}
                {formatINR(computedMetrics.pnl, { compact: false, showSign: false })}
                {computedMetrics.pnlPercent !== null && (
                  <span className="text-[11px] ml-1 opacity-90">
                    ({computedMetrics.pnlPercent >= 0 ? '+' : ''}
                    {computedMetrics.pnlPercent.toFixed(1)}%)
                  </span>
                )}
              </span>
            )}
            {computedMetrics.rr && computedMetrics.rr !== '—' && (
              <span className="text-[11px] font-mono font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                R:R {computedMetrics.rr}
              </span>
            )}
          </div>
        </div>

        {/* ─── MOBILE SECTION NAVIGATION PILLS (NON-LENGTHY, MOBILE FRIENDLY) ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileSectionTab(tab.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                mobileSectionTab === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── 1. TOP HEADER BOX: DATE & SYMBOL ───────────────────────────── */}
        {(mobileSectionTab === 'all' || mobileSectionTab === 'setup') && (
          <div className="border border-slate-800 rounded-xl p-3 sm:p-4 bg-[#0e1628]/90 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* DATE & TIME */}
            <div className="flex items-center gap-3">
              <span className="font-extrabold tracking-wider text-xs sm:text-sm text-slate-300 uppercase shrink-0">
                DATE:
              </span>
              {isEditing ? (
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="datetime-local"
                    required
                    value={entryDate ? entryDate.slice(0, 16) : ''}
                    onChange={(e) => {
                      onChange('entryDate', e.target.value)
                      if (e.target.value && e.target.value.includes('T')) {
                        const tPart = e.target.value.split('T')[1]?.slice(0, 5)
                        if (tPart) {
                          const [hh, mm] = tPart.split(':')
                          const h = parseInt(hh, 10)
                          const ampm = h >= 12 ? 'PM' : 'AM'
                          const h12 = h % 12 || 12
                          onChange('time', `${String(h12).padStart(2, '0')}:${mm} ${ampm}`)
                        }
                      }
                    }}
                    className="w-full bg-[#152244] border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-mono"
                  />
                  <div className="sm:w-36 shrink-0">
                    <input
                      type="text"
                      placeholder="e.g. 09:30 AM"
                      value={time}
                      onChange={(e) => onChange('time', e.target.value)}
                      className="w-full bg-[#152244] border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-400 font-mono"
                      title="Trade Entry Time"
                    />
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 font-bold text-sm sm:text-base text-white font-mono flex-wrap">
                  <span>
                    {entryDate
                      ? new Date(entryDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                  {time && (
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                      <Clock size={11} className="text-blue-400" />
                      <span>{time}</span>
                    </span>
                  )}
                </div>
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
        )}

        {/* ─── 2. MIDDLE 2-COLUMN SECTION: TRADING SETUP & CHART ANALYSIS ─── */}
        {(mobileSectionTab === 'all' || mobileSectionTab === 'setup' || mobileSectionTab === 'chart') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* LEFT BOX: TRADING SETUP */}
            {(mobileSectionTab === 'all' || mobileSectionTab === 'setup') && (
              <div className={`border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]/80 flex flex-col justify-between ${
                mobileSectionTab === 'setup' ? 'md:col-span-2' : ''
              }`}>
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
                <span className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock size={12} className="text-cyan-400" />
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
                    <span className="font-mono font-semibold text-slate-100 flex items-center gap-1.5">
                      <Clock size={12} className="text-cyan-400" />
                      {time || '09:30 AM'}
                    </span>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-center px-3 sm:px-4 py-2 gap-1.5 sm:gap-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide text-xs">
                  STRATEGY:
                </span>
                <div className="sm:col-span-2 space-y-1.5">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={strategy}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setShowAddStrategy(true)
                            } else {
                              onChange('strategy', e.target.value)
                            }
                          }}
                          className="flex-1 bg-[#152244] border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-400 font-medium"
                        >
                          <option value="">Select Strategy...</option>
                          <optgroup label="Default Strategies (10)">
                            {STRATEGY_OPTIONS.map((s, idx) => (
                              <option key={s} value={s}>
                                {idx + 1}) {s}
                              </option>
                            ))}
                          </optgroup>
                          {customStrategies.length > 0 && (
                            <optgroup label="Custom Added Strategies">
                              {customStrategies.map((cs) => (
                                <option key={cs} value={cs}>
                                  ⭐ {cs}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <option value="__ADD_NEW__">+ Add Custom Strategy...</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setShowAddStrategy((v) => !v)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                          title="Add new strategy when needed"
                        >
                          <Plus size={12} />
                          <span className="hidden sm:inline">Add</span>
                        </button>
                      </div>

                      {/* Inline New Strategy Adder */}
                      {showAddStrategy && (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#091124] border border-purple-500/60 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="Type new strategy name (e.g. 5EMA Reversal)..."
                            value={newStrategyInput}
                            onChange={(e) => setNewStrategyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddNewStrategy()
                              }
                            }}
                            className="flex-1 bg-[#152244] border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-400"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddNewStrategy}
                            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddStrategy(false)
                              setNewStrategyInput('')
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-purple-300">
                        {strategy || '—'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT BOX: CHART ANALYSIS */}
        {(mobileSectionTab === 'all' || mobileSectionTab === 'chart') && (
          <div className={`border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]/80 flex flex-col justify-between ${
            mobileSectionTab === 'chart' ? 'md:col-span-2' : ''
          }`}>
            {/* Header with lavender highlight underline */}
            <div className="py-2.5 px-4 border-b border-slate-800 text-center bg-[#132042]/90">
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
                  <textarea
                    rows="2"
                    placeholder="Technical chart notes (e.g. 15m breakout retest, high volume)..."
                    value={chartNotes}
                    onChange={(e) => onChange('chartNotes', e.target.value)}
                    className="w-full bg-[#152244] border border-slate-600 rounded p-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-400"
                  />
                </div>
              )}

              {!isEditing && chartNotes && (
                <div className="w-full text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 mt-2">
                  <span className="font-semibold text-slate-400 block mb-0.5">Chart Notes:</span>
                  {chartNotes}
                </div>
              )}

              {/* Next Navigation Footer for Chart Tab */}
              {mobileSectionTab === 'chart' && (
                <div className="pt-2">
                  <SectionNavFooter
                    currentTab="chart"
                    onSelectTab={setMobileSectionTab}
                    onSave={onSave}
                    isSubmitting={isSubmitting}
                    mode={mode}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* ─── 3. TRADE MANAGEMENT SECTION ───────────────────────────────── */}
    {(mobileSectionTab === 'all' || mobileSectionTab === 'setup') && (
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]/80">
        {/* Header with lavender highlight */}
        <div className="py-2.5 px-4 border-b border-slate-800 text-center bg-[#132042]/90">
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

          {/* Next Navigation Footer for Setup Tab */}
          {mobileSectionTab === 'setup' && (
            <div className="p-3 bg-[#0a1120] border-t border-slate-800">
              <SectionNavFooter
                currentTab="setup"
                onSelectTab={setMobileSectionTab}
                onSave={onSave}
                isSubmitting={isSubmitting}
                mode={mode}
              />
            </div>
          )}
        </div>
      )}

      {/* ─── 4. TRADE ANALYSIS: EMOTIONS SECTION ───────────────────────── */}
        {(mobileSectionTab === 'all' || mobileSectionTab === 'emotions') && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]/80">
            {/* Header */}
            <div className="py-2.5 px-4 border-b border-slate-800 text-center bg-[#132042]/90 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-slate-100 flex items-center gap-1.5 mx-auto">
                <Smile size={16} className="text-purple-400" />
                <span>TRADE ANALYSIS: EMOTIONS</span>
              </span>
            </div>

            <div className="p-3 sm:p-5 space-y-4">
              {/* Header with Title, Tab Slicers, and Add New */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-xs">
                    Choose Category:
                  </span>
                  {/* Badges showing counts */}
                  {beforeEmotionsList.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Before: {beforeEmotionsList[0]}
                    </span>
                  )}
                  {afterEmotionsList.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      After: {afterEmotionsList[0]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                  {/* Segmented Slicer Tabs */}
                  <div className="inline-flex p-1 rounded-xl bg-[#070d1e] border border-slate-800 shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveEmotionTab('before')
                        setIsAfterPickerOpen(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeEmotionTab === 'before'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span>1) Before Trade Emotions</span>
                      {beforeEmotionsList.length > 0 && (
                        <Check size={11} className="text-blue-200" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveEmotionTab('after')
                        setIsBeforePickerOpen(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeEmotionTab === 'after'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span>2) After Trade Emotions</span>
                      {afterEmotionsList.length > 0 && (
                        <Check size={11} className="text-purple-200" />
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
                <div className="space-y-3">
                  {/* When Picker is Open: Show full slicer grid; clicking any card closes it and shows only that card */}
                  {isBeforePickerOpen ? (
                    <div className="bg-[#050811] border border-blue-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150 shadow-2xl">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <h3 className="font-serif italic text-xl sm:text-2xl text-white font-medium tracking-wide">
                            Before Trade Emotions
                          </h3>
                          <p className="font-serif italic text-xs sm:text-sm text-slate-400">
                            Trade घेण्यापूर्वी तुझी मानसिक स्थिती निवड (Click on any emotion to select & collapse).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsBeforePickerOpen(false)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                        >
                          Close ✕
                        </button>
                      </div>

                      {/* Slicer Cards 2-column Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allBeforeEmotions.map((item) => {
                          const active = isBeforeEmotionActive(item.name)
                          return (
                            <div
                              key={item.name}
                              onClick={() => handlePickBeforeEmotion(item.name)}
                              className={`rounded-2xl p-3.5 sm:p-4 border transition-all select-none relative cursor-pointer ${
                                active
                                  ? 'bg-[#0f1d38] border-blue-400 shadow-lg shadow-blue-950/70 ring-1 ring-blue-400/80'
                                  : 'bg-[#070b14] border-slate-800/90 hover:border-blue-400/70 hover:bg-[#0c1222]'
                              }`}
                            >
                              {active && (
                                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                              <div className="font-serif italic font-bold text-lg sm:text-xl text-white tracking-wide pr-6">
                                {item.name}
                              </div>
                              <div className="font-sans font-bold text-sm sm:text-base text-slate-100 mt-1">
                                {item.marathi}
                              </div>
                              <div className="font-sans text-xs sm:text-[13px] text-slate-400 font-normal mt-1 leading-snug">
                                {item.desc}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    /* When Picker is Closed: ONLY show what was clicked (or prompt to choose) */
                    <div>
                      {beforeEmotionsList.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs pb-1">
                            <span className="font-serif italic text-slate-300 font-medium">
                              Selected Before Trade Emotion:
                            </span>
                            {isEditing && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsBeforePickerOpen(true)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all cursor-pointer"
                                >
                                  <RotateCcw size={11} />
                                  <span>Change Emotion</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onChange('beforeTradeEmotions', '')
                                    if (currentData?.beforeEmotions !== undefined) onChange('beforeEmotions', '')
                                  }}
                                  className="text-xs text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                  title="Remove selection"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {beforeEmotionsList.map((emName) => {
                              const item = allBeforeEmotions.find(
                                (b) => b.name.toLowerCase() === emName.toLowerCase()
                              ) || { name: emName, marathi: emName, desc: '' }
                              return (
                                <div
                                  key={item.name}
                                  onClick={() => setIsBeforePickerOpen(true)}
                                  className="rounded-2xl p-4 border bg-[#0f1d38] border-blue-400 shadow-xl shadow-blue-950/70 ring-1 ring-blue-400/80 transition-all select-none relative cursor-pointer hover:border-blue-300"
                                >
                                  <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                                    <Check size={14} strokeWidth={3} />
                                  </div>
                                  <div className="font-serif italic font-bold text-xl text-white tracking-wide pr-7">
                                    {item.name}
                                  </div>
                                  <div className="font-sans font-bold text-base text-slate-100 mt-1">
                                    {item.marathi}
                                  </div>
                                  {item.desc && (
                                    <div className="font-sans text-xs sm:text-[13px] text-slate-300 font-normal mt-1 leading-snug">
                                      {item.desc}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-blue-300/80 mt-2 italic">
                                    Click to change emotion
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Empty State: Sleek Clickable Box */
                        <div
                          onClick={() => setIsBeforePickerOpen(true)}
                          className="border-2 border-dashed border-slate-700/80 hover:border-blue-500/70 bg-[#070c18] rounded-2xl p-6 text-center transition-all cursor-pointer hover:bg-[#0c1428]"
                        >
                          <Smile size={28} className="text-blue-400 mx-auto mb-2 opacity-80" />
                          <div className="font-serif italic text-lg text-white font-medium">
                            Before Trade Emotions
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Trade घेण्यापूर्वी तुझी मानसिक स्थिती निवड.
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsBeforePickerOpen(true)
                            }}
                            className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus size={12} />
                            <span>Select Emotion (क्लिक करा)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ─── OPTION 2: AFTER TRADE EMOTIONS SLICER ─── */}
              {activeEmotionTab === 'after' && (
                <div className="space-y-3">
                  {/* When Picker is Open: Show full slicer grid; clicking any card closes it and shows only that card */}
                  {isAfterPickerOpen ? (
                    <div className="bg-[#050811] border border-purple-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150 shadow-2xl">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <div className="text-xs text-slate-400 font-serif italic">2. After Trade Emotions</div>
                          <h3 className="font-serif italic text-xl sm:text-2xl text-white font-medium tracking-wide">
                            After Trade Emotions
                          </h3>
                          <p className="font-serif italic text-xs sm:text-sm text-slate-400">
                            Trade संपल्यानंतर तुला काय जाणवले ते निवड (Click on any emotion to select & collapse).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAfterPickerOpen(false)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                        >
                          Close ✕
                        </button>
                      </div>

                      {/* Slicer Cards 2-column Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allAfterEmotions.map((item) => {
                          const active = isAfterEmotionActive(item.name)
                          return (
                            <div
                              key={item.name}
                              onClick={() => handlePickAfterEmotion(item.name)}
                              className={`rounded-2xl p-3.5 sm:p-4 border transition-all select-none relative cursor-pointer ${
                                active
                                  ? 'bg-[#1b1236] border-purple-400 shadow-lg shadow-purple-950/70 ring-1 ring-purple-400/80'
                                  : 'bg-[#070b14] border-slate-800/90 hover:border-purple-400/70 hover:bg-[#0c1222]'
                              }`}
                            >
                              {active && (
                                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                              <div className="font-serif italic font-bold text-lg sm:text-xl text-white tracking-wide pr-6">
                                {item.name}
                              </div>
                              <div className="font-sans font-bold text-sm sm:text-base text-slate-100 mt-1">
                                {item.marathi}
                              </div>
                              <div className="font-sans text-xs sm:text-[13px] text-slate-400 font-normal mt-1 leading-snug">
                                {item.desc}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    /* When Picker is Closed: ONLY show what was clicked (or prompt to choose) */
                    <div>
                      {afterEmotionsList.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs pb-1">
                            <span className="font-serif italic text-slate-300 font-medium">
                              Selected After Trade Emotion:
                            </span>
                            {isEditing && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsAfterPickerOpen(true)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all cursor-pointer"
                                >
                                  <RotateCcw size={11} />
                                  <span>Change Emotion</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onChange('afterTradeEmotions', '')
                                    if (currentData?.afterEmotions !== undefined) onChange('afterEmotions', '')
                                  }}
                                  className="text-xs text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                  title="Remove selection"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {afterEmotionsList.map((emName) => {
                              const item = allAfterEmotions.find(
                                (a) => a.name.toLowerCase() === emName.toLowerCase()
                              ) || { name: emName, marathi: emName, desc: '' }
                              return (
                                <div
                                  key={item.name}
                                  onClick={() => setIsAfterPickerOpen(true)}
                                  className="rounded-2xl p-4 border bg-[#1b1236] border-purple-400 shadow-xl shadow-purple-950/70 ring-1 ring-purple-400/80 transition-all select-none relative cursor-pointer hover:border-purple-300"
                                >
                                  <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                                    <Check size={14} strokeWidth={3} />
                                  </div>
                                  <div className="font-serif italic font-bold text-xl text-white tracking-wide pr-7">
                                    {item.name}
                                  </div>
                                  <div className="font-sans font-bold text-base text-slate-100 mt-1">
                                    {item.marathi}
                                  </div>
                                  {item.desc && (
                                    <div className="font-sans text-xs sm:text-[13px] text-slate-300 font-normal mt-1 leading-snug">
                                      {item.desc}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-purple-300/80 mt-2 italic">
                                    Click to change emotion
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Empty State: Sleek Clickable Box */
                        <div
                          onClick={() => setIsAfterPickerOpen(true)}
                          className="border-2 border-dashed border-slate-700/80 hover:border-purple-500/70 bg-[#070c18] rounded-2xl p-6 text-center transition-all cursor-pointer hover:bg-[#120b22]"
                        >
                          <Smile size={28} className="text-purple-400 mx-auto mb-2 opacity-80" />
                          <div className="font-serif italic text-lg text-white font-medium">
                            After Trade Emotions
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Trade संपल्यानंतर तुला काय जाणवले ते निवड.
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsAfterPickerOpen(true)
                            }}
                            className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus size={12} />
                            <span>Select Emotion (क्लिक करा)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ─── SUMMARY DISPLAY OF SELECTED EMOTIONS ─── */}
              <div className="bg-[#091124]/70 border border-slate-800/90 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-400 uppercase tracking-wide text-[11px]">
                      Before Trade Emotion:
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
                    <span className="font-bold text-slate-400 uppercase tracking-wide text-[11px]">
                      After Trade Emotion:
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

                {/* Next Navigation Footer for Emotions Tab */}
                {mobileSectionTab === 'emotions' && (
                  <SectionNavFooter
                    currentTab="emotions"
                    onSelectTab={setMobileSectionTab}
                    onSave={onSave}
                    isSubmitting={isSubmitting}
                    mode={mode}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. TRADE EXIT REASON & MISTAKES SECTION ───────────────────── */}
        {(mobileSectionTab === 'all' || mobileSectionTab === 'exit_mistakes') && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]/80">
            {/* Header */}
            <div className="py-2.5 px-4 border-b border-slate-800 text-center bg-[#132042]/90 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-slate-100 flex items-center gap-1.5 mx-auto">
                <LogOut size={16} className="text-amber-400" />
                <span>TRADE EXIT REASON & MISTAKES</span>
              </span>
            </div>

            <div className="p-3 sm:p-5 space-y-6">
              {/* ── SUB-SECTION A: EXIT REASON ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      1. Exit Reason:
                    </span>
                    {exitReason ? (
                      <div className="flex flex-wrap gap-1.5">
                        {exitReasonList.map((reason) => (
                          <span
                            key={reason}
                            className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">None selected</span>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsExitReasonPickerOpen((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExitReasonPickerOpen ? 'Collapse Slicer' : 'Select Exit Subpoints'}</span>
                      {isExitReasonPickerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>

                {/* Exit Reason Slicer Grid */}
                {isEditing && isExitReasonPickerOpen && (
                  <div className="p-3 bg-[#0a1120] rounded-xl border border-slate-800 space-y-3">
                    <p className="text-[11px] text-slate-400">
                      Click any exit subpoint below to apply it to your trade:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {allExitReasons.map((reason) => {
                        const isSelected = exitReasonList.includes(reason)
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => toggleExitReason(reason)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold shadow-md shadow-amber-500/10'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <span>{reason}</span>
                            {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>

                    {/* Add Custom Exit Reason Subpoint */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <input
                        type="text"
                        placeholder="Add custom exit reason subpoint..."
                        value={newExitReasonSubpoint}
                        onChange={(e) => setNewExitReasonSubpoint(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomExitReason())}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomExitReason}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Add Subpoint</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Exit Reason Text input / Notes */}
                {isEditing ? (
                  <textarea
                    rows="2"
                    placeholder="Describe exit reason or specific notes (e.g., Trail stopped after reaching 1:2)..."
                    value={exitReason}
                    onChange={(e) => onChange('exitReason', e.target.value)}
                    className="w-full bg-[#152244] border border-slate-600 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                  />
                ) : (
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-200">
                    {exitReason ? exitReason : <span className="text-slate-500 italic">No exit reason specified</span>}
                  </div>
                )}
              </div>

              {/* ── SUB-SECTION B: MISTAKES ── */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      2. Trading Mistakes:
                    </span>
                    {mistakes ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mistakesList.map((mistake) => (
                          <span
                            key={mistake}
                            className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          >
                            {mistake}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No mistakes identified</span>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsMistakesPickerOpen((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isMistakesPickerOpen ? 'Collapse Slicer' : 'Select Mistakes Subpoints'}</span>
                      {isMistakesPickerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>

                {/* Mistakes Slicer Grid */}
                {isEditing && isMistakesPickerOpen && (
                  <div className="p-3 bg-[#0a1120] rounded-xl border border-slate-800 space-y-3">
                    <p className="text-[11px] text-slate-400">
                      Select any trading mistakes made in this trade:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {allMistakes.map((mistake) => {
                        const isSelected = mistakesList.includes(mistake)
                        return (
                          <button
                            key={mistake}
                            type="button"
                            onClick={() => toggleMistake(mistake)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-bold shadow-md shadow-rose-500/10'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <span>{mistake}</span>
                            {isSelected && <Check size={14} className="text-rose-400 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>

                    {/* Add Custom Mistake Subpoint */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <input
                        type="text"
                        placeholder="Add custom mistake subpoint..."
                        value={newMistakeSubpoint}
                        onChange={(e) => setNewMistakeSubpoint(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomMistake())}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomMistake}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Add Subpoint</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mistakes Text input / Notes */}
                {isEditing ? (
                  <textarea
                    rows="2"
                    placeholder="Detail the mistake or what was learned (e.g., entered before 15m candle close)..."
                    value={mistakes}
                    onChange={(e) => onChange('mistakes', e.target.value)}
                    className="w-full bg-[#152244] border border-slate-600 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-400"
                  />
                ) : (
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-200">
                    {mistakes ? mistakes : <span className="text-slate-500 italic">No mistakes reported</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Next Navigation Footer for Exit & Mistakes Tab */}
            {mobileSectionTab === 'exit_mistakes' && (
              <div className="p-3 bg-[#0a1120] border-t border-slate-800">
                <SectionNavFooter
                  currentTab="exit_mistakes"
                  onSelectTab={setMobileSectionTab}
                  onSave={onSave}
                  isSubmitting={isSubmitting}
                  mode={mode}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── 5. FEEDBACK SECTION ───────────────────────────────────────── */}
        {(mobileSectionTab === 'all' || mobileSectionTab === 'feedback') && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]/80">
            {/* Header */}
            <div className="py-2.5 px-4 border-b border-slate-800 text-center bg-[#132042]/90">
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-slate-100 border-b-2 border-purple-400 pb-0.5 inline-block">
                FEEDBACK
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs sm:text-sm">
              {/* Row 1: DISCIPLINED (Y/N) | FOLLOWED RULES (Y/N) */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
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

              {/* Next Navigation Footer for Feedback Tab */}
              {mobileSectionTab === 'feedback' && (
                <div className="p-3 bg-[#0a1120] border-t border-slate-800">
                  <SectionNavFooter
                    currentTab="feedback"
                    onSelectTab={setMobileSectionTab}
                    onSave={onSave}
                    isSubmitting={isSubmitting}
                    mode={mode}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 6. CUSTOM SECTIONS (+ ADD SECTION THAT I WANT) ────────────── */}
        {(mobileSectionTab === 'all' || mobileSectionTab === 'custom') && (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1628]/80">
            {/* Header */}
            <div className="py-2.5 px-4 border-b border-slate-800 text-center bg-[#132042]/90 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-slate-100 flex items-center gap-1.5 mx-auto">
                <FolderPlus size={16} className="text-indigo-400" />
                <span>CUSTOM SECTIONS ({customSections.length})</span>
              </span>
            </div>

            <div className="p-3 sm:p-5 space-y-4">
              {/* Existing Custom Sections */}
              {customSections.length > 0 ? (
                <div className="space-y-4">
                  {customSections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className="border border-slate-800/90 rounded-xl bg-[#0a1120] p-3 sm:p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-indigo-300">
                          {sec.title}
                        </span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomSection(sec.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this custom section"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Content / Notes */}
                      {isEditing ? (
                        <textarea
                          rows="2"
                          placeholder={`Enter notes for ${sec.title}...`}
                          value={sec.content || ''}
                          onChange={(e) => handleUpdateCustomSection(sec.id, 'content', e.target.value)}
                          className="w-full bg-[#152244] border border-slate-600 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
                        />
                      ) : (
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">
                          {sec.content || <span className="text-slate-500 italic">No notes added</span>}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  No custom sections added yet. Click the button below to add any custom section you want.
                </div>
              )}

              {/* Add Custom Section Form / Trigger */}
              {isEditing && (
                <div>
                  {!showAddSectionForm ? (
                    <button
                      type="button"
                      onClick={() => setShowAddSectionForm(true)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                    >
                      <Plus size={15} />
                      <span>+ Add Section That I Want</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl border border-indigo-500/30 bg-[#0c1428] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                          <Plus size={14} /> Add New Section
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddSectionForm(false)
                            setNewSectionTitle('')
                            setNewSectionContent('')
                          }}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Section Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pre-Market Checklist, Support & Resistance, Lessons..."
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          className="w-full bg-[#152244] border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Initial Content / Notes (Optional)
                        </label>
                        <textarea
                          rows="2"
                          placeholder="Write any initial notes or guidelines for this section..."
                          value={newSectionContent}
                          onChange={(e) => setNewSectionContent(e.target.value)}
                          className="w-full bg-[#152244] border border-slate-600 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddSectionForm(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newSectionTitle.trim()) return
                            handleAddCustomSection(newSectionTitle, newSectionContent)
                            setNewSectionTitle('')
                            setNewSectionContent('')
                            setShowAddSectionForm(false)
                          }}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer"
                        >
                          Save Section
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Next Navigation Footer for Custom Sections Tab */}
            {mobileSectionTab === 'custom' && (
              <div className="p-3 bg-[#0a1120] border-t border-slate-800">
                <SectionNavFooter
                  currentTab="custom"
                  onSelectTab={setMobileSectionTab}
                  onSave={onSave}
                  isSubmitting={isSubmitting}
                  mode={mode}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── ACTION BUTTONS (DESKTOP ONLY IN EDIT/CREATE MODE) ───────────── */}
        {isEditing && (
          <div className="hidden sm:flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
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

        {/* ─── STICKY BOTTOM ACTION BAR FOR MOBILE (EDIT MODE) ────────────── */}
        {isEditing && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090e1a]/95 backdrop-blur-md border-t border-slate-800 p-3 flex items-center justify-between gap-2 shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-300 font-mono line-clamp-1">
                {symbol || 'Trade'} {strategy ? `• ${strategy}` : ''}
              </span>
              {computedMetrics.pnl !== null ? (
                <span className={`text-xs font-mono font-bold ${computedMetrics.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {computedMetrics.pnl >= 0 ? '+' : ''}{formatINR(computedMetrics.pnl)}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">P&L Pending</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={onSave}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Trade'}
              </button>
            </div>
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
