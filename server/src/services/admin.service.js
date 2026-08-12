import User from "../models/User.model.js";
import Vendor from "../models/Vendor.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";

import ApiError from "../utils/ApiError.js";

import {
  USER_STATUS,
  VENDOR_STATUS,
  PRODUCT_STATUS,
} from "../constants/index.js";


/*                         Dashboard Statistics                               */


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
      status: VENDOR_STATUS.PENDING,
    }),

    Product.countDocuments({
      status: PRODUCT_STATUS.PENDING_APPROVAL,
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


/*                            User Management                                 */


const getAllUsers = async (query = {}) => {
  const { page = 1, limit = 10, status, search } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      {
        fullName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        username: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const users = await User.find(filter)
    .select("-password -refreshToken")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({
      createdAt: -1,
    });

  const total = await User.countDocuments(filter);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const updateUserStatus = async (userId, status) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      status,
    },
    {
      new: true,
    },
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};


/*                            Vendor Management                               */


const getAllVendors = async (query = {}) => {
  const vendors = await Vendor.find(query)
    .populate("user", "fullName email username")
    .sort({
      createdAt: -1,
    });

  return vendors;
};

const approveVendor = async (vendorId) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    {
      status: VENDOR_STATUS.ACTIVE,
    },
    {
      new: true,
    },
  );

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};

const rejectVendor = async (vendorId, reason) => {
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    {
      status: VENDOR_STATUS.REJECTED,
      rejectionReason: reason,
    },
    {
      new: true,
    },
  );

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};


/*                         Product Moderation                                 */


const getPendingProducts = async (query = {}) => {
  return await Product.find({
    status: PRODUCT_STATUS.PENDING_APPROVAL,
    ...query,
  })
    .populate("vendor", "shopName")
    .sort({
      createdAt: -1,
    });
};

const approveProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    {
      status: PRODUCT_STATUS.ACTIVE,
    },
    {
      new: true,
    },
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

const rejectProduct = async (productId, reason) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    {
      status: PRODUCT_STATUS.REJECTED,
      rejectionReason: reason,
    },
    {
      new: true,
    },
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};


/*                             Order Management                               */


const getAllOrders = async (query = {}) => {
  return await Order.find(query).populate("user", "fullName email").sort({
    createdAt: -1,
  });
};

export default {
  getDashboardStats,

  getAllUsers,
  getUserById,
  updateUserStatus,

  getAllVendors,
  approveVendor,
  rejectVendor,

  getPendingProducts,
  approveProduct,
  rejectProduct,

  getAllOrders,
};
