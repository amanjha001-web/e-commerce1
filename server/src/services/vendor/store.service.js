import mongoose from 'mongoose';
import { Vendor } from '../../models/Vendor.model.js';
import { Product } from '../../models/Product.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { Order } from '../../models/Order.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { VendorPayout } from '../../models/VendorPayout.model.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';
import { ApiError } from '../../utils/apiError.js';
import { uploadToCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;

const NON_REVENUE_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.RETURNED,
  'cancelled',
  'CANCELLED',
  'Cancelled',
  'canceled',
  'CANCELED',
  'Canceled',
  'refunded',
  'REFUNDED',
  'Refunded',
  'returned',
  'RETURNED',
  'Returned',
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
  'Captured',
  'completed',
  'COMPLETED',
  'Completed',
  'succeeded',
  'SUCCEEDED',
  'settled',
  'SETTLED',
];

const DELIVERED_ORDER_VARIANTS = [
  ORDER_STATUS.DELIVERED,
  'delivered',
  'DELIVERED',
  'Delivered',
  'completed',
  'COMPLETED',
  'Completed',
];

const PENDING_ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  'pending',
  'Pending',
  'confirmed',
  'Confirmed',
  'processing',
  'Processing',
];

const PUBLISHED_PRODUCT_STATUSES = [
  PRODUCT_STATUS.PUBLISHED,
  'published',
  'Published',
  'active',
  'ACTIVE',
];

const PENDING_PRODUCT_STATUSES = [
  PRODUCT_STATUS.PENDING_APPROVAL,
  'pending',
  'Pending',
];

const toSafeDateExpr = (expr) => ({
  $convert: { input: expr, to: 'date', onError: null, onNull: null },
});

const ORDER_DATE_EXPR = toSafeDateExpr({
  $ifNull: [
    '$createdAt',
    { $ifNull: ['$orderDate', { $ifNull: ['$paidAt', { $ifNull: ['$updatedAt', '$_id'] }] }] },
  ],
});

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

const isOrderEarnedExpr = () => ({
  $and: [
    { $not: [{ $in: ['$orderStatus', NON_REVENUE_STATUSES] }] },
    { $not: [{ $in: ['$status', NON_REVENUE_STATUSES] }] },
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
});

const isOrderNonCancelledExpr = () => ({
  $and: [
    { $not: [{ $in: ['$orderStatus', NON_REVENUE_STATUSES] }] },
    { $not: [{ $in: ['$status', NON_REVENUE_STATUSES] }] },
  ],
});

const uniqueRefs = (refs) => {
  const seen = new Set();
  const out = [];
  for (const ref of refs) {
    if (!ref) continue;
    const key = String(ref);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(ref);
    }
  }
  return out;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toMonthKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const getLocalTzOffsetString = () => {
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};

const growthPercent = (current, previous) => {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
};

const normalizeSalesPeriod = (period) => {
  const clean = String(period || '').trim().toLowerCase();
  if (['7d', '30d', '90d', '8w', 'all'].includes(clean)) return clean;
  return '8w';
};

const isModelQueryable = (model, method = 'find') =>
  mongoose.connection?.readyState === 1 || Boolean(model?.[method]?.mock);

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

export class VendorStoreService {
  async findVendorForUser(userId, notFoundMessage = 'Vendor not found') {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!vendor) throw ApiError.notFound(notFoundMessage);
    return vendor;
  }

  async buildVendorScope(vendor, userId) {
    const vendorRefs = uniqueRefs([vendor._id, vendor.userId, vendor.user, userId]);
    const vendorRefSet = new Set(vendorRefs.map(String));
    const productFilter = {
      $or: [{ vendorId: vendor._id }, { vendor: { $in: vendorRefs } }],
    };

    let productIds = [];
    if (isModelQueryable(Product, 'find')) {
      const idQuery = Product.find(productFilter);
      if (idQuery && typeof idQuery.distinct === 'function') {
        productIds = await idQuery.distinct('_id');
      } else if (idQuery && typeof idQuery.select === 'function') {
        const docs = await idQuery.select('_id').lean();
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

    const itemMatchStage = productIds.length
      ? {
          $or: [
            { _resolvedVendorId: { $in: vendorRefs } },
            { _resolvedVendorId: null, _resolvedProductId: { $in: productIds } },
          ],
        }
      : { _resolvedVendorId: { $in: vendorRefs } };

    return {
      vendorRefs,
      vendorRefSet,
      productIds,
      productIdSet,
      productFilter,
      orderVendorMatch,
      itemMatchStage,
    };
  }

  async getMyStore(userId) {
    return this.findVendorForUser(userId, 'Store not found for this vendor');
  }

  async updateStore(userId, storeData) {
    const vendor = await Vendor.findOneAndUpdate(
      { $or: [{ userId }, { user: userId }] },
      storeData,
      { new: true, runValidators: true }
    );
    if (!vendor) throw ApiError.notFound('Store not found');
    return vendor;
  }

  async updateStoreLogo(userId, file) {
    if (!file) throw ApiError.badRequest('Logo image required');
    const vendor = await this.findVendorForUser(userId, 'Store not found');

    const uploaded = await uploadToCloudinary(file.buffer, 'vendor-logos');
    vendor.logo = { url: uploaded.url, publicId: uploaded.publicId };
    await vendor.save();
    return vendor;
  }

  async updateStoreBanner(userId, file) {
    if (!file) throw ApiError.badRequest('Banner image required');
    const vendor = await this.findVendorForUser(userId, 'Store not found');

    const uploaded = await uploadToCloudinary(file.buffer, 'vendor-banners');
    vendor.banner = { url: uploaded.url, publicId: uploaded.publicId };
    await vendor.save();
    return vendor;
  }

  async aggregateOrderSummary(scope) {
    if (!isModelQueryable(Order, 'aggregate')) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        ordersThisWeek: 0,
        ordersPrevWeek: 0,
        ordersThisMonth: 0,
        ordersLastMonth: 0,
        grossSales: 0,
        earnedSales: 0,
        salesThisMonth: 0,
        salesLastMonth: 0,
        salesThisWeek: 0,
        salesPrevWeek: 0,
      };
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisWeekStart = startOfDay(new Date(now.getTime() - 6 * DAY_MS));
    const prevWeekStart = new Date(thisWeekStart.getTime() - 7 * DAY_MS);

    const rows = await Order.aggregate([
      { $match: scope.orderVendorMatch },
      { $unwind: '$items' },
      {
        $addFields: {
          _resolvedVendorId: { $ifNull: ['$items.vendorId', '$items.vendor'] },
          _resolvedProductId: { $ifNull: ['$items.product', '$items.productId'] },
          _orderDate: ORDER_DATE_EXPR,
        },
      },
      { $match: scope.itemMatchStage },
      {
        $group: {
          _id: '$_id',
          orderDate: { $first: '$_orderDate' },
          orderStatus: { $first: '$orderStatus' },
          status: { $first: '$status' },
          isNonCancelled: { $first: { $cond: [isOrderNonCancelledExpr(), 1, 0] } },
          isEarned: { $first: { $cond: [isOrderEarnedExpr(), 1, 0] } },
          vendorGrossTotal: {
            $sum: { $cond: [isOrderNonCancelledExpr(), ITEM_TOTAL_EXPR, 0] },
          },
          vendorEarnedTotal: {
            $sum: { $cond: [isOrderEarnedExpr(), ITEM_TOTAL_EXPR, 0] },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $in: ['$orderStatus', PENDING_ORDER_STATUSES] },
                    { $in: ['$status', PENDING_ORDER_STATUSES] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ordersThisWeek: {
            $sum: { $cond: [{ $gte: ['$orderDate', thisWeekStart] }, 1, 0] },
          },
          ordersPrevWeek: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$orderDate', prevWeekStart] },
                    { $lt: ['$orderDate', thisWeekStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ordersThisMonth: {
            $sum: { $cond: [{ $gte: ['$orderDate', thisMonthStart] }, 1, 0] },
          },
          ordersLastMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$orderDate', lastMonthStart] },
                    { $lt: ['$orderDate', thisMonthStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          grossSales: { $sum: '$vendorGrossTotal' },
          earnedSales: { $sum: '$vendorEarnedTotal' },
          salesThisMonth: {
            $sum: {
              $cond: [{ $gte: ['$orderDate', thisMonthStart] }, '$vendorEarnedTotal', 0],
            },
          },
          salesLastMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$orderDate', lastMonthStart] },
                    { $lt: ['$orderDate', thisMonthStart] },
                  ],
                },
                '$vendorEarnedTotal',
                0,
              ],
            },
          },
          salesThisWeek: {
            $sum: {
              $cond: [{ $gte: ['$orderDate', thisWeekStart] }, '$vendorEarnedTotal', 0],
            },
          },
          salesPrevWeek: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$orderDate', prevWeekStart] },
                    { $lt: ['$orderDate', thisWeekStart] },
                  ],
                },
                '$vendorEarnedTotal',
                0,
              ],
            },
          },
        },
      },
    ]);

    return (
      rows?.[0] || {
        totalOrders: 0,
        pendingOrders: 0,
        ordersThisWeek: 0,
        ordersPrevWeek: 0,
        ordersThisMonth: 0,
        ordersLastMonth: 0,
        grossSales: 0,
        earnedSales: 0,
        salesThisMonth: 0,
        salesLastMonth: 0,
        salesThisWeek: 0,
        salesPrevWeek: 0,
      }
    );
  }

  async getLowStockSummary(vendorId, scope) {
    const [lowProducts, lowInventory] = await Promise.all([
      isModelQueryable(Product, 'find')
        ? Product.find({
            ...scope.productFilter,
            stock: { $lte: LOW_STOCK_THRESHOLD },
            isActive: { $ne: false },
          })
            .select('name slug price stock images status')
            .sort({ stock: 1 })
            .limit(25)
            .lean()
        : Promise.resolve([]),
      isModelQueryable(Inventory, 'find')
        ? Inventory.find({
            vendorId,
            quantity: { $lte: LOW_STOCK_THRESHOLD },
          })
            .populate('productId', 'name slug price stock images status')
            .sort({ quantity: 1 })
            .limit(25)
            .lean()
        : Promise.resolve([]),
    ]);

    const byProductId = new Map();
    for (const p of lowProducts || []) {
      if (!p?._id) continue;
      byProductId.set(String(p._id), {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price || 0,
        stock: Number(p.stock ?? 0),
        status: p.status,
      });
    }
    for (const inv of lowInventory || []) {
      const prod = inv?.productId;
      const pid = prod?._id ? String(prod._id) : inv?.productId ? String(inv.productId) : null;
      if (!pid || !prod?.name) continue;
      const qty = Number(inv.quantity ?? prod.stock ?? 0);
      const existing = byProductId.get(pid);
      if (!existing || qty < existing.stock) {
        byProductId.set(pid, {
          _id: prod._id,
          name: prod.name,
          slug: prod.slug,
          price: prod.price || 0,
          stock: qty,
          status: prod.status,
        });
      }
    }

    const sorted = Array.from(byProductId.values()).sort((a, b) => a.stock - b.stock);
    return {
      lowStockCount: sorted.length,
      outOfStockCount: sorted.filter((item) => item.stock <= 0).length,
      lowStockProducts: sorted.slice(0, 5),
    };
  }

  async getPayoutMetrics(vendorId, earningsDoc) {
    const [payoutAgg, latestPayout] = await Promise.all([
      isModelQueryable(VendorPayout, 'aggregate')
        ? VendorPayout.aggregate([
            { $match: { vendorId } },
            { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      isModelQueryable(VendorPayout, 'findOne')
        ? VendorPayout.findOne({ vendorId }).sort({ createdAt: -1 }).lean()
        : Promise.resolve(null),
    ]);

    let pendingFromPayouts = 0;
    let pendingPayoutCount = 0;
    let paidFromPayouts = 0;

    for (const row of payoutAgg || []) {
      const status = String(row?._id || '').toUpperCase();
      if (status === 'PENDING' || status === 'PROCESSING') {
        pendingFromPayouts += Number(row.total || 0);
        pendingPayoutCount += Number(row.count || 0);
      } else if (status === 'PAID') {
        paidFromPayouts += Number(row.total || 0);
      }
    }

    const availableBalance = Number(earningsDoc?.availableBalance || 0);
    const pendingBalance = Number(earningsDoc?.pendingBalance || 0);
    const pendingPayouts = Math.max(pendingBalance, pendingFromPayouts);
    const totalWithdrawn = Math.max(Number(earningsDoc?.totalWithdrawn || 0), paidFromPayouts);

    return {
      totalRevenue: Number(earningsDoc?.totalRevenue || 0),
      totalCommission: Number(earningsDoc?.totalCommission || 0),
      netEarnings: Number(earningsDoc?.netEarnings || 0),
      availableBalance,
      pendingBalance,
      pendingPayouts,
      pendingPayoutCount,
      totalWithdrawn,
      latestPayout: latestPayout || null,
    };
  }

  async buildSalesReportForVendor(scope, period = '8w') {
    const safePeriod = normalizeSalesPeriod(period);
    const tzOffset = getLocalTzOffsetString();

    if (safePeriod === 'all') {
      const monthExpr = {
        $dateToString: { format: '%Y-%m', date: '$_orderDate', timezone: tzOffset },
      };

      const rows = isModelQueryable(Order, 'aggregate')
        ? await Order.aggregate([
            { $match: scope.orderVendorMatch },
            { $unwind: '$items' },
            {
              $addFields: {
                _resolvedVendorId: { $ifNull: ['$items.vendorId', '$items.vendor'] },
                _resolvedProductId: { $ifNull: ['$items.product', '$items.productId'] },
                _orderDate: ORDER_DATE_EXPR,
              },
            },
            { $match: scope.itemMatchStage },
            {
              $group: {
                _id: { month: monthExpr, orderId: '$_id' },
                grossSales: {
                  $sum: { $cond: [isOrderNonCancelledExpr(), ITEM_TOTAL_EXPR, 0] },
                },
                revenue: {
                  $sum: { $cond: [isOrderEarnedExpr(), ITEM_TOTAL_EXPR, 0] },
                },
              },
            },
            {
              $group: {
                _id: '$_id.month',
                grossSales: { $sum: '$grossSales' },
                revenue: { $sum: '$revenue' },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
        : [];

      const byMonth = new Map(
        (rows || []).filter((r) => r?._id).map((r) => [r._id, r])
      );
      const keys = Array.from(byMonth.keys()).sort();

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const minDefaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      let rangeMonthStart = minDefaultStart;
      if (keys.length > 0) {
        const [yr, mo] = keys[0].split('-').map((n) => parseInt(n, 10));
        if (Number.isFinite(yr) && Number.isFinite(mo)) {
          const earliest = new Date(yr, mo - 1, 1);
          const cap36 = new Date(now.getFullYear(), now.getMonth() - 35, 1);
          const bounded = earliest < cap36 ? cap36 : earliest;
          rangeMonthStart = bounded < minDefaultStart ? bounded : minDefaultStart;
        }
      }

      const salesTrend = [];
      const cursor = new Date(rangeMonthStart);
      while (cursor <= currentMonthStart) {
        const key = toMonthKey(cursor);
        const rec = byMonth.get(key);
        const revenue = Number(rec?.revenue || 0);
        const grossSales = Number(rec?.grossSales || 0);
        const orders = Number(rec?.count || 0);
        salesTrend.push({
          _id: key,
          date: key,
          label: cursor.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          totalSales: revenue,
          revenue,
          sales: grossSales,
          grossSales,
          count: orders,
          orders,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const totalOrders = salesTrend.reduce((sum, d) => sum + d.orders, 0);
      const totalRevenue = salesTrend.reduce((sum, d) => sum + d.revenue, 0);
      const grossSales = salesTrend.reduce((sum, d) => sum + d.grossSales, 0);

      return {
        period: 'all',
        salesTrend,
        summary: {
          totalOrders,
          totalRevenue,
          grossSales,
          averageOrderValue:
            totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
          growth: 0,
        },
      };
    }

    const totalDays = safePeriod === '8w' ? 56 : Number(safePeriod.replace('d', '')) || 7;
    const rangeStart = startOfDay(new Date(Date.now() - (totalDays - 1) * DAY_MS));
    const prevStart = new Date(rangeStart.getTime() - totalDays * DAY_MS);

    const dayExpr = {
      $dateToString: { format: '%Y-%m-%d', date: '$_orderDate', timezone: tzOffset },
    };

    const [currentRows, prevAgg] = await Promise.all([
      isModelQueryable(Order, 'aggregate')
        ? Order.aggregate([
            { $match: scope.orderVendorMatch },
            { $unwind: '$items' },
            {
              $addFields: {
                _resolvedVendorId: { $ifNull: ['$items.vendorId', '$items.vendor'] },
                _resolvedProductId: { $ifNull: ['$items.product', '$items.productId'] },
                _orderDate: ORDER_DATE_EXPR,
              },
            },
            { $match: { ...scope.itemMatchStage, _orderDate: { $gte: rangeStart } } },
            {
              $group: {
                _id: { day: dayExpr, orderId: '$_id' },
                grossSales: {
                  $sum: { $cond: [isOrderNonCancelledExpr(), ITEM_TOTAL_EXPR, 0] },
                },
                revenue: {
                  $sum: { $cond: [isOrderEarnedExpr(), ITEM_TOTAL_EXPR, 0] },
                },
              },
            },
            {
              $group: {
                _id: '$_id.day',
                grossSales: { $sum: '$grossSales' },
                revenue: { $sum: '$revenue' },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
        : Promise.resolve([]),
      isModelQueryable(Order, 'aggregate')
        ? Order.aggregate([
            { $match: scope.orderVendorMatch },
            { $unwind: '$items' },
            {
              $addFields: {
                _resolvedVendorId: { $ifNull: ['$items.vendorId', '$items.vendor'] },
                _resolvedProductId: { $ifNull: ['$items.product', '$items.productId'] },
                _orderDate: ORDER_DATE_EXPR,
              },
            },
            {
              $match: {
                ...scope.itemMatchStage,
                _orderDate: { $gte: prevStart, $lt: rangeStart },
              },
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: { $cond: [isOrderEarnedExpr(), ITEM_TOTAL_EXPR, 0] } },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    const dayMap = new Map((currentRows || []).filter((r) => r?._id).map((r) => [r._id, r]));

    let salesTrend = [];
    if (safePeriod === '8w') {
      for (let w = 0; w < 8; w += 1) {
        const weekStart = new Date(rangeStart.getTime() + w * 7 * DAY_MS);
        let revenue = 0;
        let grossSales = 0;
        let orders = 0;
        for (let d = 0; d < 7; d += 1) {
          const day = new Date(weekStart.getTime() + d * DAY_MS);
          const rec = dayMap.get(toDateKey(day));
          if (rec) {
            revenue += Number(rec.revenue || 0);
            grossSales += Number(rec.grossSales || 0);
            orders += Number(rec.count || 0);
          }
        }
        const key = toDateKey(weekStart);
        salesTrend.push({
          _id: key,
          date: key,
          label: weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          totalSales: Math.round(revenue * 100) / 100,
          revenue: Math.round(revenue * 100) / 100,
          sales: Math.round(grossSales * 100) / 100,
          grossSales: Math.round(grossSales * 100) / 100,
          count: orders,
          orders,
        });
      }
    } else {
      for (let i = 0; i < totalDays; i += 1) {
        const day = new Date(rangeStart.getTime() + i * DAY_MS);
        const key = toDateKey(day);
        const rec = dayMap.get(key);
        const revenue = Number(rec?.revenue || 0);
        const grossSales = Number(rec?.grossSales || 0);
        const orders = Number(rec?.count || 0);
        salesTrend.push({
          _id: key,
          date: key,
          label: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          totalSales: revenue,
          revenue,
          sales: grossSales,
          grossSales,
          count: orders,
          orders,
        });
      }
    }

    const totalOrders = salesTrend.reduce((sum, d) => sum + d.orders, 0);
    const totalRevenue = salesTrend.reduce((sum, d) => sum + d.revenue, 0);
    const grossSales = salesTrend.reduce((sum, d) => sum + d.grossSales, 0);
    const prevRevenue = Number(prevAgg?.[0]?.revenue || 0);

    return {
      period: safePeriod,
      salesTrend,
      summary: {
        totalOrders,
        totalRevenue,
        grossSales,
        averageOrderValue:
          totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
        growth: growthPercent(totalRevenue, prevRevenue),
      },
    };
  }

  async getDashboard(userId) {
    const vendor = await this.findVendorForUser(userId, 'Vendor not found');
    const scope = await this.buildVendorScope(vendor, userId);

    const [
      totalProducts,
      publishedProducts,
      pendingProducts,
      earningsDoc,
      orderSummary,
      lowStockSummary,
      recentOrdersRaw,
      salesReport,
    ] = await Promise.all([
      Product.countDocuments(scope.productFilter),
      Product.countDocuments({
        ...scope.productFilter,
        status: { $in: PUBLISHED_PRODUCT_STATUSES },
      }),
      Product.countDocuments({
        ...scope.productFilter,
        status: { $in: PENDING_PRODUCT_STATUSES },
      }),
      VendorEarnings.findOne({ vendorId: vendor._id }),
      this.aggregateOrderSummary(scope),
      this.getLowStockSummary(vendor._id, scope),
      Order.find(scope.orderVendorMatch)
        .populate('userId', 'fullName name email avatar')
        .select(
          'orderNumber userId shippingAddress items totalAmount orderStatus status paymentStatus paymentMethod isPaid createdAt'
        )
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      this.buildSalesReportForVendor(scope, '8w'),
    ]);

    const payoutMetrics = await this.getPayoutMetrics(vendor._id, earningsDoc);

    const totalRevenue = Math.max(
      Number(orderSummary.earnedSales || 0),
      payoutMetrics.totalRevenue
    );
    const grossSales = Math.max(Number(orderSummary.grossSales || 0), totalRevenue);
    const totalOrders = Number(orderSummary.totalOrders || 0);
    const salesGrowth = growthPercent(
      orderSummary.salesThisMonth,
      orderSummary.salesLastMonth
    );
    const ordersGrowth = growthPercent(
      orderSummary.ordersThisWeek,
      orderSummary.ordersPrevWeek
    );

    const recentOrders = (recentOrdersRaw || []).map((order) => {
      const vendorItems = (order.items || []).filter((item) =>
        belongsToVendor(item, scope.vendorRefSet, scope.productIdSet)
      );
      const vendorOrderTotal = vendorItems.reduce((sum, item) => {
        const lineTotal =
          item.total !== undefined && item.total !== null
            ? Number(item.total)
            : Number(item.price || 0) * Number(item.quantity || 1);
        return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
      }, 0);
      const customerName =
        order.userId?.fullName ||
        order.userId?.name ||
        order.shippingAddress?.fullName ||
        order.customer?.fullName ||
        order.customer?.name ||
        'Customer';

      return {
        ...order,
        items: vendorItems,
        vendorItemsCount: vendorItems.length,
        vendorOrderTotal: Math.round(vendorOrderTotal * 100) / 100,
        customer: {
          fullName: customerName,
          email: order.userId?.email || '',
        },
      };
    });

    const metrics = {
      totalProducts,
      publishedProducts,
      pendingProducts,
      lowStockCount: lowStockSummary.lowStockCount,
      outOfStockCount: lowStockSummary.outOfStockCount,
      totalOrders,
      pendingOrders: Number(orderSummary.pendingOrders || 0),
      ordersThisWeek: Number(orderSummary.ordersThisWeek || 0),
      ordersGrowth,
      totalSales: grossSales,
      grossSales,
      totalRevenue,
      salesGrowth,
      netEarnings: payoutMetrics.netEarnings,
      availableBalance: payoutMetrics.availableBalance,
      pendingBalance: payoutMetrics.pendingBalance,
      pendingPayouts: payoutMetrics.pendingPayouts,
      pendingPayoutCount: payoutMetrics.pendingPayoutCount,
      totalCommission: payoutMetrics.totalCommission,
      totalWithdrawn: payoutMetrics.totalWithdrawn,
      averageOrderValue:
        totalOrders > 0 ? Math.round((grossSales / totalOrders) * 100) / 100 : 0,
      rating: Number(vendor.rating || 0),
      numReviews: Number(vendor.numReviews || 0),
    };

    return {
      store: vendor,
      metrics,
      earnings: payoutMetrics,
      lowStockProducts: lowStockSummary.lowStockProducts,
      recentOrders,
      salesReport,
    };
  }

  async getStats(userId) {
    const vendor = await this.findVendorForUser(userId, 'Vendor not found');
    const scope = await this.buildVendorScope(vendor, userId);

    const [earningsDoc, orderSummary, totalProducts, lowStockSummary] = await Promise.all([
      VendorEarnings.findOne({ vendorId: vendor._id }),
      this.aggregateOrderSummary(scope),
      Product.countDocuments(scope.productFilter),
      this.getLowStockSummary(vendor._id, scope),
    ]);

    const payoutMetrics = await this.getPayoutMetrics(vendor._id, earningsDoc);
    const revenue = Math.max(Number(orderSummary.earnedSales || 0), payoutMetrics.totalRevenue);
    const grossSales = Math.max(Number(orderSummary.grossSales || 0), revenue);

    return {
      totalOrders: Number(orderSummary.totalOrders || 0),
      pendingOrders: Number(orderSummary.pendingOrders || 0),
      ordersThisWeek: Number(orderSummary.ordersThisWeek || 0),
      totalProducts,
      lowStockCount: lowStockSummary.lowStockCount,
      rating: vendor.rating,
      revenue,
      grossSales,
      netEarnings: payoutMetrics.netEarnings,
      balance: payoutMetrics.availableBalance,
      pendingPayouts: payoutMetrics.pendingPayouts,
    };
  }

  async getSalesReport(userId, period = '8w') {
    const vendor = await this.findVendorForUser(userId, 'Vendor not found');
    const scope = await this.buildVendorScope(vendor, userId);
    return this.buildSalesReportForVendor(scope, period);
  }
}

export const vendorStoreService = new VendorStoreService();
export default vendorStoreService;
