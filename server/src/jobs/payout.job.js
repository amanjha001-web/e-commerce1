import { VendorPayout } from '../models/VendorPayout.model.js';
import logger from '../config/logger.js';

export const processPendingPayouts = async () => {
  logger.info('[JOB] Reviewing pending payouts batch...');
  const pending = await VendorPayout.find({ status: 'PENDING' }).limit(50);
  logger.info(`[JOB] Found ${pending.length} pending payouts waiting for admin disbursement.`);
  return { pendingCount: pending.length };
};

export default processPendingPayouts;
