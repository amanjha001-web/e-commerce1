import { Order } from '../models/Order.model.js';
import { Product } from '../models/Product.model.js';
import { Inventory } from '../models/Inventory.model.js';
import { StockMovement } from '../models/StockMovement.model.js';
import { ORDER_STATUS } from '../constants/orderStatus.constant.js';
import { PAYMENT_STATUS } from '../constants/paymentStatus.constant.js';
import logger from '../config/logger.js';

export const cleanupExpiredOrders = async () => {
  logger.info('[JOB] Running expired order cleanup...');
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours

  const expiredOrders = await Order.find({
    orderStatus: ORDER_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    createdAt: { $lte: cutoff },
  });

  let cancelledCount = 0;
  for (const order of expiredOrders) {
    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: 'Auto-cancelled due to expired payment window (48 hours)',
      timestamp: new Date(),
    });
    await order.save();

    // Release stock back
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      await Inventory.findOneAndUpdate(
        { productId: item.product },
        { $inc: { quantity: item.quantity } }
      );
      await StockMovement.create({
        productId: item.product,
        variantId: item.variant,
        vendorId: item.vendorId,
        type: 'CANCELLED_ORDER',
        quantity: item.quantity,
        previousStock: 0,
        newStock: 0,
        reason: `Auto-restocked after order expiry #${order.orderNumber}`,
        referenceId: order._id.toString(),
      });
    }
    cancelledCount++;
  }

  logger.info(`[JOB] Expired orders cleanup complete. Cancelled & restocked ${cancelledCount} orders.`);
  return { cancelled: cancelledCount };
};

export default cleanupExpiredOrders;
