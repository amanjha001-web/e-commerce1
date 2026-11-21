import mongoose from 'mongoose';
import { ReturnRequest } from '../../models/ReturnRequest.model.js';
import { Order } from '../../models/Order.model.js';
import { User } from '../../models/User.model.js';
import { Vendor } from '../../models/Vendor.model.js';
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

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : { ...(doc || {}) });

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractId = (val) => {
  if (!val) return '';
  if (typeof val === 'object' && val._id) return String(val._id);
  return mongoose.isValidObjectId(val) ? String(val) : '';
};

const isPopulatedObj = (val, keys = ['name', 'fullName', 'email', 'storeName', 'shopName']) =>
  Boolean(val && typeof val === 'object' && keys.some((k) => val[k]));

const resolveLegacyOrderRelations = async (docs = []) => {
  if (mongoose.connection.readyState !== 1 || !Array.isArray(docs) || docs.length === 0) {
    return { users: new Map(), vendors: new Map() };
  }

  const missingUserIds = [];
  const missingVendorIds = [];

  for (const doc of docs) {
    const raw = toPlain(doc);
    if (!isPopulatedObj(raw.userId, ['fullName', 'name', 'email']) && !isPopulatedObj(raw.user, ['fullName', 'name', 'email'])) {
      const uid = extractId(raw.userId) || extractId(raw.user) || extractId(raw.customer);
      if (uid) missingUserIds.push(uid);
    }
    if (Array.isArray(raw.items)) {
      for (const item of raw.items) {
        if (!isPopulatedObj(item?.vendorId, ['storeName', 'shopName']) && !isPopulatedObj(item?.vendor, ['storeName', 'shopName'])) {
          const vid = extractId(item?.vendorId) || extractId(item?.vendor);
          if (vid) missingVendorIds.push(vid);
        }
      }
    }
  }

  const [usersRes, vendorsRes] = await Promise.all([
    missingUserIds.length > 0
      ? Promise.resolve()
          .then(() =>
            User.find({ _id: { $in: [...new Set(missingUserIds)] } })
              .select('fullName name username email phone')
              .lean()
          )
          .catch(() => [])
      : Promise.resolve([]),
    missingVendorIds.length > 0
      ? Promise.resolve()
          .then(() =>
            Vendor.find({ _id: { $in: [...new Set(missingVendorIds)] } })
              .select('storeName shopName businessName slug shopSlug email phone')
              .lean()
          )
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const users = new Map();
  for (const u of usersRes || []) {
    if (u?._id) users.set(String(u._id), u);
  }
  const vendors = new Map();
  for (const v of vendorsRes || []) {
    if (v?._id) vendors.set(String(v._id), v);
  }
  return { users, vendors };
};

const formatAdminOrder = (doc, relations = {}) => {
  if (!doc) return null;
  const raw = toPlain(doc);

  let userObj = isPopulatedObj(raw.userId, ['fullName', 'name', 'email'])
    ? toPlain(raw.userId)
    : isPopulatedObj(raw.user, ['fullName', 'name', 'email'])
      ? toPlain(raw.user)
      : isPopulatedObj(raw.customer, ['fullName', 'name', 'email'])
        ? toPlain(raw.customer)
        : null;

  if (!userObj && relations.users instanceof Map) {
    const uid = extractId(raw.userId) || extractId(raw.user) || extractId(raw.customer);
    if (uid && relations.users.has(uid)) {
      userObj = relations.users.get(uid);
    }
  }

  const customerName =
    userObj?.fullName ||
    userObj?.name ||
    userObj?.username ||
    raw.customerName ||
    raw.shippingAddress?.fullName ||
    userObj?.email ||
    'Customer';

  const normalizedOrderStatus = String(
    raw.orderStatus || raw.status || ORDER_STATUS.PENDING
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const resolvedTotal = Number(
    raw.totalAmount ?? raw.total ?? raw.grandTotal ?? raw.finalAmount ?? raw.amount ?? 0
  );

  const normalizedItems = Array.isArray(raw.items)
    ? raw.items.map((item) => {
        const productObj =
          item?.product && typeof item.product === 'object' ? toPlain(item.product) : null;
        let vendorObj = isPopulatedObj(item?.vendorId, ['storeName', 'shopName', 'businessName'])
          ? toPlain(item.vendorId)
          : isPopulatedObj(item?.vendor, ['storeName', 'shopName', 'businessName'])
            ? toPlain(item.vendor)
            : null;
        if (!vendorObj && relations.vendors instanceof Map) {
          const vid = extractId(item?.vendorId) || extractId(item?.vendor);
          if (vid && relations.vendors.has(vid)) {
            vendorObj = relations.vendors.get(vid);
          }
        }
        const storeName =
          vendorObj?.storeName || vendorObj?.shopName || vendorObj?.businessName || '';
        const itemImage =
          (typeof item?.image === 'string' ? item.image : item?.image?.url) ||
          (typeof productObj?.images?.[0] === 'string'
            ? productObj.images[0]
            : productObj?.images?.[0]?.url) ||
          (typeof productObj?.thumbnail === 'string'
            ? productObj.thumbnail
            : productObj?.thumbnail?.url) ||
          '';

        return {
          ...item,
          name: item?.name || productObj?.name || 'Product',
          image: itemImage,
          price: Number(item?.price ?? productObj?.price ?? 0),
          quantity: Number(item?.quantity ?? 1),
          total: Number(item?.total ?? (Number(item?.price ?? productObj?.price ?? 0) * Number(item?.quantity ?? 1))),
          vendorId: vendorObj ? { ...vendorObj, storeName } : item?.vendorId || item?.vendor,
        };
      })
    : [];

  return {
    ...raw,
    orderNumber:
      raw.orderNumber || (raw._id ? `#SS-${String(raw._id).slice(-5).toUpperCase()}` : ''),
    userId: userObj || raw.userId || raw.user || null,
    user: userObj || undefined,
    customerName,
    orderStatus: normalizedOrderStatus,
    paymentStatus: String(
      raw.paymentStatus || (raw.isPaid ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.PENDING)
    )
      .trim()
      .toLowerCase(),
    totalAmount: resolvedTotal,
    createdAt: raw.createdAt || raw.orderDate || raw.updatedAt,
    items: normalizedItems,
  };
};

const hydrateLegacyOrderForSave = (order) => {
  if (!order) return;
  const legacyUser = order.get?.('user') || order.user;
  if (!order.userId && legacyUser) {
    order.userId = legacyUser?._id || legacyUser;
  }
  const legacyStatus = order.get?.('status') || order.status;
  if (!order.orderStatus && legacyStatus) {
    order.orderStatus = String(legacyStatus).trim().toLowerCase().replace(/[\s-]+/g, '_');
  }
  const legacyTotal =
    order.get?.('total') ?? order.total ?? order.get?.('grandTotal') ?? order.get?.('amount');
  if ((order.totalAmount === undefined || order.totalAmount === null) && legacyTotal !== undefined) {
    order.totalAmount = Number(legacyTotal || 0);
  }
  if (!order.orderNumber && order._id) {
    order.orderNumber = `#SS-${String(order._id).slice(-5).toUpperCase()}`;
  }
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }
};

export class AdminOrderService {
  async getOrders(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};
    const andClauses = [];
    const isConnected = mongoose.connection.readyState === 1;

    if (
      params.status &&
      !['all', 'all statuses', 'all_statuses'].includes(
        String(params.status).trim().toLowerCase()
      )
    ) {
      const normalizedStatus = String(params.status)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
      if (isConnected) {
        const statusRegex = new RegExp(`^${normalizedStatus.replace(/_/g, '[\\s_-]*')}$`, 'i');
        andClauses.push({
          $or: [{ orderStatus: statusRegex }, { status: statusRegex }],
        });
      } else {
        filter.orderStatus = normalizedStatus;
      }
    }
    if (params.paymentStatus && String(params.paymentStatus).toLowerCase() !== 'all') {
      const normPay = String(params.paymentStatus).trim().toLowerCase();
      filter.paymentStatus = isConnected ? new RegExp(`^${escapeRegex(normPay)}$`, 'i') : normPay;
    }
    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      const regex = { $regex: escapeRegex(q), $options: 'i' };
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

      const orClauses = [
        { orderNumber: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
      ];
      if (isConnected && mongoose.isValidObjectId(q)) {
        orClauses.push({ _id: q });
      }
      if (userIds.length > 0) {
        orClauses.push({ userId: { $in: userIds } }, { user: { $in: userIds } });
      }
      if (andClauses.length > 0) {
        andClauses.push({ $or: orClauses });
      } else {
        filter.$or = orClauses;
      }
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'fullName name username email phone')
        .populate('items.product', 'name slug images thumbnail price')
        .populate('items.vendorId', 'storeName shopName slug shopSlug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    const relations = await resolveLegacyOrderRelations(orders);

    return {
      orders: orders.map((doc) => formatAdminOrder(doc, relations)),
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
      .populate('userId', 'fullName name username email phone')
      .populate('items.product', 'name slug images thumbnail price')
      .populate('items.vendorId', 'storeName shopName slug shopSlug email phone');

    if (!order) throw ApiError.notFound('Order not found');
    const relations = await resolveLegacyOrderRelations([order]);
    return formatAdminOrder(order, relations);
  }

  async updateOrderStatus(orderId, status, note = '', adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    hydrateLegacyOrderForSave(order);

    const normalizedStatus = await applyOrderStatusTransition(order, {
      status,
      note,
      updatedBy: adminId,
      actorLabel: 'admin',
    });

    await order.save({ validateModifiedOnly: true });

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
    hydrateLegacyOrderForSave(order);

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
    await order.save({ validateModifiedOnly: true });

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
    hydrateLegacyOrderForSave(order);

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

    const existingRefundId =
      typeof amountOrPayload === 'object' && amountOrPayload !== null
        ? amountOrPayload.existingRefundId
        : null;
    const adminNotes =
      typeof amountOrPayload === 'object' && amountOrPayload !== null
        ? String(amountOrPayload.adminNotes || '').trim()
        : '';

    const priorMatch = {
      orderId: order._id,
      status: { $in: ['processed', 'approved'] },
      ...(existingRefundId && mongoose.isValidObjectId(existingRefundId)
        ? { _id: { $ne: new mongoose.Types.ObjectId(existingRefundId) } }
        : {}),
    };

    const priorRefunds = await Promise.resolve()
      .then(() =>
        Refund.aggregate([
          { $match: priorMatch },
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

    let refund;
    if (existingRefundId && mongoose.isValidObjectId(existingRefundId)) {
      refund = await Refund.findById(existingRefundId);
    }

    if (refund) {
      refund.orderId = refund.orderId || order._id;
      refund.userId = refund.userId || order.userId;
      refund.paymentId = payment._id;
      refund.amount = refundAmount;
      refund.reason = finalReason;
      refund.status = 'processed';
      refund.razorpayRefundId = rzpRefund?.id || refund.razorpayRefundId;
      refund.processedBy = adminId;
      refund.processedAt = new Date();
      if (adminNotes) refund.adminNotes = adminNotes;
      await refund.save({ validateModifiedOnly: true });
    } else {
      refund = await Refund.create({
        orderId: order._id,
        paymentId: payment._id,
        userId: order.userId,
        amount: refundAmount,
        reason: finalReason,
        status: 'processed',
        razorpayRefundId: rzpRefund?.id,
        processedBy: adminId,
        processedAt: new Date(),
        ...(adminNotes ? { adminNotes } : {}),
      });
    }

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
    await order.save({ validateModifiedOnly: true });
    await payment.save({ validateModifiedOnly: true });

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
    hydrateLegacyOrderForSave(order);

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
    hydrateLegacyOrderForSave(order);

    order.orderStatus = ORDER_STATUS.RETURN_APPROVED;
    order.returnRequest = order.returnRequest || {};
    order.returnRequest.status = 'approved';
    order.returnRequest.actionedAt = new Date();
    order.returnRequest.actionedBy = adminId;
    order.statusHistory.push({
      status: ORDER_STATUS.RETURN_APPROVED,
      note: 'Return request approved by admin',
      updatedBy: adminId,
      timestamp: new Date(),
    });
    await order.save({ validateModifiedOnly: true });

    await Promise.resolve()
      .then(() =>
        ReturnRequest.updateMany(
          { orderId: order._id, status: 'pending' },
          { $set: { status: 'approved', actionedBy: adminId, actionedAt: new Date() } }
        )
      )
      .catch(() => {});

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
    hydrateLegacyOrderForSave(order);

    order.orderStatus = ORDER_STATUS.RETURN_REJECTED;
    order.returnRequest = order.returnRequest || {};
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
    await order.save({ validateModifiedOnly: true });

    await Promise.resolve()
      .then(() =>
        ReturnRequest.updateMany(
          { orderId: order._id, status: 'pending' },
          {
            $set: {
              status: 'rejected',
              adminNotes: reason || '',
              actionedBy: adminId,
              actionedAt: new Date(),
            },
          }
        )
      )
      .catch(() => {});

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
