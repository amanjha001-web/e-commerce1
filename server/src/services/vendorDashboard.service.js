import vendorDashboardRepository from "../repositories/vendorDashboard.repository.js";
import { ApiError } from "../utils/index.js";

const getVendorDashboard = async (userId) => {
  const vendor = await vendorDashboardRepository.getVendorProfile(userId);

  if (!vendor) {
    throw new ApiError(404, "Vendor profile not found");
  }

  const [productStats, orderStats, earnings, recentOrders] = await Promise.all([
    vendorDashboardRepository.getProductStats(userId),
    vendorDashboardRepository.getOrderStats(userId),
    vendorDashboardRepository.getEarningStats(vendor._id),
    vendorDashboardRepository.getRecentOrders(userId),
  ]);

  // Never return another vendor's items inside a shared order.
  const filteredRecentOrders = recentOrders.map((order) => {
    const vendorItems = (order.items ?? []).filter((item) => {
      const itemVendorId = item.vendor?._id ?? item.vendor;

      return String(itemVendorId) === String(userId);
    });

    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,

      // This is the total for this vendor's items only.
      vendorOrderTotal: vendorItems.reduce(
        (total, item) => total + Number(item.totalPrice ?? 0),
        0,
      ),

      items: vendorItems.map((item) => ({
        product: item.product,
        name: item.name,
        image: item.image,
        sku: item.sku,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        totalPrice: item.totalPrice,
        vendorAmount: item.vendorAmount,
      })),
    };
  });

  return {
    vendor: {
      _id: vendor._id,
      shopName: vendor.shopName,
      slug: vendor.slug,
      isApproved: vendor.isApproved,
      isVerified: vendor.isVerified,
      isActive: vendor.isActive,
    },

    stats: {
      totalProducts: productStats.totalProducts,
      totalOrders: orderStats.totalOrders,
      totalSales: orderStats.totalSales,
      totalEarnings: earnings.pending + earnings.available + earnings.withdrawn,
      pendingOrders: orderStats.pendingOrders,
      deliveredOrders: orderStats.deliveredOrders,
      lowStockProducts: productStats.lowStockProducts,
    },

    earnings,

    recentOrders: filteredRecentOrders,

    topProducts: productStats.topProducts,
  };
};

export default {
  getVendorDashboard,
};
