import Redis from 'ioredis';
import { env } from './env.js';
import logger from './logger.js';

let redisClient = null;

// Fallback in-memory map
const memoryCache = new Map();

export const initRedis = () => {
  if (!env.REDIS_ENABLED) {
    logger.info('Redis disabled by configuration. Operating in in-memory cache mode.');
    return null;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis retry limit exceeded. Failing over to in-memory cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully.');
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis connection error: ${err.message}. Using in-memory fallback.`);
    });

    redisClient.connect().catch((err) => {
      logger.warn(`Could not connect to Redis: ${err.message}. Fallback enabled.`);
    });

    return redisClient;
  } catch (err) {
    logger.warn(`Redis initialization failed: ${err.message}. Fallback enabled.`);
    return null;
  }
};

export const cache = {
  async get(key) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch {
        return memoryCache.get(key) || null;
      }
    }
    return memoryCache.get(key) || null;
  },

  async set(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err) {
        logger.warn(`Redis set failed: ${err.message}`);
      }
    }
    memoryCache.set(key, value);
    setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
  },

  async del(key) {
    if (redisClient && redisClient.status === 'ready') {
      try {
        await redisClient.del(key);
      } catch (err) {
        logger.warn(`Redis del failed: ${err.message}`);
      }
    }
    memoryCache.delete(key);
  },
};

export default { initRedis, cache };
