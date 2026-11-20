import { User } from '../../models/User.model.js';
import { Product } from '../../models/Product.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { Order } from '../../models/Order.model.js';
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

// Orders that should never be counted as earned revenue
const NON_REVENUE_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.RETURNED,
];

// Revenue = paid (online) OR delivered (COD) orders that were not cancelled/refunded/returned
const REVENUE_MATCH = {
  orderStatus: { $nin: NON_REVENUE_STATUSES },
  $or: [
    { isPaid: true },
    { paymentStatus: PAYMENT_STATUS.SUCCESS },
    { orderStatus: ORDER_STATUS.DELIVERED },
  ],
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

const growthPercent = (current, previous) => {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
};

const normalizePeriod = (period) => (PERIOD_DAYS[period] ? period : '7d');

const getMonthBoundaries = () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { thisMonthStart, lastMonthStart };
};

const sumRevenue = async (extraMatch = {}) => {
  const result = await Order.aggregate([
    { $match: { ...REVENUE_MATCH, ...extraMatch } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
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
      lowStockCount,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      pendingOrders,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      openTickets,
      recentOrders,
      recentUsers,
      lowStockProducts,
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
      Product.countDocuments({ status: PRODUCT_STATUS.PENDING_APPROVAL }),
      Product.countDocuments({ stock: { $lte: 10 } }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Order.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
      Order.countDocuments({ orderStatus: ORDER_STATUS.PENDING }),
      sumRevenue(),
      sumRevenue({ createdAt: { $gte: thisMonthStart } }),
      sumRevenue({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
      SupportTicket.countDocuments({ status: { $in: OPEN_TICKET_STATUSES } }),
      this.getRecentOrders(5),
      this.getRecentUsers(5),
      this.getLowStockProducts(10, 5),
      this.getTopProducts(5),
    ]);

    const pendingVendors = Math.max(pendingVendorAccounts, pendingVendorRequests);

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
    const days = PERIOD_DAYS[safePeriod];
    const rangeStart = startOfDay(new Date(Date.now() - (days - 1) * DAY_MS));
    const previousStart = new Date(rangeStart.getTime() - days * DAY_MS);

    const dateExpr = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [ordersByDay, revenueByDay, previousOrders, previousRevenue] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: rangeStart } } },
        { $group: { _id: dateExpr, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...REVENUE_MATCH, createdAt: { $gte: rangeStart } } },
        { $group: { _id: dateExpr, revenue: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: previousStart, $lt: rangeStart } }),
      sumRevenue({ createdAt: { $gte: previousStart, $lt: rangeStart } }),
    ]);

    const ordersMap = new Map((ordersByDay || []).map((d) => [d._id, Number(d.orders) || 0]));
    const revenueMap = new Map((revenueByDay || []).map((d) => [d._id, Number(d.revenue) || 0]));

    // Fill every day in range so charts never have gaps
    const salesTrend = [];
    for (let i = 0; i < days; i += 1) {
      const day = new Date(rangeStart.getTime() + i * DAY_MS);
      const key = toDateKey(day);
      const orders = ordersMap.get(key) || 0;
      const revenue = revenueMap.get(key) || 0;
      salesTrend.push({
        date: key,
        label: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        orders,
        sales: orders,
        revenue,
      });
    }

    const totalOrders = salesTrend.reduce((sum, d) => sum + d.orders, 0);
    const totalRevenue = salesTrend.reduce((sum, d) => sum + d.revenue, 0);

    return {
      period: safePeriod,
      salesTrend,
      summary: {
        totalOrders,
        totalRevenue,
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
