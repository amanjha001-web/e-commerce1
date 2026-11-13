import http from 'http';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { initSocket } from './config/socket.js';
import { createDatabaseIndexes } from './database/indexes.js';
import logger from './config/logger.js';

validateEnv();

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDatabase();

    // 2. Initialize Redis (if enabled)
    initRedis();

    // 3. Sync Database Indexes
    await createDatabaseIndexes();

    // 4. Start HTTP Server
    server.listen(env.PORT, () => {
      logger.info(`===================================================`);
      logger.info(`🚀 ShopSphere Server running in [${env.NODE_ENV}] mode`);
      logger.info(`📡 Port: ${env.PORT} | Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`⚡ Socket.IO initialized`);
      logger.info(`===================================================`);
    });
  } catch (error) {
    logger.error('CRITICAL: Server startup failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await disconnectDatabase();
      logger.info('Database disconnected.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds timeout
  setTimeout(() => {
    logger.error('Forcefully terminating process due to shutdown timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start if executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { server, app };
export default server;
