# StockSense India — Real-Time Stock Market Platform

A production-ready, full-stack Indian stock market website built with the **MERN stack** (MongoDB, Express, React, Node.js), featuring real-time NSE/BSE data, live charts, user authentication, watchlists, and subscription tiers.

---

## 🏗 Project Structure

```
stockmarket/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── DEVELOPMENT_LOG.md
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18.x
- MongoDB 6.x (local or Atlas)
- npm ≥ 9.x

### 1. Clone and install
```bash
git clone https://github.com/Maheshwaghcse/stockmarket.git
cd stockmarket

# Install backend deps
cd server && npm install

# Install frontend deps
cd ../client && npm install
```

### 2. Environment variables
```bash
# Copy the example env files
cp server/.env.example server/.env
cp client/.env.example client/.env
# Fill in your real values
```

### 3. Run in development
```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS v3 |
| Charts | Lightweight Charts (TradingView) |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + Refresh Tokens |
| Payments | Razorpay (India) |

## 📊 Market Data

- **Demo Mode**: Realistic mock data with clear "DEMO" labels
- **Live Mode**: Requires a licensed NSE/BSE data provider subscription

## 📄 License

MIT — see [LICENSE](LICENSE)
