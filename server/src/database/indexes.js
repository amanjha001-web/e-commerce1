import logger from '../config/logger.js';
import * as models from '../models/index.js';
import { dropStaleSupportTicketUniqueIndexes } from '../utils/supportTicket.utils.js';

export const createDatabaseIndexes = async () => {
  try {
    if (models.SupportTicket?.collection) {
      await dropStaleSupportTicketUniqueIndexes(models.SupportTicket.collection);
    }
    for (const [, model] of Object.entries(models)) {
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
