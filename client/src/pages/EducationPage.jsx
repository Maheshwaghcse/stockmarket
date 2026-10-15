import { BookOpen, TrendingUp, BarChart2, DollarSign, Shield, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const TOPICS = [
  { icon: BookOpen,    title: 'Stock Market Basics',       desc: 'Learn how stock markets work, key participants, and how to read quotes.', slug: 'market-basics', category: 'education' },
  { icon: TrendingUp,  title: 'Reading Index Charts',      desc: 'Understand candlesticks, support/resistance, and key technical indicators.', slug: 'reading-charts', category: 'guide' },
  { icon: BarChart2,   title: 'Understanding NSE & BSE',   desc: 'Differences between NSE and BSE, trading hours, and settlement cycles.', slug: 'nse-bse-guide', category: 'education' },
  { icon: DollarSign,  title: 'Mutual Funds vs Stocks',    desc: 'Comparing direct equity investment with mutual fund structures.', slug: 'mf-vs-stocks', category: 'guide' },
  { icon: Shield,      title: 'Risk Management',           desc: 'Position sizing, stop-loss strategies, and portfolio diversification.', slug: 'risk-management', category: 'education' },
  { icon: HelpCircle,  title: 'Glossary of Terms',         desc: 'P/E ratio, EBITDA, circuit breaker, SEBI — all terms explained.', slug: 'glossary', category: 'glossary' },
]

export default function EducationPage() {
  return (
    <div className="space-y-8 fade-in">
      {/* Hero */}
      <div className="card text-center py-12"
           style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))', borderColor: 'rgba(99,102,241,0.2)' }}>
        <h1 className="text-3xl font-bold mb-3">Stock Market Education</h1>
        <p className="muted max-w-xl mx-auto text-sm">
          Learn stock market fundamentals, chart reading, index analysis, and smart investing principles.
          All content is educational and not investment advice.
        </p>
      </div>

      {/* Topics */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Learning Resources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map(({ icon: Icon, title, desc, slug, category }) => (
            <Link key={slug} to={`/news/${slug}`}
                  className="card hover:border-blue-500/30 transition-all hover:-translate-y-0.5 group block">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Icon size={20} style={{ color: '#a5b4fc' }} />
              </div>
              <h3 className="font-semibold text-sm mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
              <p className="text-xs muted leading-relaxed">{desc}</p>
              <span className="text-xs mt-3 block capitalize font-medium"
                    style={{ color: '#6366f1' }}>{category}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
        <p className="text-sm" style={{ color: '#f59e0b' }}>
          ⚠️ <strong>Educational purpose only.</strong> StockSense India is not SEBI registered.
          Nothing on this platform constitutes investment advice. Please consult a SEBI-registered financial advisor before investing.
        </p>
      </div>
    </div>
  )
}
