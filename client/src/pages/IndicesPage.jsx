import { useMarketStore } from '../store/marketStore'
import IndexCard from '../components/market/IndexCard'
import { BarChart2 } from 'lucide-react'

export default function IndicesPage() {
  const { indices } = useMarketStore()
  const all = Object.values(indices)

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 size={24} /> Indian Indices</h1>
          <p className="text-sm muted mt-1">NSE and BSE major market indices and sector benchmarks</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {all.length === 0
          ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-lg" />)
          : all.map((idx) => <IndexCard key={idx.symbol} index={idx} />)
        }
      </div>
    </div>
  )
}
