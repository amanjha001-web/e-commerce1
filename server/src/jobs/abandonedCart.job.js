import { Cart } from '../models/Cart.model.js';
import { notificationService } from '../services/common/notification.service.js';
import logger from '../config/logger.js';

export const processAbandonedCarts = async () => {
  logger.info('[JOB] Running abandoned cart check...');
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const abandonedCarts = await Cart.find({
    updatedAt: { $lte: cutoff },
    'items.0': { $exists: true },
  }).populate('userId');

  let processedCount = 0;
  for (const cart of abandonedCarts) {
    if (cart.userId) {
      await notificationService
        .createNotification({
          userId: cart.userId._id,
          title: 'Items waiting in your cart!',
          message: 'You have items saved in your ShopSphere cart. Complete your order before items sell out!',
          type: 'system',
        })
        .catch(() => {});
      processedCount++;
    }
  }

  logger.info(`[JOB] Abandoned cart check finished. Notified ${processedCount} users.`);
  return { processed: processedCount };
};

export default processAbandonedCarts;
