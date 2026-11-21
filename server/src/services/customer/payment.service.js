import mongoose from 'mongoose';
import { Payment } from '../../models/Payment.model.js';
import { Order } from '../../models/Order.model.js';
import { Refund } from '../../models/Refund.model.js';
import { ApiError } from '../../utils/apiError.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { createRazorpayOrder } from '../../integrations/razorpay/razorpay.client.js';
import { verifyPaymentSignature } from '../../integrations/razorpay/razorpay.utils.js';
import { env } from '../../config/env.js';
import { notificationService } from '../common/notification.service.js';
import { accrueVendorEarningsForOrder } from '../../utils/orderPayment.utils.js';

export class CustomerPaymentService {
  async createPaymentOrder(userId, orderId) {
    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      throw ApiError.badRequest('Invalid Order ID');
    }

    const order = await Order.findOne({ _id: orderId, $or: [{ userId }, { user: userId }] });
    if (!order) throw ApiError.notFound('Order not found');

    if (order.isPaid || String(order.paymentStatus || '').toLowerCase() === PAYMENT_STATUS.SUCCESS) {
      throw ApiError.badRequest('Order is already paid');
    }

    const resolvedTotal = Number(order.totalAmount ?? order.get?.('total') ?? 0);

    // Call Razorpay API
    const rzpOrder = await createRazorpayOrder({
      amount: resolvedTotal,
      currency: 'INR',
      receipt: `rcpt_${order.orderNumber || order._id}`,
      notes: { orderId: order._id.toString(), userId: userId.toString() },
    });

    let payment = await Payment.findOne({ orderId: order._id });
    if (payment && payment.status === PAYMENT_STATUS.SUCCESS) {
      throw ApiError.badRequest('Payment is already completed for this order');
    }

    if (!payment) {
      payment = await Payment.create({
        orderId: order._id,
        userId,
        amount: resolvedTotal,
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

    if (!order.userId) order.userId = userId;
    order.paymentId = payment._id;
    await order.save({ validateModifiedOnly: true });

    return {
      keyId: env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
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
      const wasAlreadyPaid = Boolean(order.isPaid);
      order.paymentStatus = PAYMENT_STATUS.SUCCESS;
      order.orderStatus = ORDER_STATUS.CONFIRMED;
      order.isPaid = true;
      order.paidAt = order.paidAt || new Date();
      if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
      order.statusHistory.push({
        status: ORDER_STATUS.CONFIRMED,
        note: `Payment verified successfully (ID: ${razorpay_payment_id})`,
        updatedBy: userId,
        timestamp: new Date(),
      });
      await order.save({ validateModifiedOnly: true });

      // Accrue vendor earnings only once
      if (!wasAlreadyPaid) {
        await accrueVendorEarningsForOrder(order);
      }
    }

    notificationService
      .createNotification({
        userId: payment.userId || userId,
        title: 'Payment Confirmed',
        message: `Payment of ₹${payment.amount} for order #${order?.orderNumber || payment.orderId} succeeded.`,
        type: 'payment',
        link: `/orders/${payment.orderId}`,
        data: { orderId: payment.orderId, paymentId: payment._id },
      })
      .catch(() => {});

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
    if (!paymentId || !mongoose.isValidObjectId(paymentId)) {
      throw ApiError.badRequest('Invalid Payment ID');
    }

    const payment = await Payment.findOne({ _id: paymentId, $or: [{ userId }, { user: userId }] });
    if (!payment) throw ApiError.notFound('Payment not found');

    if (
      ![PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(
        String(payment.status || '').toLowerCase()
      )
    ) {
      throw ApiError.badRequest('Can only refund successful payments');
    }

    const existingPending = await Refund.findOne({
      orderId: payment.orderId,
      status: { $in: ['pending', 'requested', 'approved'] },
    }).lean();
    if (existingPending) {
      throw ApiError.badRequest('A refund request for this order is already in progress');
    }

    const refund = await Refund.create({
      orderId: payment.orderId,
      paymentId: payment._id,
      userId: payment.userId || userId,
      amount: payment.amount,
      reason,
      status: 'pending',
    });

    notificationService
      .createNotification({
        userId,
        title: 'Refund Request Submitted',
        message: `Your refund request of ₹${payment.amount} is pending review.`,
        type: 'payment',
        link: `/orders/${payment.orderId}`,
        data: { orderId: payment.orderId, refundId: refund._id },
      })
      .catch(() => {});

    notificationService
      .notifyAdmins({
        title: 'New Refund Request',
        message: `Refund of ₹${payment.amount} requested for order ${payment.orderId}.`,
        type: 'payment',
        link: '/admin/refunds',
        data: { orderId: payment.orderId, refundId: refund._id },
      })
      .catch(() => {});

    return refund;
  }
}

export const customerPaymentService = new CustomerPaymentService();
export default customerPaymentService;
