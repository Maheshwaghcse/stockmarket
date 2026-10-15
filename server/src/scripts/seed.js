require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Article = require('../models/Article');
const Watchlist = require('../models/Watchlist');
const Subscription = require('../models/Subscription');
const Trade = require('../models/Trade');
const { connectDB } = require('../config/db');

async function seed() {
  await connectDB();
  console.log('🌱 Starting database seeding...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Article.deleteMany({}),
    Watchlist.deleteMany({}),
    Subscription.deleteMany({}),
    Trade.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing users, articles, watchlists, subscriptions, trades.');

  // 1. Create Users
  const adminUser = await User.create({
    name: 'StockSense Admin',
    email: 'admin@stocksense.in',
    password: 'Admin@123456',
    role: 'admin',
    isEmailVerified: true,
    preferences: {
      theme: 'dark',
      defaultIndices: ['NIFTY50', 'SENSEX', 'BANKNIFTY'],
      notifications: true,
    },
  });

  const demoUser = await User.create({
    name: 'Demo Trader',
    email: 'demo@stocksense.in',
    password: 'Demo@123456',
    role: 'user',
    isEmailVerified: true,
    preferences: {
      theme: 'dark',
      defaultIndices: ['NIFTY50', 'SENSEX', 'FINNIFTY'],
      notifications: true,
    },
  });

  const premiumUser = await User.create({
    name: 'Rohan Sharma (Pro)',
    email: 'premium@stocksense.in',
    password: 'Premium@123456',
    role: 'user',
    isEmailVerified: true,
    preferences: {
      theme: 'dark',
      defaultIndices: ['NIFTY50', 'BANKNIFTY', 'NIFTYIT'],
      notifications: true,
    },
  });

  console.log('✅ Created users:');
  console.log('   - Admin: admin@stocksense.in / Admin@123456');
  console.log('   - Demo:  demo@stocksense.in / Demo@123456');
  console.log('   - Pro:   premium@stocksense.in / Premium@123456');

  // 2. Create Subscriptions
  const freeSub = new Subscription({
    user: demoUser._id,
    plan: 'free',
    status: 'active',
    billingCycle: 'monthly',
  });
  freeSub.applyPlanFeatures();
  await freeSub.save();

  const proSub = new Subscription({
    user: premiumUser._id,
    plan: 'premium',
    status: 'active',
    billingCycle: 'yearly',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
  proSub.applyPlanFeatures();
  await proSub.save();

  // 3. Create Sample Watchlists
  await Watchlist.create({
    user: demoUser._id,
    name: 'Top Bluechips',
    isDefault: true,
    items: [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', type: 'stock', exchange: 'NSE' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'stock', exchange: 'NSE' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', type: 'stock', exchange: 'NSE' },
      { symbol: 'INFY', name: 'Infosys Ltd', type: 'stock', exchange: 'NSE' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', type: 'stock', exchange: 'NSE' },
    ],
  });

  await Watchlist.create({
    user: premiumUser._id,
    name: 'High Beta Banking & Tech',
    isDefault: true,
    items: [
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', type: 'stock', exchange: 'NSE' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', type: 'stock', exchange: 'NSE' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', type: 'stock', exchange: 'NSE' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'stock', exchange: 'NSE' },
      { symbol: 'INFY', name: 'Infosys Ltd', type: 'stock', exchange: 'NSE' },
      { symbol: 'WIPRO', name: 'Wipro Ltd', type: 'stock', exchange: 'NSE' },
    ],
  });

  console.log('✅ Created initial watchlists and subscription records.');

  // 4. Create Sample Trades for Trading Journal (demo user)
  const sampleTrades = [
    {
      user: demoUser._id,
      symbol: 'RELIANCE',
      tradeType: 'Long',
      entryDate: new Date('2026-10-01T09:30:00Z'),
      exitDate: new Date('2026-10-01T15:15:00Z'),
      entryPrice: 1180,
      exitPrice: 1215,
      quantity: 50,
      entryReason: 'Bullish breakout above 50-DMA with heavy volume expansion.',
      exitReason: 'Target 1 hit at resistance; took profits before market close.',
      lessonLearned: 'Sticking to predefined targets yields stress-free execution.',
    },
    {
      user: demoUser._id,
      symbol: 'TCS',
      tradeType: 'Long',
      entryDate: new Date('2026-10-05T10:00:00Z'),
      exitDate: new Date('2026-10-05T14:30:00Z'),
      entryPrice: 2310,
      exitPrice: 2355,
      quantity: 30,
      entryReason: 'Pre-earnings optimism and strong USD/INR tailwind.',
      exitReason: 'Trailing stop loss triggered on rally consolidation.',
      lessonLearned: 'Trail stop losses in 1/3 tranches to let winners run further.',
    },
    {
      user: demoUser._id,
      symbol: 'HDFCBANK',
      tradeType: 'Short',
      entryDate: new Date('2026-10-07T09:45:00Z'),
      exitDate: new Date('2026-10-07T13:30:00Z'),
      entryPrice: 735,
      exitPrice: 718,
      quantity: 100,
      entryReason: 'Rejection at downward trendline, sector weakness in banking.',
      exitReason: 'Covered short near previous swing support.',
      lessonLearned: 'Short trades need stricter profit booking due to gap-up risks.',
    },
    {
      user: demoUser._id,
      symbol: 'INFY',
      tradeType: 'Long',
      entryDate: new Date('2026-10-08T11:15:00Z'),
      exitDate: new Date('2026-10-08T14:00:00Z'),
      entryPrice: 1860,
      exitPrice: 1835,
      quantity: 25,
      entryReason: 'Attempted intraday bottom fishing on sudden dip.',
      exitReason: 'Strict stop loss hit at ₹1835.',
      lessonLearned: 'Never catch falling knives without price action confirmation.',
    },
    {
      user: demoUser._id,
      symbol: 'ICICIBANK',
      tradeType: 'Long',
      entryDate: new Date('2026-10-12T09:20:00Z'),
      exitDate: new Date('2026-10-12T15:00:00Z'),
      entryPrice: 1320,
      exitPrice: 1362,
      quantity: 40,
      entryReason: 'Strong Q2 loan growth numbers and positive analyst upgrades.',
      exitReason: 'End of day square-off at target level.',
      lessonLearned: 'Fundamental momentum combined with intraday trend gives high win rate.',
    },
    {
      user: demoUser._id,
      symbol: 'TATAMOTORS',
      tradeType: 'Long',
      entryDate: new Date('2026-10-13T10:30:00Z'),
      exitDate: new Date('2026-10-13T15:10:00Z'),
      entryPrice: 970,
      exitPrice: 1005,
      quantity: 60,
      entryReason: 'EV sales record announcement and breakout from cup & handle.',
      exitReason: 'Reached psychological round level of ₹1000+.',
      lessonLearned: 'Holding through minor intraday pullbacks rewarded well.',
    },
    {
      user: demoUser._id,
      symbol: 'SBIN',
      tradeType: 'Long',
      entryDate: new Date('2026-10-14T09:40:00Z'),
      exitDate: new Date('2026-10-14T11:30:00Z'),
      entryPrice: 840,
      exitPrice: 825,
      quantity: 50,
      entryReason: 'Anticipated PSU bank rally following morning gap up.',
      exitReason: 'Failed to sustain gap, stop loss hit.',
      lessonLearned: 'Wait 15 minutes after open before buying gap-ups.',
    },
    {
      user: demoUser._id,
      symbol: 'WIPRO',
      tradeType: 'Long',
      entryDate: new Date('2026-10-15T09:30:00Z'),
      entryPrice: 550,
      quantity: 100,
      entryReason: 'Swing position build ahead of deal win announcements.',
      lessonLearned: 'Position sizing kept small for overnight hold.',
    },
  ];

  for (const t of sampleTrades) {
    const tradeDoc = new Trade(t);
    await tradeDoc.save();
  }
  console.log(`✅ Seeded ${sampleTrades.length} trades for Trading Journal.`);

  // 5. Create Articles (News, Education, Analysis, Guide, Glossary)
  const articlesData = [
    {
      title: 'Sensex Crosses 80,000: What Is Powering the Indian Equity Bull Run?',
      slug: 'sensex-crosses-80000-what-powers-rally',
      summary: 'A deep dive into the macroeconomic tailwinds, retail SIP inflows, and corporate earnings driving the Indian benchmark to all-time highs.',
      content: `The Indian stock market has achieved a historic milestone as the benchmark BSE Sensex crossed the psychological 80,000 threshold. 

### Key Catalysts Behind the Surge
1. **Domestic Institutional Liquidity**: Retail systematic investment plans (SIPs) in mutual funds continue to breach record numbers, infusing over ₹20,000 crore every month into domestic equities.
2. **Capital Expenditure Momentum**: The government sustained focus on infrastructure, manufacturing incentives (PLI), and defense indigenization has broadened earnings visibility across capital goods and engineering sectors.
3. **Macroeconomic Stability**: Strong GDP growth hovering around 7%, moderated inflation within the RBI tolerance band, and stable foreign exchange reserves provide a resilient backdrop.

### Cautionary Note for Investors
While optimism is elevated, valuation multiples in midcap and smallcap spaces trade at significant premiums to long-term historical averages. Prudent asset allocation and disciplined staggered deployment remain essential.`,
      author: adminUser._id,
      category: 'news',
      tags: ['sensex', 'nifty', 'macro', 'economy'],
      isPublished: true,
      isFeatured: true,
      readingTimeMinutes: 5,
      relatedSymbols: ['SENSEX', 'NIFTY50'],
      publishedAt: new Date(Date.now() - 2 * 3600000),
      source: 'StockSense Editorial',
    },
    {
      title: 'RBI Monetary Policy Update: Repo Rate Held Steady at 6.50%',
      slug: 'rbi-monetary-policy-repo-rate-unchanged',
      summary: 'Reserve Bank of India Monetary Policy Committee maintains status quo on key benchmark interest rates while keeping vigilance on food price pressures.',
      content: `The Reserve Bank of India (RBI) Monetary Policy Committee (MPC) voted to keep the policy repo rate unchanged at 6.50% for the policy review cycle.

### MPC Highlights
- **Stance**: Focused on withdrawal of accommodation to ensure inflation aligns with the target while supporting growth.
- **GDP Forecast**: Real GDP growth for the financial year projected at 7.2%.
- **Inflation Target**: CPI inflation projected around 4.5%, with close tracking of weather patterns and vegetable prices.

Banking and rate-sensitive stocks reacted positively, with Bank Nifty gaining steady momentum following Governor remarks regarding liquidity management and banking sector stability.`,
      author: adminUser._id,
      category: 'news',
      tags: ['rbi', 'monetary-policy', 'interest-rates', 'banking'],
      isPublished: true,
      isFeatured: true,
      readingTimeMinutes: 4,
      relatedSymbols: ['BANKNIFTY', 'FINNIFTY'],
      publishedAt: new Date(Date.now() - 6 * 3600000),
      source: 'StockSense Market Bureau',
    },
    {
      title: 'FIIs Return to Dalal Street: Banking and IT Stocks See Heavy Buying',
      slug: 'fiis-return-to-dalal-street-banking-it-buying',
      summary: 'Foreign institutional investors registered net purchases exceeding ₹3,400 crore as US bond yields softened and global dollar index weakened.',
      content: `Foreign Institutional Investors (FIIs) turned net buyers in Indian cash equities after a streak of consolidation. Softening US Treasury yields and dollar index corrections rekindled emerging market risk appetite.

Large-cap financial institutions like HDFC Bank and ICICI Bank alongside Tier-1 IT services giants led the buying counter, contributing substantially to broader market breadth.`,
      author: adminUser._id,
      category: 'news',
      tags: ['fii', 'investing', 'capital-markets'],
      isPublished: true,
      isFeatured: false,
      readingTimeMinutes: 3,
      relatedSymbols: ['HDFCBANK', 'ICICIBANK', 'TCS'],
      publishedAt: new Date(Date.now() - 24 * 3600000),
      source: 'StockSense Desk',
    },
    {
      title: 'Stock Market Basics 101: Understanding Shares, Exchanges, and Orders',
      slug: 'stock-market-basics-101-guide-for-beginners',
      summary: 'A comprehensive starter manual explaining how shares work, the role of NSE and BSE, market order types, and clearing processes.',
      content: `Entering the stock market can seem overwhelming, but breaking down its foundational blocks demystifies the world of equity investing.

### 1. What Is a Share?
A share represents fractional ownership in a publicly listed enterprise. When you own a share of Infosys or Tata Motors, you own a proportionate slice of that company assets and prospective earnings.

### 2. Exchanges: NSE and BSE
- **National Stock Exchange (NSE)**: India largest stock exchange by volume, founded in 1992. Its flagship index is the Nifty 50.
- **Bombay Stock Exchange (BSE)**: Asia oldest stock exchange established in 1875. Its marquee index is the Sensex (Sensitive Index).

### 3. Understanding Order Types
- **Market Order**: Executes immediately at the best available current market price.
- **Limit Order**: Executes only at your specified target price or better.
- **Stop-Loss (SL) Order**: An automatic trigger order to exit a position once a price threshold is breached, preventing catastrophic drawdowns.`,
      author: adminUser._id,
      category: 'education',
      tags: ['basics', 'education', 'beginners', 'investing'],
      isPublished: true,
      isFeatured: true,
      readingTimeMinutes: 7,
      relatedSymbols: ['NIFTY50', 'SENSEX'],
      publishedAt: new Date(Date.now() - 48 * 3600000),
      source: 'StockSense Academy',
    },
    {
      title: 'Fundamental Analysis Guide: P/E Ratio, P/B, and ROE Explained',
      slug: 'fundamental-analysis-pe-pb-roe-explained',
      summary: 'Learn the primary financial ratios professional equity research analysts use to evaluate whether a company is undervalued or expensive.',
      content: `Fundamental analysis evaluates a business core financial health, competitive advantages (moat), and intrinsic worth before committing capital.

### Price to Earnings (P/E) Ratio
The P/E ratio measures how much investors are willing to pay for each rupee of net profit:
\`\`\`
P/E = Market Price per Share / Earnings per Share (EPS)
\`\`\`
A lower P/E relative to industry peers and historical average may signal value, provided corporate earnings are not deteriorating.

### Price to Book (P/B) Ratio
Commonly used for financial institutions, banks, and capital-intensive manufacturers:
\`\`\`
P/B = Market Price per Share / Book Value per Share
\`\`\`

### Return on Equity (ROE)
ROE indicates how efficiently company management generates profits from shareholders equity capital. Consistently exceeding 15% ROE across multiple business cycles is a hallmark of high-quality franchises.`,
      author: adminUser._id,
      category: 'education',
      tags: ['fundamental-analysis', 'ratios', 'investing'],
      isPublished: true,
      isFeatured: true,
      readingTimeMinutes: 6,
      relatedSymbols: ['RELIANCE', 'TCS'],
      publishedAt: new Date(Date.now() - 72 * 3600000),
      source: 'StockSense Academy',
    },
    {
      title: 'Risk Management and Position Sizing: The 1% Rule for Longevity',
      slug: 'risk-management-position-sizing-golden-rules',
      summary: 'Capital preservation is rule #1 in financial markets. Master risk-reward ratios, stop loss placement, and volatility sizing.',
      content: `More traders exit the markets due to poor risk management than faulty chart analysis. Without disciplined position sizing, even a 70% win-rate system can result in capital depletion.

### The 1% Risk Rule
Never risk more than 1% to 2% of your entire portfolio equity on any single trade idea. If your capital is ₹1,00,000, your maximum tolerable loss per trade must not exceed ₹1,000.

### Calculating Position Size
\`\`\`
Position Size = (Total Capital * Max Risk %) / (Entry Price - Stop Loss Price)
\`\`\`
For instance, if buying a stock at ₹500 with a stop loss at ₹480 (risk per share = ₹20), and maximum risk is ₹1,000:
\`\`\`
Position Size = 1000 / 20 = 50 Shares
\`\`\`
Adhering to this formula shields your psychology and balance sheet from streak losses.`,
      author: adminUser._id,
      category: 'guide',
      tags: ['risk-management', 'trading-psychology', 'strategy'],
      isPublished: true,
      isFeatured: false,
      readingTimeMinutes: 5,
      relatedSymbols: ['NIFTY50'],
      publishedAt: new Date(Date.now() - 96 * 3600000),
      source: 'StockSense Academy',
    },
    {
      title: 'Stock Market Glossary: 20 Essential Financial Terms Explained',
      slug: 'stock-market-glossary-essential-terms',
      summary: 'Quick reference glossary covering Bear Market, Bull Market, Circuit Breakers, Demat, Dividend Yield, and T+1 Settlement.',
      content: `### Essential Financial Market Glossary

- **Bull Market**: A sustained period of rising asset prices and widespread investor confidence.
- **Bear Market**: A decline of 20% or more from recent peaks accompanied by negative sentiment.
- **Circuit Breaker**: Regulatory threshold where trading is temporarily suspended to prevent panic cascades.
- **Demat Account**: An electronic repository where securities are held in dematerialized format (via NSDL or CDSL in India).
- **Dividend Yield**: Annual dividend payout per share divided by the current share price, expressed as a percentage.
- **T+1 Settlement**: Trade settlement cycle where buyers receive securities and sellers receive payout within 1 business day of execution.`,
      author: adminUser._id,
      category: 'glossary',
      tags: ['glossary', 'terms', 'reference'],
      isPublished: true,
      isFeatured: false,
      readingTimeMinutes: 4,
      relatedSymbols: ['NIFTY50', 'SENSEX'],
      publishedAt: new Date(Date.now() - 120 * 3600000),
      source: 'StockSense Academy',
    },
  ];

  await Article.insertMany(articlesData);
  console.log(`✅ Seeded ${articlesData.length} articles across news, education, guide, and glossary.`);

  console.log('🎉 Seeding successfully completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
