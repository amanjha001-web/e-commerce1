import logger from '../config/logger.js';
import * as models from '../models/index.js';

export const createDatabaseIndexes = async () => {
  try {
    for (const [name, model] of Object.entries(models)) {
      if (model && model.createIndexes) {
        await model.createIndexes();
      }
    }
    logger.info('Database indexes synchronized successfully.');
  } catch (error) {
    logger.warn(`Database indexing notice: ${error.message}`);
  }
};

export default createDatabaseIndexes;
