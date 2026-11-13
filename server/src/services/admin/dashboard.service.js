import { User } from '../../models/User.model.js';
import { Product } from '../../models/Product.model.js';
import { Order } from '../../models/Order.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { Payment } from '../../models/Payment.model.js';

export class AdminDashboardService {
  async getDashboard() {
    const [
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      revenueResult,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Vendor.countDocuments({ status: 'approved' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      Order.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({ stock: { $lte: 10 } })
        .limit(5)
        .select('name stock price images'),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return {
      metrics: {
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        totalRevenue,
      },
      recentOrders,
      lowStockProducts,
    };
  }

  async getDashboardAnalytics() {
    // 30 days orders trend
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          sales: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return { salesTrend };
  }

  async getRecentOrders(limit = 10) {
    return Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }

  async getLowStockProducts(threshold = 10) {
    return Product.find({ stock: { $lte: Number(threshold) } })
      .populate('category', 'name')
      .populate('vendorId', 'storeName');
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
