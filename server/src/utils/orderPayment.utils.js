import { Payment } from '../models/Payment.model.js';
import { VendorEarnings } from '../models/VendorEarnings.model.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../constants/paymentStatus.constant.js';

export const accrueVendorEarningsForOrder = async (order) => {
  for (const item of order?.items || []) {
    if (!item?.vendorId) continue;

    const itemRevenue = Number(item.total || 0);
    const commission = Math.round(itemRevenue * 0.1 * 100) / 100; // 10% platform fee
    const net = itemRevenue - commission;

    await VendorEarnings.findOneAndUpdate(
      { vendorId: item.vendorId },
      {
        $inc: {
          totalRevenue: itemRevenue,
          totalCommission: commission,
          netEarnings: net,
          availableBalance: net,
        },
      },
      { upsert: true, new: true }
    );
  }
};

export const settleCodOrderOnDelivery = async (order) => {
  if (
    !order ||
    order.isPaid ||
    order.paymentStatus === PAYMENT_STATUS.SUCCESS ||
    (order.paymentMethod && order.paymentMethod !== PAYMENT_METHODS.COD)
  ) {
    return false;
  }

  order.isPaid = true;
  order.paymentStatus = PAYMENT_STATUS.SUCCESS;
  order.paidAt = order.paidAt || new Date();

  const existingPayment = await Payment.findOne({ orderId: order._id });
  if (existingPayment) {
    if (existingPayment.status !== PAYMENT_STATUS.SUCCESS) {
      existingPayment.status = PAYMENT_STATUS.SUCCESS;
      existingPayment.isVerified = true;
      await existingPayment.save();
    }
  } else {
    await Payment.create({
      orderId: order._id,
      userId: order.userId,
      amount: Number(order.totalAmount || 0),
      currency: 'INR',
      paymentMethod: PAYMENT_METHODS.COD,
      status: PAYMENT_STATUS.SUCCESS,
      isVerified: true,
    });
  }

  await accrueVendorEarningsForOrder(order);
  return true;
};

export default { accrueVendorEarningsForOrder, settleCodOrderOnDelivery };
