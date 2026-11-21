import mongoose from 'mongoose';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { VendorPayout } from '../../models/VendorPayout.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { Product } from '../../models/Product.model.js';
import { Order } from '../../models/Order.model.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { ApiError } from '../../utils/apiError.js';

const NON_REVENUE_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.RETURNED,
  'cancelled',
  'CANCELLED',
  'Cancelled',
  'canceled',
  'CANCELED',
  'refunded',
  'REFUNDED',
  'returned',
  'RETURNED',
];

const SUCCESS_PAYMENT_VARIANTS = [
  PAYMENT_STATUS.SUCCESS,
  'success',
  'SUCCESS',
  'Success',
  'paid',
  'PAID',
  'Paid',
  'captured',
  'CAPTURED',
  'completed',
  'COMPLETED',
  'succeeded',
  'SETTLED',
  'settled',
];

const DELIVERED_ORDER_VARIANTS = [
  ORDER_STATUS.DELIVERED,
  'delivered',
  'DELIVERED',
  'Delivered',
  'completed',
  'COMPLETED',
];

const ITEM_TOTAL_EXPR = {
  $ifNull: [
    '$items.total',
    {
      $multiply: [
        { $ifNull: ['$items.price', 0] },
        { $ifNull: ['$items.quantity', 1] },
      ],
    },
  ],
};

const isModelQueryable = (model, method = 'find') =>
  mongoose.connection?.readyState === 1 || Boolean(model?.[method]?.mock);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export class VendorEarningsService {
  async getVendorProfile(userId) {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor;
  }

  async getVendorId(userId) {
    const vendor = await this.getVendorProfile(userId);
    return vendor._id;
  }

  async aggregateLiveOrderEarnings(vendor, userId) {
    if (!isModelQueryable(Order, 'aggregate')) {
      return { earnedRevenue: 0, pendingOrderRevenue: 0, earnedOrdersCount: 0 };
    }

    const vendorRefs = Array.from(
      new Set([vendor._id, vendor.userId, vendor.user, userId].filter(Boolean).map(String))
    );

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

    const orderMatch = productIds.length
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

    const itemMatch = productIds.length
      ? {
          $or: [
            { _resolvedVendorId: { $in: vendorRefs } },
            { _resolvedVendorId: null, _resolvedProductId: { $in: productIds } },
          ],
        }
      : { _resolvedVendorId: { $in: vendorRefs } };

    const isNonCancelledExpr = {
      $and: [
        { $not: [{ $in: ['$orderStatus', NON_REVENUE_STATUSES] }] },
        { $not: [{ $in: ['$status', NON_REVENUE_STATUSES] }] },
      ],
    };

    const isEarnedExpr = {
      $and: [
        isNonCancelledExpr,
        {
          $or: [
            { $eq: ['$isPaid', true] },
            { $eq: ['$paid', true] },
            { $in: ['$paymentStatus', SUCCESS_PAYMENT_VARIANTS] },
            { $in: ['$orderStatus', DELIVERED_ORDER_VARIANTS] },
            { $in: ['$status', DELIVERED_ORDER_VARIANTS] },
          ],
        },
      ],
    };

    const rows = await Order.aggregate([
      { $match: orderMatch },
      { $unwind: '$items' },
      {
        $addFields: {
          _resolvedVendorId: { $ifNull: ['$items.vendorId', '$items.vendor'] },
          _resolvedProductId: { $ifNull: ['$items.product', '$items.productId'] },
        },
      },
      { $match: itemMatch },
      {
        $group: {
          _id: '$_id',
          grossAmount: { $sum: { $cond: [isNonCancelledExpr, ITEM_TOTAL_EXPR, 0] } },
          earnedAmount: { $sum: { $cond: [isEarnedExpr, ITEM_TOTAL_EXPR, 0] } },
          isEarned: { $first: { $cond: [isEarnedExpr, 1, 0] } },
        },
      },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$grossAmount' },
          earnedRevenue: { $sum: '$earnedAmount' },
          earnedOrdersCount: { $sum: '$isEarned' },
        },
      },
    ]);

    const row = rows?.[0] || {};
    const grossRevenue = round2(row.grossRevenue || 0);
    const earnedRevenue = round2(row.earnedRevenue || 0);
    return {
      earnedRevenue,
      pendingOrderRevenue: Math.max(0, round2(grossRevenue - earnedRevenue)),
      earnedOrdersCount: Number(row.earnedOrdersCount || 0),
    };
  }

  async aggregatePayoutSummary(vendorId) {
    if (!isModelQueryable(VendorPayout, 'aggregate')) {
      return { pending: 0, pendingCount: 0, paid: 0, totalRequests: 0 };
    }

    const rows = await VendorPayout.aggregate([
      { $match: { vendorId } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    let pending = 0;
    let pendingCount = 0;
    let paid = 0;
    let totalRequests = 0;

    for (const r of rows || []) {
      const status = String(r?._id || '').toUpperCase();
      const amt = Number(r?.total || 0);
      const cnt = Number(r?.count || 0);
      totalRequests += cnt;
      if (status === 'PENDING' || status === 'PROCESSING') {
        pending += amt;
        pendingCount += cnt;
      } else if (status === 'PAID') {
        paid += amt;
      }
    }

    return {
      pending: round2(pending),
      pendingCount,
      paid: round2(paid),
      totalRequests,
    };
  }

  async ensureSyncedEarnings(userId) {
    const vendor = await this.getVendorProfile(userId);
    const vendorId = vendor._id;

    let earnings = await VendorEarnings.findOne({ vendorId });
    if (!earnings) {
      earnings = await VendorEarnings.create({ vendorId });
    }

    const [liveOrders, payoutSummary] = await Promise.all([
      this.aggregateLiveOrderEarnings(vendor, userId),
      this.aggregatePayoutSummary(vendorId),
    ]);

    const commissionRate = Number(vendor.commissionRate ?? 10);
    // If paid/delivered orders existed in DB before VendorEarnings ledger accrued, backfill once
    if (
      Number(earnings.totalRevenue || 0) === 0 &&
      liveOrders.earnedRevenue > 0
    ) {
      const totalRev = liveOrders.earnedRevenue;
      const totalComm = round2((totalRev * commissionRate) / 100);
      const net = round2(totalRev - totalComm);
      const pendingBal = Math.max(Number(earnings.pendingBalance || 0), payoutSummary.pending);
      const withdrawn = Math.max(Number(earnings.totalWithdrawn || 0), payoutSummary.paid);
      const available = Math.max(0, round2(net - pendingBal - withdrawn));

      earnings.totalRevenue = totalRev;
      earnings.totalCommission = totalComm;
      earnings.netEarnings = net;
      earnings.pendingBalance = pendingBal;
      earnings.totalWithdrawn = withdrawn;
      earnings.availableBalance = available;
      if (typeof earnings.save === 'function') {
        await earnings.save();
      }
    }

    return { vendor, earnings, liveOrders, payoutSummary };
  }

  async getEarnings(userId) {
    const { vendor, earnings, liveOrders, payoutSummary } =
      await this.ensureSyncedEarnings(userId);

    const doc = earnings.toObject ? earnings.toObject() : { ...earnings };
    const commissionRate = Number(vendor.commissionRate ?? 10);
    const bank = vendor.businessDetails?.bankAccount || vendor.bankDetails || {};
    const acctNum = String(bank.accountNumber || '').trim();

    return {
      ...doc,
      totalRevenue: round2(Math.max(Number(doc.totalRevenue || 0), liveOrders.earnedRevenue)),
      totalCommission: round2(doc.totalCommission || 0),
      netEarnings: round2(doc.netEarnings || 0),
      availableBalance: round2(doc.availableBalance || 0),
      pendingBalance: round2(Math.max(Number(doc.pendingBalance || 0), payoutSummary.pending)),
      totalWithdrawn: round2(Math.max(Number(doc.totalWithdrawn || 0), payoutSummary.paid)),
      commissionRate,
      pendingOrderRevenue: liveOrders.pendingOrderRevenue,
      earnedOrdersCount: liveOrders.earnedOrdersCount,
      payoutSummary,
      bankDetails: {
        accountHolderName: bank.accountHolderName || '',
        bankName: bank.bankName || '',
        ifscCode: bank.ifscCode || '',
        accountNumberMasked: acctNum ? `••••${acctNum.slice(-4)}` : '',
        configured: Boolean(acctNum),
      },
    };
  }

  async getEarningsSummary(userId) {
    return this.getEarnings(userId);
  }
}

export const vendorEarningsService = new VendorEarningsService();
export default vendorEarningsService;
