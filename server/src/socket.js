const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow connections from any localhost/127.0.0.1 or non-prod origins
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, origin || true);
        } else {
          callback(null, process.env.CLIENT_URL || false);
        }
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client subscribes to specific indices
    socket.on('subscribe:indices', (symbols) => {
      if (Array.isArray(symbols)) {
        symbols.forEach((sym) => socket.join(`index:${sym}`));
      }
    });

    socket.on('subscribe:stock', (symbol) => {
      if (symbol) socket.join(`stock:${symbol}`);
    });

    socket.on('unsubscribe:stock', (symbol) => {
      if (symbol) socket.leave(`stock:${symbol}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} — ${reason}`);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
