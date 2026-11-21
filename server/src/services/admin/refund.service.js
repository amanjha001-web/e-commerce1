import mongoose from 'mongoose';
import { Refund } from '../../models/Refund.model.js';
import { ReturnRequest } from '../../models/ReturnRequest.model.js';
import { Order } from '../../models/Order.model.js';
import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { REFUND_STATUS, REFUND_STATUS_LIST } from '../../constants/refundStatus.constant.js';
import { adminOrderService } from './order.service.js';
import { notificationService } from '../common/notification.service.js';
import { appendOrderStatusHistory } from '../../utils/orderStatus.utils.js';

const ensureValidObjectId = (id, label = 'Refund ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : { ...(doc || {}) });

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractId = (val) => {
  if (!val) return '';
  if (typeof val === 'object' && val._id) return String(val._id);
  return mongoose.isValidObjectId(val) ? String(val) : '';
};

const isPopulated = (val, keys = ['email', 'fullName', 'name', 'orderNumber', 'totalAmount', 'total']) =>
  Boolean(val && typeof val === 'object' && keys.some((k) => val[k] !== undefined && val[k] !== null));

const normalizeRefundStatus = (rawStatus) => {
  const s = String(rawStatus || 'pending').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (s === 'completed' || s === 'refunded' || s === 'success') return REFUND_STATUS.PROCESSED;
  if (s === 'refund_pending') return REFUND_STATUS.PENDING;
  return s || REFUND_STATUS.PENDING;
};

const normalizeReturnStatus = (rawStatus) => {
  const s = String(rawStatus || 'pending').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (s === 'requested' || s === 'return_requested') return 'pending';
  if (s === 'return_approved') return 'approved';
  if (s === 'return_rejected') return 'rejected';
  if (s === 'returned') return 'completed';
  return s || 'pending';
};

const resolveLegacyRelations = async (docs = []) => {
  if (mongoose.connection.readyState !== 1 || !Array.isArray(docs) || docs.length === 0) {
    return { users: new Map(), orders: new Map() };
  }

  const missingUserIds = [];
  const missingOrderIds = [];
  for (const doc of docs) {
    const raw = toPlain(doc);
    if (!isPopulated(raw.userId, ['email', 'fullName', 'name']) && !isPopulated(raw.user, ['email', 'fullName', 'name'])) {
      const uid = extractId(raw.userId) || extractId(raw.user);
      if (uid) missingUserIds.push(uid);
    }
    if (!isPopulated(raw.orderId, ['orderNumber', 'totalAmount', 'total']) && !isPopulated(raw.order, ['orderNumber', 'totalAmount', 'total'])) {
      const oid = extractId(raw.orderId) || extractId(raw.order);
      if (oid) missingOrderIds.push(oid);
    }
  }

  const [usersRes, ordersRes] = await Promise.all([
    missingUserIds.length > 0
      ? Promise.resolve()
          .then(() =>
            User.find({ _id: { $in: [...new Set(missingUserIds)] } })
              .select('fullName name username email phone avatar')
              .lean()
          )
          .catch(() => [])
      : Promise.resolve([]),
    missingOrderIds.length > 0
      ? Promise.resolve()
          .then(() =>
            Order.find({ _id: { $in: [...new Set(missingOrderIds)] } })
              .select('orderNumber totalAmount total amount orderStatus status paymentStatus paymentMethod isPaid shippingAddress userId user createdAt orderDate returnRequest cancellation')
              .lean()
          )
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const users = new Map();
  for (const u of usersRes || []) {
    if (u?._id) users.set(String(u._id), u);
  }
  const orders = new Map();
  for (const o of ordersRes || []) {
    if (o?._id) orders.set(String(o._id), o);
  }
  return { users, orders };
};

const formatRefundDoc = (doc, relations = {}) => {
  if (!doc) return null;
  const raw = toPlain(doc);

  let orderObj = isPopulated(raw.orderId, ['orderNumber', 'totalAmount', 'total', 'orderStatus'])
    ? toPlain(raw.orderId)
    : isPopulated(raw.order, ['orderNumber', 'totalAmount', 'total', 'orderStatus'])
      ? toPlain(raw.order)
      : null;
  if (!orderObj && relations.orders instanceof Map) {
    const oid = extractId(raw.orderId) || extractId(raw.order);
    if (oid && relations.orders.has(oid)) orderObj = relations.orders.get(oid);
  }

  let userObj = isPopulated(raw.userId, ['fullName', 'name', 'email'])
    ? toPlain(raw.userId)
    : isPopulated(raw.user, ['fullName', 'name', 'email'])
      ? toPlain(raw.user)
      : null;
  if (!userObj && relations.users instanceof Map) {
    const uid = extractId(raw.userId) || extractId(raw.user) || extractId(orderObj?.userId) || extractId(orderObj?.user);
    if (uid && relations.users.has(uid)) userObj = relations.users.get(uid);
  }

  const paymentObj =
    (raw.paymentId && typeof raw.paymentId === 'object' ? toPlain(raw.paymentId) : null) ||
    (raw.payment && typeof raw.payment === 'object' ? toPlain(raw.payment) : null);
  const processorObj =
    raw.processedBy && typeof raw.processedBy === 'object' ? toPlain(raw.processedBy) : null;

  const customerName =
    userObj?.fullName ||
    userObj?.name ||
    userObj?.username ||
    orderObj?.shippingAddress?.fullName ||
    userObj?.email ||
    'Customer';

  const resolvedOrderId = orderObj?._id || extractId(raw.orderId) || extractId(raw.order) || null;
  const resolvedAmount = Number(
    raw.amount ?? raw.refundAmount ?? orderObj?.refundAmount ?? orderObj?.totalAmount ?? orderObj?.total ?? 0
  );

  return {
    ...raw,
    status: normalizeRefundStatus(raw.status),
    amount: resolvedAmount,
    reason: raw.reason || raw.refundReason || raw.notes || '',
    createdAt: raw.createdAt || raw.requestedAt || orderObj?.createdAt || orderObj?.orderDate,
    refundCode: raw._id ? `RF-${String(raw._id).slice(-5).toUpperCase()}` : 'RF-NEW',
    orderRefId: resolvedOrderId,
    orderNumber:
      orderObj?.orderNumber ||
      (resolvedOrderId ? `#SS-${String(resolvedOrderId).slice(-5).toUpperCase()}` : '—'),
    orderTotal: Number(orderObj?.totalAmount ?? orderObj?.total ?? resolvedAmount),
    orderStatus: orderObj?.orderStatus || orderObj?.status || '',
    paymentStatus: orderObj?.paymentStatus || paymentObj?.status || '',
    paymentMethod: orderObj?.paymentMethod || paymentObj?.paymentMethod || '',
    isPaid: Boolean(orderObj?.isPaid),
    customerName,
    customerEmail: userObj?.email || '',
    customerPhone: userObj?.phone || orderObj?.shippingAddress?.phone || '',
    razorpayPaymentId: paymentObj?.razorpayPaymentId || '',
    processedByName: processorObj?.fullName || processorObj?.name || '',
  };
};

const formatLegacyOrderAsRefund = (orderDoc, userLookup = new Map()) => {
  const order = toPlain(orderDoc);
  const uid = extractId(order.userId) || extractId(order.user);
  const userObj = isPopulated(order.userId, ['fullName', 'name', 'email'])
    ? toPlain(order.userId)
    : isPopulated(order.user, ['fullName', 'name', 'email'])
      ? toPlain(order.user)
      : uid
        ? userLookup.get(uid) || null
        : null;

  const rawPay = String(order.paymentStatus || '').toLowerCase();
  const rawOrd = String(order.orderStatus || order.status || '').toLowerCase();
  const status =
    rawOrd === 'refunded' || rawPay === 'refunded' || rawPay === 'partially_refunded'
      ? REFUND_STATUS.PROCESSED
      : REFUND_STATUS.PENDING;

  const amount = Number(
    order.refundAmount ?? order.totalAmount ?? order.total ?? order.grandTotal ?? order.amount ?? 0
  );
  const reason =
    order.refundReason ||
    order.returnRequest?.reason ||
    order.cancellation?.reason ||
    (status === REFUND_STATUS.PROCESSED ? 'Order refund' : 'Pending order refund');

  return {
    _id: order._id,
    isLegacyOrderRecord: true,
    refundCode: `RF-${String(order._id).slice(-5).toUpperCase()}`,
    orderRefId: order._id,
    orderNumber:
      order.orderNumber || `#SS-${String(order._id).slice(-5).toUpperCase()}`,
    orderTotal: Number(order.totalAmount ?? order.total ?? amount),
    orderStatus: rawOrd,
    paymentStatus: rawPay,
    paymentMethod: order.paymentMethod || '',
    isPaid: Boolean(order.isPaid || ['success', 'paid', 'refunded', 'partially_refunded'].includes(rawPay)),
    amount,
    reason,
    status,
    customerName:
      userObj?.fullName ||
      userObj?.name ||
      userObj?.username ||
      order.shippingAddress?.fullName ||
      userObj?.email ||
      'Customer',
    customerEmail: userObj?.email || '',
    customerPhone: userObj?.phone || order.shippingAddress?.phone || '',
    adminNotes: '',
    rejectionReason: '',
    createdAt: order.createdAt || order.orderDate || order.updatedAt,
  };
};

const formatReturnDoc = (doc, relations = {}) => {
  if (!doc) return null;
  const raw = toPlain(doc);

  let orderObj = isPopulated(raw.orderId, ['orderNumber', 'totalAmount', 'total', 'orderStatus'])
    ? toPlain(raw.orderId)
    : isPopulated(raw.order, ['orderNumber', 'totalAmount', 'total', 'orderStatus'])
      ? toPlain(raw.order)
      : null;
  if (!orderObj && relations.orders instanceof Map) {
    const oid = extractId(raw.orderId) || extractId(raw.order);
    if (oid && relations.orders.has(oid)) orderObj = relations.orders.get(oid);
  }

  let userObj = isPopulated(raw.userId, ['fullName', 'name', 'email'])
    ? toPlain(raw.userId)
    : isPopulated(raw.user, ['fullName', 'name', 'email'])
      ? toPlain(raw.user)
      : null;
  if (!userObj && relations.users instanceof Map) {
    const uid = extractId(raw.userId) || extractId(raw.user) || extractId(orderObj?.userId) || extractId(orderObj?.user);
    if (uid && relations.users.has(uid)) userObj = relations.users.get(uid);
  }

  const actionerObj =
    raw.actionedBy && typeof raw.actionedBy === 'object' ? toPlain(raw.actionedBy) : null;

  const customerName =
    userObj?.fullName ||
    userObj?.name ||
    userObj?.username ||
    orderObj?.shippingAddress?.fullName ||
    userObj?.email ||
    'Customer';

  const resolvedOrderId = orderObj?._id || extractId(raw.orderId) || extractId(raw.order) || null;

  return {
    ...raw,
    status: normalizeReturnStatus(raw.status),
    reason: raw.reason || raw.refundReason || orderObj?.returnRequest?.reason || '',
    createdAt: raw.createdAt || raw.requestedAt || orderObj?.createdAt || orderObj?.orderDate,
    returnCode: raw._id ? `RT-${String(raw._id).slice(-5).toUpperCase()}` : 'RT-NEW',
    orderRefId: resolvedOrderId,
    orderNumber:
      orderObj?.orderNumber ||
      (resolvedOrderId ? `#SS-${String(resolvedOrderId).slice(-5).toUpperCase()}` : '—'),
    amount: Number(orderObj?.totalAmount ?? orderObj?.total ?? raw.amount ?? 0),
    orderStatus: orderObj?.orderStatus || orderObj?.status || '',
    paymentStatus: orderObj?.paymentStatus || '',
    paymentMethod: orderObj?.paymentMethod || '',
    isPaid: Boolean(orderObj?.isPaid),
    customerName,
    customerEmail: userObj?.email || '',
    customerPhone: userObj?.phone || orderObj?.shippingAddress?.phone || '',
    actionedByName: actionerObj?.fullName || actionerObj?.name || '',
  };
};

const formatLegacyOrderAsReturn = (orderDoc, userLookup = new Map()) => {
  const order = toPlain(orderDoc);
  const uid = extractId(order.userId) || extractId(order.user);
  const userObj = isPopulated(order.userId, ['fullName', 'name', 'email'])
    ? toPlain(order.userId)
    : isPopulated(order.user, ['fullName', 'name', 'email'])
      ? toPlain(order.user)
      : uid
        ? userLookup.get(uid) || null
        : null;

  const retStatus = normalizeReturnStatus(order.returnRequest?.status || order.orderStatus || order.status);
  const amount = Number(order.totalAmount ?? order.total ?? order.grandTotal ?? order.amount ?? 0);

  return {
    _id: order._id,
    isLegacyOrderRecord: true,
    returnCode: `RT-${String(order._id).slice(-5).toUpperCase()}`,
    orderRefId: order._id,
    orderNumber:
      order.orderNumber || `#SS-${String(order._id).slice(-5).toUpperCase()}`,
    amount,
    reason: order.returnRequest?.reason || 'Order return request',
    status: retStatus,
    orderStatus: String(order.orderStatus || order.status || '').toLowerCase(),
    paymentStatus: String(order.paymentStatus || '').toLowerCase(),
    paymentMethod: order.paymentMethod || '',
    isPaid: Boolean(order.isPaid),
    customerName:
      userObj?.fullName ||
      userObj?.name ||
      userObj?.username ||
      order.shippingAddress?.fullName ||
      userObj?.email ||
      'Customer',
    customerEmail: userObj?.email || '',
    customerPhone: userObj?.phone || order.shippingAddress?.phone || '',
    adminNotes: order.returnRequest?.rejectionReason || '',
    createdAt:
      order.returnRequest?.requestedAt ||
      order.createdAt ||
      order.orderDate ||
      order.updatedAt,
  };
};

const ORDER_POPULATE_SELECT =
  'orderNumber totalAmount total amount orderStatus status paymentStatus paymentMethod isPaid shippingAddress userId user createdAt orderDate returnRequest cancellation';

const POPULATE_REFUND = (query) =>
  query
    .populate('userId', 'fullName name username email phone avatar')
    .populate('orderId', ORDER_POPULATE_SELECT)
    .populate('paymentId', 'paymentMethod status razorpayPaymentId amount')
    .populate('processedBy', 'fullName name email');

const POPULATE_RETURN = (query) =>
  query
    .populate('userId', 'fullName name username email phone avatar')
    .populate('orderId', ORDER_POPULATE_SELECT)
    .populate('items.productId', 'name slug price images')
    .populate('actionedBy', 'fullName name email');

const buildLegacyOrderUserLookup = async (orders = []) => {
  const missingUserIds = [];
  for (const doc of orders) {
    const o = toPlain(doc);
    if (!isPopulated(o.userId, ['fullName', 'name', 'email']) && !isPopulated(o.user, ['fullName', 'name', 'email'])) {
      const uid = extractId(o.userId) || extractId(o.user);
      if (uid) missingUserIds.push(uid);
    }
  }
  if (missingUserIds.length === 0) return new Map();
  const users = await Promise.resolve()
    .then(() =>
      User.find({ _id: { $in: [...new Set(missingUserIds)] } })
        .select('fullName name username email phone')
        .lean()
    )
    .catch(() => []);
  const lookup = new Map();
  for (const u of users || []) {
    if (u?._id) lookup.set(String(u._id), u);
  }
  return lookup;
};

const filterAndPaginateUnified = (allItems = [], params = {}, statusPendingAliases = ['pending']) => {
  const { page, limit, skip } = parsePagination({ ...params, limit: params.limit || 10 });
  const sorted = [...allItems].sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const normalizedStatus =
    params.status && String(params.status).toLowerCase() !== 'all'
      ? String(params.status).trim().toLowerCase().replace(/[\s-]+/g, '_')
      : '';

  const q = params.search && String(params.search).trim()
    ? String(params.search).trim().toLowerCase()
    : '';
  const strippedQ = q.replace(/^#/, '');

  const filtered = sorted.filter((item) => {
    if (normalizedStatus) {
      const st = String(item.status || '').toLowerCase();
      if (normalizedStatus === 'pending') {
        if (!statusPendingAliases.includes(st)) return false;
      } else if (st !== normalizedStatus) {
        return false;
      }
    }

    if (q) {
      const haystack = [
        item._id,
        item.refundCode,
        item.returnCode,
        item.orderRefId,
        item.orderNumber,
        item.customerName,
        item.customerEmail,
        item.customerPhone,
        item.reason,
        item.adminNotes,
        item.razorpayRefundId,
      ]
        .filter(Boolean)
        .map((val) => String(val).toLowerCase())
        .join(' ');
      if (!haystack.includes(q) && !haystack.includes(strippedQ)) {
        return false;
      }
    }

    return true;
  });

  const total = filtered.length;
  return {
    items: filtered.slice(skip, skip + limit),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export class AdminRefundService {
  async getRefunds(params = {}) {
    if (mongoose.connection.readyState === 1) {
      const [rawRefunds, candidateOrders] = await Promise.all([
        POPULATE_REFUND(Refund.find({})).sort({ createdAt: -1 }),
        Order.find({
          $or: [
            { orderStatus: /^(refund[_\s-]*pending|refunded|partially[_\s-]*refunded)$/i },
            { status: /^(refund[_\s-]*pending|refunded|partially[_\s-]*refunded)$/i },
            { paymentStatus: /^(refund[_\s-]*pending|refunded|partially[_\s-]*refunded)$/i },
          ],
        })
          .populate('userId', 'fullName name username email phone')
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      const relations = await resolveLegacyRelations(rawRefunds);
      const formattedRefunds = (rawRefunds || []).map((doc) => formatRefundDoc(doc, relations));
      const coveredOrderIds = new Set(
        formattedRefunds.map((r) => (r.orderRefId ? String(r.orderRefId) : '')).filter(Boolean)
      );

      const uncoveredOrders = (candidateOrders || []).filter(
        (o) => o?._id && !coveredOrderIds.has(String(o._id))
      );
      const orderUserLookup = await buildLegacyOrderUserLookup(uncoveredOrders);
      const legacyOrderRefunds = uncoveredOrders.map((o) =>
        formatLegacyOrderAsRefund(o, orderUserLookup)
      );

      const allItems = [...formattedRefunds, ...legacyOrderRefunds];
      const summary = {
        total: allItems.length,
        pending: 0,
        approved: 0,
        processed: 0,
        rejected: 0,
        totalRefundedAmount: 0,
      };
      for (const item of allItems) {
        const st = String(item.status || '').toLowerCase();
        if (st === REFUND_STATUS.PENDING || st === REFUND_STATUS.REQUESTED) {
          summary.pending += 1;
        } else if (st === REFUND_STATUS.APPROVED) {
          summary.approved += 1;
        } else if (st === REFUND_STATUS.PROCESSED) {
          summary.processed += 1;
          summary.totalRefundedAmount += Number(item.amount || 0);
        } else if (st === REFUND_STATUS.REJECTED) {
          summary.rejected += 1;
        }
      }
      summary.totalRefundedAmount = Math.round(summary.totalRefundedAmount * 100) / 100;

      const { items, pagination } = filterAndPaginateUnified(
        allItems,
        params,
        [REFUND_STATUS.PENDING, REFUND_STATUS.REQUESTED]
      );

      return {
        refunds: items,
        summary,
        pagination,
      };
    }

    const { page, limit, skip } = parsePagination({ ...params, limit: params.limit || 10 });
    const filter = {};

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalized = String(params.status).trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (normalized === 'pending') {
        filter.status = { $in: [REFUND_STATUS.PENDING, REFUND_STATUS.REQUESTED] };
      } else if (REFUND_STATUS_LIST.includes(normalized)) {
        filter.status = normalized;
      }
    }

    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      const regex = { $regex: escapeRegex(q), $options: 'i' };
      const orClauses = [{ reason: regex }, { razorpayRefundId: regex }];

      if (mongoose.isValidObjectId(q)) {
        orClauses.push({ _id: q }, { orderId: q });
      }

      filter.$or = orClauses;
    }

    const [refunds, total] = await Promise.all([
      POPULATE_REFUND(Refund.find(filter))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Refund.countDocuments(filter),
    ]);

    const formatted = (Array.isArray(refunds) ? refunds : []).map(formatRefundDoc);

    const summary = {
      total: Number(total || 0),
      pending: 0,
      approved: 0,
      processed: 0,
      rejected: 0,
      totalRefundedAmount: 0,
    };

    for (const item of formatted) {
      const st = String(item.status || '').toLowerCase();
      if (st === REFUND_STATUS.PENDING || st === REFUND_STATUS.REQUESTED) {
        summary.pending += 1;
      } else if (st === REFUND_STATUS.APPROVED) {
        summary.approved += 1;
      } else if (st === REFUND_STATUS.PROCESSED) {
        summary.processed += 1;
        summary.totalRefundedAmount += Number(item.amount || 0);
      } else if (st === REFUND_STATUS.REJECTED) {
        summary.rejected += 1;
      }
    }

    return {
      refunds: formatted,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRefundById(refundId) {
    ensureValidObjectId(refundId, 'Refund ID');
    const refund = await POPULATE_REFUND(Refund.findById(refundId));
    if (refund) {
      const relations = await resolveLegacyRelations([refund]);
      return formatRefundDoc(refund, relations);
    }

    if (mongoose.connection.readyState === 1) {
      const legacyOrder = await Order.findById(refundId)
        .populate('userId', 'fullName name username email phone')
        .lean();
      if (legacyOrder) {
        const userLookup = await buildLegacyOrderUserLookup([legacyOrder]);
        return formatLegacyOrderAsRefund(legacyOrder, userLookup);
      }
    }

    throw ApiError.notFound('Refund request not found');
  }

  async createManualRefund(body = {}, adminId) {
    const rawIdentifier = String(body.orderId || body.orderNumber || '').trim();
    if (!rawIdentifier) {
      throw ApiError.badRequest('Order ID or Order Number is required');
    }

    let order = null;
    if (mongoose.isValidObjectId(rawIdentifier)) {
      order = await Order.findById(rawIdentifier).select('_id orderNumber').lean();
    }
    if (!order) {
      const stripped = rawIdentifier.replace(/^#/, '');
      order = await Order.findOne({
        orderNumber: new RegExp(`^#?${escapeRegex(stripped)}$`, 'i'),
      })
        .select('_id orderNumber')
        .lean();
    }
    if (!order) {
      throw ApiError.notFound(`Order '${rawIdentifier}' not found`);
    }

    const result = await adminOrderService.processRefund(
      order._id,
      {
        amount: body.amount,
        reason: body.reason || 'Admin processed refund',
        adminNotes: body.adminNotes || '',
      },
      body.reason || 'Admin processed refund',
      adminId
    );

    const populated = await this.getRefundById(result.refund._id).catch(() =>
      formatRefundDoc(result.refund)
    );
    return { ...result, refund: populated };
  }

  async approveRefund(refundId, body = {}, adminId) {
    ensureValidObjectId(refundId, 'Refund ID');
    const refund = await Refund.findById(refundId);
    if (!refund && mongoose.connection.readyState === 1) {
      const legacyOrder = await Order.findById(refundId).lean();
      if (legacyOrder) {
        const result = await adminOrderService.processRefund(
          legacyOrder._id,
          {
            amount: body?.amount ?? legacyOrder.refundAmount ?? legacyOrder.totalAmount ?? legacyOrder.total,
            reason:
              body?.reason ||
              legacyOrder.returnRequest?.reason ||
              legacyOrder.cancellation?.reason ||
              'Approved by admin',
            adminNotes: body?.adminNotes || '',
          },
          body?.reason || 'Approved by admin',
          adminId
        );
        const populated = await this.getRefundById(result.refund._id).catch(() =>
          formatRefundDoc(result.refund)
        );
        return { ...result, refund: populated };
      }
    }
    if (!refund) throw ApiError.notFound('Refund request not found');

    const currentStatus = String(refund.status || '').toLowerCase();
    if (currentStatus === REFUND_STATUS.PROCESSED) {
      throw ApiError.badRequest('This refund has already been processed');
    }
    if (currentStatus === REFUND_STATUS.REJECTED) {
      throw ApiError.badRequest('Rejected refund requests cannot be approved');
    }

    const targetOrderId =
      refund.orderId?._id ||
      refund.orderId ||
      refund.get?.('order')?._id ||
      refund.get?.('order');
    const fallbackAmount = refund.amount ?? refund.get?.('refundAmount');
    const fallbackReason = refund.reason || refund.get?.('refundReason');
    const result = await adminOrderService.processRefund(
      targetOrderId,
      {
        existingRefundId: refund._id,
        amount: body?.amount ?? fallbackAmount,
        reason: body?.reason || fallbackReason || 'Approved by admin',
        adminNotes: body?.adminNotes || '',
      },
      body?.reason || fallbackReason || 'Approved by admin',
      adminId
    );

    const populated = await this.getRefundById(refund._id).catch(() =>
      formatRefundDoc(result.refund)
    );
    return { ...result, refund: populated };
  }

  async rejectRefund(refundId, body = {}, adminId) {
    ensureValidObjectId(refundId, 'Refund ID');
    const refund = await Refund.findById(refundId);
    if (!refund && mongoose.connection.readyState === 1) {
      const legacyOrder = await Order.findById(refundId);
      if (legacyOrder) {
        const reason =
          String(body?.reason || body?.rejectionReason || '').trim() ||
          'Refund request rejected by administrator';
        const curStatus = String(legacyOrder.orderStatus || legacyOrder.get?.('status') || '').toLowerCase();
        if (curStatus === 'refunded') {
          throw ApiError.badRequest('Cannot reject a refund that has already been processed');
        }
        legacyOrder.orderStatus = legacyOrder.isDelivered ? 'delivered' : 'cancelled';
        if (String(legacyOrder.paymentStatus || '').toLowerCase() === 'refund_pending') {
          legacyOrder.paymentStatus = legacyOrder.isPaid ? 'success' : 'pending';
        }
        if (!Array.isArray(legacyOrder.statusHistory)) legacyOrder.statusHistory = [];
        appendOrderStatusHistory(legacyOrder, {
          status: legacyOrder.orderStatus,
          note: `Refund request rejected by admin: ${reason}`,
          updatedBy: adminId,
        });
        await legacyOrder.save({ validateModifiedOnly: true });
        return {
          ...formatLegacyOrderAsRefund(legacyOrder),
          status: REFUND_STATUS.REJECTED,
          rejectionReason: reason,
        };
      }
    }
    if (!refund) throw ApiError.notFound('Refund request not found');

    const currentStatus = String(refund.status || '').toLowerCase();
    if (currentStatus === REFUND_STATUS.PROCESSED) {
      throw ApiError.badRequest('Cannot reject a refund that has already been processed');
    }
    if (currentStatus === REFUND_STATUS.REJECTED) {
      throw ApiError.badRequest('This refund request has already been rejected');
    }

    const reason =
      String(body?.reason || body?.rejectionReason || '').trim() ||
      'Refund request rejected by administrator';

    if (!refund.orderId && (refund.get?.('order') || refund.order)) {
      refund.orderId = refund.get?.('order') || refund.order;
    }
    if (!refund.userId && (refund.get?.('user') || refund.user)) {
      refund.userId = refund.get?.('user') || refund.user;
    }

    refund.status = REFUND_STATUS.REJECTED;
    refund.rejectionReason = reason;
    refund.adminNotes = String(body?.adminNotes || reason).trim();
    refund.processedBy = adminId;
    refund.processedAt = new Date();
    await refund.save({ validateModifiedOnly: true });

    const order = await Promise.resolve()
      .then(() => Order.findById(refund.orderId))
      .catch(() => null);
    if (order) {
      appendOrderStatusHistory(order, {
        status: order.orderStatus || order.get?.('status') || 'delivered',
        note: `Refund request rejected by admin: ${reason}`,
        updatedBy: adminId,
      });
      await order.save({ validateModifiedOnly: true }).catch(() => {});
    }

    notificationService
      .createNotification({
        userId: refund.userId,
        title: 'Refund Request Rejected',
        message: `Your refund request of ₹${refund.amount ?? refund.get?.('refundAmount') ?? 0} was declined. Reason: ${reason}`,
        type: 'payment',
        link: order ? `/orders/${order._id}` : '/orders',
        data: { refundId: refund._id, orderId: refund.orderId },
      })
      .catch(() => {});

    return this.getRefundById(refund._id).catch(() => formatRefundDoc(refund));
  }

  async getReturnRequests(params = {}) {
    if (mongoose.connection.readyState === 1) {
      const [rawReturns, candidateOrders] = await Promise.all([
        POPULATE_RETURN(ReturnRequest.find({})).sort({ createdAt: -1 }),
        Order.find({
          $or: [
            { orderStatus: /^(return[_\s-]*requested|return[_\s-]*approved|return[_\s-]*rejected|returned)$/i },
            { status: /^(return[_\s-]*requested|return[_\s-]*approved|return[_\s-]*rejected|returned)$/i },
            { 'returnRequest.status': /^(requested|approved|rejected)$/i },
          ],
        })
          .populate('userId', 'fullName name username email phone')
          .sort({ createdAt: -1 })
          .lean(),
      ]);

      const relations = await resolveLegacyRelations(rawReturns);
      const formattedReturns = (rawReturns || []).map((doc) => formatReturnDoc(doc, relations));
      const coveredOrderIds = new Set(
        formattedReturns.map((r) => (r.orderRefId ? String(r.orderRefId) : '')).filter(Boolean)
      );

      const uncoveredOrders = (candidateOrders || []).filter(
        (o) => o?._id && !coveredOrderIds.has(String(o._id))
      );
      const orderUserLookup = await buildLegacyOrderUserLookup(uncoveredOrders);
      const legacyOrderReturns = uncoveredOrders.map((o) =>
        formatLegacyOrderAsReturn(o, orderUserLookup)
      );

      const allItems = [...formattedReturns, ...legacyOrderReturns];
      const summary = { total: allItems.length, pending: 0, approved: 0, completed: 0, rejected: 0 };
      for (const item of allItems) {
        const st = String(item.status || '').toLowerCase();
        if (st === 'pending') summary.pending += 1;
        else if (st === 'approved') summary.approved += 1;
        else if (st === 'completed') summary.completed += 1;
        else if (st === 'rejected') summary.rejected += 1;
      }

      const { items, pagination } = filterAndPaginateUnified(allItems, params, ['pending', 'requested']);

      return {
        returns: items,
        summary,
        pagination,
      };
    }

    const { page, limit, skip } = parsePagination({ ...params, limit: params.limit || 10 });
    const filter = {};

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalized = String(params.status).trim().toLowerCase();
      if (['pending', 'approved', 'rejected', 'completed'].includes(normalized)) {
        filter.status = normalized;
      }
    }

    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      const regex = { $regex: escapeRegex(q), $options: 'i' };
      const orClauses = [{ reason: regex }, { adminNotes: regex }];

      if (mongoose.isValidObjectId(q)) {
        orClauses.push({ _id: q }, { orderId: q });
      }

      filter.$or = orClauses;
    }

    const [returns, total] = await Promise.all([
      POPULATE_RETURN(ReturnRequest.find(filter))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReturnRequest.countDocuments(filter),
    ]);

    const formatted = (Array.isArray(returns) ? returns : []).map(formatReturnDoc);

    const summary = { total: Number(total || 0), pending: 0, approved: 0, completed: 0, rejected: 0 };
    for (const item of formatted) {
      const st = String(item.status || '').toLowerCase();
      if (st === 'pending') summary.pending += 1;
      else if (st === 'approved') summary.approved += 1;
      else if (st === 'completed') summary.completed += 1;
      else if (st === 'rejected') summary.rejected += 1;
    }

    return {
      returns: formatted,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveReturnRequest(returnId, body = {}, adminId) {
    ensureValidObjectId(returnId, 'Return Request ID');
    const returnReq = await ReturnRequest.findById(returnId);
    if (!returnReq && mongoose.connection.readyState === 1) {
      const legacyOrder = await Order.findById(returnId);
      if (legacyOrder) {
        const updatedOrder = await adminOrderService.approveReturn(legacyOrder._id, adminId);
        let refundResult = null;
        if (body?.processRefund) {
          refundResult = await adminOrderService.processRefund(
            legacyOrder._id,
            {
              amount: body?.amount,
              reason: body?.reason || legacyOrder.returnRequest?.reason || 'Return approved refund',
              adminNotes: body?.adminNotes || '',
            },
            body?.reason || legacyOrder.returnRequest?.reason || 'Return approved refund',
            adminId
          );
        }
        return {
          returnRequest: {
            ...formatLegacyOrderAsReturn(updatedOrder),
            status: refundResult ? 'completed' : 'approved',
          },
          ...(refundResult ? { refund: formatRefundDoc(refundResult.refund) } : {}),
        };
      }
    }
    if (!returnReq) throw ApiError.notFound('Return request not found');

    if (returnReq.status === 'rejected') {
      throw ApiError.badRequest('Rejected return request cannot be approved');
    }

    const orderId =
      returnReq.orderId?._id ||
      returnReq.orderId ||
      returnReq.get?.('order')?._id ||
      returnReq.get?.('order');
    if (!returnReq.orderId && orderId) returnReq.orderId = orderId;
    if (!returnReq.userId && (returnReq.get?.('user') || returnReq.user)) {
      returnReq.userId = returnReq.get?.('user') || returnReq.user;
    }

    if (String(returnReq.status || '').toLowerCase() === 'pending') {
      await adminOrderService.approveReturn(orderId, adminId);
      returnReq.status = 'approved';
      returnReq.actionedBy = adminId;
      returnReq.actionedAt = new Date();
      if (body?.adminNotes) returnReq.adminNotes = String(body.adminNotes).trim();
      await returnReq.save({ validateModifiedOnly: true });
    }

    let refundResult = null;
    if (body?.processRefund) {
      refundResult = await adminOrderService.processRefund(
        orderId,
        {
          amount: body?.amount,
          reason: body?.reason || returnReq.reason || 'Return approved refund',
          adminNotes: body?.adminNotes || '',
        },
        body?.reason || returnReq.reason || 'Return approved refund',
        adminId
      );
      returnReq.status = 'completed';
      await returnReq.save({ validateModifiedOnly: true });
    }

    const populated = await POPULATE_RETURN(ReturnRequest.findById(returnReq._id));
    const relations = await resolveLegacyRelations([populated || returnReq]);
    return {
      returnRequest: formatReturnDoc(populated || returnReq, relations),
      ...(refundResult ? { refund: formatRefundDoc(refundResult.refund) } : {}),
    };
  }

  async rejectReturnRequest(returnId, body = {}, adminId) {
    ensureValidObjectId(returnId, 'Return Request ID');
    const returnReq = await ReturnRequest.findById(returnId);
    if (!returnReq && mongoose.connection.readyState === 1) {
      const legacyOrder = await Order.findById(returnId);
      if (legacyOrder) {
        const reason =
          String(body?.reason || body?.rejectionReason || '').trim() ||
          'Return request rejected by administrator';
        const updatedOrder = await adminOrderService.rejectReturn(legacyOrder._id, reason, adminId);
        return {
          ...formatLegacyOrderAsReturn(updatedOrder),
          status: 'rejected',
          adminNotes: String(body?.adminNotes || reason).trim(),
        };
      }
    }
    if (!returnReq) throw ApiError.notFound('Return request not found');

    if (returnReq.status === 'rejected') {
      throw ApiError.badRequest('Return request is already rejected');
    }
    if (returnReq.status === 'completed') {
      throw ApiError.badRequest('Completed return request cannot be rejected');
    }

    const reason =
      String(body?.reason || body?.rejectionReason || '').trim() ||
      'Return request rejected by administrator';
    const orderId =
      returnReq.orderId?._id ||
      returnReq.orderId ||
      returnReq.get?.('order')?._id ||
      returnReq.get?.('order');
    if (!returnReq.orderId && orderId) returnReq.orderId = orderId;
    if (!returnReq.userId && (returnReq.get?.('user') || returnReq.user)) {
      returnReq.userId = returnReq.get?.('user') || returnReq.user;
    }

    await adminOrderService.rejectReturn(orderId, reason, adminId);
    returnReq.status = 'rejected';
    returnReq.adminNotes = String(body?.adminNotes || reason).trim();
    returnReq.actionedBy = adminId;
    returnReq.actionedAt = new Date();
    await returnReq.save({ validateModifiedOnly: true });

    const populated = await POPULATE_RETURN(ReturnRequest.findById(returnReq._id));
    const relations = await resolveLegacyRelations([populated || returnReq]);
    return formatReturnDoc(populated || returnReq, relations);
  }
}

export const adminRefundService = new AdminRefundService();
export default adminRefundService;
