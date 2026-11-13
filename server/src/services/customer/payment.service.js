import { Payment } from '../../models/Payment.model.js';
import { Order } from '../../models/Order.model.js';
import { Refund } from '../../models/Refund.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { ApiError } from '../../utils/apiError.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { createRazorpayOrder, createRazorpayRefund } from '../../integrations/razorpay/razorpay.client.js';
import { verifyPaymentSignature } from '../../integrations/razorpay/razorpay.utils.js';

export class CustomerPaymentService {
  async createPaymentOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw ApiError.notFound('Order not found');

    if (order.isPaid) {
      throw ApiError.badRequest('Order is already paid');
    }

    // Call Razorpay API
    const rzpOrder = await createRazorpayOrder({
      amount: order.totalAmount,
      currency: 'INR',
      receipt: `rcpt_${order.orderNumber}`,
      notes: { orderId: order._id.toString(), userId: userId.toString() },
    });

    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = await Payment.create({
        orderId: order._id,
        userId,
        amount: order.totalAmount,
        currency: 'INR',
        paymentMethod: 'razorpay',
        status: PAYMENT_STATUS.PENDING,
        razorpayOrderId: rzpOrder.id,
      });
    } else {
      payment.razorpayOrderId = rzpOrder.id;
      payment.status = PAYMENT_STATUS.PENDING;
      await payment.save();
    }

    order.paymentId = payment._id;
    await order.save();

    return {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: order._id,
      paymentId: payment._id,
    };
  }

  async verifyPayment(userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) {
    const isValid = verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValid) {
      throw ApiError.badRequest('Invalid payment signature. Verification failed.');
    }

    let payment;
    if (orderId) {
      payment = await Payment.findOne({ orderId });
    } else {
      payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    }

    if (!payment) {
      throw ApiError.notFound('Payment record not found');
    }

    // Idempotency: skip if already processed
    if (payment.status === PAYMENT_STATUS.SUCCESS) {
      return { success: true, message: 'Payment already verified', payment };
    }

    payment.status = PAYMENT_STATUS.SUCCESS;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.isVerified = true;
    await payment.save();

    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = PAYMENT_STATUS.SUCCESS;
      order.orderStatus = ORDER_STATUS.CONFIRMED;
      order.isPaid = true;
      order.paidAt = new Date();
      order.statusHistory.push({
        status: ORDER_STATUS.CONFIRMED,
        note: `Payment verified successfully (ID: ${razorpay_payment_id})`,
        updatedBy: userId,
        timestamp: new Date(),
      });
      await order.save();

      // Accrue vendor earnings
      for (const item of order.items) {
        if (item.vendorId) {
          const itemRevenue = item.total;
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
      }
    }

    return {
      success: true,
      message: 'Payment verified and confirmed successfully',
      payment,
      order,
    };
  }

  async getPaymentById(paymentId, userId) {
    const payment = await Payment.findOne({ _id: paymentId, userId }).populate('orderId');
    if (!payment) throw ApiError.notFound('Payment not found');
    return payment;
  }

  async getOrderPayment(orderId, userId) {
    const payment = await Payment.findOne({ orderId, userId }).populate('orderId');
    if (!payment) throw ApiError.notFound('Payment not found');
    return payment;
  }

  async getPaymentStatus(paymentId, userId) {
    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) throw ApiError.notFound('Payment not found');
    return { status: payment.status, isVerified: payment.isVerified };
  }

  async retryPayment(userId, orderId) {
    return this.createPaymentOrder(userId, orderId);
  }

  async requestRefund(userId, paymentId, { reason }) {
    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) throw ApiError.notFound('Payment not found');

    if (payment.status !== PAYMENT_STATUS.SUCCESS) {
      throw ApiError.badRequest('Can only refund successful payments');
    }

    const refund = await Refund.create({
      orderId: payment.orderId,
      paymentId: payment._id,
      userId,
      amount: payment.amount,
      reason,
      status: 'pending',
    });

    return refund;
  }
}

export const customerPaymentService = new CustomerPaymentService();
export default customerPaymentService;
