import { processAbandonedCarts } from './abandonedCart.job.js';
import { cleanupExpiredOrders } from './expiredOrder.job.js';
import { processPendingPayouts } from './payout.job.js';

export const runScheduledJobs = async () => {
  await Promise.allSettled([
    processAbandonedCarts(),
    cleanupExpiredOrders(),
    processPendingPayouts(),
  ]);
};

export default {
  processAbandonedCarts,
  cleanupExpiredOrders,
  processPendingPayouts,
  runScheduledJobs,
};
