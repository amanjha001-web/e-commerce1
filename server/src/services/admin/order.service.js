import { Order } from '../../models/Order.model.js';
import { Payment } from '../../models/Payment.model.js';
import { Refund } from '../../models/Refund.model.js';
import { Product } from '../../models/Product.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { createRazorpayRefund } from '../../integrations/razorpay/razorpay.client.js';

export class AdminOrderService {
  async getOrders(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status) filter.orderStatus = params.status;
    if (params.paymentStatus) filter.paymentStatus = params.paymentStatus;
    if (params.search) {
      filter.orderNumber = { $regex: params.search, $options: 'i' };
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

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || `Updated by admin to ${status}`,
      updatedBy: adminId,
      timestamp: new Date(),
    });

    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    await order.save();
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

    return order;
  }

  async processRefund(orderId, amountOrPayload, reason = '', adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const payment = await Payment.findOne({ orderId: order._id });
    if (!payment) throw ApiError.notFound('Payment record not found for this order');

    const amount = typeof amountOrPayload === 'object' ? amountOrPayload.amount : amountOrPayload;
    const finalReason = typeof amountOrPayload === 'object' ? amountOrPayload.reason : reason;
    const refundAmount = amount || order.totalAmount;

    let rzpRefund = null;
    if (payment.razorpayPaymentId) {
      try {
        rzpRefund = await createRazorpayRefund(payment.razorpayPaymentId, {
          amount: refundAmount,
          notes: { orderId: order._id.toString(), reason: finalReason },
        });
      } catch (err) {
        throw ApiError.badRequest(`Refund gateway error: ${err.message}`);
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

    order.orderStatus = ORDER_STATUS.REFUNDED;
    order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    order.statusHistory.push({
      status: ORDER_STATUS.REFUNDED,
      note: `Refund processed: ₹${refundAmount}. Reason: ${finalReason}`,
      updatedBy: adminId,
      timestamp: new Date(),
    });
    await order.save();

    payment.status = PAYMENT_STATUS.REFUNDED;
    await payment.save();

    return { order, refund };
  }

  async updateOrderShipping(orderId, { carrier, trackingNumber, trackingUrl, estimatedDeliveryDate }) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    order.tracking = {
      carrier: carrier || order.tracking?.carrier,
      trackingNumber: trackingNumber || order.tracking?.trackingNumber,
      trackingUrl: trackingUrl || order.tracking?.trackingUrl,
      estimatedDeliveryDate: estimatedDeliveryDate || order.tracking?.estimatedDeliveryDate,
    };
    order.orderStatus = ORDER_STATUS.SHIPPED;
    await order.save();

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

    return order;
  }
}

export const adminOrderService = new AdminOrderService();
export default adminOrderService;
