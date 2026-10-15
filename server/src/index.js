require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./socket');
const { startMarketDataService } = require('./services/marketDataService');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  // Start market data simulation/live feed
  startMarketDataService();

  server.listen(PORT, () => {
    console.log(`🚀 StockSense server running on port ${PORT}`);
    console.log(`📊 Market data mode: ${process.env.MARKET_DATA_MODE || 'demo'}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Graceful shutdown initiated...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
