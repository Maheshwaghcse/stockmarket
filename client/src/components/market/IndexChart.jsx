import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import api from '../../lib/api'

export default function IndexChart({ symbol, height = 260 }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
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

    const series = chart.addCandlestickSeries({
      upColor:   '#22c55e',
      downColor: '#ef4444',
      borderUpColor:   '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor:   '#22c55e',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    // Fetch intraday data
    api.get(`/market/indices/${symbol}/intraday?interval=5`)
      .then(({ data }) => {
        series.setData(data.data)
        chart.timeScale().fitContent()
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load chart data')
        setLoading(false)
      })

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol])

  return (
    <div className="relative w-full" style={{ minHeight: height }}>
      {loading && (
        <div className="skeleton absolute inset-0 rounded-lg" />
      )}
      {error && (
        <div className="flex items-center justify-center h-full text-sm muted">{error}</div>
      )}
      <div ref={containerRef} className="w-full" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s' }} />
    </div>
  )
}
