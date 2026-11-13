import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/token.utils.js';
import logger from './logger.js';
import corsOptions from './cors.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket auth error: ${err.message}`);
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.user?._id;
    const role = socket.user?.role;
    logger.info(`User connected to socket: ${userId} (${role})`);

    // Join user's personal room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Join role room
    if (role) {
      socket.join(`role:${role}`);
    }

    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      logger.debug(`User ${userId} joined conversation: ${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.debug(`User ${userId} left conversation: ${conversationId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected from socket: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    // Return a dummy object if IO is not initialized yet to avoid crashing
    return {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    };
  }
  return io;
};

export default { initSocket, getIO };
