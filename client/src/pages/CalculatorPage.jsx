import { useState } from 'react'
import { 
  Target, TrendingUp, Gift, Landmark, Sliders, 
  RotateCcw, Sparkles, Check, Info, ArrowRight, 
  DollarSign, Percent, ShieldCheck, ChevronRight
} from 'lucide-react'

// Helper for Indian Currency formatting
function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0'
  return '₹ ' + Math.round(val).toLocaleString('en-IN')
}

// Interactive SVG Donut Chart Component
function DonutChart({ segments, size = 200, strokeWidth = 24, centerLabel = '', centerValue = '' }) {
  const total = segments.reduce((acc, s) => acc + (Math.max(0, s.value) || 0), 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let accumulated = 0

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {total > 0 && segments.map((seg, i) => {
            const val = Math.max(0, seg.value)
            const strokeDasharray = `${(val / total) * circumference} ${circumference}`
            const strokeDashoffset = -accumulated * circumference
            accumulated += val / total
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {centerLabel && (
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span className="text-base font-extrabold text-slate-100 tracking-tight">
              {centerValue}
            </span>
          )}
        </div>
      </div>

      {/* Legend with percentages */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="font-medium text-slate-300">{seg.label}</span>
              <span className="font-bold text-slate-400">({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState('risk') // 'risk' | 'cagr' | 'sip' | 'emi' | 'option'

  // ══════════════════════════════════════════════════════
  // TAB 1: RISK / POSITION SIZE CALCULATOR STATE
  // ══════════════════════════════════════════════════════
  const [riskMode, setRiskMode] = useState('equity') // 'equity' | 'fno'
  const [riskCapital, setRiskCapital] = useState(100000)
  const [riskPct, setRiskPct] = useState(2)
  const [riskStoploss, setRiskStoploss] = useState(70)
  const [riskFnoIndex, setRiskFnoIndex] = useState('BANKNIFTY')
  const [riskFnoLotSize, setRiskFnoLotSize] = useState(15)

  // F&O Lot size presets
  const FNO_INDEX_LOTS = {
    'BANKNIFTY': 15,
    'NIFTY': 25,
    'FINNIFTY': 25,
    'MIDCPNIFTY': 50,
    'SENSEX': 10,
    'CUSTOM': riskFnoLotSize
  }

  const handleIndexChange = (e) => {
    const sym = e.target.value
    setRiskFnoIndex(sym)
    if (sym !== 'CUSTOM') {
      setRiskFnoLotSize(FNO_INDEX_LOTS[sym] || 25)
    }
  }

  // Risk Calculations
  const calculatedRiskAmount = (riskCapital * (riskPct / 100)) || 0
  const calculatedEquityQty = riskStoploss > 0 ? Math.floor(calculatedRiskAmount / riskStoploss) : 0
  const calculatedEquityActualRisk = calculatedEquityQty * riskStoploss

  const calculatedRiskPerLot = (riskFnoLotSize * riskStoploss) || 0
  const calculatedFnoLots = calculatedRiskPerLot > 0 ? Math.floor(calculatedRiskAmount / calculatedRiskPerLot) : 0
  const calculatedFnoQty = calculatedFnoLots * riskFnoLotSize
  const calculatedFnoActualRisk = calculatedFnoLots * calculatedRiskPerLot

  const handleClearRisk = () => {
    setRiskCapital(100000)
    setRiskPct(2)
    setRiskStoploss(riskMode === 'equity' ? 70 : 35)
  }

  // ══════════════════════════════════════════════════════
  // TAB 2: CAGR / REVERSE CAGR CALCULATOR STATE
  // ══════════════════════════════════════════════════════
  const [cagrMode, setCagrMode] = useState('cagr') // 'cagr' | 'reverse'
  const [cagrInitial, setCagrInitial] = useState(20000)
  const [cagrFinal, setCagrFinal] = useState(35000)
  const [cagrDuration, setCagrDuration] = useState(5)
  const [cagrRate, setCagrRate] = useState(11.84)

  // CAGR Calculations
  let computedCAGR = 0
  let computedAbsReturn = 0
  let computedGain = 0
  let finalCalculatedAmount = cagrFinal

  if (cagrMode === 'cagr') {
    if (cagrInitial > 0 && cagrFinal > 0 && cagrDuration > 0) {
      computedCAGR = ((Math.pow(cagrFinal / cagrInitial, 1 / cagrDuration) - 1) * 100)
      computedAbsReturn = ((cagrFinal - cagrInitial) / cagrInitial) * 100
      computedGain = cagrFinal - cagrInitial
    }
  } else {
    // Reverse CAGR
    if (cagrInitial > 0 && cagrDuration > 0) {
      finalCalculatedAmount = cagrInitial * Math.pow(1 + (cagrRate / 100), cagrDuration)
      computedGain = finalCalculatedAmount - cagrInitial
      computedAbsReturn = ((finalCalculatedAmount - cagrInitial) / cagrInitial) * 100
      computedCAGR = cagrRate
    }
  }

  const handleClearCAGR = () => {
    setCagrInitial(20000)
    setCagrFinal(35000)
    setCagrDuration(5)
    setCagrRate(12)
  }

  // ══════════════════════════════════════════════════════
  // TAB 3: SIP / LUMPSUM CALCULATOR STATE
  // ══════════════════════════════════════════════════════
  const [sipMode, setSipMode] = useState('sip') // 'sip' | 'lumpsum'
  const [sipAmount, setSipAmount] = useState(5000)
  const [sipReturnRate, setSipReturnRate] = useState(12)
  const [sipYears, setSipYears] = useState(10)

  // SIP / Lumpsum Calculations
  let sipInvested = 0
  let sipReturns = 0
  let sipTotalValue = 0

  if (sipMode === 'sip') {
    const monthlyRate = (sipReturnRate / 100) / 12
    const totalMonths = sipYears * 12
    if (monthlyRate > 0) {
      sipTotalValue = sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
    } else {
      sipTotalValue = sipAmount * totalMonths
    }
    sipInvested = sipAmount * totalMonths
    sipReturns = Math.max(0, sipTotalValue - sipInvested)
  } else {
    // Lumpsum
    sipInvested = sipAmount
    sipTotalValue = sipAmount * Math.pow(1 + (sipReturnRate / 100), sipYears)
    sipReturns = Math.max(0, sipTotalValue - sipInvested)
  }

  const handleResetSIP = () => {
    setSipAmount(5000)
    setSipReturnRate(12)
    setSipYears(10)
  }

  // ══════════════════════════════════════════════════════
  // TAB 4: EMI CALCULATOR STATE
  // ══════════════════════════════════════════════════════
  const [emiLoanAmount, setEmiLoanAmount] = useState(100000)
  const [emiRate, setEmiRate] = useState(8.5)
  const [emiTenure, setEmiTenure] = useState(5)

  // EMI Calculations
  const emiMonthlyRate = (emiRate / 12) / 100
  const emiTotalMonths = emiTenure * 12
  let calculatedMonthlyEMI = 0
  let calculatedTotalPayable = 0
  let calculatedTotalInterest = 0

  if (emiLoanAmount > 0 && emiTotalMonths > 0) {
    if (emiMonthlyRate > 0) {
      calculatedMonthlyEMI = (emiLoanAmount * emiMonthlyRate * Math.pow(1 + emiMonthlyRate, emiTotalMonths)) /
        (Math.pow(1 + emiMonthlyRate, emiTotalMonths) - 1)
      calculatedTotalPayable = calculatedMonthlyEMI * emiTotalMonths
      calculatedTotalInterest = calculatedTotalPayable - emiLoanAmount
    } else {
      calculatedMonthlyEMI = emiLoanAmount / emiTotalMonths
      calculatedTotalPayable = emiLoanAmount
      calculatedTotalInterest = 0
    }
  }

  const handleResetEMI = () => {
    setEmiLoanAmount(100000)
    setEmiRate(8.5)
    setEmiTenure(5)
  }

  // ══════════════════════════════════════════════════════
  // TAB 5: OPTION CALCULATOR STATE
  // ══════════════════════════════════════════════════════
  const [optionIndex, setOptionIndex] = useState('NIFTY')
  const [optionCapital, setOptionCapital] = useState(100000)
  const [optionRiskPct, setOptionRiskPct] = useState(2)
  const [optionStoplossPoints, setOptionStoplossPoints] = useState(20)
  const [optionStrikeCondition, setOptionStrikeCondition] = useState('Less Than')
  const [optionPrice, setOptionPrice] = useState(120)

  const OPTION_INDEX_LOTS = {
    'NIFTY': 25,
    'BANKNIFTY': 15,
    'FINNIFTY': 25,
    'MIDCPNIFTY': 50,
    'SENSEX': 10
  }

  const currentOptionLotSize = OPTION_INDEX_LOTS[optionIndex] || 25
  const optionMaxRiskAmount = (optionCapital * (optionRiskPct / 100)) || 0
  const optionRiskPerLot = (currentOptionLotSize * optionStoplossPoints) || 0
  const calculatedOptionLots = optionRiskPerLot > 0 ? Math.floor(optionMaxRiskAmount / optionRiskPerLot) : 0
  const calculatedOptionQty = calculatedOptionLots * currentOptionLotSize
  const calculatedOptionPremiumRequired = calculatedOptionQty * optionPrice
  const calculatedOptionActualRisk = calculatedOptionLots * optionRiskPerLot

  const handleClearOption = () => {
    setOptionCapital(100000)
    setOptionRiskPct(2)
    setOptionStoplossPoints(20)
    setOptionPrice(120)
  }

  return (
    <div className="min-h-screen pb-16 pt-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
            <span>DESK</span>
            <ChevronRight size={12} className="text-slate-500" />
            <span className="text-blue-400">Calculator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            {activeTab === 'risk' && <>Risk / Position Size Calculator <span className="text-amber-400">⭐</span></>}
            {activeTab === 'cagr' && <>CAGR / Reverse CAGR Calculator <span className="text-amber-400">⭐</span></>}
            {activeTab === 'sip' && <>SIP Calculator <span className="text-amber-400">⭐</span></>}
            {activeTab === 'emi' && <>EMI Calculator <span className="text-amber-400">⭐</span></>}
            {activeTab === 'option' && <>Option Calculator <span className="text-amber-400">⭐</span></>}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Institutional-grade calculators for capital risk management, position sizing, compound returns, and derivatives.
          </p>
        </div>

        {/* Top 5 Tab Navigation Bar with Icons matching Reference Screenshots */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
          <button
            id="tab-risk"
            onClick={() => setActiveTab('risk')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'risk'
                ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'risk' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
              <Target size={18} />
            </div>
            <span>Risk</span>
          </button>

          <button
            id="tab-cagr"
            onClick={() => setActiveTab('cagr')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'cagr'
                ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'cagr' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
              <TrendingUp size={18} />
            </div>
            <span>CAGR</span>
          </button>

          <button
            id="tab-sip"
            onClick={() => setActiveTab('sip')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'sip'
                ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'sip' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
              <Gift size={18} />
            </div>
            <span>SIP</span>
          </button>

          <button
            id="tab-emi"
            onClick={() => setActiveTab('emi')}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'emi'
                ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'emi' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
              <Landmark size={18} />
            </div>
            <span>EMI</span>
          </button>

          <button
            id="tab-option"
            onClick={() => setActiveTab('option')}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'option'
                ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'option' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
              <Sliders size={18} />
            </div>
            <span>Option</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB CONTENT CONTAINER
        ══════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* ══════════════════════════════════════════════════
              1. RISK / POSITION SIZE CALCULATOR
          ══════════════════════════════════════════════════ */}
          {activeTab === 'risk' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Main Interactive Card */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
                
                {/* Header row with Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-slate-100">Risk / Position Size Calculator</h2>
                  </div>
                  {/* Equity / F&O Mode Pill Switcher */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                    <button
                      onClick={() => { setRiskMode('equity'); setRiskStoploss(70); }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        riskMode === 'equity'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Equity
                    </button>
                    <button
                      onClick={() => { setRiskMode('fno'); setRiskStoploss(35); }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        riskMode === 'fno'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      F&O
                    </button>
                  </div>
                </div>

                {/* Grid: Inputs Left, Results Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                  {/* Left: Input Form */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Account Capital *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-slate-500 font-medium">₹</span>
                        <input
                          type="number"
                          value={riskCapital}
                          onChange={(e) => setRiskCapital(Number(e.target.value))}
                          placeholder="Enter capital amount"
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Risk Per Trade (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            value={riskPct}
                            onChange={(e) => setRiskPct(Number(e.target.value))}
                            placeholder="Enter risk per trade"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3.5 top-3 text-slate-500 font-medium">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          {riskMode === 'equity' ? 'Stoploss (In ₹) *' : 'Stoploss Points *'}
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={riskStoploss}
                          onChange={(e) => setRiskStoploss(Number(e.target.value))}
                          placeholder="Enter stoploss amount"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* F&O specific instrument and lot size */}
                    {riskMode === 'fno' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Index / Contract *
                          </label>
                          <select
                            value={riskFnoIndex}
                            onChange={handleIndexChange}
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="BANKNIFTY">Bank Nifty (Lot: 15)</option>
                            <option value="NIFTY">Nifty 50 (Lot: 25)</option>
                            <option value="FINNIFTY">Fin Nifty (Lot: 25)</option>
                            <option value="MIDCPNIFTY">Midcap Nifty (Lot: 50)</option>
                            <option value="SENSEX">Sensex (Lot: 10)</option>
                            <option value="CUSTOM">Custom Lot Size</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Lot Size *
                          </label>
                          <input
                            type="number"
                            value={riskFnoLotSize}
                            disabled={riskFnoIndex !== 'CUSTOM'}
                            onChange={(e) => setRiskFnoLotSize(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60"
                          />
                        </div>
                      </div>
                    )}

                    {/* Buttons: Clear, Calculate */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        onClick={handleClearRisk}
                        className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {}}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <span>Calculate</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Results Card */}
                  <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-5">
                        <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Result</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                          {riskMode === 'equity' ? 'Equity Sizing' : 'Derivatives Sizing'}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-xs text-slate-400 font-medium">Amount at Risk</span>
                          <p className="text-2xl font-black text-rose-400 mt-1">
                            {formatINR(riskMode === 'equity' ? calculatedEquityActualRisk : calculatedFnoActualRisk)}
                          </p>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            (Max allowed budget: {formatINR(calculatedRiskAmount)})
                          </span>
                        </div>

                        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-xs text-slate-400 font-medium">Total Quantity</span>
                          <p className="text-3xl font-black text-blue-400 mt-1">
                            {riskMode === 'equity' ? calculatedEquityQty : calculatedFnoQty}{' '}
                            <span className="text-sm font-semibold text-slate-400">
                              {riskMode === 'equity' ? 'Shares' : 'Contracts'}
                            </span>
                          </p>
                        </div>

                        {riskMode === 'fno' && (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                              <span className="text-[11px] text-slate-400">Number of Lots</span>
                              <p className="text-lg font-bold text-emerald-400 mt-0.5">
                                {calculatedFnoLots} <span className="text-xs text-slate-400">Lots</span>
                              </p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                              <span className="text-[11px] text-slate-400">Risk per Lot</span>
                              <p className="text-lg font-bold text-amber-400 mt-0.5">
                                {formatINR(calculatedRiskPerLot)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                      <span>Adherence to 2% Rule:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check size={14} /> Safe Position
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational & Educational Card from Screenshot 5 */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">What is Risk calculator?</h3>
                  <p className="text-slate-400 leading-relaxed">
                    One of the most important tools in a trader's bag is risk management. Proper position sizing is key to managing risk and to avoid blowing out your account on a single trade. If your position size is too limited or too wide, you may end up taking a lot of risk or end up taking not enough for you to profit from a trade.
                  </p>
                  <p className="text-slate-400 mt-2 leading-relaxed">
                    Knowing your risk position is critical to establishing a winning strategy. Our calculator helps you make trading decisions based on intellect and not emotion. That's how you trade like a pro. With a few simple inputs, our calculator will help you find the approximate units to buy or sell to control your maximum risk per position.
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-3">Important terms to understand</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-slate-200">Account capital:</span>
                      <p className="text-xs text-slate-400 mt-1">Pretty straightforward, traders just need to input their total deployable account capital.</p>
                    </div>
                    <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-slate-200">Risk per trade (%):</span>
                      <p className="text-xs text-slate-400 mt-1">This is a crucial field. Input the risk you are willing to take on that trade in % of your account capital. All Pro traders take risk in a range of 1-2% per trade.</p>
                    </div>
                    <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-slate-200">Stoploss in rupee:</span>
                      <p className="text-xs text-slate-400 mt-1">Here, traders should input the maximum number of points they are willing to risk in a trade to protect account capital in case the market goes against their position.</p>
                    </div>
                    <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-slate-200">Lot size:</span>
                      <p className="text-xs text-slate-400 mt-1">If you are trading in F&O enter the lot size of instrument you are taking trade in (e.g. Bank Nifty is 15, Nifty is 25).</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-3">How to use this Calculator?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/70 space-y-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-blue-400">For Equity:</span>
                      <p className="text-xs text-slate-300">Let's say you have purchased Reliance at 2500.</p>
                      <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                        <li>Your Account Capital is ₹1,00,000</li>
                        <li>You are willing to take Risk per trade is 2% = ₹2,000</li>
                        <li>You plan to exit if it goes down below 2430, so stoploss is ₹70</li>
                        <li>Total quantity you can enter = (1,00,000 × 2%) / 70 = 2,000 / 70 = <strong className="text-white">28 shares</strong></li>
                        <li>Now amount at risk = 28 × 70 = <strong className="text-rose-400">₹1,960</strong></li>
                      </ul>
                    </div>

                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/70 space-y-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">For F&O:</span>
                      <p className="text-xs text-slate-300">Let's say you trade BankNifty CE at 250 with capital ₹1,00,000.</p>
                      <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                        <li>2% risk of ₹1,00,000 = ₹2,000</li>
                        <li>Stoploss = 35 points (exit below 215)</li>
                        <li>Lot size of BankNifty = 15 (or 25)</li>
                        <li>Risk per lot = 15 × 35 = ₹525 (or 25 × 35 = ₹875)</li>
                        <li>No. of lots you can trade = 2,000 / 875 = 2.28 → <strong className="text-white">2 Lots</strong></li>
                        <li>Total Quantity = 2 × 25 = <strong className="text-white">50 qty</strong></li>
                        <li>Amount at risk = 2 × 875 = <strong className="text-rose-400">₹1,750</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              2. CAGR / REVERSE CAGR CALCULATOR
          ══════════════════════════════════════════════════ */}
          {activeTab === 'cagr' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
                
                {/* Header row with Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-slate-100">CAGR / Reverse CAGR Calculator</h2>
                  </div>
                  {/* CAGR / Reverse CAGR Switcher */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                    <button
                      onClick={() => setCagrMode('cagr')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        cagrMode === 'cagr'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      CAGR
                    </button>
                    <button
                      onClick={() => setCagrMode('reverse')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        cagrMode === 'reverse'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Reverse CAGR
                    </button>
                  </div>
                </div>

                {/* Grid: Inputs Left, Donut & Results Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                  {/* Left: Input Form */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Initial Amount *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-slate-500 font-medium">₹</span>
                        <input
                          type="number"
                          value={cagrInitial}
                          onChange={(e) => setCagrInitial(Number(e.target.value))}
                          placeholder="Enter initial capital amount"
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {cagrMode === 'cagr' ? (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Final Amount *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-500 font-medium">₹</span>
                          <input
                            type="number"
                            value={cagrFinal}
                            onChange={(e) => setCagrFinal(Number(e.target.value))}
                            placeholder="Enter final capital amount"
                            className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Expected CAGR (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={cagrRate}
                            onChange={(e) => setCagrRate(Number(e.target.value))}
                            placeholder="Enter expected annual return rate"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3.5 top-3 text-slate-500 font-medium">%</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Duration (Years) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={cagrDuration}
                        onChange={(e) => setCagrDuration(Number(e.target.value))}
                        placeholder="Enter duration in years"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Buttons: Clear, Calculate */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        onClick={handleClearCAGR}
                        className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {}}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <span>Calculate</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Results Card & Donut Chart */}
                  <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                        <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Result</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                          {cagrMode === 'cagr' ? 'CAGR Growth' : 'Projected Value'}
                        </span>
                      </div>

                      {/* Donut Chart */}
                      <DonutChart
                        segments={[
                          { label: 'Initial', value: cagrInitial, color: '#3b82f6' },
                          { label: 'Gain', value: Math.max(0, computedGain), color: '#22c55e' }
                        ]}
                        centerLabel={cagrMode === 'cagr' ? 'CAGR' : 'Future Value'}
                        centerValue={cagrMode === 'cagr' ? `${computedCAGR.toFixed(2)}%` : formatINR(finalCalculatedAmount)}
                      />

                      {/* Metric summary */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-center">
                          <span className="text-[11px] text-slate-400">CAGR Rate</span>
                          <p className="text-xl font-black text-amber-400 mt-0.5">
                            {computedCAGR.toFixed(2)}%
                          </p>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-center">
                          <span className="text-[11px] text-slate-400">Absolute Returns</span>
                          <p className="text-xl font-black text-emerald-400 mt-0.5">
                            {computedAbsReturn.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Total Wealth Created:</span>
                      <span className="text-slate-100 font-bold">{formatINR(computedGain)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational & Educational Card from Screenshot 1 */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">What is Compound Annual Growth Rate (CAGR)?</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Compound Annual Growth Rate (CAGR) is the annual growth of your investments over a specific period of time. In other words, it is a measure of how much you have earned on your investments every year during a given interval. This is one of the most accurate methods of calculating the rise or fall of your investment returns over time.
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-3">How to calculate CAGR?</h3>
                  <ol className="text-slate-400 text-xs sm:text-sm space-y-2 list-decimal list-inside">
                    <li>1st: Divide the investment value at the end of the period by the initial value.</li>
                    <li>Then increase the result to the power of one divided by the time period of the investment in years.</li>
                    <li>Subtract one from the total.</li>
                  </ol>
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 my-3 font-mono text-xs text-blue-400">
                    CAGR = (FA / IA)^(1 / n) - 1
                  </div>
                  <p className="text-xs text-slate-500">
                    In the above formula, FA stands for the final amount of the investment, IA stands for the present value of the investment, and n stands for the number of years of investment.
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-2">Let's take an example:</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Imagine you invested Rs 20,000 in a mutual fund in 2015. The investment will be worth Rs 35,000 in 2020. Using the formula, the CAGR of this mutual fund investment will be:
                  </p>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 my-2 font-mono text-xs text-emerald-400">
                    CAGR = (35000 / 20000)^(1 / 5) - 1 = 11.84%
                  </div>
                  <p className="text-xs text-slate-400">
                    Here, that means the mutual fund investment gave you an average return of 11.84% per annum. You can also calculate the absolute returns on investment using the CAGR calculator: Absolute returns = (FA - IA) / PV * 100 = (35000 - 20000) / 20000 * 100 = 75%.
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-3">Advantages of using CAGR</h3>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                    <li>It will enable you to evaluate your investment options. For example, if stock A is not working as well as Stock B based on their respective CAGR indices, you can invest in Stock B instead.</li>
                    <li>The relative growth of your organization with respect to the market leaders in your business segment.</li>
                    <li>CAGR is a more accurate way of calculating and determining returns of an investment the value of which changes over time. Investors can compare the 2 investment options of the same category or a market index using CAGR.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              3. SIP / LUMPSUM CALCULATOR
          ══════════════════════════════════════════════════ */}
          {activeTab === 'sip' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
                
                {/* Header row with Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-slate-100">SIP Calculator</h2>
                  </div>
                  {/* SIP / Lumpsum Switcher */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                    <button
                      onClick={() => setSipMode('sip')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sipMode === 'sip'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      SIP
                    </button>
                    <button
                      onClick={() => setSipMode('lumpsum')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sipMode === 'lumpsum'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Lumpsum
                    </button>
                  </div>
                </div>

                {/* Grid: Interactive Sliders Left, Donut & Results Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                  {/* Left: Range Sliders & Inputs */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Monthly Investment Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          {sipMode === 'sip' ? 'Monthly Investment *' : 'Total Investment *'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">₹</span>
                          <input
                            type="number"
                            value={sipAmount}
                            onChange={(e) => setSipAmount(Number(e.target.value))}
                            className="w-32 pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        min={sipMode === 'sip' ? 500 : 5000}
                        max={sipMode === 'sip' ? 200000 : 2000000}
                        step={sipMode === 'sip' ? 500 : 5000}
                        value={sipAmount}
                        onChange={(e) => setSipAmount(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Expected Return Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Expected Return P.A. (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            value={sipReturnRate}
                            onChange={(e) => setSipReturnRate(Number(e.target.value))}
                            className="w-24 pr-6 pl-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-2 top-1 text-xs text-slate-500">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="0.5"
                        value={sipReturnRate}
                        onChange={(e) => setSipReturnRate(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Time Period Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Time Period (Years) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={sipYears}
                            onChange={(e) => setSipYears(Number(e.target.value))}
                            className="w-24 pr-6 pl-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-2 top-1 text-xs text-slate-500">Yr</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="40"
                        step="1"
                        value={sipYears}
                        onChange={(e) => setSipYears(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={handleResetSIP}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                      >
                        <RotateCcw size={13} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Results Card & Donut Chart */}
                  <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                        <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Result</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                          {sipMode === 'sip' ? 'Systematic Plan' : 'One-time Lumpsum'}
                        </span>
                      </div>

                      {/* Donut Chart */}
                      <DonutChart
                        segments={[
                          { label: 'Invested', value: sipInvested, color: '#3b82f6' },
                          { label: 'Returns', value: sipReturns, color: '#22c55e' }
                        ]}
                        centerLabel="Total Value"
                        centerValue={formatINR(sipTotalValue)}
                      />

                      {/* Financial Figures */}
                      <div className="space-y-2.5 mt-5">
                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                          <span className="text-slate-400">Invested Amount:</span>
                          <span className="text-slate-100 font-bold">{formatINR(sipInvested)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                          <span className="text-slate-400">Estimate Returns:</span>
                          <span className="text-emerald-400 font-bold">{formatINR(sipReturns)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-2">
                          <span className="text-slate-200 font-semibold">Total Value:</span>
                          <span className="text-blue-400 font-black text-base">{formatINR(sipTotalValue)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
                      Compounded monthly over {sipYears} years at {sipReturnRate}% p.a.
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational & Educational Card from Screenshot 4 */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">What is SIP calculator?</h3>
                  <p className="text-slate-400 leading-relaxed">
                    A Systematic Investment Plan (SIP) calculator is an online financial tool that can help to calculate the returns you would earn on your SIP investments. The calculator also tells you how much you would need to invest every month to earn a target corpus. Simply put, it provides a roadmap to achieve your various financial goals.
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-2">Formula to Calculate your SIP:</h3>
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 my-2 font-mono text-xs text-blue-400">
                    M = P × [ (1 + i)^n - 1 ] / i × (1 + i)
                  </div>
                  <p className="text-xs text-slate-400 space-y-1">
                    In this formula:
                    <br />• <strong>M</strong> is the amount you receive on maturity
                    <br />• <strong>P</strong> is the amount you invest at regular intervals
                    <br />• <strong>n</strong> is the number of payments you have made so far
                    <br />• <strong>i</strong> is the periodic rate of interest
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-2">How to calculate SIP investments?</h3>
                  <p className="text-xs text-slate-400">
                    Suppose you wish to invest Rs 4,000 per month for 10 years. The expected rate of return is 10%.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside my-2">
                    <li>Monthly investment amount = 4,000</li>
                    <li>Expected return p.a. = 10%</li>
                    <li>Investment period (in years) = 10 years</li>
                  </ul>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 text-xs text-slate-300 space-y-1">
                    <p>• Invested Amount: <strong className="text-white">₹4,80,000</strong></p>
                    <p>• Estimated Returns: <strong className="text-emerald-400">₹3,46,203</strong></p>
                    <p>• Total Value: <strong className="text-blue-400">₹8,26,203</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              4. EMI CALCULATOR
          ══════════════════════════════════════════════════ */}
          {activeTab === 'emi' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
                
                {/* Header row with Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-slate-100">EMI Calculator</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Real-time Monthly Amortization</span>
                  </div>
                </div>

                {/* Grid: Range Sliders Left, Donut & Results Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                  {/* Left: Sliders */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Loan Amount Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Loan Amount *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">₹</span>
                          <input
                            type="number"
                            value={emiLoanAmount}
                            onChange={(e) => setEmiLoanAmount(Number(e.target.value))}
                            className="w-32 pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="20000000"
                        step="10000"
                        value={emiLoanAmount}
                        onChange={(e) => setEmiLoanAmount(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Rate of Interest Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Rate of Interest (P.A.) % *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={emiRate}
                            onChange={(e) => setEmiRate(Number(e.target.value))}
                            className="w-24 pr-6 pl-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-2 top-1 text-xs text-slate-500">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="25"
                        step="0.1"
                        value={emiRate}
                        onChange={(e) => setEmiRate(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Loan Tenure Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Loan Tenure (Years) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={emiTenure}
                            onChange={(e) => setEmiTenure(Number(e.target.value))}
                            className="w-24 pr-6 pl-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 text-right focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-2 top-1 text-xs text-slate-500">Yr</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={emiTenure}
                        onChange={(e) => setEmiTenure(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={handleResetEMI}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                      >
                        <RotateCcw size={13} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Results Card & Donut Chart */}
                  <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                        <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Result</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
                          Monthly Installment
                        </span>
                      </div>

                      {/* Donut Chart */}
                      <DonutChart
                        segments={[
                          { label: 'Principal', value: emiLoanAmount, color: '#3b82f6' },
                          { label: 'Interest', value: calculatedTotalInterest, color: '#06b6d4' }
                        ]}
                        centerLabel="Monthly EMI"
                        centerValue={formatINR(calculatedMonthlyEMI)}
                      />

                      {/* Breakdown Numbers */}
                      <div className="space-y-2.5 mt-5">
                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                          <span className="text-slate-400">Monthly EMI:</span>
                          <span className="text-blue-400 font-bold">{formatINR(calculatedMonthlyEMI)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                          <span className="text-slate-400">Principal Amount:</span>
                          <span className="text-slate-100 font-bold">{formatINR(emiLoanAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                          <span className="text-slate-400">Total Interest:</span>
                          <span className="text-cyan-400 font-bold">{formatINR(calculatedTotalInterest)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-2">
                          <span className="text-slate-200 font-semibold">Total Amount:</span>
                          <span className="text-slate-100 font-black text-base">{formatINR(calculatedTotalPayable)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
                      Total {emiTotalMonths} monthly installments over {emiTenure} years
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational & Educational Card from Screenshot 3 */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">What is EMI calculator?</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Equated Monthly Installment - EMI for short - is the amount payable every month to the bank or any other financial institution until the loan amount is fully paid off. It consists of the interest on loan as well as part of the principal amount to be repaid. The sum of principal amount and interest is divided by the tenure, i.e., number of months, in which the loan has to be repaid.
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-2">Formula:</h3>
                  <p className="text-xs text-slate-400">There is a specific formula that we use to compute the EMI amount for a loan:</p>
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/70 my-2 font-mono text-xs text-blue-400">
                    EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
                  </div>
                  <p className="text-xs text-slate-400 space-y-1">
                    where:
                    <br />• <strong>P</strong> is the principal loan amount
                    <br />• <strong>R</strong> is the rate of interest per month [ (Annual Rate / 12) / 100 ]
                    <br />• <strong>N</strong> is the loan tenure in months
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-2">How to calculate EMI</h3>
                  <p className="text-xs text-slate-400">
                    For example, if you take a loan of ₹10,00,000 from the bank at 10.5% annual interest for a period of 10 years (i.e., 120 months):
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside my-2">
                    <li>Loan Amount = ₹10,00,000</li>
                    <li>Rate of Interest (p.a) = 10.5%</li>
                    <li>Loan Tenure = 10 years (120 months)</li>
                  </ul>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 text-xs text-slate-300">
                    Therefore, EMI = <strong className="text-blue-400">₹13,493</strong> per month. Total amount payable = 120 × ₹13,493 = <strong className="text-white">₹16,19,220</strong> (Total interest included = <strong className="text-cyan-400">₹6,19,220</strong>).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              5. OPTION CALCULATOR
          ══════════════════════════════════════════════════ */}
          {activeTab === 'option' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
                
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-slate-100">Option Calculator</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Derivative Strike & Quantity Optimization</span>
                  </div>
                </div>

                {/* Grid: Inputs Left, Results Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                  {/* Left: Input Form */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Index *
                        </label>
                        <select
                          value={optionIndex}
                          onChange={(e) => setOptionIndex(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="NIFTY">Nifty 50 (Lot: 25)</option>
                          <option value="BANKNIFTY">Bank Nifty (Lot: 15)</option>
                          <option value="FINNIFTY">Fin Nifty (Lot: 25)</option>
                          <option value="MIDCPNIFTY">Midcap Nifty (Lot: 50)</option>
                          <option value="SENSEX">Sensex (Lot: 10)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Trading Capital *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-500 font-medium">₹</span>
                          <input
                            type="number"
                            value={optionCapital}
                            onChange={(e) => setOptionCapital(Number(e.target.value))}
                            placeholder="Enter trading capital"
                            className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Risk Per Trade (%) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            value={optionRiskPct}
                            onChange={(e) => setOptionRiskPct(Number(e.target.value))}
                            placeholder="Enter risk per trade"
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-3.5 top-2 text-slate-500 font-medium">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Stoploss Per Trade (Points) *
                        </label>
                        <input
                          type="number"
                          value={optionStoplossPoints}
                          onChange={(e) => setOptionStoplossPoints(Number(e.target.value))}
                          placeholder="Enter stoploss points"
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Strike Condition *
                        </label>
                        <select
                          value={optionStrikeCondition}
                          onChange={(e) => setOptionStrikeCondition(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="Less Than">Less Than (OTM / Deep OTM)</option>
                          <option value="Greater Than">Greater Than (ITM / Deep ITM)</option>
                          <option value="At The Money">At The Money (ATM)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                          Price (Premium) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-500 font-medium">₹</span>
                          <input
                            type="number"
                            value={optionPrice}
                            onChange={(e) => setOptionPrice(Number(e.target.value))}
                            placeholder="Enter premium price"
                            className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Buttons: Clear, Calculate */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        onClick={handleClearOption}
                        className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {}}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <span>Calculate</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Results Card */}
                  <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-5">
                        <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Result</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                          {optionIndex} ({currentOptionLotSize}/lot)
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-xs text-slate-400 font-medium">Quantity to Buy</span>
                          <p className="text-3xl font-black text-blue-400 mt-1">
                            {calculatedOptionQty}{' '}
                            <span className="text-sm font-semibold text-slate-400">Qty ({calculatedOptionLots} Lots)</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
                            <span className="text-[11px] text-slate-400">Max Risk Budget</span>
                            <p className="text-base font-bold text-rose-400 mt-0.5">
                              {formatINR(calculatedOptionActualRisk)}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
                            <span className="text-[11px] text-slate-400">Capital Required</span>
                            <p className="text-base font-bold text-amber-400 mt-0.5">
                              {formatINR(calculatedOptionPremiumRequired)}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/40 text-xs text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Risk per Lot:</span>
                            <span className="font-semibold text-slate-200">{formatINR(optionRiskPerLot)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-slate-400">Strike Match:</span>
                            <span className="font-semibold text-indigo-400">{optionStrikeCondition} Selection</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                      <span>Execution Sizing:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck size={14} /> Risk Controlled
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational & Educational Card from Screenshot 2 */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">What is Option calculator?</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Optimize your trades by getting the trade quantity and nearest matched strike price suggestion based on LTP. A powerful tool designed to optimize your trading strategies with precision and efficiency. Whether you're a seasoned investor or just starting out, this calculator simplifies complex financial decisions into clear, actionable insights.
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-5">
                  <h3 className="text-base font-bold text-white mb-3">Key Option Sizing Rules:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-blue-400 text-xs uppercase tracking-wider block mb-1">1. Stoploss in Points</span>
                      <p className="text-xs text-slate-400">
                        Always size lots based on index points rather than arbitrary rupee values. Multiply stoploss points by the contract lot size to determine per-lot risk.
                      </p>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-indigo-400 text-xs uppercase tracking-wider block mb-1">2. Strike Condition</span>
                      <p className="text-xs text-slate-400">
                        Less Than filters for lower premium OTM strikes, while Greater Than focuses on high-delta In-The-Money (ITM) options with lower time decay.
                      </p>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                      <span className="font-semibold text-emerald-400 text-xs uppercase tracking-wider block mb-1">3. Capital Utilization</span>
                      <p className="text-xs text-slate-400">
                        Never allocate more than 20-30% of total capital into naked option buys, even when the risk percentage permits higher lot sizing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
