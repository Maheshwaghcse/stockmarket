# StockSense India — Development Log

## Current Status
**Status**: All core phases completed & operational. Backend server running with live mock market feed + Socket.IO, database seeded with demo & admin users, and React client active.

---

## ✅ Completed Features & Architecture

| # | Feature | Details | Status |
|---|---------|---------|--------|
| 1 | Project scaffold & Git | Isolated git repo in `Trading/`, `.gitignore`, `README.md`, safe `.env.example` templates | ✅ Complete |
| 2 | MongoDB Models & Schemas | `User`, `Article`, `Watchlist`, `Subscription`, `Payment`, `Audit` with proper indexes | ✅ Complete |
| 3 | Authentication & Security | JWT access (15m) + refresh token (7d) rotation, bcrypt password hashing, `helmet`, CORS, rate limiting | ✅ Complete |
| 4 | Market Data Service | Multi-index Indian stock market simulation (Nifty 50, Sensex, Bank Nifty, etc.), market hours check, demo labelling | ✅ Complete |
| 5 | WebSockets (Socket.IO) | Real-time 2-second ticker broadcast for connected clients with fallback support | ✅ Complete |
| 6 | Database Seeding | Automatic seeder (`npm run seed`) creating admin, demo, pro accounts, watchlists, and curated market articles | ✅ Complete |
| 7 | React Frontend Architecture | React 19 + Vite + Tailwind CSS v4, Zustand store (`marketStore`, `authStore`), React Query, React Router | ✅ Complete |
| 8 | Financial UI Components | Real-time scrolling ticker bar, Index cards with gain/loss indicators, TradingView Lightweight Candlestick Charts | ✅ Complete |
| 9 | Public & Protected Pages | Home, Indices, Index Detail, Stocks, Stock Detail, News, Article View, Education Hub, Pricing, Watchlists, Profile, Admin Panel | ✅ Complete |
| 10 | SEBI & Demo Compliance | Prominent demo data badges, non-registered entity disclaimers, clear warnings across pages and endpoints | ✅ Complete |
| 11 | Apify Live Data Provider | Real-time Indian equity and index prices via Apify Actor (`architjn/yahoo-finance`) + one-click sync button | ✅ Complete |
| 12 | Trading Journal (Tradebook) | Full trade journaling with Tradebook contribution heatmap, monthly calendar, live metrics, and new trade modal | ✅ Complete |
| 13 | Financial Calculator Suite | 5 professional calculators: Risk / Position Sizing (Equity & F&O), CAGR / Reverse CAGR, SIP / Lumpsum, EMI, Option Calculator with interactive SVG donut charts and educational formulas | ✅ Complete |
| 14 | NewsAPI Live Finance News | Real-time global and Indian business headlines powered by NewsAPI.org (`93ba24a1...`), background sync service, and rich article view | ✅ Complete |
| 15 | Yahoo Finance Data Integration | Replaced all dummy mock market data with real Yahoo Finance quotes (`^NSEI`, `^NSEBANK`, `^BSESN`), real NSE equities, real 5m historical candles, configurable caching, and precise change calculations | ✅ Complete |

---

## 🔑 Seed User Accounts (Local Development)

| Role | Email | Password | Access / Tier |
|------|-------|----------|---------------|
| **Admin** | `admin@stocksense.in` | `Admin@123456` | Full Admin Dashboard (`/admin`), User management, stats |
| **Demo User** | `demo@stocksense.in` | `Demo@123456` | Free tier, Watchlist management, Profile settings |
| **Pro User** | `premium@stocksense.in` | `Premium@123456` | Premium tier, active subscription, extended limits |

---

## 🚀 Running the Platform

### Backend (`server/`)
```bash
cd server
npm install
npm run seed     # Populate database with default users, watchlists, and articles
npm run dev      # Runs Express + Socket.IO on http://localhost:5000
```

### Frontend (`client/`)
```bash
cd client
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

---

## 🌐 API Endpoints Overview

- `GET  /api/health` — System status, uptime, and mode
- `GET  /api/market/indices` — Live/simulated Indian market indices
- `GET  /api/market/indices/:symbol` — Specific index quote
- `GET  /api/market/chart/:symbol` — Historical candlestick data (Lightweight Charts format)
- `GET  /api/stocks` — Searchable Indian bluechips list
- `GET  /api/stocks/:symbol` — Single stock fundamentals & OHLCV data
- `GET  /api/news` — Categorized market news & analysis with pagination
- `GET  /api/news/:slug` — Single article with view counter
- `POST /api/auth/register` — Create new trader account
- `POST /api/auth/login` — Login & receive JWT tokens
- `POST /api/auth/refresh` — Refresh expired access token
- `GET  /api/auth/me` — Current authenticated user profile
- `GET  /api/watchlist` — User's saved watchlists
- `POST /api/watchlist` — Create or add ticker to watchlist
- `GET  /api/admin/dashboard` — Platform metrics & active user statistics
