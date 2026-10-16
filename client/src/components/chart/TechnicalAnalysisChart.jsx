import { useEffect, useRef, useState, useMemo } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries,
} from 'lightweight-charts'
import {
  Sliders,
  Eye,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Activity,
  Compass,
} from 'lucide-react'
import api from '../../lib/api'
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateVWAP,
  calculateHeikinAshi,
} from '../../lib/indicators'
import { detectCandlestickPatterns, PATTERN_DISCLAIMER } from '../../lib/patterns'

const SYMBOLS = [
  // Primary Benchmark Indices
  { symbol: 'NIFTY50', name: 'Nifty 50', type: 'Index' },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', type: 'Index' },
  { symbol: 'SENSEX', name: 'BSE Sensex', type: 'Index' },
  { symbol: 'FINNIFTY', name: 'Nifty Financial Services', type: 'Index' },
  { symbol: 'NIFTYIT', name: 'Nifty IT Index', type: 'Index' },

  // NSE Equities across key sectors
  { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'Stock' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'Stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', type: 'Stock' },
  { symbol: 'INFY', name: 'Infosys Ltd', type: 'Stock' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', type: 'Stock' },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'Stock' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', type: 'Stock' },
  { symbol: 'ITC', name: 'ITC Limited', type: 'Stock' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', type: 'Stock' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', type: 'Stock' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', type: 'Stock' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', type: 'Stock' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', type: 'Stock' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', type: 'Stock' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', type: 'Stock' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', type: 'Stock' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', type: 'Stock' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', type: 'Stock' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', type: 'Stock' },
  { symbol: 'BEL', name: 'Bharat Electronics', type: 'Stock' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics', type: 'Stock' },
  { symbol: 'TRENT', name: 'Trent Ltd', type: 'Stock' },
  { symbol: 'TATAPOWER', name: 'Tata Power Ltd', type: 'Stock' },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', type: 'Stock' },
  { symbol: 'INDIGO', name: 'InterGlobe Aviation', type: 'Stock' },
  { symbol: 'IRCTC', name: 'IRCTC Ltd', type: 'Stock' },
  { symbol: 'DLF', name: 'DLF Ltd', type: 'Stock' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems', type: 'Stock' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', type: 'Stock' },
  { symbol: 'DIXON', name: 'Dixon Tech', type: 'Stock' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', type: 'Stock' },
]

const TIMEFRAMES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '2Y', range: '2y', interval: '1d' },
]

export default function TechnicalAnalysisChart({
  defaultSymbol = 'NIFTY50',
  height = 480,
  defaultTimeframe = null,
}) {
  // Chart selection state
  const [symbol, setSymbol] = useState(defaultSymbol)
  
  // Default to 2Y for stocks or if explicitly requested via defaultTimeframe
  const initialTf = useMemo(() => {
    if (defaultTimeframe) {
      return TIMEFRAMES.find((t) => t.label === defaultTimeframe) || TIMEFRAMES[5]
    }
    return defaultSymbol === 'NIFTY50' ? TIMEFRAMES[1] : TIMEFRAMES[5] // 2Y (TIMEFRAMES[5])
  }, [defaultTimeframe, defaultSymbol])

  const [selectedTf, setSelectedTf] = useState(initialTf)
  const [chartType, setChartType] = useState('candlestick') // candlestick, line, area, bar, heikin-ashi

  useEffect(() => {
    if (defaultSymbol && defaultSymbol !== symbol) {
      setSymbol(defaultSymbol)
    }
  }, [defaultSymbol])

  useEffect(() => {
    if (defaultTimeframe) {
      const found = TIMEFRAMES.find((t) => t.label === defaultTimeframe)
      if (found) setSelectedTf(found)
    }
  }, [defaultTimeframe])

  const availableSymbols = useMemo(() => {
    if (symbol && !SYMBOLS.some((s) => s.symbol === symbol)) {
      return [...SYMBOLS, { symbol, name: symbol, type: 'Stock' }]
    }
    return SYMBOLS
  }, [symbol])

  // Data state
  const [rawData, setRawData] = useState([])
  const [chartMeta, setChartMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Indicator Settings
  const [showVolume, setShowVolume] = useState(true)
  const [showSMA, setShowSMA] = useState(true)
  const [smaPeriod, setSmaPeriod] = useState(20)

  const [showEMA, setShowEMA] = useState(false)
  const [emaPeriod, setEmaPeriod] = useState(20)

  const [showBB, setShowBB] = useState(false)
  const [bbPeriod, setBbPeriod] = useState(20)
  const [bbStdDev, setBbStdDev] = useState(2)

  const [showVWAP, setShowVWAP] = useState(false)

  // Sub-pane Indicator (None, RSI, MACD, ATR)
  const [subIndicator, setSubIndicator] = useState('rsi')
  const [rsiPeriod, setRsiPeriod] = useState(14)

  // Pattern scanner
  const [showPatterns, setShowPatterns] = useState(true)
  const [selectedPattern, setSelectedPattern] = useState(null)

  // UI state
  const [showSettings, setShowSettings] = useState(false)

  // Refs for Chart DOM containers
  const mainChartContainerRef = useRef(null)
  const subChartContainerRef = useRef(null)

  const mainChartRef = useRef(null)
  const subChartRef = useRef(null)

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(
        `/market/chart/${symbol}?interval=${selectedTf.interval}&range=${selectedTf.range}`
      )
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRawData(data.data)
        setChartMeta({
          name: data.name || symbol,
          symbol: data.symbol,
          exchange: data.exchange,
          count: data.count,
          lastCandleTime: data.lastCandleTime,
          sourceTimestamp: data.sourceTimestamp,
          dataFreshness: data.dataFreshness,
          isMarketOpen: data.isMarketOpen,
          interval: data.interval,
          range: data.range,
          note: data.note,
        })
      } else {
        setError(`No price data available for ${symbol} on selected timeframe.`)
        setRawData([])
      }
    } catch (err) {
      console.error('Chart data fetch error:', err)
      setError(err.response?.data?.message || 'Failed to load historical chart data.')
      setRawData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [symbol, selectedTf])

  // Process candles (raw or Heikin-Ashi)
  const chartCandles = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    if (chartType === 'heikin-ashi') {
      return calculateHeikinAshi(rawData)
    }
    return rawData
  }, [rawData, chartType])

  // Detect patterns
  const detectedPatterns = useMemo(() => {
    if (!rawData || rawData.length < 3) return []
    return detectCandlestickPatterns(rawData)
  }, [rawData])

  // Setup / Render Main Chart
  useEffect(() => {
    if (!mainChartContainerRef.current || chartCandles.length === 0) return

    let chart = null
    let handleResize = null

    try {
      if (mainChartRef.current) {
        mainChartRef.current.remove()
        mainChartRef.current = null
      }

      const container = mainChartContainerRef.current
      const mainHeight = subIndicator !== 'none' ? height * 0.72 : height

      chart = createChart(container, {
        width: container.clientWidth || 320,
        height: mainHeight,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(51,65,85,0.3)' },
          horzLines: { color: 'rgba(51,65,85,0.3)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: '#334155',
          scaleMargins: { top: 0.1, bottom: showVolume ? 0.2 : 0.1 },
        },
        timeScale: {
          borderColor: '#334155',
          timeVisible: selectedTf.range === '1d' || selectedTf.range === '5d',
          secondsVisible: false,
        },
      })
      mainChartRef.current = chart

      // 1. Primary Price Series
      let priceSeries = null
      if (chartType === 'candlestick' || chartType === 'heikin-ashi') {
        priceSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })
        priceSeries.setData(
          chartCandles.map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        )
      } else if (chartType === 'line') {
        priceSeries = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
        })
        priceSeries.setData(chartCandles.map((c) => ({ time: c.time, value: c.close })))
      } else if (chartType === 'area') {
        priceSeries = chart.addSeries(AreaSeries, {
          topColor: 'rgba(59, 130, 246, 0.4)',
          bottomColor: 'rgba(59, 130, 246, 0.02)',
          lineColor: '#3b82f6',
          lineWidth: 2,
        })
        priceSeries.setData(chartCandles.map((c) => ({ time: c.time, value: c.close })))
      } else if (chartType === 'bar') {
        priceSeries = chart.addSeries(BarSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
        })
        priceSeries.setData(
          chartCandles.map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        )
      }

      // 2. Volume Overlay
      if (showVolume) {
        try {
          const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: '', // overlay mode
          })
          if (volumeSeries.priceScale) {
            volumeSeries.priceScale().applyOptions({
              scaleMargins: { top: 0.8, bottom: 0 },
            })
          }
          volumeSeries.setData(
            chartCandles.map((c) => ({
              time: c.time,
              value: c.volume || 0,
              color: c.close >= c.open ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
            }))
          )
        } catch (volErr) {
          console.warn('Volume overlay warning:', volErr)
        }
      }

      // 3. Technical Indicator Overlays
      if (showSMA) {
        const smaData = calculateSMA(rawData, smaPeriod)
        if (smaData.length > 0) {
          const smaSeries = chart.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 1.5,
            title: `SMA ${smaPeriod}`,
          })
          smaSeries.setData(smaData)
        }
      }

      if (showEMA) {
        const emaData = calculateEMA(rawData, emaPeriod)
        if (emaData.length > 0) {
          const emaSeries = chart.addSeries(LineSeries, {
            color: '#06b6d4',
            lineWidth: 1.5,
            title: `EMA ${emaPeriod}`,
          })
          emaSeries.setData(emaData)
        }
      }

      if (showBB) {
        const bbData = calculateBollingerBands(rawData, bbPeriod, bbStdDev)
        if (bbData.length > 0) {
          const upperSeries = chart.addSeries(LineSeries, {
            color: 'rgba(168, 85, 247, 0.6)',
            lineWidth: 1,
            lineStyle: 2,
            title: `BB Upper (${bbPeriod})`,
          })
          const middleSeries = chart.addSeries(LineSeries, {
            color: 'rgba(168, 85, 247, 0.9)',
            lineWidth: 1.5,
            title: `BB Mid (${bbPeriod})`,
          })
          const lowerSeries = chart.addSeries(LineSeries, {
            color: 'rgba(168, 85, 247, 0.6)',
            lineWidth: 1,
            lineStyle: 2,
            title: `BB Lower (${bbPeriod})`,
          })

          upperSeries.setData(bbData.map((d) => ({ time: d.time, value: d.upper })))
          middleSeries.setData(bbData.map((d) => ({ time: d.time, value: d.middle })))
          lowerSeries.setData(bbData.map((d) => ({ time: d.time, value: d.lower })))
        }
      }

      if (showVWAP) {
        const vwapData = calculateVWAP(rawData)
        if (vwapData.length > 0) {
          const vwapSeries = chart.addSeries(LineSeries, {
            color: '#ec4899',
            lineWidth: 1.5,
            title: 'VWAP',
          })
          vwapSeries.setData(vwapData.map((d) => ({ time: d.time, value: d.value })))
        }
      }

      chart.timeScale().fitContent()

      handleResize = () => {
        if (container && chart && container.clientWidth > 0) {
          chart.applyOptions({ width: container.clientWidth })
        }
      }
      window.addEventListener('resize', handleResize)
    } catch (chartErr) {
      console.error('Main chart build error:', chartErr)
    }

    return () => {
      if (handleResize) {
        window.removeEventListener('resize', handleResize)
      }
      if (chart) {
        try {
          chart.remove()
        } catch {}
        mainChartRef.current = null
      }
    }
  }, [
    chartCandles,
    chartType,
    showVolume,
    showSMA,
    smaPeriod,
    showEMA,
    emaPeriod,
    showBB,
    bbPeriod,
    bbStdDev,
    showVWAP,
    subIndicator,
    height,
  ])

  // Setup / Render Sub-Pane Chart (RSI, MACD, ATR)
  useEffect(() => {
    if (subIndicator === 'none' || !subChartContainerRef.current || rawData.length === 0) {
      if (subChartRef.current) {
        try {
          subChartRef.current.remove()
        } catch {}
        subChartRef.current = null
      }
      return
    }

    let subChart = null
    let handleResize = null

    try {
      if (subChartRef.current) {
        subChartRef.current.remove()
        subChartRef.current = null
      }

      const container = subChartContainerRef.current
      subChart = createChart(container, {
        width: container.clientWidth || 320,
        height: 140,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
        },
        grid: {
          vertLines: { color: 'rgba(51,65,85,0.2)' },
          horzLines: { color: 'rgba(51,65,85,0.2)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#334155' },
        timeScale: {
          borderColor: '#334155',
          timeVisible: selectedTf.range === '1d' || selectedTf.range === '5d',
          secondsVisible: false,
        },
      })
      subChartRef.current = subChart

      if (subIndicator === 'rsi') {
        const rsiData = calculateRSI(rawData, rsiPeriod)
        if (rsiData.length > 0) {
          const rsiSeries = subChart.addSeries(LineSeries, {
            color: '#818cf8',
            lineWidth: 1.5,
            title: `RSI (${rsiPeriod})`,
          })
          rsiSeries.setData(rsiData)

          const obLine = subChart.addSeries(LineSeries, {
            color: 'rgba(239, 68, 68, 0.4)',
            lineWidth: 1,
            lineStyle: 2,
          })
          obLine.setData(rsiData.map((d) => ({ time: d.time, value: 70 })))

          const osLine = subChart.addSeries(LineSeries, {
            color: 'rgba(34, 197, 94, 0.4)',
            lineWidth: 1,
            lineStyle: 2,
          })
          osLine.setData(rsiData.map((d) => ({ time: d.time, value: 30 })))
        }
      } else if (subIndicator === 'macd') {
        const macdData = calculateMACD(rawData, 12, 26, 9)
        if (macdData.length > 0) {
          const histSeries = subChart.addSeries(HistogramSeries, {
            title: 'Histogram',
          })
          histSeries.setData(
            macdData.map((d) => ({
              time: d.time,
              value: d.histogram,
              color: d.histogram >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)',
            }))
          )

          const macdLine = subChart.addSeries(LineSeries, {
            color: '#38bdf8',
            lineWidth: 1.5,
            title: 'MACD (12,26)',
          })
          macdLine.setData(macdData.map((d) => ({ time: d.time, value: d.macd })))

          const sigLine = subChart.addSeries(LineSeries, {
            color: '#f97316',
            lineWidth: 1.5,
            title: 'Signal (9)',
          })
          sigLine.setData(macdData.map((d) => ({ time: d.time, value: d.signal })))
        }
      } else if (subIndicator === 'atr') {
        const atrData = calculateATR(rawData, 14)
        if (atrData.length > 0) {
          const atrSeries = subChart.addSeries(LineSeries, {
            color: '#facc15',
            lineWidth: 1.5,
            title: 'ATR (14)',
          })
          atrSeries.setData(atrData)
        }
      }

      subChart.timeScale().fitContent()

      handleResize = () => {
        if (container && subChart && container.clientWidth > 0) {
          subChart.applyOptions({ width: container.clientWidth })
        }
      }
      window.addEventListener('resize', handleResize)
    } catch (subErr) {
      console.error('Sub chart build error:', subErr)
    }

    return () => {
      if (handleResize) {
        window.removeEventListener('resize', handleResize)
      }
      if (subChart) {
        try {
          subChart.remove()
        } catch {}
        subChartRef.current = null
      }
    }
  }, [subIndicator, rawData, rsiPeriod, selectedTf])

  return (
    <div className="card space-y-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      {/* Header controls: Symbol Selector, Timeframe, Chart Type, Indicator Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol Select */}
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold outline-none border focus:ring-1 focus:ring-blue-500 cursor-pointer"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            <optgroup label="Benchmark Indices">
              {availableSymbols.filter((s) => s.type === 'Index').map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.name} ({s.symbol})
                </option>
              ))}
            </optgroup>
            <optgroup label="NSE Equities">
              {availableSymbols.filter((s) => s.type === 'Stock').map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.name} ({s.symbol})
                </option>
              ))}
            </optgroup>
          </select>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-lg border border-slate-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                type="button"
                onClick={() => setSelectedTf(tf)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  selectedTf.label === tf.label
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none border cursor-pointer"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            <option value="candlestick">Candlestick</option>
            <option value="heikin-ashi">Heikin-Ashi</option>
            <option value="line">Line View</option>
            <option value="area">Area View</option>
            <option value="bar">OHLC Bar</option>
          </select>
        </div>

        {/* Indicator & Pattern Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className={`btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg ${
              showSettings ? 'border-blue-500 text-blue-400' : ''
            }`}
          >
            <Sliders size={13} />
            <span>Indicators ({[showSMA, showEMA, showBB, showVWAP].filter(Boolean).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPatterns((v) => !v)}
            className={`btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg ${
              showPatterns ? 'border-indigo-500 text-indigo-400' : ''
            }`}
          >
            <Eye size={13} />
            <span>Patterns ({detectedPatterns.length})</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh historical market data"
            className="btn-ghost p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Heikin-Ashi Clarification Warning */}
      {chartType === 'heikin-ashi' && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}
        >
          <Info size={14} className="shrink-0" />
          <span>
            <strong>Heikin-Ashi Mode Active:</strong> Transformed candles smooth noise using average formulas
            (Close = [O+H+L+C]/4). They represent trend momentum, not actual exchange trade execution prices.
          </span>
        </div>
      )}

      {/* Indicator Settings Panel */}
      {showSettings && (
        <div
          className="p-4 rounded-xl space-y-4 border text-xs"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Indicator Configuration</span>
            <span className="text-slate-400">All formulas mathematically computed from historical candles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* SMA */}
            <div className="p-3 rounded-lg border border-slate-800 space-y-2 bg-slate-900/30">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-amber-400">Simple Moving Avg (SMA)</span>
                <input
                  type="checkbox"
                  checked={showSMA}
                  onChange={(e) => setShowSMA(e.target.checked)}
                  className="rounded text-amber-500"
                />
              </label>
              <div className="flex items-center justify-between text-slate-400">
                <span>Period: {smaPeriod}</span>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={smaPeriod}
                  disabled={!showSMA}
                  onChange={(e) => setSmaPeriod(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>

            {/* EMA */}
            <div className="p-3 rounded-lg border border-slate-800 space-y-2 bg-slate-900/30">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-cyan-400">Exponential MA (EMA)</span>
                <input
                  type="checkbox"
                  checked={showEMA}
                  onChange={(e) => setShowEMA(e.target.checked)}
                  className="rounded text-cyan-500"
                />
              </label>
              <div className="flex items-center justify-between text-slate-400">
                <span>Period: {emaPeriod}</span>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={emaPeriod}
                  disabled={!showEMA}
                  onChange={(e) => setEmaPeriod(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className="p-3 rounded-lg border border-slate-800 space-y-2 bg-slate-900/30">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-purple-400">Bollinger Bands</span>
                <input
                  type="checkbox"
                  checked={showBB}
                  onChange={(e) => setShowBB(e.target.checked)}
                  className="rounded text-purple-500"
                />
              </label>
              <div className="flex items-center justify-between text-slate-400">
                <span>Std Dev: {bbStdDev}σ</span>
                <select
                  value={bbStdDev}
                  disabled={!showBB}
                  onChange={(e) => setBbStdDev(Number(e.target.value))}
                  className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-slate-200"
                >
                  <option value={1.5}>1.5</option>
                  <option value={2}>2.0</option>
                  <option value={2.5}>2.5</option>
                </select>
              </div>
            </div>

            {/* VWAP */}
            <div className="p-3 rounded-lg border border-slate-800 space-y-2 bg-slate-900/30">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-pink-400">Session VWAP</span>
                <input
                  type="checkbox"
                  checked={showVWAP}
                  onChange={(e) => setShowVWAP(e.target.checked)}
                  className="rounded text-pink-500"
                />
              </label>
              <p className="text-[10px] text-slate-400 leading-tight">
                Cumulative (TP × Volume) / Volume. Resets each daily session.
              </p>
            </div>
          </div>

          {/* Sub-Pane Indicator Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-slate-300 font-medium">Oscillator Sub-Pane:</span>
            <div className="flex items-center gap-2">
              {[
                ['rsi', 'RSI (Relative Strength)'],
                ['macd', 'MACD (12, 26, 9)'],
                ['atr', 'ATR (True Range Volatility)'],
                ['none', 'Hidden'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSubIndicator(key)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    subIndicator === key
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Area */}
      <div className="relative w-full" style={{ minHeight: height }}>
        {loading && (
          <div className="skeleton absolute inset-0 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-300 font-mono">
              <RefreshCw size={16} className="animate-spin text-blue-400" />
              <span>Fetching real historical OHLCV candles...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
            <AlertTriangle size={32} className="text-amber-400" />
            <p className="text-sm font-medium text-slate-200">{error}</p>
            <p className="text-xs text-slate-400 max-w-md">
              Data is sourced directly from market quotes. Prices are not simulated or mocked when upstream is
              temporarily quiet.
            </p>
            <button onClick={fetchData} className="btn-primary text-xs px-4 py-2 mt-2">
              Retry Query
            </button>
          </div>
        )}

        {/* Lightweight Charts Canvas Containers */}
        <div style={{ display: error ? 'none' : 'block', opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}>
          <div ref={mainChartContainerRef} className="w-full" />
          {subIndicator !== 'none' && (
            <div className="border-t border-slate-800 pt-2 mt-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">
                {subIndicator === 'rsi' && `Relative Strength Index (RSI ${rsiPeriod}) · Overbought: 70 | Oversold: 30`}
                {subIndicator === 'macd' && 'MACD Line (12, 26) · Signal Line (9) · Histogram'}
                {subIndicator === 'atr' && 'Average True Range (14) · Volatility Metric'}
              </div>
              <div ref={subChartContainerRef} className="w-full" />
            </div>
          )}
        </div>
      </div>

      {/* Metadata & Source Timestamp Footer */}
      {chartMeta && (
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span>
              Ticker: <strong className="text-slate-200">{chartMeta.symbol}</strong> ({chartMeta.exchange})
            </span>
            <span>·</span>
            <span>
              Candles: <strong className="text-slate-200">{chartMeta.count}</strong> bars
            </span>
            <span>·</span>
            <span>Interval: {chartMeta.interval}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  chartMeta.isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>{chartMeta.dataFreshness}</span>
            </span>
            {chartMeta.lastCandleTime && (
              <span>Last Bar: {new Date(chartMeta.lastCandleTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>
      )}

      {/* Candlestick Pattern Recognition Drawer */}
      {showPatterns && detectedPatterns.length > 0 && (
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-indigo-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Detected Candlestick Patterns ({detectedPatterns.length})
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">Causal pattern detection without look-ahead bias</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {detectedPatterns.slice(-6).map((pat, idx) => (
              <div
                key={`${pat.time}-${pat.pattern}-${idx}`}
                onClick={() => setSelectedPattern(pat)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all hover:border-indigo-500/50 ${
                  selectedPattern?.time === pat.time && selectedPattern?.pattern === pat.pattern
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-800 bg-slate-900/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200">{pat.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      pat.type === 'bullish'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : pat.type === 'bearish'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                    }`}
                  >
                    {pat.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{pat.description}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 font-mono">
                  <span>Price: ₹{pat.price}</span>
                  <span>{new Date(pat.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Selected Pattern Inspector */}
          {selectedPattern && (
            <div
              className="p-3.5 rounded-xl border text-xs space-y-2 mt-2"
              style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-indigo-300">
                  {selectedPattern.name} — Technical Analysis Breakdown
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Confidence: {selectedPattern.confidence.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{selectedPattern.description}</p>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
                <strong className="text-emerald-400">Confirmation Rule:</strong> {selectedPattern.confirmationRule}
              </div>
              <p className="text-[10px] text-amber-400/90 italic">⚠️ {selectedPattern.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
