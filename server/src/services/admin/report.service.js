import { Order } from '../../models/Order.model.js';
import { Payment } from '../../models/Payment.model.js';
import { Product } from '../../models/Product.model.js';
import { User } from '../../models/User.model.js';

export class AdminReportService {
  async getReportSummary() {
    const [totalOrders, totalRevenue, totalUsers, totalProducts] = await Promise.all([
      Order.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      totalProducts,
    };
  }

  async getSalesReport(params = {}) {
    const match = { isPaid: true };
    if (params.startDate || params.endDate) {
      match.createdAt = {};
      if (params.startDate) match.createdAt.$gte = new Date(params.startDate);
      if (params.endDate) match.createdAt.$lte = new Date(params.endDate);
    }

    const sales = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return sales;
  }

  async getRevenueReport(params = {}) {
    const match = { status: 'success' };
    const revenue = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return revenue;
  }

  async exportReport(params = {}) {
    const orders = await Order.find().limit(1000).select('orderNumber totalAmount paymentStatus orderStatus createdAt');
    const csvRows = ['OrderNumber,TotalAmount,PaymentStatus,OrderStatus,CreatedAt'];
    orders.forEach((o) => {
      csvRows.push(`${o.orderNumber},${o.totalAmount},${o.paymentStatus},${o.orderStatus},${o.createdAt.toISOString()}`);
    });
    return csvRows.join('\n');
  }
}

export const adminReportService = new AdminReportService();
export default adminReportService;
