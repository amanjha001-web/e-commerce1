import { Vendor } from '../../models/Vendor.model.js';
import { Product } from '../../models/Product.model.js';
import { Order } from '../../models/Order.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { ApiError } from '../../utils/apiError.js';
import { uploadToCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

export class VendorStoreService {
  async getMyStore(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Store not found for this vendor');
    return vendor;
  }

  async updateStore(userId, storeData) {
    const vendor = await Vendor.findOneAndUpdate(
      { userId },
      storeData,
      { new: true, runValidators: true }
    );
    if (!vendor) throw ApiError.notFound('Store not found');
    return vendor;
  }

  async updateStoreLogo(userId, file) {
    if (!file) throw ApiError.badRequest('Logo image required');
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Store not found');

    const uploaded = await uploadToCloudinary(file.buffer, 'vendor-logos');
    vendor.logo = { url: uploaded.url, publicId: uploaded.publicId };
    await vendor.save();
    return vendor;
  }

  async updateStoreBanner(userId, file) {
    if (!file) throw ApiError.badRequest('Banner image required');
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Store not found');

    const uploaded = await uploadToCloudinary(file.buffer, 'vendor-banners');
    vendor.banner = { url: uploaded.url, publicId: uploaded.publicId };
    await vendor.save();
    return vendor;
  }

  async getDashboard(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor not found');

    const [productsCount, ordersCount, earnings] = await Promise.all([
      Product.countDocuments({ vendorId: vendor._id }),
      Order.countDocuments({ 'items.vendorId': vendor._id }),
      VendorEarnings.findOne({ vendorId: vendor._id }),
    ]);

    const recentOrders = await Order.find({ 'items.vendorId': vendor._id })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      store: vendor,
      metrics: {
        totalProducts: productsCount,
        totalOrders: ordersCount,
        totalRevenue: earnings?.totalRevenue || 0,
        netEarnings: earnings?.netEarnings || 0,
        availableBalance: earnings?.availableBalance || 0,
      },
      recentOrders,
    };
  }

  async getStats(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor not found');

    const earnings = await VendorEarnings.findOne({ vendorId: vendor._id });
    const totalOrders = await Order.countDocuments({ 'items.vendorId': vendor._id });
    const pendingOrders = await Order.countDocuments({
      'items.vendorId': vendor._id,
      orderStatus: 'pending',
    });

    return {
      totalOrders,
      pendingOrders,
      rating: vendor.rating,
      revenue: earnings?.totalRevenue || 0,
      netEarnings: earnings?.netEarnings || 0,
      balance: earnings?.availableBalance || 0,
    };
  }

  async getSalesReport(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor not found');

    // Aggregate monthly or daily sales
    const sales = await Order.aggregate([
      { $match: { 'items.vendorId': vendor._id, isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    return sales;
  }
}

export const vendorStoreService = new VendorStoreService();
export default vendorStoreService;
