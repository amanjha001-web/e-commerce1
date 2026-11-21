import mongoose from 'mongoose';
import { Order } from '../../models/Order.model.js';
import { User } from '../../models/User.model.js';
import { Payment } from '../../models/Payment.model.js';
import { Refund } from '../../models/Refund.model.js';
import { Product } from '../../models/Product.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { createRazorpayRefund } from '../../integrations/razorpay/razorpay.client.js';
import { notificationService } from '../common/notification.service.js';
import {
  appendOrderStatusHistory,
  applyOrderStatusTransition,
} from '../../utils/orderStatus.utils.js';

export class AdminOrderService {
  async getOrders(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (
      params.status &&
      !['all', 'all statuses', 'all_statuses'].includes(
        String(params.status).trim().toLowerCase()
      )
    ) {
      filter.orderStatus = String(params.status)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
    }
    if (params.paymentStatus && String(params.paymentStatus).toLowerCase() !== 'all') {
      filter.paymentStatus = String(params.paymentStatus).trim().toLowerCase();
    }
    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      const regex = { $regex: q, $options: 'i' };
      const matchingUsers = await Promise.resolve()
        .then(() =>
          User.find({
            $or: [{ fullName: regex }, { name: regex }, { email: regex }],
          })
            .select('_id')
            .lean()
        )
        .catch(() => []);
      const userIds = (matchingUsers || []).map((u) => u._id);

      const orClauses = [{ orderNumber: regex }];
      if (userIds.length > 0) {
        orClauses.push({ userId: { $in: userIds } });
      }
      filter.$or = orClauses;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .populate('items.product', 'name slug images price')
        .populate('items.vendorId', 'storeName slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId) {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('items.product', 'name slug images price')
      .populate('items.vendorId', 'storeName slug email phone');

    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  async updateOrderStatus(orderId, status, note = '', adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const normalizedStatus = await applyOrderStatusTransition(order, {
      status,
      note,
      updatedBy: adminId,
      actorLabel: 'admin',
    });

    await order.save();

    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Order Status Updated',
        message: `Your order #${order.orderNumber} status is now ${String(normalizedStatus).replace(/_/g, ' ')}.`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: normalizedStatus },
      })
      .catch(() => {});

    return order;
  }

  async cancelOrder(orderId, reason = 'Cancelled by admin', adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.cancellation = {
      reason,
      cancelledAt: new Date(),
      cancelledBy: adminId,
    };
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      note: `Cancelled by admin: ${reason}`,
      updatedBy: adminId,
      timestamp: new Date(),
    });
    await order.save();

    // Restock items
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
        reason: `Restocked after admin cancellation #${order.orderNumber}`,
        referenceId: order._id.toString(),
        performedBy: adminId,
      });
    }

    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber} was cancelled by support.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: ORDER_STATUS.CANCELLED },
      })
      .catch(() => {});

    return order;
  }

  async processRefund(orderId, amountOrPayload, reason = '', adminId) {
    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      throw ApiError.badRequest('Invalid Order ID');
    }

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const normalizedOrderStatus = String(order.orderStatus || '').toLowerCase();
    const normalizedOrderPayStatus = String(order.paymentStatus || '').toLowerCase();

    if (
      normalizedOrderStatus === ORDER_STATUS.REFUNDED ||
      normalizedOrderPayStatus === PAYMENT_STATUS.REFUNDED
    ) {
      throw ApiError.badRequest('This order has already been fully refunded');
    }

    // Prefer successful/partially_refunded Payment records before falling back to pending attempts
    let payment = await Payment.findOne({
      orderId: order._id,
      status: {
        $in: [
          PAYMENT_STATUS.SUCCESS,
          PAYMENT_STATUS.PARTIALLY_REFUNDED,
          PAYMENT_STATUS.REFUNDED,
        ],
      },
    }).sort({ createdAt: -1 });

    if (!payment && order.paymentId) {
      payment = await Payment.findById(order.paymentId);
    }
    if (!payment) {
      payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    }

    const paymentStatusLower = String(payment?.status || '').toLowerCase();
    if (paymentStatusLower === PAYMENT_STATUS.REFUNDED) {
      throw ApiError.badRequest('This payment has already been fully refunded');
    }

    const isPaidOrder =
      Boolean(order.isPaid) ||
      ['success', 'paid', 'partially_refunded'].includes(normalizedOrderPayStatus) ||
      ['success', 'partially_refunded'].includes(paymentStatusLower);

    if (!isPaidOrder) {
      throw ApiError.badRequest(
        'Cannot process refund for an unpaid order. Payment has not been received yet.'
      );
    }

    if (!payment) {
      payment = await Payment.create({
        orderId: order._id,
        userId: order.userId,
        amount: Number(order.totalAmount || 0),
        currency: 'INR',
        paymentMethod: order.paymentMethod || PAYMENT_METHODS.COD,
        status: PAYMENT_STATUS.SUCCESS,
        isVerified: true,
      });
      order.paymentId = order.paymentId || payment._id;
    }

    const priorRefunds = await Promise.resolve()
      .then(() =>
        Refund.aggregate([
          {
            $match: {
              orderId: order._id,
              status: { $in: ['processed', 'approved'] },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
      )
      .catch(() => []);

    const alreadyRefunded = Number(priorRefunds?.[0]?.total || 0);
    const maxRefundableBase = Number(payment?.amount ?? order.totalAmount ?? 0);
    const remainingRefundable = Math.max(
      0,
      Math.round((maxRefundableBase - alreadyRefunded) * 100) / 100
    );

    if (remainingRefundable <= 0) {
      throw ApiError.badRequest('This order has already been fully refunded');
    }

    const rawAmount =
      typeof amountOrPayload === 'object' && amountOrPayload !== null
        ? amountOrPayload.amount
        : amountOrPayload;

    let refundAmount = remainingRefundable;
    if (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') {
      const parsedAmount = Number(rawAmount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw ApiError.badRequest('Refund amount must be a positive number');
      }
      refundAmount = Math.round(parsedAmount * 100) / 100;
    }

    if (refundAmount > remainingRefundable) {
      throw ApiError.badRequest(
        `Refund amount (₹${refundAmount}) exceeds remaining refundable balance (₹${remainingRefundable})`
      );
    }

    const rawReason =
      typeof amountOrPayload === 'object' && amountOrPayload !== null
        ? amountOrPayload.reason
        : reason;
    const finalReason = String(rawReason || reason || '').trim() || 'Admin processed refund';

    let rzpRefund = null;
    if (payment.razorpayPaymentId) {
      try {
        rzpRefund = await createRazorpayRefund(payment.razorpayPaymentId, {
          amount: refundAmount,
          notes: { orderId: order._id.toString(), reason: finalReason },
        });
      } catch (err) {
        const gatewayMessage =
          err?.error?.description ||
          err?.error?.reason ||
          err?.message ||
          'Razorpay refund failed';
        throw ApiError.badRequest(`Refund gateway error: ${gatewayMessage}`);
      }
    }

    const refund = await Refund.create({
      orderId: order._id,
      paymentId: payment._id,
      userId: order.userId,
      amount: refundAmount,
      reason: finalReason,
      status: 'processed',
      razorpayRefundId: rzpRefund?.id,
      processedBy: adminId,
      processedAt: new Date(),
    });

    const totalRefundedAfter =
      Math.round((alreadyRefunded + refundAmount) * 100) / 100;
    const isFullRefund = totalRefundedAfter >= maxRefundableBase;
    const updatedRemaining = Math.max(
      0,
      Math.round((maxRefundableBase - totalRefundedAfter) * 100) / 100
    );

    if (isFullRefund) {
      order.orderStatus = ORDER_STATUS.REFUNDED;
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      payment.status = PAYMENT_STATUS.REFUNDED;
    } else {
      order.paymentStatus = PAYMENT_STATUS.PARTIALLY_REFUNDED;
      payment.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;
    }

    appendOrderStatusHistory(order, {
      status: isFullRefund ? ORDER_STATUS.REFUNDED : order.orderStatus,
      note: `${isFullRefund ? 'Full' : 'Partial'} refund processed: ₹${refundAmount}. Reason: ${finalReason}`,
      updatedBy: adminId,
    });
    await order.save();
    await payment.save();

    notificationService
      .createNotification({
        userId: order.userId,
        title: isFullRefund ? 'Refund Processed' : 'Partial Refund Processed',
        message: `A ${isFullRefund ? 'full' : 'partial'} refund of ₹${refundAmount} for order #${order.orderNumber} has been processed.`,
        type: 'payment',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, refundId: refund._id, amount: refundAmount },
      })
      .catch(() => {});

    return {
      order,
      refund,
      isFullRefund,
      totalRefunded: totalRefundedAfter,
      remainingRefundable: updatedRemaining,
    };
  }

  async updateOrderShipping(orderId, payload = {}, adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const {
      carrier,
      courierPartner,
      trackingNumber,
      trackingUrl,
      estimatedDeliveryDate,
      expectedDeliveryDate,
      note,
    } = payload || {};

    const resolvedCarrier = carrier || courierPartner || order.tracking?.carrier;
    const resolvedTrackingNumber = trackingNumber || order.tracking?.trackingNumber;
    const resolvedTrackingUrl = trackingUrl || order.tracking?.trackingUrl;
    const resolvedEstimatedDate =
      estimatedDeliveryDate || expectedDeliveryDate || order.tracking?.estimatedDeliveryDate;

    order.tracking = {
      carrier: resolvedCarrier,
      trackingNumber: resolvedTrackingNumber,
      trackingUrl: resolvedTrackingUrl,
      estimatedDeliveryDate: resolvedEstimatedDate,
    };

    const shippingNote =
      note ||
      `Order shipped${resolvedCarrier ? ` via ${resolvedCarrier}` : ''}${
        resolvedTrackingNumber ? ` (Tracking: ${resolvedTrackingNumber})` : ''
      }`;

    await applyOrderStatusTransition(order, {
      status: ORDER_STATUS.SHIPPED,
      note: shippingNote,
      updatedBy: adminId,
      actorLabel: 'admin',
    });

    await order.save();

    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Order Shipped',
        message: `Your order #${order.orderNumber} has been shipped${resolvedCarrier ? ` via ${resolvedCarrier}` : ''}${resolvedTrackingNumber ? ` (Tracking: ${resolvedTrackingNumber})` : ''}.`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber, status: ORDER_STATUS.SHIPPED },
      })
      .catch(() => {});

    return order;
  }

  async approveReturn(orderId, adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.orderStatus = ORDER_STATUS.RETURN_APPROVED;
    order.returnRequest.status = 'approved';
    order.returnRequest.actionedAt = new Date();
    order.returnRequest.actionedBy = adminId;
    order.statusHistory.push({
      status: ORDER_STATUS.RETURN_APPROVED,
      note: 'Return request approved by admin',
      updatedBy: adminId,
      timestamp: new Date(),
    });
    await order.save();

    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Return Request Approved',
        message: `Your return request for order #${order.orderNumber} has been approved.`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, status: ORDER_STATUS.RETURN_APPROVED },
      })
      .catch(() => {});

    return order;
  }

  async rejectReturn(orderId, reason = '', adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.orderStatus = ORDER_STATUS.RETURN_REJECTED;
    order.returnRequest.status = 'rejected';
    order.returnRequest.rejectionReason = reason;
    order.returnRequest.actionedAt = new Date();
    order.returnRequest.actionedBy = adminId;
    order.statusHistory.push({
      status: ORDER_STATUS.RETURN_REJECTED,
      note: `Return request rejected by admin: ${reason}`,
      updatedBy: adminId,
      timestamp: new Date(),
    });
    await order.save();

    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Return Request Rejected',
        message: `Your return request for order #${order.orderNumber} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, status: ORDER_STATUS.RETURN_REJECTED },
      })
      .catch(() => {});

    return order;
  }
}

export const adminOrderService = new AdminOrderService();
export default adminOrderService;
