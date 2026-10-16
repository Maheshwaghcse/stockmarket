import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts'
import api from '../../lib/api'

export default function IndexChart({ symbol = 'NIFTY50', height = 280, timeRange = '1D' }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return

    let chart = null
    let resizeHandler = null

    try {
      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth || 300,
        height,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(51,65,85,0.4)' },
          horzLines: { color: 'rgba(51,65,85,0.4)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#334155' },
        timeScale: {
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
      })

      // lightweight-charts v5 uses chart.addSeries(CandlestickSeries, options)
      const series = chart.addSeries
        ? chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
          })
        : chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
          })

      chartRef.current = chart
      seriesRef.current = series

      resizeHandler = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({ width: containerRef.current.clientWidth })
        }
      }
      window.addEventListener('resize', resizeHandler)

      setLoading(true)
      setError(null)

      // Fetch data based on timeRange
      const fetchUrl = timeRange === '1D'
        ? `/market/indices/${symbol}/intraday?interval=5`
        : `/market/chart/${symbol}?range=${timeRange === '5D' ? '5d' : timeRange === '1M' ? '1mo' : '1y'}&interval=${timeRange === '5D' ? '15m' : timeRange === '1M' ? '60m' : '1d'}`

      api.get(fetchUrl)
        .then(({ data }) => {
          if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            series.setData(data.data)
            chart.timeScale().fitContent()
          } else {
            setError(`No candle data available for ${symbol}`)
          }
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load chart data')
          setLoading(false)
        })
    } catch (err) {
      console.error('Error initializing chart:', err)
      setError('Chart initialization error')
      setLoading(false)
    }

    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }
      if (chart) {
        chart.remove()
      }
    }
  }, [symbol, height, timeRange])

  return (
    <div className="relative w-full" style={{ minHeight: height }}>
      {loading && (
        <div className="skeleton absolute inset-0 rounded-lg" />
      )}
      {error && (
        <div className="flex items-center justify-center h-full text-sm muted py-12">{error}</div>
      )}
      <div
        ref={containerRef}
        className="w-full"
        style={{ display: error ? 'none' : 'block', opacity: loading ? 0 : 1, transition: 'opacity 0.3s' }}
      />
    </div>
  )
}
