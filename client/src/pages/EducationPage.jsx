import { useState, Component } from 'react'
import {
  BookOpen,
  TrendingUp,
  BarChart2,
  DollarSign,
  Shield,
  HelpCircle,
  Activity,
  Layers,
  Compass,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sliders,
  RefreshCw,
  Info,
} from 'lucide-react'
import TechnicalAnalysisChart from '../components/chart/TechnicalAnalysisChart'

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.warn('Chart error caught by boundary:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 border-amber-500/30 bg-amber-500/10 text-center space-y-2 rounded-xl">
          <p className="text-sm font-semibold text-amber-300">Technical Analysis Sandbox Loading</p>
          <p className="text-xs text-slate-300">The chart canvas is refreshing. All educational curriculum modules below remain fully accessible.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="btn-primary text-xs px-3 py-1.5 mt-2"
          >
            Retry Chart
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const CURRICULUM_MODULES = [
  {
    id: 'basics',
    title: '1. Market Basics & Indian Exchanges',
    badge: 'Foundation',
    icon: BookOpen,
    summary: 'NSE, BSE, SEBI framework, trading hours, and T+1 settlement mechanism.',
    definition:
      'The Indian equity market consists primarily of two major nationwide electronic exchanges: the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE). The market operates under the regulatory supervision of SEBI to ensure transparency, investor protection, and systemic stability.',
    methodology: [
      {
        title: 'Trading Sessions (IST)',
        desc: 'Pre-Open Session: 09:00 AM – 09:08 AM (order collection & price discovery). Normal Trading: 09:15 AM – 03:30 PM. Closing Session: 03:30 PM – 03:40 PM. Post-Close: 03:40 PM – 04:00 PM.',
      },
      {
        title: 'Settlement Mechanism',
        desc: 'India follows the T+1 rolling settlement cycle. Stocks bought on Monday settle on Tuesday, and payout of funds and securities takes place on T+1 day.',
      },
      {
        title: 'Circuit Filters & Price Bands',
        desc: 'Exchanges enforce daily dynamic price bands (e.g. 5%, 10%, 20%) on individual stocks and index-level circuit breakers (10%, 15%, 20%) to curb irrational volatility.',
      },
    ],
    example:
      'When an investor buys 50 shares of Reliance Industries at ₹2,500 on NSE at 11:30 AM on Wednesday, the trade is matched electronically by the order book. On Thursday (T+1), the shares are credited to the investor’s Demat account (CDSL/NSDL), and funds are settled by the clearing corporation.',
    limitations:
      'Liquidity risk in small-cap stocks, slippage during high-volatility events, and market-wide circuit freezes where trading halts completely.',
  },
  {
    id: 'cycles',
    title: '2. Bull and Bear Markets',
    badge: 'Market Cycles',
    icon: TrendingUp,
    summary: 'The 4 phases of market cycles: Accumulation, Markup, Distribution, and Markdown.',
    definition:
      'A Bull Market is characterized by sustained upward price trajectories, rising GDP, institutional inflows, and investor optimism. A Bear Market is defined as a prolonged decline (typically 20% or more from 52-week highs), marked by widespread pessimism and capitulation.',
    methodology: [
      {
        title: 'Phase 1: Accumulation',
        desc: 'Occurs when the market has bottomed. Institutional smart money quietly buys undervalued assets from discouraged retail sellers while media headlines are overwhelmingly negative.',
      },
      {
        title: 'Phase 2: Markup (Bull Run)',
        desc: 'Prices break out above resistance. Trend-following funds and the public enter. Higher highs and higher lows form consistently.',
      },
      {
        title: 'Phase 3: Distribution',
        desc: 'Smart money begins offloading inventory into euphoric retail buying. Volume remains high but upward price momentum stalls, forming a trading range or topping pattern.',
      },
      {
        title: 'Phase 4: Markdown (Bear Market)',
        desc: 'Sellers overwhelm buyers. Stop-losses trigger, leading to waterfall declines, margin calls, and despair until valuation reverts to attractive levels.',
      },
    ],
    example:
      'During March 2020, Nifty 50 plunged to ~7,511 in a rapid bear capitulation. The subsequent accumulation in April–May 2020 evolved into a historic multi-year markup phase reaching over 20,000+ points by 2023–2024.',
    limitations:
      'Identifying the exact top or bottom is nearly impossible. Bear market rallies can be violent traps that deceive traders into buying too early.',
  },
  {
    id: 'charts',
    title: '3. Chart Types & Candle Anatomy',
    badge: 'Price Action',
    icon: BarChart2,
    summary: 'Candlestick, Line, Area, Bar views and Heikin-Ashi synthetic transformations.',
    definition:
      'A financial chart plots price discovery over standardized time intervals. Japanese candlesticks display 4 data points per bar: Open, High, Low, and Close (OHLC). Heikin-Ashi is a mathematical variation that filters out noise to highlight underlying trend direction.',
    methodology: [
      {
        title: 'Candle Anatomy',
        desc: 'Real Body represents the distance between Open and Close (Green if Close > Open, Red if Close < Open). Upper Wick (Shadow) marks the session High; Lower Wick marks the session Low.',
      },
      {
        title: 'Heikin-Ashi Formulas',
        desc: 'HA Close = (Open + High + Low + Close) / 4. HA Open = (Previous HA Open + Previous HA Close) / 2. HA High = max(High, HA Open, HA Close). HA Low = min(Low, HA Open, HA Close).',
      },
      {
        title: 'Visual Comparison',
        desc: 'Line charts use only Close prices to show raw momentum. Candlesticks reveal intra-session battle between buyers and sellers. Heikin-Ashi simplifies trend tracking with consecutive color sequences.',
      },
    ],
    example:
      'On a 5-minute Nifty 50 candle: Open 22,500, High 22,540, Low 22,490, Close 22,530. The body is 30 points green with a 10-point upper wick and a 10-point lower wick, indicating buyers gained control after initial lower dips.',
    limitations:
      'Heikin-Ashi candles show synthetic averaged values, not actual trade execution prices. Never place limit orders or calculate stop-losses using Heikin-Ashi prices without checking actual market quotes.',
  },
  {
    id: 'patterns',
    title: '4. Candlestick Patterns',
    badge: 'Formations',
    icon: Compass,
    summary: 'Probabilistic reversal and continuation patterns: Doji, Hammer, Engulfing, and Stars.',
    definition:
      'Candlestick patterns are repetitive visual formations created by the balance of buying and selling pressure. While they provide clues about market psychology, they are strictly probabilistic and require volume and location confirmation.',
    methodology: [
      {
        title: 'Doji',
        desc: 'Occurs when Open and Close are virtually equal (real body ≤ 10% of total range). Signifies market equilibrium and indecision between bulls and bears.',
      },
      {
        title: 'Hammer & Hanging Man',
        desc: 'Small real body near top of range with a long lower shadow at least double the body size. Hammer occurs after a downtrend (bullish rejection of lows); Hanging Man occurs after an uptrend (warning of sudden selling pressure).',
      },
      {
        title: 'Shooting Star',
        desc: 'Small body near the bottom with a long upper wick at least double the body. Signifies buyers attempted a rally but sellers rejected the higher price.',
      },
      {
        title: 'Bullish & Bearish Engulfing',
        desc: '2-candle pattern where the current candle body completely covers or engulfs the preceding candle body with opposing color.',
      },
      {
        title: 'Morning Star & Evening Star',
        desc: '3-candle reversal pattern: A long directional candle, followed by an indecisive small star candle, followed by a strong reversal candle penetrating deep into the first candle body.',
      },
    ],
    example:
      'Bank Nifty declines toward a key daily support zone around 48,000. A daily Hammer candle forms with a 400-point lower wick and a 60-point green body. The next day opens higher with strong institutional volume, confirming the rejection.',
    limitations:
      'Candlestick patterns frequently fail in sideways or choppy markets. They must always be evaluated in the context of prevailing trends, support/resistance, and volume.',
  },
  {
    id: 'indicators',
    title: '5. Technical Indicators Engine',
    badge: 'Analytics',
    icon: Sliders,
    summary: 'Mathematical models: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, and VWAP.',
    definition:
      'Technical indicators are mathematical calculations based on historical price, volume, or open interest. They help identify trend direction, momentum velocity, volatility expansion, and mean reversion potential.',
    methodology: [
      {
        title: 'SMA & EMA',
        desc: 'SMA gives equal weight to all period closes: SMA = (Sum of Close) / N. EMA applies exponential multiplier k = 2/(N+1), giving greater weight to recent price changes to reduce lag.',
      },
      {
        title: 'RSI (Relative Strength Index)',
        desc: 'Oscillator measuring speed and change of price moves between 0 and 100 via Wilder’s smoothing. Above 70 is traditionally overbought; below 30 is oversold. Bullish/bearish divergence signals potential trend exhaustion.',
      },
      {
        title: 'MACD (Moving Average Convergence Divergence)',
        desc: 'Calculated as 12 EMA minus 26 EMA. A 9 EMA of the MACD line serves as the Signal line. The histogram reflects the spread between MACD and Signal.',
      },
      {
        title: 'Bollinger Bands',
        desc: 'Consists of a 20-period SMA middle band with upper and lower bands positioned 2 standard deviations away. Band contraction (squeeze) precedes explosive breakout volatility.',
      },
      {
        title: 'ATR & VWAP',
        desc: 'ATR measures average true range for stop-loss sizing without directional bias. VWAP calculates cumulative (Typical Price × Volume) / Cumulative Volume, resetting daily as an institutional benchmark.',
      },
    ],
    example:
      'Nifty 50 trades in a narrow 50-point range for 4 days. The Bollinger Bandwidth drops to multi-month lows (squeeze). As price breaks above the 20-day EMA with an RSI rise above 60 and rising volume, a strong directional breakout occurs.',
    limitations:
      'All technical indicators are derived from past price and volume; none can predict the future. Over-optimizing indicator parameters causes curve-fitting and lagging decision paralysis.',
  },
  {
    id: 'trends',
    title: '6. Trends, Support & Resistance',
    badge: 'Structure',
    icon: Activity,
    summary: 'Price structure, higher highs/lows, horizontal support/resistance, and breakout validation.',
    definition:
      'Market trends describe the overarching trajectory of asset prices over time. Support represents a price level where demand is strong enough to halt or reverse a decline; Resistance is where selling supply prevents further upward advances.',
    methodology: [
      {
        title: 'Trend Identification',
        desc: 'Uptrend: Sequence of Higher Highs (HH) and Higher Lows (HL). Downtrend: Sequence of Lower Highs (LH) and Lower Lows (LL). Consolidation: Price oscillates between horizontal boundaries.',
      },
      {
        title: 'Role Reversal Principle',
        desc: 'Once a well-established resistance level is breached with high volume, it typically flips to become a future support level upon retest, and vice-versa.',
      },
      {
        title: 'Breakout vs Fakeout',
        desc: 'A true breakout is confirmed when a candle closes outside the boundary with above-average volume. A fakeout occurs when price briefly pierces the level but closes back inside the range, trapping aggressive traders.',
      },
    ],
    example:
      'Nifty 50 tested the 22,000 mark three times over two months before breaking through on Union Budget day with double normal turnover. On a subsequent pullback two weeks later, 22,000 acted as solid support.',
    limitations:
      'Support and resistance are zones or areas, not exact mathematical single-cent prices. News events and sudden institutional block trades can easily overrun technical levels.',
  },
  {
    id: 'volume',
    title: '7. Volume & Volatility',
    badge: 'Momentum',
    icon: Layers,
    summary: 'Volume Spread Analysis (VSA), institutional participation, and volatility expansion.',
    definition:
      'Volume is the total number of shares or contracts transacted during a given timeframe. It measures the fuel, liquidity, and conviction behind price movements. Volatility quantifies the degree of price dispersion or fluctuations over time.',
    methodology: [
      {
        title: 'Volume Confirmation',
        desc: 'Healthy trends are accompanied by expanding volume in the direction of the trend and declining volume during counter-trend consolidations or pullbacks.',
      },
      {
        title: 'Volume Divergence',
        desc: 'If price reaches a new high but volume is significantly lower than previous peaks, it indicates diminishing institutional demand and vulnerability to a reversal.',
      },
      {
        title: 'Volatility Compression & Expansion',
        desc: 'Markets alternate cyclically between low volatility (quiet consolidation) and high volatility (directional trending). Volatility contractions often foreshadow significant price expansions.',
      },
    ],
    example:
      'Tata Steel rallies 4% in a single session with 3× its 20-day average volume, breaking above a 6-month descending trendline. The heavy volume confirms institutional sponsorship rather than retail speculation.',
    limitations:
      'Intraday volume data can be distorted by algorithmic high-frequency trading (HFT) and wash sales. Volume on broad market indices is derived from constituent weights rather than direct index share trading.',
  },
  {
    id: 'risk',
    title: '8. Risk Management & Trading Psychology',
    badge: 'Discipline',
    icon: Shield,
    summary: 'Capital preservation, position sizing formulas, Risk-to-Reward ratio, and psychological discipline.',
    definition:
      'Risk management is the systematic framework a trader enforces to protect capital, survive drawdowns, and maintain statistical expectancy. It is the single most critical factor separating profitable long-term traders from gamblers.',
    methodology: [
      {
        title: 'The 1%–2% Capital Rule',
        desc: 'Never risk more than 1% to 2% of total trading account equity on any single trade. If an account has ₹5,00,000, max risk per trade is strictly capped at ₹5,000 to ₹10,000.',
      },
      {
        title: 'Position Sizing Formula',
        desc: 'Position Size (Qty) = Risk Amount (₹) / (Entry Price - Stop Loss Price). This mathematical formula ensures position size adjusts inversely to trade volatility.',
      },
      {
        title: 'Risk-to-Reward (R:R) Ratio',
        desc: 'Only enter setups where the realistic profit target offers at least 1:2 or 1:3 R:R. A trader with a 40% win rate can remain highly profitable with a 1:2.5 average reward ratio.',
      },
      {
        title: 'Psychological Pitfalls',
        desc: 'Revenge Trading (doubling down after a loss), FOMO (chasing extended rallies), and moving stop-losses away from entry are the primary causes of trader ruin.',
      },
    ],
    example:
      'A trader with ₹2,00,000 capital risks 1% (₹2,000) buying HDFC Bank at ₹1,500 with a stop-loss at ₹1,460 (₹40 risk per share). Position size = ₹2,000 / ₹40 = 50 shares. Target is ₹1,580 (1:2 R:R, ₹4,000 gain). Even if stopped out, account suffers only a controlled 1% scratch.',
    limitations:
      'Overnight gap risk (e.g., global geopolitical events causing an index to gap down 2% at the open) can trigger stop-losses below pre-calculated exit prices (slippage).',
  },
]

export default function EducationPage() {
  const [activeTab, setActiveTab] = useState('basics')
  const activeModule = CURRICULUM_MODULES.find((m) => m.id === activeTab) || CURRICULUM_MODULES[0]

  return (
    <div className="space-y-10 fade-in max-w-6xl mx-auto">
      {/* Hero */}
      <div
        className="card text-center py-10 px-4 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12))',
          borderColor: 'rgba(99,102,241,0.25)',
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-blue-500/30 bg-blue-500/10 text-blue-400">
          <Zap size={13} />
          <span>Interactive Market Learning Academy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Market Learning & Technical Analysis
        </h1>
        <p className="muted max-w-2xl mx-auto text-sm mt-2 leading-relaxed">
          Master Indian market structure, technical indicators, candlestick pattern recognition, and risk
          management. Practice charting concepts in real time with live market data.
        </p>
      </div>

      {/* Featured Interactive Technical Analysis Sandbox */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              <span>Interactive Technical Analysis Chart</span>
            </h2>
            <p className="text-xs muted">
              Explore real historical OHLCV data for Nifty 50, Bank Nifty, Sensex, and NSE equities. Toggle chart views,
              moving averages, Bollinger Bands, oscillators, and pattern detection.
            </p>
          </div>
        </div>

        <ChartErrorBoundary>
          <TechnicalAnalysisChart defaultSymbol="NIFTY50" height={460} />
        </ChartErrorBoundary>
      </div>

      {/* Curriculum Module Tabs */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Comprehensive Trading Curriculum</h2>
          <p className="text-xs muted">
            Structured modules covering market mechanics, technical analysis, and risk management principles.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          {CURRICULUM_MODULES.map((m) => {
            const Icon = m.icon
            const isActive = m.id === activeTab
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveTab(m.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-blue-400'} />
                <span>{m.title.split('. ')[1]}</span>
              </button>
            )
          })}
        </div>

        {/* Active Module Content Card */}
        <div className="card space-y-6 p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {activeModule.badge}
                </span>
                <span className="text-xs text-slate-400">Technical Analysis Module</span>
              </div>
              <h3 className="text-2xl font-bold">{activeModule.title}</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-md">{activeModule.summary}</p>
          </div>

          {/* Definition */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Info size={14} className="text-blue-400" />
              <span>Core Concept & Definition</span>
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
              {activeModule.definition}
            </p>
          </div>

          {/* Methodology / Rules Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-400" />
              <span>Calculation & Identification Rules</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeModule.methodology.map((meth) => (
                <div key={meth.title} className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-1">
                  <h5 className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>{meth.title}</span>
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed pl-5">{meth.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Indian Market Example */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Target size={14} className="text-emerald-400" />
              <span>Practical Indian Market Example</span>
            </h4>
            <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/10 text-xs text-slate-300 leading-relaxed space-y-1">
              <p>{activeModule.example}</p>
            </div>
          </div>

          {/* Limitations & Risk Warnings */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>Limitations & Risk Caveats</span>
            </h4>
            <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/10 text-xs text-amber-200/90 leading-relaxed">
              <p>⚠️ {activeModule.limitations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Platform Note */}
      <div className="card text-center py-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <p className="text-xs muted leading-relaxed max-w-2xl mx-auto">
          StockSense is a self-directed trading journal, performance analysis, and risk management workspace.
          All educational materials, indicator algorithms, and pattern recognition models are provided for
          discipline, mathematical understanding, and trading skill development.
        </p>
      </div>
    </div>
  )
}
