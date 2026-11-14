import mongoose from 'mongoose';
import { env } from './env.js';
import logger from './logger.js';

let isConnected = false;

export const connectDatabase = async (uri = env.MONGODB_URI) => {
  if (isConnected) {
    logger.info('Database already connected.');
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: env.MONGODB_DB_NAME,
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = !!conn.connections[0].readyState;
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Drop legacy conflicting unique indexes (e.g. user_1 vs userId_1)
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collections = ['carts', 'wishlists'];
        for (const colName of collections) {
          try {
            const col = db.collection(colName);
            const indexes = await col.indexes();
            for (const idx of indexes) {
              if (idx.name === 'user_1' || (idx.key && idx.key.user && idx.unique)) {
                await col.dropIndex(idx.name);
                logger.info(`Dropped legacy conflicting unique index '${idx.name}' on '${colName}'`);
              }
            }
          } catch {
            // Ignore if index doesn't exist or collection is empty
          }
        }
      }
    } catch {
      // Safe non-blocking
    }

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected. Retrying connection...');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected successfully.');
  }
};

export default { connectDatabase, disconnectDatabase };
