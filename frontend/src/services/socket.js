import { io } from 'socket.io-client';

let socket = null;

/**
 * Connect to the Socket.io server with JWT authentication.
 * Uses the same origin (Vite proxy handles forwarding to backend).
 */
export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io({
    auth: { token },
    // No URL needed — Vite proxy forwards to the backend
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
}

/**
 * Disconnect the socket and clean up.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance (may be null if not connected).
 */
export function getSocket() {
  return socket;
}
