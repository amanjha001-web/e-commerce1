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
        // Sanitize users collection so sparse unique index on username never hits duplicate null or empty string
        try {
          const userCol = db.collection('users');
          await userCol.updateMany(
            { $or: [{ username: null }, { username: '' }, { username: 'null' }] },
            { $unset: { username: '' } }
          );
        } catch {
          // Safe non-blocking
        }

        const legacyUserIndexCollections = ['carts', 'wishlists'];
        for (const colName of legacyUserIndexCollections) {
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

        // Sanitize products & drop legacy conflicting unique indexes (e.g. non-sparse sku_1, product_1, name_1)
        try {
          const prodCol = db.collection('products');
          await prodCol.updateMany(
            { $or: [{ sku: null }, { sku: '' }] },
            { $unset: { sku: '' } }
          );
          const prodIndexes = await prodCol.indexes();
          for (const idx of prodIndexes) {
            if (
              idx.unique &&
              idx.key &&
              (idx.key.sku || idx.key.product || idx.key.name)
            ) {
              await prodCol.dropIndex(idx.name);
              logger.info(`Dropped legacy conflicting unique index '${idx.name}' on 'products'`);
            }
          }
        } catch {
          // Safe non-blocking
        }

        // Sanitize inventories & drop legacy conflicting unique index on 'product' (schema uses 'productId')
        try {
          const invCol = db.collection('inventories');
          await invCol.updateMany(
            { product: { $exists: true } },
            { $unset: { product: '' } }
          );
          const invIndexes = await invCol.indexes();
          for (const idx of invIndexes) {
            if (idx.name === 'product_1' || (idx.key && idx.key.product && idx.unique)) {
              await invCol.dropIndex(idx.name);
              logger.info(`Dropped legacy conflicting unique index '${idx.name}' on 'inventories'`);
            }
          }
        } catch {
          // Safe non-blocking
        }

        // Drop legacy standalone unique sku/product index on productvariants if any
        try {
          const varCol = db.collection('productvariants');
          const varIndexes = await varCol.indexes();
          for (const idx of varIndexes) {
            if (
              idx.unique &&
              idx.key &&
              ((idx.key.sku && !idx.key.productId) || idx.key.product)
            ) {
              await varCol.dropIndex(idx.name);
              logger.info(`Dropped legacy conflicting unique index '${idx.name}' on 'productvariants'`);
            }
          }
        } catch {
          // Safe non-blocking
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
