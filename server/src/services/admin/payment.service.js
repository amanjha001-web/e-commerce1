import mongoose from 'mongoose';
import { Payment } from '../../models/Payment.model.js';
import { Order } from '../../models/Order.model.js';
import { User } from '../../models/User.model.js';
import { Refund } from '../../models/Refund.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { VendorPayout } from '../../models/VendorPayout.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { fetchRazorpayPayment } from '../../integrations/razorpay/razorpay.client.js';
import { accrueVendorEarningsForOrder } from '../../utils/orderPayment.utils.js';
import { appendOrderStatusHistory } from '../../utils/orderStatus.utils.js';
import { notificationService } from '../common/notification.service.js';

const PAYOUT_STATUS_LIST = ['PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED'];
const TERMINAL_PAYOUT_STATUSES = ['PAID', 'REJECTED', 'CANCELLED'];

const ensureValidObjectId = (id, label = 'ID') => {
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

const isPopulatedObj = (val, keys = ['email', 'fullName', 'name', 'orderNumber', 'storeName', 'shopName']) =>
  Boolean(val && typeof val === 'object' && keys.some((k) => val[k] !== undefined && val[k] !== null));

const normalizePaymentStatus = (raw) => {
  const s = String(raw || 'pending').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['paid', 'completed', 'captured', 'successful'].includes(s)) return PAYMENT_STATUS.SUCCESS;
  return s || PAYMENT_STATUS.PENDING;
};

const resolveLegacyPaymentRelations = async (docs = []) => {
  if (mongoose.connection.readyState !== 1 || !Array.isArray(docs) || docs.length === 0) {
    return { users: new Map(), orders: new Map() };
  }

  const missingUserIds = [];
  const missingOrderIds = [];
  for (const doc of docs) {
    const raw = toPlain(doc);
    if (!isPopulatedObj(raw.userId, ['fullName', 'name', 'email']) && !isPopulatedObj(raw.user, ['fullName', 'name', 'email'])) {
      const uid = extractId(raw.userId) || extractId(raw.user);
      if (uid) missingUserIds.push(uid);
    }
    if (!isPopulatedObj(raw.orderId, ['orderNumber', 'totalAmount', 'total']) && !isPopulatedObj(raw.order, ['orderNumber', 'totalAmount', 'total'])) {
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
              .select('orderNumber totalAmount total orderStatus status paymentStatus paymentMethod isPaid shippingAddress createdAt orderDate userId user')
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

const formatAdminPayment = (doc, relations = {}, extra = {}) => {
  if (!doc) return null;
  const raw = toPlain(doc);

  let orderObj = isPopulatedObj(raw.orderId, ['orderNumber', 'totalAmount', 'total', 'orderStatus'])
    ? toPlain(raw.orderId)
    : isPopulatedObj(raw.order, ['orderNumber', 'totalAmount', 'total', 'orderStatus'])
      ? toPlain(raw.order)
      : raw.orderId && typeof raw.orderId === 'object'
        ? toPlain(raw.orderId)
        : null;

  const oid = extractId(raw.orderId) || extractId(raw.order);
  if ((!orderObj || (!orderObj.orderNumber && !orderObj.totalAmount)) && relations.orders instanceof Map && oid && relations.orders.has(oid)) {
    orderObj = relations.orders.get(oid);
  }

  let userObj = isPopulatedObj(raw.userId, ['fullName', 'name', 'email'])
    ? toPlain(raw.userId)
    : isPopulatedObj(raw.user, ['fullName', 'name', 'email'])
      ? toPlain(raw.user)
      : null;
  const uid = extractId(raw.userId) || extractId(raw.user) || extractId(orderObj?.userId) || extractId(orderObj?.user);
  if (!userObj && relations.users instanceof Map && uid && relations.users.has(uid)) {
    userObj = relations.users.get(uid);
  }

  const orderRefId = orderObj?._id || (oid || null);
  const orderNumber =
    orderObj?.orderNumber ||
    raw.orderNumber ||
    (orderRefId ? `#SS-${String(orderRefId).slice(-5).toUpperCase()}` : '—');

  const paymentCode =
    raw.razorpayPaymentId ||
    raw.transactionId ||
    raw.paymentId ||
    (raw._id ? `PAY-${String(raw._id).slice(-5).toUpperCase()}` : 'PAY-NEW');

  const customerName =
    userObj?.fullName ||
    userObj?.name ||
    userObj?.username ||
    raw.customerName ||
    orderObj?.shippingAddress?.fullName ||
    userObj?.email ||
    'Customer';

  const resolvedMethod = String(
    raw.paymentMethod || raw.method || raw.mode || orderObj?.paymentMethod || ''
  )
    .trim()
    .toLowerCase();

  return {
    ...raw,
    paymentCode,
    orderRefId,
    orderNumber,
    orderId: orderObj || orderRefId,
    userId: userObj || raw.userId || raw.user || null,
    user: userObj || undefined,
    customerName,
    customerEmail: userObj?.email || raw.customerEmail || '',
    customerPhone: userObj?.phone || orderObj?.shippingAddress?.phone || raw.customerPhone || '',
    paymentMethod: resolvedMethod,
    method: resolvedMethod,
    amount: Number(raw.amount ?? raw.totalAmount ?? orderObj?.totalAmount ?? orderObj?.total ?? 0),
    status: normalizePaymentStatus(raw.status || raw.paymentStatus),
    orderStatus: orderObj?.orderStatus || orderObj?.status || '',
    orderPaymentStatus: orderObj?.paymentStatus || '',
    createdAt: raw.createdAt || raw.paymentDate || raw.updatedAt,
    ...(extra.refundHistory !== undefined ? { refundHistory: extra.refundHistory } : {}),
    ...(extra.totalRefunded !== undefined ? { totalRefunded: extra.totalRefunded } : {}),
  };
};

const resolveLegacyPayoutRelations = async (docs = []) => {
  if (mongoose.connection.readyState !== 1 || !Array.isArray(docs) || docs.length === 0) {
    return new Map();
  }
  const missingVendorIds = [];
  for (const doc of docs) {
    const raw = toPlain(doc);
    if (!isPopulatedObj(raw.vendorId, ['storeName', 'shopName', 'businessName']) && !isPopulatedObj(raw.vendor, ['storeName', 'shopName', 'businessName'])) {
      const vid = extractId(raw.vendorId) || extractId(raw.vendor);
      if (vid) missingVendorIds.push(vid);
    }
  }
  if (missingVendorIds.length === 0) return new Map();

  const vendors = await Promise.resolve()
    .then(() =>
      Vendor.find({ _id: { $in: [...new Set(missingVendorIds)] } })
        .select('storeName shopName businessName slug shopSlug email phone userId user businessDetails bankDetails')
        .lean()
    )
    .catch(() => []);
  const map = new Map();
  for (const v of vendors || []) {
    if (v?._id) map.set(String(v._id), v);
  }
  return map;
};

const formatVendorPayout = (doc, vendorLookup = new Map()) => {
  if (!doc) return null;
  const raw = toPlain(doc);
  let vendorObj = isPopulatedObj(raw.vendorId, ['storeName', 'shopName', 'businessName'])
    ? toPlain(raw.vendorId)
    : isPopulatedObj(raw.vendor, ['storeName', 'shopName', 'businessName'])
      ? toPlain(raw.vendor)
      : null;
  const vid = extractId(raw.vendorId) || extractId(raw.vendor);
  if (!vendorObj && vendorLookup instanceof Map && vid && vendorLookup.has(vid)) {
    vendorObj = vendorLookup.get(vid);
  }
  const storeName =
    vendorObj?.storeName ||
    vendorObj?.shopName ||
    vendorObj?.businessName ||
    vendorObj?.fullName ||
    'Vendor';
  const processorObj =
    raw.processedBy && typeof raw.processedBy === 'object' ? toPlain(raw.processedBy) : null;
  const bankDetails =
    (raw.bankDetails && (raw.bankDetails.accountNumber || raw.bankDetails.bankName)
      ? raw.bankDetails
      : null) ||
    vendorObj?.businessDetails?.bankAccount ||
    vendorObj?.bankDetails ||
    {};

  return {
    ...raw,
    payoutCode: raw._id ? `PO-${String(raw._id).slice(-5).toUpperCase()}` : 'PO-NEW',
    vendorName: storeName,
    vendorId: vendorObj ? { ...vendorObj, storeName, shopName: storeName } : raw.vendorId || vid,
    vendor: vendorObj ? { ...vendorObj, storeName, shopName: storeName } : undefined,
    bankDetails,
    status: String(raw.status || 'PENDING').trim().toUpperCase(),
    processedByName: processorObj?.fullName || processorObj?.name || '',
  };
};

export class AdminPaymentService {
  async getPayments(params = {}) {
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
      const normStatus = normalizePaymentStatus(params.status);
      if (isConnected) {
        if (normStatus === PAYMENT_STATUS.SUCCESS) {
          filter.status = {
            $in: ['success', 'paid', 'completed', 'captured', 'Success', 'Paid', 'COMPLETED'],
          };
        } else {
          filter.status = new RegExp(`^${normStatus.replace(/_/g, '[\\s_-]*')}$`, 'i');
        }
      } else {
        filter.status = normStatus;
      }
    }

    const methodParam = params.paymentMethod || params.method;
    if (methodParam && String(methodParam).toLowerCase() !== 'all') {
      const cleanMethod = String(methodParam).trim().toLowerCase();
      if (isConnected) {
        const methodRegex = new RegExp(`^${escapeRegex(cleanMethod)}$`, 'i');
        andClauses.push({
          $or: [{ paymentMethod: methodRegex }, { method: methodRegex }],
        });
      } else {
        filter.paymentMethod = cleanMethod;
      }
    }

    if (params.dateRange && String(params.dateRange).toLowerCase() !== 'all') {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[String(params.dateRange).trim().toLowerCase()];
      if (days) {
        filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      const regex = { $regex: escapeRegex(q), $options: 'i' };
      const searchClauses = [
        { razorpayPaymentId: regex },
        { razorpayOrderId: regex },
        { transactionId: regex },
        { paymentId: regex },
        { failureReason: regex },
      ];

      if (mongoose.isValidObjectId(q)) {
        searchClauses.push({ _id: q }, { orderId: q }, { order: q });
      }

      if (isConnected) {
        const cleanOrderTerm = q.replace(/^#/, '');
        const orderRegex = { $regex: escapeRegex(cleanOrderTerm), $options: 'i' };
        const [matchingOrders, matchingUsers] = await Promise.all([
          Promise.resolve()
            .then(() =>
              Order.find({
                $or: [
                  { orderNumber: orderRegex },
                  { 'shippingAddress.fullName': regex },
                ],
              })
                .select('_id')
                .lean()
            )
            .catch(() => []),
          Promise.resolve()
            .then(() =>
              User.find({
                $or: [{ fullName: regex }, { name: regex }, { email: regex }, { phone: regex }],
              })
                .select('_id')
                .lean()
            )
            .catch(() => []),
        ]);

        if (matchingOrders?.length > 0) {
          const orderIds = matchingOrders.map((o) => o._id);
          searchClauses.push({ orderId: { $in: orderIds } }, { order: { $in: orderIds } });
        }
        if (matchingUsers?.length > 0) {
          const userIds = matchingUsers.map((u) => u._id);
          searchClauses.push({ userId: { $in: userIds } }, { user: { $in: userIds } });
        }
      }

      andClauses.push({ $or: searchClauses });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'fullName name username email phone avatar')
        .populate(
          'orderId',
          'orderNumber totalAmount total orderStatus status paymentStatus paymentMethod isPaid shippingAddress createdAt'
        )
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    const relations = await resolveLegacyPaymentRelations(payments);
    const formatted = (Array.isArray(payments) ? payments : []).map((doc) =>
      formatAdminPayment(doc, relations)
    );

    const summary = {
      total: Number(total || 0),
      successCount: 0,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
      totalCollectedAmount: 0,
    };

    if (isConnected) {
      const agg = await Promise.resolve()
        .then(() =>
          Payment.aggregate([
            {
              $group: {
                _id: { $toLower: { $ifNull: ['$status', 'pending'] } },
                count: { $sum: 1 },
                amount: { $sum: { $ifNull: ['$amount', 0] } },
              },
            },
          ])
        )
        .catch(() => []);
      if (Array.isArray(agg) && agg.length > 0) {
        let totalAll = 0;
        for (const row of agg) {
          const cnt = Number(row.count || 0);
          const amt = Number(row.amount || 0);
          const st = normalizePaymentStatus(row._id);
          totalAll += cnt;
          if (st === PAYMENT_STATUS.SUCCESS) {
            summary.successCount += cnt;
            summary.totalCollectedAmount += amt;
          } else if (st === PAYMENT_STATUS.PENDING || st === PAYMENT_STATUS.PROCESSING) {
            summary.pendingCount += cnt;
          } else if (st === PAYMENT_STATUS.FAILED || st === PAYMENT_STATUS.CANCELLED) {
            summary.failedCount += cnt;
          } else if (
            [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED, PAYMENT_STATUS.REFUND_PENDING].includes(st)
          ) {
            summary.refundedCount += cnt;
          }
        }
        summary.total = totalAll;
        summary.totalCollectedAmount = Math.round(summary.totalCollectedAmount * 100) / 100;
      }
    } else {
      for (const item of formatted) {
        const st = normalizePaymentStatus(item.status);
        if (st === PAYMENT_STATUS.SUCCESS) {
          summary.successCount += 1;
          summary.totalCollectedAmount += Number(item.amount || 0);
        } else if (st === PAYMENT_STATUS.PENDING || st === PAYMENT_STATUS.PROCESSING) {
          summary.pendingCount += 1;
        } else if (st === PAYMENT_STATUS.FAILED || st === PAYMENT_STATUS.CANCELLED) {
          summary.failedCount += 1;
        } else if (
          [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED, PAYMENT_STATUS.REFUND_PENDING].includes(st)
        ) {
          summary.refundedCount += 1;
        }
      }
    }

    return {
      payments: formatted,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentById(paymentId) {
    ensureValidObjectId(paymentId, 'Payment ID');
    const payment = await Payment.findById(paymentId)
      .populate('userId', 'fullName name username email phone avatar')
      .populate('orderId');

    if (!payment) throw ApiError.notFound('Payment record not found');
    const relations = await resolveLegacyPaymentRelations([payment]);
    const formatted = formatAdminPayment(payment, relations);

    let refundHistory = [];
    let totalRefunded = 0;
    if (mongoose.connection.readyState === 1) {
      const orConditions = [{ paymentId: payment._id }];
      if (formatted.orderRefId) {
        orConditions.push({ orderId: formatted.orderRefId }, { order: formatted.orderRefId });
      }
      refundHistory = await Promise.resolve()
        .then(() => Refund.find({ $or: orConditions }).sort({ createdAt: -1 }).lean())
        .catch(() => []);
      totalRefunded = (refundHistory || [])
        .filter((r) => ['processed', 'approved'].includes(String(r.status || '').toLowerCase()))
        .reduce((sum, r) => sum + Number(r.amount ?? r.refundAmount ?? 0), 0);
    }

    return {
      ...formatted,
      refundHistory: refundHistory || [],
      totalRefunded: Math.round(totalRefunded * 100) / 100,
    };
  }

  async reconcilePayment(paymentId) {
    ensureValidObjectId(paymentId, 'Payment ID');
    const payment = await Payment.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');

    const rzpPaymentId = payment.razorpayPaymentId || payment.get?.('transactionId');
    if (!rzpPaymentId) {
      return {
        paymentId: payment._id,
        localStatus: payment.status,
        status: payment.status,
        reconciled: false,
        updated: false,
        reason: 'No Razorpay payment ID is linked to this transaction',
        payment: await this.getPaymentById(payment._id),
      };
    }

    const gatewayPayment = await fetchRazorpayPayment(rzpPaymentId);
    if (gatewayPayment?.isSimulated) {
      return {
        paymentId: payment._id,
        localStatus: payment.status,
        status: payment.status,
        reconciled: false,
        updated: false,
        simulated: true,
        reason: 'Live Razorpay API credentials are not configured on the server',
        payment: await this.getPaymentById(payment._id),
      };
    }

    const gatewayStatus =
      gatewayPayment.status === 'captured'
        ? PAYMENT_STATUS.SUCCESS
        : String(gatewayPayment.status || payment.status).toLowerCase();

    const statusChanged = payment.status !== gatewayStatus;
    if (statusChanged) {
      payment.status = gatewayStatus;
      if (gatewayStatus === PAYMENT_STATUS.SUCCESS) {
        payment.isVerified = true;
      }
      await payment.save({ validateModifiedOnly: true });
    }

    const linkedOrderId = payment.orderId || payment.get?.('order');
    if (gatewayStatus === PAYMENT_STATUS.SUCCESS && linkedOrderId) {
      const order = await Promise.resolve()
        .then(() => Order.findById(linkedOrderId))
        .catch(() => null);
      if (order) {
        const wasAlreadyPaid = Boolean(order.isPaid);
        order.isPaid = true;
        order.paymentStatus = PAYMENT_STATUS.SUCCESS;
        order.paidAt = order.paidAt || new Date();
        if (String(order.orderStatus || '').toLowerCase() === ORDER_STATUS.PENDING) {
          order.orderStatus = ORDER_STATUS.CONFIRMED;
        }
        if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
        if (statusChanged || !wasAlreadyPaid) {
          appendOrderStatusHistory(order, {
            status: order.orderStatus || ORDER_STATUS.CONFIRMED,
            note: `Payment confirmed via Razorpay gateway reconciliation (ID: ${rzpPaymentId})`,
          });
        }
        await order.save({ validateModifiedOnly: true });
        if (!wasAlreadyPaid) {
          await accrueVendorEarningsForOrder(order);
        }
      }
    }

    const updatedPayment = await this.getPaymentById(payment._id);
    return {
      paymentId: payment._id,
      localStatus: payment.status,
      gatewayStatus: gatewayPayment.status,
      reconciled: true,
      updated: statusChanged,
      payment: updatedPayment,
    };
  }

  async getVendorPayouts(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};
    const isConnected = mongoose.connection.readyState === 1;

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const upper = String(params.status).trim().toUpperCase();
      if (PAYOUT_STATUS_LIST.includes(upper)) {
        filter.status = isConnected ? new RegExp(`^${escapeRegex(upper)}$`, 'i') : upper;
      }
    }
    if (params.vendorId && String(params.vendorId).toLowerCase() !== 'all') {
      ensureValidObjectId(params.vendorId, 'Vendor ID');
      if (isConnected) {
        filter.$or = [{ vendorId: params.vendorId }, { vendor: params.vendorId }];
      } else {
        filter.vendorId = params.vendorId;
      }
    }
    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      const regex = { $regex: escapeRegex(q), $options: 'i' };
      const clauses = [{ transactionReference: regex }, { notes: regex }];
      if (mongoose.isValidObjectId(q)) {
        clauses.push({ _id: q }, { vendorId: q });
      }
      if (isConnected) {
        const matchingVendors = await Promise.resolve()
          .then(() =>
            Vendor.find({
              $or: [
                { storeName: regex },
                { shopName: regex },
                { businessName: regex },
                { email: regex },
              ],
            })
              .select('_id')
              .lean()
          )
          .catch(() => []);
        if (matchingVendors?.length > 0) {
          const vIds = matchingVendors.map((v) => v._id);
          clauses.push({ vendorId: { $in: vIds } }, { vendor: { $in: vIds } });
        }
      }
      filter.$or = filter.$or ? [...filter.$or, ...clauses] : clauses;
    }

    const [payouts, total] = await Promise.all([
      VendorPayout.find(filter)
        .populate(
          'vendorId',
          'storeName shopName businessName slug shopSlug email phone userId user businessDetails bankDetails'
        )
        .populate('processedBy', 'fullName name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      VendorPayout.countDocuments(filter),
    ]);

    const vendorLookup = await resolveLegacyPayoutRelations(payouts);
    const formatted = (Array.isArray(payouts) ? payouts : []).map((doc) =>
      formatVendorPayout(doc, vendorLookup)
    );

    const summary = {
      total: Number(total || 0),
      pending: 0,
      processing: 0,
      paid: 0,
      rejected: 0,
      cancelled: 0,
      totalPaidAmount: 0,
    };

    if (isConnected) {
      const agg = await Promise.resolve()
        .then(() =>
          VendorPayout.aggregate([
            {
              $group: {
                _id: { $toUpper: { $ifNull: ['$status', 'PENDING'] } },
                count: { $sum: 1 },
                amount: { $sum: { $ifNull: ['$amount', 0] } },
              },
            },
          ])
        )
        .catch(() => []);
      if (Array.isArray(agg) && agg.length > 0) {
        let totalAll = 0;
        for (const row of agg) {
          const cnt = Number(row.count || 0);
          const amt = Number(row.amount || 0);
          totalAll += cnt;
          if (row._id === 'PENDING') summary.pending += cnt;
          else if (row._id === 'PROCESSING') summary.processing += cnt;
          else if (row._id === 'PAID') {
            summary.paid += cnt;
            summary.totalPaidAmount += amt;
          } else if (row._id === 'REJECTED') summary.rejected += cnt;
          else if (row._id === 'CANCELLED') summary.cancelled += cnt;
        }
        summary.total = totalAll;
      }
    } else {
      for (const item of formatted) {
        if (item.status === 'PENDING') summary.pending += 1;
        else if (item.status === 'PROCESSING') summary.processing += 1;
        else if (item.status === 'PAID') {
          summary.paid += 1;
          summary.totalPaidAmount += Number(item.amount || 0);
        } else if (item.status === 'REJECTED') summary.rejected += 1;
        else if (item.status === 'CANCELLED') summary.cancelled += 1;
      }
    }

    return {
      payouts: formatted,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorPayoutById(payoutId) {
    ensureValidObjectId(payoutId, 'Payout ID');
    const payout = await VendorPayout.findById(payoutId)
      .populate(
        'vendorId',
        'storeName shopName businessName slug shopSlug email phone userId user businessDetails bankDetails'
      )
      .populate('processedBy', 'fullName name email');
    if (!payout) throw ApiError.notFound('Payout record not found');
    const vendorLookup = await resolveLegacyPayoutRelations([payout]);
    return formatVendorPayout(payout, vendorLookup);
  }

  async updateVendorPayoutStatus(payoutId, statusOrPayload, adminId) {
    ensureValidObjectId(payoutId, 'Payout ID');
    const payout = await VendorPayout.findById(payoutId);
    if (!payout) throw ApiError.notFound('Payout record not found');

    const payload =
      typeof statusOrPayload === 'object' && statusOrPayload !== null
        ? statusOrPayload
        : { status: statusOrPayload };

    const formattedStatus = String(payload.status || '').trim().toUpperCase();
    if (!PAYOUT_STATUS_LIST.includes(formattedStatus)) {
      throw ApiError.badRequest(
        `Invalid payout status '${payload.status}'. Must be one of: ${PAYOUT_STATUS_LIST.join(', ')}`
      );
    }

    const previousStatus = String(payout.status || 'PENDING').trim().toUpperCase();
    if (
      TERMINAL_PAYOUT_STATUSES.includes(previousStatus) &&
      formattedStatus !== previousStatus
    ) {
      throw ApiError.badRequest(
        `Cannot change payout status after it has been marked ${previousStatus}`
      );
    }

    const targetVendorId = payout.vendorId || payout.get?.('vendor');
    if (!payout.vendorId && targetVendorId) {
      payout.vendorId = targetVendorId;
    }

    payout.status = formattedStatus;
    if (payload.transactionReference !== undefined) {
      payout.transactionReference = String(payload.transactionReference || '').trim();
    }
    if (payload.notes !== undefined) {
      payout.notes = String(payload.notes || '').trim();
    }
    payout.processedBy = adminId;
    payout.processedAt = new Date();
    await payout.save({ validateModifiedOnly: true });

    if (previousStatus !== formattedStatus && targetVendorId) {
      const earnings = await VendorEarnings.findOne({ vendorId: targetVendorId });
      if (earnings) {
        const payoutAmt = Number(payout.amount || 0);
        if (formattedStatus === 'PAID') {
          earnings.pendingBalance = Math.max(0, Number(earnings.pendingBalance || 0) - payoutAmt);
          earnings.totalWithdrawn = Number(earnings.totalWithdrawn || 0) + payoutAmt;
          await earnings.save();
        } else if (['REJECTED', 'CANCELLED'].includes(formattedStatus)) {
          earnings.pendingBalance = Math.max(0, Number(earnings.pendingBalance || 0) - payoutAmt);
          earnings.availableBalance = Number(earnings.availableBalance || 0) + payoutAmt;
          await earnings.save();
        }
      }

      const vendorDoc = await Promise.resolve()
        .then(() => Vendor.findById(targetVendorId).select('userId user storeName shopName').lean())
        .catch(() => null);
      const vendorUserId = vendorDoc?.userId || vendorDoc?.user;
      if (vendorUserId) {
        notificationService
          .createNotification({
            userId: vendorUserId,
            title: `Payout ${formattedStatus}`,
            message: `Your payout request of ₹${payout.amount} has been marked ${formattedStatus}.${payout.transactionReference ? ` Ref: ${payout.transactionReference}` : ''}`,
            type: 'payment',
            link: '/vendor/payouts',
            data: { payoutId: payout._id, status: formattedStatus },
          })
          .catch(() => {});
      }
    }

    return this.getVendorPayoutById(payout._id);
  }
}

export const adminPaymentService = new AdminPaymentService();
export default adminPaymentService;
