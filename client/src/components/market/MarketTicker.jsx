import { useMarketStore } from '../../store/marketStore'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MarketTicker() {
  const { indices } = useMarketStore()
  const items = Object.values(indices)

  if (!items.length) return null

  // Duplicate for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden border-b relative"
         style={{ background: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.05)', height: 32 }}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>LIVE MARKETS</span>
      </div>
      <div className="flex items-center h-full" style={{ paddingLeft: 125 }}>
        <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap gap-8">
          {doubled.map((idx, i) => {
            const isGain = idx.changePct >= 0
            return (
              <span key={`${idx.symbol}-${i}`} className="flex items-center gap-2 text-xs font-medium mono shrink-0">
                <span className="text-slate-300 font-semibold">{idx.symbol}</span>
                <span className={isGain ? 'gain' : 'loss'}>{idx.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                <span className={`flex items-center gap-0.5 ${isGain ? 'gain' : 'loss'}`}>
                  {isGain ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isGain ? '+' : ''}{idx.changePct?.toFixed(2)}%
                </span>
              </span>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
