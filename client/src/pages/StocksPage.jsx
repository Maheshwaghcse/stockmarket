import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  LayoutGrid,
  List,
  BarChart2,
  BookOpen,
  ArrowRight,
  Activity,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react'
import api from '../lib/api'
import TechnicalAnalysisChart from '../components/chart/TechnicalAnalysisChart'

// Sector color accents for badges
const SECTOR_COLORS = {
  Banking: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  IT: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
  Energy: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
  Auto: { bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
  FMCG: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
  Pharma: { bg: 'rgba(236, 72, 153, 0.12)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.25)' },
  Metals: { bg: 'rgba(148, 163, 184, 0.12)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.25)' },
  Financials: { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.25)' },
  Defence: { bg: 'rgba(34, 197, 94, 0.12)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.25)' },
  Infra: { bg: 'rgba(234, 179, 8, 0.12)', text: '#facc15', border: 'rgba(234, 179, 8, 0.25)' },
  Retail: { bg: 'rgba(244, 63, 94, 0.12)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.25)' },
  Tech: { bg: 'rgba(6, 182, 212, 0.12)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.25)' },
  Travel: { bg: 'rgba(56, 189, 248, 0.12)', text: '#7dd3fc', border: 'rgba(56, 189, 248, 0.25)' },
  Realty: { bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
  Cement: { bg: 'rgba(161, 161, 170, 0.12)', text: '#d4d4d8', border: 'rgba(161, 161, 170, 0.25)' },
  Chemicals: { bg: 'rgba(20, 184, 166, 0.12)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.25)' },
}

function getSectorStyle(sector) {
  return SECTOR_COLORS[sector] || { bg: 'rgba(100, 116, 139, 0.12)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.2)' }
}

function formatINR(val) {
  if (typeof val !== 'number' || isNaN(val)) return '—'
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatVolume(vol) {
  if (!vol || vol <= 0) return '—'
  if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`
  if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)} k`
  return vol.toLocaleString('en-IN')
}

export default function StocksPage() {
  const [q, setQ] = useState('')
  const [selectedSector, setSelectedSector] = useState('All')
  const [sortBy, setSortBy] = useState('all') // 'all', 'gainers', 'losers', 'volume', 'price-desc', 'name-asc'
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25) // 25, 50, 100
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartModalStock, setChartModalStock] = useState(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => api.get('/stocks').then((r) => r.data),
    staleTime: 30_000,
  })

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await api.get('/stocks?refresh=true')
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const rawStocks = data?.data || []

  // Extract unique sectors with counts
  const sectorCounts = useMemo(() => {
    const counts = { All: rawStocks.length }
    rawStocks.forEach((s) => {
      const sec = s.sector || 'Other'
      counts[sec] = (counts[sec] || 0) + 1
    })
    return counts
  }, [rawStocks])

  const sectorList = useMemo(() => {
    const keys = Object.keys(sectorCounts).filter((k) => k !== 'All')
    keys.sort()
    return ['All', ...keys]
  }, [sectorCounts])

  // Filter and sort stocks
  const processedStocks = useMemo(() => {
    let list = [...rawStocks]

    // Sector filter
    if (selectedSector !== 'All') {
      list = list.filter((s) => s.sector === selectedSector)
    }

    // Search query
    if (q.trim()) {
      const query = q.trim().toUpperCase()
      list = list.filter(
        (s) => s.symbol.toUpperCase().includes(query) || (s.name && s.name.toUpperCase().includes(query))
      )
    }

    // Sorting
    switch (sortBy) {
      case 'gainers':
        list.sort((a, b) => (b.changePct || 0) - (a.changePct || 0))
        break
      case 'losers':
        list.sort((a, b) => (a.changePct || 0) - (b.changePct || 0))
        break
      case 'volume':
        list.sort((a, b) => (b.volume || 0) - (a.volume || 0))
        break
      case 'price-desc':
        list.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'name-asc':
        list.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''))
        break
      default:
        // Default: keep natural ranking / symbol
        break
    }

    return list
  }, [rawStocks, selectedSector, q, sortBy])

  // Overall market stats computed across all raw stocks
  const marketStats = useMemo(() => {
    if (rawStocks.length === 0) return { advances: 0, declines: 0, unchanged: 0, topGainer: null, topLoser: null }
    let advances = 0
    let declines = 0
    let unchanged = 0

    let topGainer = rawStocks[0]
    let topLoser = rawStocks[0]

    rawStocks.forEach((s) => {
      if ((s.changePct || 0) > 0) advances++
      else if ((s.changePct || 0) < 0) declines++
      else unchanged++

      if ((s.changePct || 0) > (topGainer?.changePct || 0)) topGainer = s
      if ((s.changePct || 0) < (topLoser?.changePct || 0)) topLoser = s
    })

    return { advances, declines, unchanged, topGainer, topLoser }
  }, [rawStocks])

  // Pagination slice
  const totalPages = Math.ceil(processedStocks.length / pageSize) || 1
  const paginatedStocks = useMemo(() => {
    const start = (page - 1) * pageSize
    return processedStocks.slice(start, start + pageSize)
  }, [processedStocks, page, pageSize])

  const handlePageChange = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }

  return (
    <div className="space-y-6 fade-in">
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Stocks & Equities Universe</h1>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              {rawStocks.length} Tracked Equities
            </span>
          </div>
          <p className="text-sm muted mt-1">
            Real NSE market reference quotes, sector classifications, intraday ranges, and direct charting
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5 active:scale-95 disabled:opacity-50"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
            title="Fetch fresh live quotes from Yahoo Finance"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
            <span>{isRefreshing ? 'Refreshing…' : 'Sync Quotes'}</span>
          </button>
        </div>
      </div>

      {/* ── Market Breadth Summary Cards ────────────────────────── */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total & A/D Ratio */}
        <div className="card p-3.5 space-y-2">
          <p className="text-xs muted flex items-center justify-between">
            <span>Market Breadth</span>
            <Activity size={13} className="text-blue-400" />
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold">{rawStocks.length} Stocks</span>
            <span className="text-xs font-semibold text-emerald-400">
              {marketStats.advances} Adv / {marketStats.declines} Dec
            </span>
          </div>
          {/* Breadth Bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${rawStocks.length ? (marketStats.advances / rawStocks.length) * 100 : 50}%`,
              }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{
                width: `${rawStocks.length ? (marketStats.declines / rawStocks.length) * 100 : 50}%`,
              }}
            />
          </div>
        </div>

        {/* Advances */}
        <div className="card p-3.5 space-y-1">
          <p className="text-xs muted flex items-center gap-1.5">
            <TrendingUp size={13} className="text-emerald-400" />
            <span>Advances (Gainers)</span>
          </p>
          <p className="text-2xl font-bold text-emerald-400">{marketStats.advances}</p>
          <p className="text-[11px] muted">
            {rawStocks.length ? ((marketStats.advances / rawStocks.length) * 100).toFixed(0) : 0}% of tracked universe
          </p>
        </div>

        {/* Declines */}
        <div className="card p-3.5 space-y-1">
          <p className="text-xs muted flex items-center gap-1.5">
            <TrendingDown size={13} className="text-rose-400" />
            <span>Declines (Losers)</span>
          </p>
          <p className="text-2xl font-bold text-rose-400">{marketStats.declines}</p>
          <p className="text-[11px] muted">
            {rawStocks.length ? ((marketStats.declines / rawStocks.length) * 100).toFixed(0) : 0}% in corrective move
          </p>
        </div>

        {/* Top Performer Card */}
        <div className="card p-3.5 space-y-1">
          <p className="text-xs muted flex items-center justify-between">
            <span>Top Gainer Today</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">NSE</span>
          </p>
          {marketStats.topGainer ? (
            <div>
              <div className="flex items-baseline justify-between">
                <Link
                  to={`/stocks/${marketStats.topGainer.symbol}`}
                  className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors"
                >
                  {marketStats.topGainer.symbol}
                </Link>
                <span className="text-xs font-bold text-emerald-400 mono">
                  +{marketStats.topGainer.changePct?.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs mono muted">₹{formatINR(marketStats.topGainer.price)}</p>
            </div>
          ) : (
            <p className="text-xs muted">—</p>
          )}
        </div>
      </div>

      {/* ── Sector Filter Pills ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto touch-scroll pb-1 scrollbar-thin">
        <span className="text-xs font-semibold muted uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
          <Layers size={12} /> Sectors:
        </span>
        {sectorList.map((sec) => {
          const isSelected = selectedSector === sec
          const count = sectorCounts[sec] || 0
          return (
            <button
              key={sec}
              onClick={() => {
                setSelectedSector(sec)
                setPage(1)
              }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isSelected ? '#ffffff' : 'var(--color-text)',
                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
              }}
            >
              <span>{sec}</span>
              <span
                className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(100, 116, 139, 0.2)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search, Sort & View Mode Controls ───────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 muted pointer-events-none" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="Search 106 stocks by symbol or company (e.g. TATA, HDFC, RELIANCE)…"
            className="w-full pl-9 pr-8 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              '--tw-ring-color': 'rgba(99,102,241,0.4)',
            }}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 muted hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sorters & View Switcher */}
        <div className="flex items-center gap-2">
          {/* Sorter Dropdown */}
          <div className="relative flex items-center">
            <SlidersHorizontal size={13} className="absolute left-3 muted pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-8 pr-6 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="all">Sort: Default</option>
              <option value="gainers">Top Gainers (%)</option>
              <option value="losers">Top Losers (%)</option>
              <option value="volume">Highest Volume</option>
              <option value="price-desc">Highest Price (₹)</option>
              <option value="name-asc">Symbol (A to Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'muted hover:text-slate-200'}`}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'muted hover:text-slate-200'}`}
              title="Grid Card View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Filters Bar ──────────────────────────────────── */}
      {(selectedSector !== 'All' || q || sortBy !== 'all') && (
        <div className="flex items-center justify-between text-xs muted px-1">
          <span>
            Showing <strong className="text-slate-200">{processedStocks.length}</strong> of{' '}
            <strong className="text-slate-200">{rawStocks.length}</strong> equities
            {selectedSector !== 'All' && ` in ${selectedSector}`}
            {q && ` matching "${q}"`}
          </span>
          <button
            onClick={() => {
              setSelectedSector('All')
              setQ('')
              setSortBy('all')
              setPage(1)
            }}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ── Main View (Table or Grid) ───────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      ) : processedStocks.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-200">No matching stocks found</p>
          <p className="text-xs muted max-w-md mx-auto">
            Try adjusting your search query or selecting a different sector filter from the list above.
          </p>
          <button
            onClick={() => {
              setQ('')
              setSelectedSector('All')
              setSortBy('all')
            }}
            className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW ────────────────────────────────────────── */
        <div className="card overflow-x-auto touch-scroll p-0">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-wider muted border-b"
                style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,0.1)' }}
              >
                <th className="py-3 px-4 text-left font-semibold">Symbol & Sector</th>
                <th className="py-3 px-4 text-left font-semibold">Company Name</th>
                <th className="py-3 px-4 text-right font-semibold">LTP (₹)</th>
                <th className="py-3 px-4 text-right font-semibold">24h Change</th>
                <th className="py-3 px-4 text-center font-semibold min-w-44">Day Range (L - H)</th>
                <th className="py-3 px-4 text-right font-semibold">Volume</th>
                <th className="py-3 px-4 text-right font-semibold">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStocks.map((s) => {
                const isGain = (s.changePct || 0) >= 0
                const sectorStyle = getSectorStyle(s.sector)
                const dayLow = s.dayLow || s.price
                const dayHigh = s.dayHigh || s.price
                const rangeDiff = dayHigh - dayLow
                const rangePct = rangeDiff > 0 ? Math.min(100, Math.max(0, ((s.price - dayLow) / rangeDiff) * 100)) : 50

                return (
                  <tr
                    key={s.symbol}
                    className="border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(51,65,85,0.4)' }}
                  >
                    {/* Symbol & Sector */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/stocks/${s.symbol}`}
                          className="font-bold text-slate-100 hover:text-indigo-400 transition-colors"
                        >
                          {s.symbol}
                        </Link>
                        {s.sector && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: sectorStyle.bg,
                              color: sectorStyle.text,
                              border: `1px solid ${sectorStyle.border}`,
                            }}
                          >
                            {s.sector}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company Name */}
                    <td className="py-3 px-4 text-xs muted max-w-48 truncate" title={s.name}>
                      {s.name}
                    </td>

                    {/* LTP */}
                    <td className="py-3 px-4 text-right font-bold mono text-slate-100">
                      ₹{formatINR(s.price)}
                    </td>

                    {/* Change */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center justify-end gap-1 px-2 py-0.5 rounded text-xs font-bold mono ${
                          isGain ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {isGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isGain ? '+' : ''}
                        {s.changePct?.toFixed(2)}%
                      </span>
                    </td>

                    {/* Day Range Bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 max-w-44 mx-auto">
                        <div className="flex justify-between text-[10px] muted mono">
                          <span>₹{formatINR(dayLow)}</span>
                          <span>₹{formatINR(dayHigh)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isGain ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${rangePct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-4 text-right mono text-xs muted">{formatVolume(s.volume)}</td>

                    {/* Quick Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setChartModalStock(s)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all flex items-center gap-1 cursor-pointer"
                          title="Open 2-Year Interactive Historical Chart"
                        >
                          <BarChart2 size={12} />
                          <span>Chart (2Y)</span>
                        </button>
                        <Link
                          to={`/journal?symbol=${s.symbol}`}
                          className="px-2 py-1 rounded text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all flex items-center gap-1"
                          title="Log Trade in Journal"
                        >
                          <BookOpen size={12} />
                          <span>Journal</span>
                        </Link>
                        <Link
                          to={`/stocks/${s.symbol}`}
                          className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-0.5"
                          title="View Valuation Metrics"
                        >
                          <span>Detail</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── GRID CARDS VIEW ─────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {paginatedStocks.map((s) => {
            const isGain = (s.changePct || 0) >= 0
            const sectorStyle = getSectorStyle(s.sector)
            const dayLow = s.dayLow || s.price
            const dayHigh = s.dayHigh || s.price
            const rangeDiff = dayHigh - dayLow
            const rangePct = rangeDiff > 0 ? Math.min(100, Math.max(0, ((s.price - dayLow) / rangeDiff) * 100)) : 50

            return (
              <div
                key={s.symbol}
                className="card p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-all hover:-translate-y-0.5 space-y-3"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/stocks/${s.symbol}`}
                        className="font-bold text-base text-slate-100 hover:text-indigo-400 transition-colors"
                      >
                        {s.symbol}
                      </Link>
                      <p className="text-xs muted line-clamp-1 mt-0.5" title={s.name}>
                        {s.name}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded mono flex items-center gap-1 ${
                        isGain ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {isGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isGain ? '+' : ''}
                      {s.changePct?.toFixed(2)}%
                    </span>
                  </div>

                  {/* Price & Sector */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <p className="text-xl font-bold mono text-slate-100">₹{formatINR(s.price)}</p>
                    {s.sector && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: sectorStyle.bg,
                          color: sectorStyle.text,
                          border: `1px solid ${sectorStyle.border}`,
                        }}
                      >
                        {s.sector}
                      </span>
                    )}
                  </div>

                  {/* Day Range Slider */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] muted mono">
                      <span>Low: ₹{formatINR(dayLow)}</span>
                      <span>High: ₹{formatINR(dayHigh)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isGain ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${rangePct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  className="pt-2 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: 'rgba(51,65,85,0.4)' }}
                >
                  <span className="text-[11px] muted mono">Vol: {formatVolume(s.volume)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChartModalStock(s)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      title="Open 2-Year Interactive Historical Chart"
                    >
                      <BarChart2 size={12} /> Chart (2Y)
                    </button>
                    <Link
                      to={`/journal?symbol=${s.symbol}`}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <BookOpen size={12} /> Journal
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination Footer ────────────────────────────────────── */}
      {processedStocks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-t border-slate-800 text-xs muted">
          <div>
            Showing <strong className="text-slate-200">{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-200">
              {Math.min(page * pageSize, processedStocks.length)}
            </strong>{' '}
            of <strong className="text-slate-200">{processedStocks.length}</strong> stocks
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>All (106)</option>
              </select>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-medium text-slate-200">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick 2-Year Interactive Historical Chart Modal ── */}
      {chartModalStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#0b1329] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  {chartModalStock.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{chartModalStock.symbol}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {chartModalStock.sector || 'NSE'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                      2-Year Historical Graph
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{chartModalStock.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/stocks/${chartModalStock.symbol}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors flex items-center gap-1 font-medium"
                >
                  <span>Full Details</span>
                  <ArrowRight size={12} />
                </Link>
                <button
                  onClick={() => setChartModalStock(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Chart"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Technical Analysis Chart configured with 2-Year timeframe */}
            <div className="rounded-xl overflow-hidden">
              <TechnicalAnalysisChart
                defaultSymbol={chartModalStock.symbol}
                defaultTimeframe="2Y"
                height={440}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
