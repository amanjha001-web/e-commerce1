import mongoose from 'mongoose';
import { User } from '../../models/User.model.js';
import { Product } from '../../models/Product.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { Order } from '../../models/Order.model.js';
import { Payment } from '../../models/Payment.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { VendorRequest } from '../../models/VendorRequest.model.js';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';
import { PAYMENT_STATUS } from '../../constants/paymentStatus.constant.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';
import { VENDOR_STATUS } from '../../constants/vendorStatus.constant.js';
import { ROLES } from '../../constants/roles.constant.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

// Orders that should never be counted as earned revenue (case-insensitive variants for legacy docs)
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

const ORDER_AMOUNT_EXPR = {
  $ifNull: [
    '$totalAmount',
    {
      $ifNull: [
        '$finalAmount',
        {
          $ifNull: [
            '$grandTotal',
            { $ifNull: ['$total', { $ifNull: ['$amount', 0] }] },
          ],
        },
      ],
    },
  ],
};

const PAYMENT_AMOUNT_EXPR = {
  $ifNull: [
    '$amount',
    { $ifNull: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] },
  ],
};

const ORDER_DATE_EXPR = {
  $ifNull: ['$createdAt', { $ifNull: ['$orderDate', { $ifNull: ['$paidAt', '$updatedAt'] }] }],
};

const PAYMENT_DATE_EXPR = {
  $ifNull: ['$createdAt', { $ifNull: ['$paidAt', { $ifNull: ['$paymentDate', '$updatedAt'] }] }],
};

const buildOrderRevenueMatch = (dateRangeFilter = null) => {
  const andConditions = [
    { orderStatus: { $nin: NON_REVENUE_STATUSES } },
    { status: { $nin: NON_REVENUE_STATUSES } },
    {
      $or: [
        { isPaid: true },
        { paid: true },
        { paymentStatus: { $in: SUCCESS_PAYMENT_VARIANTS } },
        { orderStatus: { $in: DELIVERED_ORDER_VARIANTS } },
        { status: { $in: DELIVERED_ORDER_VARIANTS } },
      ],
    },
  ];
  if (dateRangeFilter) {
    andConditions.push(dateRangeFilter);
  }
  return { $and: andConditions };
};

const buildPaymentSuccessMatch = (dateRangeFilter = null) => {
  const andConditions = [
    {
      $or: [
        { status: { $in: SUCCESS_PAYMENT_VARIANTS } },
        { paymentStatus: { $in: SUCCESS_PAYMENT_VARIANTS } },
      ],
    },
  ];
  if (dateRangeFilter) {
    andConditions.push(dateRangeFilter);
  }
  return { $and: andConditions };
};

const buildDateRangeFilter = (rangeObj, legacyDateField = 'orderDate') => {
  if (!rangeObj) return null;
  return {
    $or: [
      { createdAt: rangeObj },
      { createdAt: { $exists: false }, [legacyDateField]: rangeObj },
      { createdAt: null, [legacyDateField]: rangeObj },
    ],
  };
};

const getLocalTzOffsetString = () => {
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};

const PENDING_VENDOR_STATUSES = [VENDOR_STATUS.PENDING, VENDOR_STATUS.UNDER_REVIEW];
const OPEN_TICKET_STATUSES = ['open', 'pending', 'in_progress', 'waiting_for_customer'];

const USER_SELECT = 'fullName name username email avatar role isActive createdAt';

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

const growthPercent = (current, previous) => {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
};

const normalizePeriod = (period) => {
  const clean = String(period || '').trim().toLowerCase();
  if (clean === 'all' || PERIOD_DAYS[clean]) return clean;
  return '7d';
};

const getMonthBoundaries = () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { thisMonthStart, lastMonthStart };
};

const sumRevenue = async (dateRangeObj = null) => {
  const orderDateFilter = buildDateRangeFilter(dateRangeObj, 'orderDate');
  const paymentDateFilter = buildDateRangeFilter(dateRangeObj, 'paidAt');

  const [orderAgg, paymentAgg] = await Promise.all([
    Order.aggregate([
      { $match: buildOrderRevenueMatch(orderDateFilter) },
      { $group: { _id: null, total: { $sum: ORDER_AMOUNT_EXPR } } },
    ]),
    Payment.aggregate([
      { $match: buildPaymentSuccessMatch(paymentDateFilter) },
      { $group: { _id: null, total: { $sum: PAYMENT_AMOUNT_EXPR } } },
    ]),
  ]);
  return Math.max(
    Number(orderAgg?.[0]?.total || 0),
    Number(paymentAgg?.[0]?.total || 0)
  );
};

const sumGrossOrderValue = async (dateRangeObj = null) => {
  const orderDateFilter = buildDateRangeFilter(dateRangeObj, 'orderDate');
  const match = {
    orderStatus: { $nin: NON_REVENUE_STATUSES },
    status: { $nin: NON_REVENUE_STATUSES },
    ...(orderDateFilter || {}),
  };
  const result = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: ORDER_AMOUNT_EXPR } } },
  ]);
  return Number(result?.[0]?.total || 0);
};

const mapRecentUser = (user) => ({
  ...user,
  status: user?.isActive === false ? 'blocked' : 'active',
});

export class AdminDashboardService {
  async getDashboard() {
    const { thisMonthStart, lastMonthStart } = getMonthBoundaries();
    const customerFilter = { role: { $in: [ROLES.USER, 'customer'] } };

    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      totalVendors,
      pendingVendorAccounts,
      pendingVendorRequests,
      totalProducts,
      publishedProducts,
      pendingProducts,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      pendingOrders,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      grossSales,
      openTickets,
      recentOrders,
      recentUsers,
      lowStockList,
      topProducts,
    ] = await Promise.all([
      User.countDocuments(customerFilter),
      User.countDocuments({ ...customerFilter, createdAt: { $gte: thisMonthStart } }),
      User.countDocuments({
        ...customerFilter,
        createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
      }),
      Vendor.countDocuments({ status: VENDOR_STATUS.APPROVED }),
      Vendor.countDocuments({ status: { $in: PENDING_VENDOR_STATUSES } }),
      VendorRequest.countDocuments({
        status: { $in: PENDING_VENDOR_STATUSES },
        isDeleted: { $ne: true },
      }),
      Product.countDocuments(),
      Product.countDocuments({ status: PRODUCT_STATUS.PUBLISHED }),
      Product.countDocuments({
        status: { $in: [PRODUCT_STATUS.PENDING_APPROVAL, 'pending'] },
      }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Order.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
      Order.countDocuments({ orderStatus: ORDER_STATUS.PENDING }),
      sumRevenue(),
      sumRevenue({ $gte: thisMonthStart }),
      sumRevenue({ $gte: lastMonthStart, $lt: thisMonthStart }),
      sumGrossOrderValue(),
      SupportTicket.countDocuments({ status: { $in: OPEN_TICKET_STATUSES } }),
      this.getRecentOrders(5),
      this.getRecentUsers(5),
      this.getLowStockProducts(10, 50),
      this.getTopProducts(5),
    ]);

    const pendingVendors = Math.max(pendingVendorAccounts, pendingVendorRequests);
    const lowStockCount = lowStockList.length;
    const lowStockProducts = lowStockList.slice(0, 5);
    const pendingRevenue = Math.max(0, Math.round((grossSales - totalRevenue) * 100) / 100);

    const metrics = {
      totalUsers,
      totalCustomers: totalUsers,
      newUsersThisMonth: usersThisMonth,
      usersGrowth: growthPercent(usersThisMonth, usersLastMonth),
      totalVendors,
      pendingVendors,
      totalProducts,
      publishedProducts,
      pendingProducts,
      lowStockCount,
      totalOrders,
      ordersThisMonth,
      ordersGrowth: growthPercent(ordersThisMonth, ordersLastMonth),
      pendingOrders,
      totalRevenue,
      revenueThisMonth,
      revenueGrowth: growthPercent(revenueThisMonth, revenueLastMonth),
      grossSales,
      pendingRevenue,
      openTickets,
    };

    return {
      metrics,
      recentOrders,
      recentUsers,
      lowStockProducts,
      topProducts,
    };
  }

  async getDashboardAnalytics(period = '7d') {
    const safePeriod = normalizePeriod(period);
    const tzOffset = getLocalTzOffsetString();
    const canQueryPayments =
      mongoose.connection?.readyState === 1 || Boolean(Payment.aggregate?.mock);

    if (safePeriod === 'all') {
      const monthOrderExpr = {
        $dateToString: { format: '%Y-%m', date: ORDER_DATE_EXPR, timezone: tzOffset },
      };
      const monthPaymentExpr = {
        $dateToString: { format: '%Y-%m', date: PAYMENT_DATE_EXPR, timezone: tzOffset },
      };

      const [ordersByMonth, orderRevenueByMonth, paymentRevenueByMonth] = await Promise.all([
        Order.aggregate([
          {
            $group: {
              _id: monthOrderExpr,
              orders: { $sum: 1 },
              orderValue: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $in: ['$orderStatus', NON_REVENUE_STATUSES] },
                        { $in: ['$status', NON_REVENUE_STATUSES] },
                      ],
                    },
                    0,
                    ORDER_AMOUNT_EXPR,
                  ],
                },
              },
            },
          },
        ]),
        Order.aggregate([
          { $match: buildOrderRevenueMatch(null) },
          { $group: { _id: monthOrderExpr, revenue: { $sum: ORDER_AMOUNT_EXPR } } },
        ]),
        canQueryPayments
          ? Payment.aggregate([
              { $match: buildPaymentSuccessMatch(null) },
              { $group: { _id: monthPaymentExpr, revenue: { $sum: PAYMENT_AMOUNT_EXPR } } },
            ])
          : Promise.resolve([]),
      ]);

      const ordersMap = new Map(
        (ordersByMonth || []).filter((d) => d?._id).map((d) => [d._id, Number(d.orders) || 0])
      );
      const orderValueMap = new Map(
        (ordersByMonth || []).filter((d) => d?._id).map((d) => [d._id, Number(d.orderValue) || 0])
      );
      const orderRevMap = new Map(
        (orderRevenueByMonth || []).filter((d) => d?._id).map((d) => [d._id, Number(d.revenue) || 0])
      );
      const payRevMap = new Map(
        (paymentRevenueByMonth || [])
          .filter((d) => d?._id)
          .map((d) => [d._id, Number(d.revenue) || 0])
      );

      const allKeys = [
        ...ordersMap.keys(),
        ...orderRevMap.keys(),
        ...payRevMap.keys(),
      ].sort();

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const minDefaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      let rangeMonthStart = minDefaultStart;
      if (allKeys.length > 0) {
        const [yr, mo] = allKeys[0].split('-').map((n) => parseInt(n, 10));
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
        const orders = ordersMap.get(key) || 0;
        const orderRev = orderRevMap.get(key) || 0;
        const payRev = payRevMap.get(key) || 0;
        const revenue = Math.max(orderRev, payRev);
        const orderValue = Math.max(orderValueMap.get(key) || 0, payRev);
        salesTrend.push({
          date: key,
          label: cursor.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          orders,
          sales: orders,
          revenue,
          orderValue,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const totalOrders = salesTrend.reduce((sum, d) => sum + d.orders, 0);
      const totalRevenue = salesTrend.reduce((sum, d) => sum + d.revenue, 0);
      const grossSales = salesTrend.reduce((sum, d) => sum + d.orderValue, 0);

      return {
        period: 'all',
        salesTrend,
        summary: {
          totalOrders,
          totalRevenue,
          grossSales,
          pendingRevenue: Math.max(0, Math.round((grossSales - totalRevenue) * 100) / 100),
          averageOrderValue:
            totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
          ordersGrowth: 0,
          revenueGrowth: 0,
        },
      };
    }

    const days = PERIOD_DAYS[safePeriod];
    const rangeStart = startOfDay(new Date(Date.now() - (days - 1) * DAY_MS));
    const previousStart = new Date(rangeStart.getTime() - days * DAY_MS);

    const dateExpr = {
      $dateToString: { format: '%Y-%m-%d', date: ORDER_DATE_EXPR, timezone: tzOffset },
    };
    const paymentDateExpr = {
      $dateToString: { format: '%Y-%m-%d', date: PAYMENT_DATE_EXPR, timezone: tzOffset },
    };

    const currentOrderDateFilter = buildDateRangeFilter({ $gte: rangeStart }, 'orderDate');
    const currentPaymentDateFilter = buildDateRangeFilter({ $gte: rangeStart }, 'paidAt');
    const prevOrderDateFilter = buildDateRangeFilter(
      { $gte: previousStart, $lt: rangeStart },
      'orderDate'
    );

    const [ordersByDay, revenueByDay, paymentRevenueByDay, previousOrders, previousRevenue] =
      await Promise.all([
        Order.aggregate([
          { $match: currentOrderDateFilter },
          {
            $group: {
              _id: dateExpr,
              orders: { $sum: 1 },
              orderValue: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $in: ['$orderStatus', NON_REVENUE_STATUSES] },
                        { $in: ['$status', NON_REVENUE_STATUSES] },
                      ],
                    },
                    0,
                    ORDER_AMOUNT_EXPR,
                  ],
                },
              },
            },
          },
        ]),
        Order.aggregate([
          { $match: buildOrderRevenueMatch(currentOrderDateFilter) },
          { $group: { _id: dateExpr, revenue: { $sum: ORDER_AMOUNT_EXPR } } },
        ]),
        canQueryPayments
          ? Payment.aggregate([
              { $match: buildPaymentSuccessMatch(currentPaymentDateFilter) },
              { $group: { _id: paymentDateExpr, revenue: { $sum: PAYMENT_AMOUNT_EXPR } } },
            ])
          : Promise.resolve([]),
        Order.countDocuments(prevOrderDateFilter),
        sumRevenue({ $gte: previousStart, $lt: rangeStart }),
      ]);

    const ordersMap = new Map((ordersByDay || []).map((d) => [d._id, Number(d.orders) || 0]));
    const orderValueMap = new Map(
      (ordersByDay || []).map((d) => [d._id, Number(d.orderValue) || 0])
    );
    const revenueMap = new Map((revenueByDay || []).map((d) => [d._id, Number(d.revenue) || 0]));
    const paymentRevenueMap = new Map(
      (paymentRevenueByDay || []).map((d) => [d._id, Number(d.revenue) || 0])
    );

    // Fill every day in range so charts never have gaps
    const salesTrend = [];
    for (let i = 0; i < days; i += 1) {
      const day = new Date(rangeStart.getTime() + i * DAY_MS);
      const key = toDateKey(day);
      const orders = ordersMap.get(key) || 0;
      const orderRev = revenueMap.get(key) || 0;
      const payRev = paymentRevenueMap.get(key) || 0;
      const revenue = Math.max(orderRev, payRev);
      const orderValue = Math.max(orderValueMap.get(key) || 0, payRev);
      salesTrend.push({
        date: key,
        label: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        orders,
        sales: orders,
        revenue,
        orderValue,
      });
    }

    const totalOrders = salesTrend.reduce((sum, d) => sum + d.orders, 0);
    const totalRevenue = salesTrend.reduce((sum, d) => sum + d.revenue, 0);
    const grossSales = salesTrend.reduce((sum, d) => sum + d.orderValue, 0);

    return {
      period: safePeriod,
      salesTrend,
      summary: {
        totalOrders,
        totalRevenue,
        grossSales,
        pendingRevenue: Math.max(0, Math.round((grossSales - totalRevenue) * 100) / 100),
        averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
        ordersGrowth: growthPercent(totalOrders, previousOrders),
        revenueGrowth: growthPercent(totalRevenue, previousRevenue),
      },
    };
  }

  async getRecentOrders(limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    return Order.find()
      .populate('userId', 'fullName name username email avatar')
      .select('orderNumber userId totalAmount orderStatus paymentStatus paymentMethod isPaid items createdAt')
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
  }

  async getRecentUsers(limit = 5) {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
    let users = await User.find({
      role: { $nin: ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'] },
    })
      .select(USER_SELECT)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    if (!users?.length) {
      users = await User.find()
        .select(USER_SELECT)
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean();
    }

    return (users || []).map(mapRecentUser);
  }

  async getLowStockProducts(threshold = 10, limit = 50) {
    const safeThreshold = Number.isFinite(Number(threshold)) ? Number(threshold) : 10;
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const [lowProducts, lowInventory] = await Promise.all([
      Product.find({ stock: { $lte: safeThreshold } })
        .select('name slug stock price images status category vendorId')
        .populate('category', 'name')
        .populate('vendorId', 'storeName')
        .sort({ stock: 1 })
        .limit(safeLimit)
        .lean(),
      Inventory.find({ quantity: { $lte: safeThreshold } })
        .populate({
          path: 'productId',
          select: 'name slug stock price images status category vendorId',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'vendorId', select: 'storeName' },
          ],
        })
        .populate('vendorId', 'storeName')
        .sort({ quantity: 1 })
        .limit(safeLimit)
        .lean(),
    ]);

    const merged = new Map();
    for (const p of lowProducts || []) {
      if (p?._id) merged.set(String(p._id), p);
    }
    for (const inv of lowInventory || []) {
      const prod = inv?.productId;
      if (!prod || typeof prod !== 'object' || !prod._id) continue;
      const key = String(prod._id);
      const effectiveStock = Math.min(
        Number(prod.stock ?? inv.quantity ?? 0),
        Number(inv.quantity ?? prod.stock ?? 0)
      );
      if (!merged.has(key)) {
        merged.set(key, {
          ...prod,
          stock: effectiveStock,
          vendorId: prod.vendorId || inv.vendorId,
        });
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
      .slice(0, safeLimit);
  }

  async getTopProducts(limit = 5) {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);
    const aggregated = await Order.aggregate([
      { $match: { orderStatus: { $nin: NON_REVENUE_STATUSES } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          totalSales: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalSales: -1, totalRevenue: -1 } },
      { $limit: safeLimit },
    ]);

    const results = [];
    const seenIds = [];

    if (aggregated?.length) {
      const ids = aggregated.map((a) => a._id).filter(Boolean);
      const products = await Product.find({ _id: { $in: ids } })
        .select('name price stock images category status')
        .populate('category', 'name')
        .lean();
      const productMap = new Map((products || []).map((p) => [String(p._id), p]));

      for (const item of aggregated) {
        if (!item._id) continue;
        seenIds.push(item._id);
        const product = productMap.get(String(item._id)) || {};
        results.push({
          _id: item._id,
          name: product.name || item.name,
          price: product.price ?? 0,
          stock: product.stock ?? 0,
          status: product.status,
          category: product.category || null,
          image: product.images?.[0]?.url || item.image || '',
          totalSales: Number(item.totalSales) || 0,
          totalRevenue: Number(item.totalRevenue) || 0,
        });
      }
    }

    // Backfill remaining slots with top/latest catalog products when order history is sparse
    if (results.length < safeLimit) {
      const remaining = safeLimit - results.length;
      const fallbackProducts = await Product.find(
        seenIds.length ? { _id: { $nin: seenIds } } : {}
      )
        .select('name price stock images category status rating numReviews isBestSeller')
        .populate('category', 'name')
        .sort({ isBestSeller: -1, rating: -1, numReviews: -1, createdAt: -1 })
        .limit(remaining)
        .lean();

      for (const p of fallbackProducts || []) {
        results.push({
          _id: p._id,
          name: p.name,
          price: p.price ?? 0,
          stock: p.stock ?? 0,
          status: p.status,
          category: p.category || null,
          image: p.images?.[0]?.url || '',
          totalSales: 0,
          totalRevenue: 0,
        });
      }
    }

    return results;
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
