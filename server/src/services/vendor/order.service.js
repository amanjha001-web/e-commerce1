import mongoose from 'mongoose';
import { Order } from '../../models/Order.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { Product } from '../../models/Product.model.js';
import { User } from '../../models/User.model.js';
import { Payment } from '../../models/Payment.model.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { notificationService } from '../common/notification.service.js';
import {
  applyOrderStatusTransition,
  appendOrderStatusHistory,
} from '../../utils/orderStatus.utils.js';

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isModelQueryable = (model, method = 'find') =>
  mongoose.connection?.readyState === 1 || Boolean(model?.[method]?.mock);

const buildStatusVariants = (rawStatus) => {
  const clean = String(rawStatus || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!clean || clean === 'all' || clean === 'all_statuses') return null;

  const title = clean.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  const upper = clean.toUpperCase();
  const variants = new Set([clean, title, upper, String(rawStatus).trim()]);
  return Array.from(variants);
};

const belongsToVendor = (item, vendorRefSet, productIdSet) => {
  const rawVendor = item?.vendorId?._id ?? item?.vendorId ?? item?.vendor?._id ?? item?.vendor;
  if (rawVendor && vendorRefSet.has(String(rawVendor))) {
    return true;
  }
  if (!rawVendor && productIdSet.size > 0) {
    const rawProduct = item?.product?._id ?? item?.product ?? item?.productId?._id ?? item?.productId;
    return Boolean(rawProduct && productIdSet.has(String(rawProduct)));
  }
  return false;
};

const formatVendorOrder = (order, scope, paymentDoc = null) => {
  const doc = order.toObject ? order.toObject() : { ...order };
  const vendorItems = (doc.items || []).filter((item) =>
    belongsToVendor(item, scope.vendorRefSet, scope.productIdSet)
  );
  const effectiveItems = vendorItems.length > 0 ? vendorItems : doc.items || [];

  const vendorOrderTotal = effectiveItems.reduce((sum, item) => {
    const lineTotal =
      item.total !== undefined && item.total !== null
        ? Number(item.total)
        : Number(item.price || 0) * Number(item.quantity || 1);
    return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);

  const userObj = doc.userId && typeof doc.userId === 'object' ? doc.userId : null;
  const customerName =
    userObj?.fullName ||
    userObj?.name ||
    doc.shippingAddress?.fullName ||
    doc.customer?.fullName ||
    doc.customer?.name ||
    'Customer';

  const resolvedPayment = paymentDoc || (doc.paymentId && typeof doc.paymentId === 'object' ? doc.paymentId : null);

  return {
    ...doc,
    items: vendorItems,
    vendorItemsCount: vendorItems.length,
    vendorOrderTotal: Math.round(vendorOrderTotal * 100) / 100,
    status: doc.orderStatus || doc.status || 'pending',
    customer: {
      _id: userObj?._id || doc.userId || null,
      fullName: customerName,
      name: customerName,
      email: userObj?.email || doc.customer?.email || '',
      phone: userObj?.phone || doc.shippingAddress?.phone || doc.customer?.phone || '',
      avatar: userObj?.avatar || null,
    },
    ...(resolvedPayment
      ? {
          payment: {
            method: resolvedPayment.paymentMethod || doc.paymentMethod,
            status: resolvedPayment.status || doc.paymentStatus,
            transactionId:
              resolvedPayment.gatewayPaymentId ||
              resolvedPayment.razorpayPaymentId ||
              resolvedPayment.transactionId ||
              '',
          },
        }
      : doc.payment
        ? { payment: doc.payment }
        : {
            payment: {
              method: doc.paymentMethod || 'cod',
              status: doc.paymentStatus || (doc.isPaid ? 'success' : 'pending'),
              transactionId: '',
            },
          }),
  };
};

export class VendorOrderService {
  async getVendorScope(userId) {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');

    const vendorRefs = Array.from(
      new Set([vendor._id, vendor.userId, vendor.user, userId].filter(Boolean).map(String))
    );
    const vendorRefSet = new Set(vendorRefs);

    let productIds = [];
    if (isModelQueryable(Product, 'find')) {
      const q = Product.find({
        $or: [{ vendorId: vendor._id }, { vendor: { $in: vendorRefs } }],
      });
      if (q && typeof q.distinct === 'function') {
        productIds = await q.distinct('_id');
      } else if (q && typeof q.select === 'function') {
        const docs = await q.select('_id').lean();
        productIds = (docs || []).map((d) => d._id).filter(Boolean);
      }
    }

    const productIdSet = new Set(productIds.map(String));
    const orderVendorMatch = productIds.length
      ? {
          $or: [
            { 'items.vendorId': { $in: vendorRefs } },
            { 'items.vendor': { $in: vendorRefs } },
            { 'items.product': { $in: productIds } },
          ],
        }
      : {
          $or: [
            { 'items.vendorId': { $in: vendorRefs } },
            { 'items.vendor': { $in: vendorRefs } },
          ],
        };

    return {
      vendor,
      vendorId: vendor._id,
      vendorRefs,
      vendorRefSet,
      productIds,
      productIdSet,
      orderVendorMatch,
    };
  }

  async getVendorId(userId) {
    const { vendorId } = await this.getVendorScope(userId);
    return vendorId;
  }

  async getVendorOrders(userId, params = {}) {
    const scope = await this.getVendorScope(userId);
    const { page, limit, skip, sort } = parsePagination(params);

    let sortObj = sort;
    const rawSort = String(params.sortBy || params.sort || '').toLowerCase();
    if (rawSort === 'amount_desc' || rawSort === 'amount-desc') sortObj = { totalAmount: -1 };
    if (rawSort === 'amount_asc' || rawSort === 'amount-asc') sortObj = { totalAmount: 1 };

    const andConditions = [scope.orderVendorMatch];

    const statusVariants = buildStatusVariants(params.status);
    if (statusVariants) {
      andConditions.push({
        $or: [
          { orderStatus: { $in: statusVariants } },
          { status: { $in: statusVariants } },
        ],
      });
    }

    if (params.search && String(params.search).trim()) {
      const searchText = String(params.search).trim();
      const regex = new RegExp(escapeRegex(searchText), 'i');

      let matchedUserIds = [];
      if (isModelQueryable(User, 'find')) {
        const users = await User.find({
          $or: [{ fullName: regex }, { name: regex }, { email: regex }],
        })
          .select('_id')
          .limit(50)
          .lean();
        matchedUserIds = (users || []).map((u) => u._id).filter(Boolean);
      }

      const searchClauses = [
        { orderNumber: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
        { 'items.name': regex },
      ];
      if (mongoose.Types.ObjectId.isValid(searchText)) {
        searchClauses.push({ _id: searchText });
      }
      if (matchedUserIds.length > 0) {
        searchClauses.push({ userId: { $in: matchedUserIds } });
      }

      andConditions.push({ $or: searchClauses });
    }

    const filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
    const canAggregate = isModelQueryable(Order, 'aggregate');

    const [orders, total, summaryRows] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'fullName name email phone avatar')
        .populate('items.product', 'name slug images price')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
      canAggregate
        ? Order.aggregate([
            { $match: scope.orderVendorMatch },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          { $toLower: { $ifNull: ['$orderStatus', { $ifNull: ['$status', 'pending'] }] } },
                          [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                processing: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          { $toLower: { $ifNull: ['$orderStatus', { $ifNull: ['$status', ''] }] } },
                          [ORDER_STATUS.PROCESSING, ORDER_STATUS.PACKED],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                shipped: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          { $toLower: { $ifNull: ['$orderStatus', { $ifNull: ['$status', ''] }] } },
                          [ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                delivered: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          { $toLower: { $ifNull: ['$orderStatus', { $ifNull: ['$status', ''] }] } },
                          ORDER_STATUS.DELIVERED,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                cancelled: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          { $toLower: { $ifNull: ['$orderStatus', { $ifNull: ['$status', ''] }] } },
                          [ORDER_STATUS.CANCELLED, 'canceled', ORDER_STATUS.RETURNED],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    const filteredOrders = (orders || []).map((order) => formatVendorOrder(order, scope));
    const summary = summaryRows?.[0] || {
      total,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    return {
      orders: filteredOrders,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorOrderById(userId, orderId) {
    const scope = await this.getVendorScope(userId);
    const order = await Order.findOne({ _id: orderId, ...scope.orderVendorMatch })
      .populate('userId', 'fullName name email phone avatar')
      .populate('items.product', 'name slug images price');

    if (!order) throw ApiError.notFound('Order not found or no items for this vendor');

    let paymentDoc = null;
    if (isModelQueryable(Payment, 'findOne')) {
      paymentDoc = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean();
    }

    return formatVendorOrder(order, scope, paymentDoc);
  }

  async updateOrderStatus(userId, orderId, { status, note = '', tracking = null }) {
    const scope = await this.getVendorScope(userId);
    const order = await Order.findOne({ _id: orderId, ...scope.orderVendorMatch });
    if (!order) throw ApiError.notFound('Order not found');

    const normalizedStatus = await applyOrderStatusTransition(order, {
      status,
      note,
      updatedBy: userId,
      actorLabel: 'vendor',
    });

    if (tracking && typeof tracking === 'object') {
      order.tracking = {
        ...(order.tracking || {}),
        ...(tracking.carrier !== undefined ? { carrier: String(tracking.carrier).trim() } : {}),
        ...(tracking.trackingNumber !== undefined
          ? { trackingNumber: String(tracking.trackingNumber).trim() }
          : {}),
        ...(tracking.trackingUrl !== undefined
          ? { trackingUrl: String(tracking.trackingUrl).trim() }
          : {}),
        ...(tracking.estimatedDeliveryDate
          ? { estimatedDeliveryDate: new Date(tracking.estimatedDeliveryDate) }
          : {}),
      };
    }

    await order.save();

    notificationService
      .createNotification({
        userId: order.userId,
        title: 'Order Status Update',
        message: `Your order #${order.orderNumber} is now ${String(normalizedStatus).replace(/_/g, ' ')}.`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, status: normalizedStatus },
      })
      .catch(() => {});

    return order;
  }

  async updateOrderTracking(userId, orderId, trackingData = {}) {
    const scope = await this.getVendorScope(userId);
    const order = await Order.findOne({ _id: orderId, ...scope.orderVendorMatch })
      .populate('userId', 'fullName name email phone avatar')
      .populate('items.product', 'name slug images price');
    if (!order) throw ApiError.notFound('Order not found');

    const carrier = String(trackingData.carrier || '').trim();
    const trackingNumber = String(trackingData.trackingNumber || '').trim();
    const trackingUrl = String(trackingData.trackingUrl || '').trim();
    const estimatedDeliveryDate = trackingData.estimatedDeliveryDate
      ? new Date(trackingData.estimatedDeliveryDate)
      : order.tracking?.estimatedDeliveryDate;

    order.tracking = {
      ...(order.tracking || {}),
      ...(carrier ? { carrier } : {}),
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(trackingUrl ? { trackingUrl } : {}),
      ...(estimatedDeliveryDate && !Number.isNaN(estimatedDeliveryDate.getTime())
        ? { estimatedDeliveryDate }
        : {}),
    };

    if (carrier || trackingNumber) {
      appendOrderStatusHistory(order, {
        status: order.orderStatus || 'shipped',
        note: `Tracking updated${carrier ? ` (${carrier}` : ''}${trackingNumber ? `${carrier ? ' · ' : ' ('}${trackingNumber})` : carrier ? ')' : ''}`,
        updatedBy: userId,
      });
    }

    await order.save();

    notificationService
      .createNotification({
        userId: order.userId?._id || order.userId,
        title: 'Shipment Tracking Updated',
        message: `Tracking info updated for order #${order.orderNumber}${trackingNumber ? `: ${trackingNumber}` : '.'}`,
        type: 'order',
        link: `/orders/${order._id}`,
        data: { orderId: order._id, tracking: order.tracking },
      })
      .catch(() => {});

    return formatVendorOrder(order, scope);
  }
}

export const vendorOrderService = new VendorOrderService();
export default vendorOrderService;
