const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

/**
 * Initialize Socket.io on the HTTP server.
 * - Authenticates connections using the same JWT secret as the REST API.
 * - Manages clinic-scoped rooms so events only reach relevant clients.
 */
function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  // JWT authentication middleware — reuses the same secret as authMiddleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { userId, role }
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user.userId}, role: ${socket.user.role})`);

    // Auto-join user to their personal notification room
    socket.join(`user:${socket.user.userId}`);

    // Client joins a clinic room to receive updates for that clinic
    socket.on('join:clinic', (clinicId) => {
      if (!clinicId) return;
      socket.join(`clinic:${clinicId}`);
    });

    // Client leaves a clinic room
    socket.on('leave:clinic', (clinicId) => {
      if (!clinicId) return;
      socket.leave(`clinic:${clinicId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Get the initialized Socket.io instance.
 * Used by controllers to emit events after successful DB operations.
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized — call initializeSocket() first');
  }
  return io;
}

module.exports = { initializeSocket, getIO };
