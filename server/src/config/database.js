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
