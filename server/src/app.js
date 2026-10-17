const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const stockRoutes = require('./routes/stocks');
const newsRoutes = require('./routes/news');
const watchlistRoutes = require('./routes/watchlist');
const subscriptionRoutes = require('./routes/subscription');
const adminRoutes = require('./routes/admin');
const journalRoutes = require('./routes/journal');
const webhookRoutes = require('./routes/webhook');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// ─── CORS ──────────────────────────────────────────────────────────────────
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow mobile apps, curl, postman, server-to-server

  // Configured client URL
  if (process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL)) return true;

  // Any localhost or 127.0.0.1 on any port (HTTP or HTTPS)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

  // Local private network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) return true;

  // In non-production environments, allow all origins
  if (process.env.NODE_ENV !== 'production') return true;

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Webhook route BEFORE body parsers (needs raw body) ────────────────────
app.use('/api/webhook', webhookRoutes);

// ─── Body Parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Global Rate Limiting ──────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ─── Auth Rate Limiting ────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/journal', journalRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    marketDataMode: process.env.MARKET_DATA_MODE || 'demo',
  });
});

// ─── 404 & Error Handlers ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
