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

const formatRefundDoc = (doc) => {
  if (!doc) return null;
  const raw = toPlain(doc);
  const orderObj =
    raw.orderId && typeof raw.orderId === 'object' ? toPlain(raw.orderId) : null;
  const userObj =
    raw.userId && typeof raw.userId === 'object' ? toPlain(raw.userId) : null;
  const paymentObj =
    raw.paymentId && typeof raw.paymentId === 'object' ? toPlain(raw.paymentId) : null;
  const processorObj =
    raw.processedBy && typeof raw.processedBy === 'object' ? toPlain(raw.processedBy) : null;

  const customerName =
    userObj?.fullName ||
    userObj?.name ||
    userObj?.username ||
    userObj?.email ||
    'Customer';

  return {
    ...raw,
    refundCode: raw._id ? `RF-${String(raw._id).slice(-5).toUpperCase()}` : 'RF-NEW',
    orderRefId: orderObj?._id || raw.orderId || null,
    orderNumber:
      orderObj?.orderNumber ||
      (raw.orderId ? `#SS-${String(orderObj?._id || raw.orderId).slice(-5).toUpperCase()}` : '—'),
    orderTotal: orderObj?.totalAmount ?? raw.amount ?? 0,
    orderStatus: orderObj?.orderStatus || '',
    paymentStatus: orderObj?.paymentStatus || paymentObj?.status || '',
    paymentMethod: orderObj?.paymentMethod || paymentObj?.paymentMethod || '',
    isPaid: Boolean(orderObj?.isPaid),
    customerName,
    customerEmail: userObj?.email || '',
    customerPhone: userObj?.phone || '',
    razorpayPaymentId: paymentObj?.razorpayPaymentId || '',
    processedByName: processorObj?.fullName || processorObj?.name || '',
  };
};

const formatReturnDoc = (doc) => {
  if (!doc) return null;
  const raw = toPlain(doc);
  const orderObj =
    raw.orderId && typeof raw.orderId === 'object' ? toPlain(raw.orderId) : null;
  const userObj =
    raw.userId && typeof raw.userId === 'object' ? toPlain(raw.userId) : null;
  const actionerObj =
    raw.actionedBy && typeof raw.actionedBy === 'object' ? toPlain(raw.actionedBy) : null;

  const customerName =
    userObj?.fullName ||
    userObj?.name ||
    userObj?.username ||
    userObj?.email ||
    'Customer';

  return {
    ...raw,
    returnCode: raw._id ? `RT-${String(raw._id).slice(-5).toUpperCase()}` : 'RT-NEW',
    orderRefId: orderObj?._id || raw.orderId || null,
    orderNumber:
      orderObj?.orderNumber ||
      (raw.orderId ? `#SS-${String(orderObj?._id || raw.orderId).slice(-5).toUpperCase()}` : '—'),
    amount: orderObj?.totalAmount ?? 0,
    orderStatus: orderObj?.orderStatus || '',
    paymentStatus: orderObj?.paymentStatus || '',
    paymentMethod: orderObj?.paymentMethod || '',
    isPaid: Boolean(orderObj?.isPaid),
    customerName,
    customerEmail: userObj?.email || '',
    customerPhone: userObj?.phone || '',
    actionedByName: actionerObj?.fullName || actionerObj?.name || '',
  };
};

const POPULATE_REFUND = (query) =>
  query
    .populate('userId', 'fullName name username email phone avatar')
    .populate('orderId', 'orderNumber totalAmount orderStatus paymentStatus paymentMethod isPaid createdAt')
    .populate('paymentId', 'paymentMethod status razorpayPaymentId amount')
    .populate('processedBy', 'fullName name email');

const POPULATE_RETURN = (query) =>
  query
    .populate('userId', 'fullName name username email phone avatar')
    .populate('orderId', 'orderNumber totalAmount orderStatus paymentStatus paymentMethod isPaid createdAt')
    .populate('items.productId', 'name slug price images')
    .populate('actionedBy', 'fullName name email');

export class AdminRefundService {
  async getRefunds(params = {}) {
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

      if (mongoose.connection.readyState === 1) {
        const cleanOrderTerm = q.replace(/^#/, '');
        const orderRegex = { $regex: escapeRegex(cleanOrderTerm), $options: 'i' };
        const [matchingOrders, matchingUsers] = await Promise.all([
          Promise.resolve()
            .then(() => Order.find({ orderNumber: orderRegex }).select('_id').lean())
            .catch(() => []),
          Promise.resolve()
            .then(() =>
              User.find({
                $or: [{ fullName: regex }, { name: regex }, { email: regex }],
              })
                .select('_id')
                .lean()
            )
            .catch(() => []),
        ]);

        if (matchingOrders?.length > 0) {
          orClauses.push({ orderId: { $in: matchingOrders.map((o) => o._id) } });
        }
        if (matchingUsers?.length > 0) {
          orClauses.push({ userId: { $in: matchingUsers.map((u) => u._id) } });
        }
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

    let summary = {
      total: Number(total || 0),
      pending: 0,
      approved: 0,
      processed: 0,
      rejected: 0,
      totalRefundedAmount: 0,
    };

    if (mongoose.connection.readyState === 1) {
      const agg = await Promise.resolve()
        .then(() =>
          Refund.aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                amount: { $sum: '$amount' },
              },
            },
          ])
        )
        .catch(() => []);

      if (Array.isArray(agg) && agg.length > 0) {
        let totalAll = 0;
        let pending = 0;
        let approved = 0;
        let processed = 0;
        let rejected = 0;
        let totalRefundedAmount = 0;

        for (const row of agg) {
          const cnt = Number(row.count || 0);
          const amt = Number(row.amount || 0);
          totalAll += cnt;
          if (row._id === REFUND_STATUS.PENDING || row._id === REFUND_STATUS.REQUESTED) {
            pending += cnt;
          } else if (row._id === REFUND_STATUS.APPROVED) {
            approved += cnt;
          } else if (row._id === REFUND_STATUS.PROCESSED) {
            processed += cnt;
            totalRefundedAmount += amt;
          } else if (row._id === REFUND_STATUS.REJECTED) {
            rejected += cnt;
          }
        }

        summary = {
          total: totalAll,
          pending,
          approved,
          processed,
          rejected,
          totalRefundedAmount: Math.round(totalRefundedAmount * 100) / 100,
        };
      }
    } else {
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
    if (!refund) throw ApiError.notFound('Refund request not found');
    return formatRefundDoc(refund);
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
    if (!refund) throw ApiError.notFound('Refund request not found');

    const currentStatus = String(refund.status || '').toLowerCase();
    if (currentStatus === REFUND_STATUS.PROCESSED) {
      throw ApiError.badRequest('This refund has already been processed');
    }
    if (currentStatus === REFUND_STATUS.REJECTED) {
      throw ApiError.badRequest('Rejected refund requests cannot be approved');
    }

    const targetOrderId = refund.orderId?._id || refund.orderId;
    const result = await adminOrderService.processRefund(
      targetOrderId,
      {
        existingRefundId: refund._id,
        amount: body?.amount ?? refund.amount,
        reason: body?.reason || refund.reason || 'Approved by admin',
        adminNotes: body?.adminNotes || '',
      },
      body?.reason || refund.reason || 'Approved by admin',
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

    refund.status = REFUND_STATUS.REJECTED;
    refund.rejectionReason = reason;
    refund.adminNotes = String(body?.adminNotes || reason).trim();
    refund.processedBy = adminId;
    refund.processedAt = new Date();
    await refund.save();

    const order = await Promise.resolve()
      .then(() => Order.findById(refund.orderId))
      .catch(() => null);
    if (order) {
      appendOrderStatusHistory(order, {
        status: order.orderStatus,
        note: `Refund request rejected by admin: ${reason}`,
        updatedBy: adminId,
      });
      await order.save().catch(() => {});
    }

    notificationService
      .createNotification({
        userId: refund.userId,
        title: 'Refund Request Rejected',
        message: `Your refund request of ₹${refund.amount} was declined. Reason: ${reason}`,
        type: 'payment',
        link: order ? `/orders/${order._id}` : '/orders',
        data: { refundId: refund._id, orderId: refund.orderId },
      })
      .catch(() => {});

    return this.getRefundById(refund._id).catch(() => formatRefundDoc(refund));
  }

  async getReturnRequests(params = {}) {
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

      if (mongoose.connection.readyState === 1) {
        const cleanOrderTerm = q.replace(/^#/, '');
        const orderRegex = { $regex: escapeRegex(cleanOrderTerm), $options: 'i' };
        const [matchingOrders, matchingUsers] = await Promise.all([
          Promise.resolve()
            .then(() => Order.find({ orderNumber: orderRegex }).select('_id').lean())
            .catch(() => []),
          Promise.resolve()
            .then(() =>
              User.find({
                $or: [{ fullName: regex }, { name: regex }, { email: regex }],
              })
                .select('_id')
                .lean()
            )
            .catch(() => []),
        ]);

        if (matchingOrders?.length > 0) {
          orClauses.push({ orderId: { $in: matchingOrders.map((o) => o._id) } });
        }
        if (matchingUsers?.length > 0) {
          orClauses.push({ userId: { $in: matchingUsers.map((u) => u._id) } });
        }
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

    let summary = { total: Number(total || 0), pending: 0, approved: 0, completed: 0, rejected: 0 };
    if (mongoose.connection.readyState === 1) {
      const agg = await Promise.resolve()
        .then(() => ReturnRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]))
        .catch(() => []);
      if (Array.isArray(agg) && agg.length > 0) {
        let totalAll = 0;
        for (const row of agg) {
          const cnt = Number(row.count || 0);
          totalAll += cnt;
          if (row._id === 'pending') summary.pending += cnt;
          else if (row._id === 'approved') summary.approved += cnt;
          else if (row._id === 'completed') summary.completed += cnt;
          else if (row._id === 'rejected') summary.rejected += cnt;
        }
        summary.total = totalAll;
      }
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
    if (!returnReq) throw ApiError.notFound('Return request not found');

    if (returnReq.status === 'rejected') {
      throw ApiError.badRequest('Rejected return request cannot be approved');
    }

    const orderId = returnReq.orderId?._id || returnReq.orderId;
    if (returnReq.status === 'pending') {
      await adminOrderService.approveReturn(orderId, adminId);
      returnReq.status = 'approved';
      returnReq.actionedBy = adminId;
      returnReq.actionedAt = new Date();
      if (body?.adminNotes) returnReq.adminNotes = String(body.adminNotes).trim();
      await returnReq.save();
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
      await returnReq.save();
    }

    const populated = await POPULATE_RETURN(ReturnRequest.findById(returnReq._id));
    return {
      returnRequest: formatReturnDoc(populated || returnReq),
      ...(refundResult ? { refund: formatRefundDoc(refundResult.refund) } : {}),
    };
  }

  async rejectReturnRequest(returnId, body = {}, adminId) {
    ensureValidObjectId(returnId, 'Return Request ID');
    const returnReq = await ReturnRequest.findById(returnId);
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
    const orderId = returnReq.orderId?._id || returnReq.orderId;

    await adminOrderService.rejectReturn(orderId, reason, adminId);
    returnReq.status = 'rejected';
    returnReq.adminNotes = String(body?.adminNotes || reason).trim();
    returnReq.actionedBy = adminId;
    returnReq.actionedAt = new Date();
    await returnReq.save();

    const populated = await POPULATE_RETURN(ReturnRequest.findById(returnReq._id));
    return formatReturnDoc(populated || returnReq);
  }
}

export const adminRefundService = new AdminRefundService();
export default adminRefundService;
