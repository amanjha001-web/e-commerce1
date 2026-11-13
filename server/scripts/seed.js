import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { seedDatabase } from '../src/database/seeders/index.js';
import logger from '../src/config/logger.js';

const run = async () => {
  try {
    await connectDatabase();
    await seedDatabase();
    await disconnectDatabase();
    logger.info('Seeding script finished successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding script failed:', error);
    process.exit(1);
  }
};

run();
