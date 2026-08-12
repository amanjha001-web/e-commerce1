import User from "../models/User.model.js";
import Vendor from "../models/Vendor.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";

/*                         Dashboard Queries                                  */

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalVendors,
    totalProducts,
    totalOrders,
    pendingVendors,
    pendingProducts,
  ] = await Promise.all([
    User.countDocuments(),

    Vendor.countDocuments(),

    Product.countDocuments(),

    Order.countDocuments(),

    Vendor.countDocuments({
      status: "pending",
    }),

    Product.countDocuments({
      status: "pending_approval",
    }),
  ]);

  return {
    totalUsers,
    totalVendors,
    totalProducts,
    totalOrders,
    pendingVendors,
    pendingProducts,
  };
};

/*                            User Queries                                    */

const findUsers = async (filter, options = {}) => {
  const { skip = 0, limit = 10 } = options;

  return User.find(filter)
    .select("-password -refreshToken")
    .skip(skip)
    .limit(limit)
    .sort({
      createdAt: -1,
    });
};

const countUsers = async (filter) => {
  return User.countDocuments(filter);
};

const findUserById = async (userId) => {
  return User.findById(userId).select("-password -refreshToken");
};

const updateUser = async (userId, data) => {
  return User.findByIdAndUpdate(userId, data, {
    new: true,
  }).select("-password -refreshToken");
};

/*                           Vendor Queries                                   */

const findVendors = async (filter = {}) => {
  return Vendor.find(filter).populate("user", "fullName email username").sort({
    createdAt: -1,
  });
};

const updateVendor = async (vendorId, data) => {
  return Vendor.findByIdAndUpdate(vendorId, data, {
    new: true,
  });
};

/*                           Product Queries                                  */

const findProducts = async (filter = {}) => {
  return Product.find(filter).populate("vendor", "shopName").sort({
    createdAt: -1,
  });
};

const updateProduct = async (productId, data) => {
  return Product.findByIdAndUpdate(productId, data, {
    new: true,
  });
};

/*                            Order Queries                                   */

const findOrders = async (filter = {}) => {
  return Order.find(filter).populate("user", "fullName email").sort({
    createdAt: -1,
  });
};

/*                              Export                                        */

export default {
  // Dashboard
  getDashboardStats,

  // Users
  findUsers,
  countUsers,
  findUserById,
  updateUser,

  // Vendors
  findVendors,
  updateVendor,

  // Products
  findProducts,
  updateProduct,

  // Orders
  findOrders,
};
