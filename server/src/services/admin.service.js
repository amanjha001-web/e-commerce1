import mongoose from "mongoose";

import User from "../models/User.model.js";
import Vendor from "../models/Vendor.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";
import VendorRequest from "../models/VendorRequest.model.js";
import Category from "../models/Category.model.js";
import Coupon from "../models/Coupon.model.js";
import Review from "../models/Review.model.js";
import Payment from "../models/Payment.model.js";
import VendorPayout from "../models/VendorPayout.model.js"
import ActivityLog from "../models/ActivityLog.model.js";
import Brand from "../models/Brand.model.js";
import Inventory from "../models/Inventory.model.js";
import InventoryMovement from "../models/InventoryMovement.model.js";
import Setting from "../models/Setting.model.js";
import SettingHistory from "../models/SettingHistory.model.js";
import ShippingZone from "../models/ShippingZone.model.js";
import SupportTicket from "../models/SupportTicket.model.js";
import Tax from "../models/Tax.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";


import razorpay from "../config/razorpay.js";

import ApiError from "../utils/ApiError.js";
import { PRODUCT_STATUS } from "../constants/index.js";

/* ======================== Dashboard Statistics ======================== */

//Dashboard stats
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
    Vendor.countDocuments({ deletedAt: null }),
    Product.countDocuments(),
    Order.countDocuments(),
    VendorRequest.countDocuments({
      status: "pending",
      isDeleted: false,
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

// Dashboard Analytics
const getDashboardAnalytics = async (period = "30d") => {
  const periodDays = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "12m": 365,
  };

  const days = periodDays[period] || 30;

  const now = new Date();
  const startDate = new Date(now);

  startDate.setDate(startDate.getDate() - days);

  const paidStatuses = ["paid", "completed", "success", "succeeded"];

  const [summaryResult, salesTrend] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: null,

          totalOrders: { $sum: 1 },

          paidOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    {
                      $toLower: {
                        $ifNull: ["$paymentStatus", ""],
                      },
                    },
                    paidStatuses,
                  ],
                },
                1,
                0,
              ],
            },
          },

          grossSales: {
            $sum: {
              $cond: [
                {
                  $in: [
                    {
                      $toLower: {
                        $ifNull: ["$paymentStatus", ""],
                      },
                    },
                    paidStatuses,
                  ],
                },
                { $ifNull: ["$totalAmount", 0] },
                0,
              ],
            },
          },

          totalRefunds: {
            $sum: { $ifNull: ["$refundAmount", 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          paidOrders: 1,
          grossSales: 1,
          totalRefunds: 1,
          netRevenue: {
            $max: [0, { $subtract: ["$grossSales", "$totalRefunds"] }],
          },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          paymentStatus: {
            $in: [
              "paid",
              "Paid",
              "completed",
              "Completed",
              "success",
              "Success",
              "succeeded",
              "Succeeded",
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          sales: { $sum: { $ifNull: ["$totalAmount", 0] } },

          orders: { $sum: 1 },

          refunds: { $sum: { $ifNull: ["$refundAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: 1,
          orders: 1,
          refunds: 1,
          revenue: {
            $max: [0, { $subtract: ["$sales", "$refunds"] }],
          },
        },
      },
      { $sort: { date: 1 } },
    ]),
  ]);

  const summary = summaryResult[0] || {
    totalOrders: 0,
    paidOrders: 0,
    grossSales: 0,
    totalRefunds: 0,
    netRevenue: 0,
  };

  return {
    period,
    startDate,
    endDate: now,
    summary,
    salesTrend,
  };
};

// Recent Dashboard Orders
const getRecentOrders = async (limit = 10) => {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 50);

  const orders = await Order.find({})
    .select(
      "orderNumber user items totalAmount orderStatus paymentStatus paymentMethod createdAt",
    )
    .populate("user", "fullName email")
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return orders;
};

// Dashboard Low Stock Products
const getLowStockProducts = async (threshold = 10, limit = 10) => {
  const safeThreshold = Math.min(
    Math.max(Number.parseInt(threshold, 10) || 10, 0),
    10000,
  );

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 50);

  const products = await Product.find({
    stock: { $lte: safeThreshold },
  })
    .select("name sku stock price thumbnail vendor")
    .populate("vendor", "shopName")
    .sort({ stock: 1, createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return {
    threshold: safeThreshold,
    count: products.length,
    products,
  };
};

/* ======================== User Management ======================== */

//get all user
const getAllUsers = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const { role, status, search } = query;

  const filter = {};

  // Role filtering - CUSTOMER, VENDOR, ADMIN
  if (role) {
    const VALID_ROLES = ["customer", "vendor", "admin"];
    if (VALID_ROLES.includes(role)) {
      filter.role = role;
    }
  }

  // Status filtering - map active/blocked to isBlocked
  if (status === "active") {
    filter.isBlocked = false;
  } else if (status === "blocked") {
    filter.isBlocked = true;
  }

  // Search functionality
  if (search?.trim()) {
    const searchRegex = {
      $regex: search.trim(),
      $options: "i",
    };

    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { username: searchRegex },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -resetPasswordToken")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

//get single user
const getUserById = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

//update user status
const updateUserStatus = async (userId, status) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (!status) {
    throw new ApiError(400, "User status is required");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true, runValidators: true },
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

//Search, filter and pagination
export const getAllUsersbyAdmin = async (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );

  const filter = {};

  if (query.search?.trim()) {
    const search = query.search.trim();
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    filter.$or = [
      { fullName: regex },
      { username: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  if (query.role) {
    filter.role = query.role;
  }

  if (query.status === "active") {
    filter.isBlocked = false;
  } else if (query.status === "blocked") {
    filter.isBlocked = true;
  }

  // Build sort option
  let sortOption = { createdAt: -1 };
  if (query.sortBy) {
    const sortValue = String(query.sortBy).toLowerCase();
    const isAscending = sortValue.includes("asc");
    const isDescending = sortValue.includes("desc");
    
    if (sortValue.includes("name")) {
      sortOption = { fullName: isAscending ? 1 : -1 };
    } else if (sortValue.includes("email")) {
      sortOption = { email: isAscending ? 1 : -1 };
    } else if (sortValue === "newest") {
      sortOption = { createdAt: -1 };
    } else if (sortValue === "oldest") {
      sortOption = { createdAt: 1 };
    }
  }

  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -resetPasswordToken")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      currentPage: page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      hasNextPage: page * limit < totalUsers,
      hasPrevPage: page > 1,
    },
  };
};

// Edit user profile
export const updateUserByAdmin = async (userId, payload) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const allowedFields = ["fullName", "username", "email", "phone"];
  const updates = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updates[field] =
        typeof payload[field] === "string"
          ? payload[field].trim()
          : payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error("No valid profile fields provided");
    error.statusCode = 400;
    throw error;
  }

  if (updates.email) {
    updates.email = updates.email.toLowerCase();

    const existingUser = await User.findOne({
      email: updates.email,
      _id: { $ne: userId },
    }).select("_id");

    if (existingUser) {
      const error = new Error("Email is already in use");
      error.statusCode = 409;
      throw error;
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true },
  ).select("-password -refreshToken -resetPasswordToken");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

// Delete user
export const deleteUserByAdmin = async (userId, currentAdminId) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  if (String(userId) === String(currentAdminId)) {
    const error = new Error("You cannot delete your own account");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select("_id role");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Protect admin accounts from deletion through user management.
  if (user.role === "admin") {
    const error = new Error(
      "Admin accounts cannot be deleted through user management",
    );
    error.statusCode = 403;
    throw error;
  }

  await User.findByIdAndDelete(userId);

  return { deletedUserId: userId };
};

// Toggle user status (block/unblock)
export const toggleUserStatus = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select("isBlocked");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  return { user: { _id: user._id, isBlocked: user.isBlocked } };
};


/* ======================== Vendor Management ======================== */

// Get vendors with safe filters, search and pagination.
const getAllVendors = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const { search, isActive, isApproved, isVerified } = query;

  const filter = {
    deletedAt: null,
  };

  if (["true", "false"].includes(String(isActive))) {
    filter.isActive = String(isActive) === "true";
  }

  if (["true", "false"].includes(String(isApproved))) {
    filter.isApproved = String(isApproved) === "true";
  }

  if (["true", "false"].includes(String(isVerified))) {
    filter.isVerified = String(isVerified) === "true";
  }

  if (search?.trim()) {
    const regex = {
      $regex: search.trim(),
      $options: "i",
    };

    filter.$or = [
      { shopName: regex },
      { email: regex },
      { phone: regex },
      { shopSlug: regex },
    ];
  }

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .populate("user", "fullName email username")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),

    Vendor.countDocuments(filter),
  ]);

  return {
    vendors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get all vendor requests with search, filters and pagination.
export const getAllVendorRequests = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  const filter = {
    deletedAt: null,
  };

  if (["true", "false"].includes(String(query.isActive))) {
    filter.isActive = String(query.isActive) === "true";
  }

  if (["true", "false"].includes(String(query.isApproved))) {
    filter.isApproved = String(query.isApproved) === "true";
  }

  if (["true", "false"].includes(String(query.isVerified))) {
    filter.isVerified = String(query.isVerified) === "true";
  }

  if (query.search?.trim()) {
    const regex = {
      $regex: query.search.trim(),
      $options: "i",
    };

    filter.$or = [
      { shopName: regex },
      { email: regex },
      { phone: regex },
      { shopSlug: regex },
    ];
  }

  const [requests, total] = await Promise.all([
    Vendor.find(filter)
      .populate("user", "fullName email username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Vendor.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// Get single vendor request details.
export const getVendorRequestById = async (vendorId) => {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new ApiError(400, "Invalid vendor request ID");
  }

  const request = await Vendor.findOne({
    _id: vendorId,
    deletedAt: null,
  })
    .populate("user", "fullName email username phone")
    .lean();

  if (!request) {
    throw new ApiError(404, "Vendor request not found");
  }

  return request;
};


// Get pending vendor requests.
export const getPendingVendorRequests = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  const filter = {
    deletedAt: null,
    isApproved: false,
  };

  if (query.search?.trim()) {
    const regex = {
      $regex: query.search.trim(),
      $options: "i",
    };

    filter.$or = [
      { shopName: regex },
      { email: regex },
      { phone: regex },
      { shopSlug: regex },
    ];
  }

  const [requests, total] = await Promise.all([
    Vendor.find(filter)
      .populate("user", "fullName email username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Vendor.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// View one vendor.
const getVendorById = async (vendorId) => {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  const vendor = await Vendor.findOne({
    _id: vendorId,
    deletedAt: null,
  }).populate("user", "fullName email username");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};

// Edit only explicitly permitted vendor fields.
const updateVendor = async (vendorId, data = {}) => {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  const allowedFields = [
    "shopName",
    "shopDescription",
    "phone",
    "email",
    "website",
    "gstNumber",
    "panNumber",
    "address",
    "socialLinks",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No permitted vendor fields provided");
  }

  if (updateData.email !== undefined) {
    updateData.email = String(updateData.email).trim().toLowerCase();
  }

  const vendor = await Vendor.findOneAndUpdate(
    {
      _id: vendorId,
      deletedAt: null,
    },
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  ).populate("user", "fullName email username");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};

// Soft-delete vendor. Does not permanently erase the record.
const deleteVendor = async (vendorId) => {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  const vendor = await Vendor.findOneAndUpdate(
    {
      _id: vendorId,
      deletedAt: null,
    },
    {
      $set: {
        deletedAt: new Date(),
        isActive: false,
      },
    },
    {
      new: true,
    },
  ).populate("user", "fullName email username");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found or already deleted");
  }

  return vendor;
};

// Explicitly activate or deactivate a vendor.
const toggleVendorStatus = async (vendorId, isActive) => {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  const vendor = await Vendor.findOneAndUpdate(
    {
      _id: vendorId,
      deletedAt: null,
    },
    {
      $set: { isActive },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("user", "fullName email username");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};

// Approve vendor without changing its active or verification status.
const approveVendor = async (vendorId) => {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  const vendor = await Vendor.findOneAndUpdate(
    {
      _id: vendorId,
      deletedAt: null,
    },
    {
      $set: { isApproved: true },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("user", "fullName email username");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};

// Reject vendor application. Requires rejectionReason in Vendor schema.
const rejectVendor = async (vendorId, reason) => {
  if (!mongoose.isValidObjectId(vendorId)) {
    throw new ApiError(400, "Invalid vendor ID");
  }

  if (!reason?.trim()) {
    throw new ApiError(400, "Rejection reason is required");
  }

  const vendor = await Vendor.findOneAndUpdate(
    {
      _id: vendorId,
      deletedAt: null,
    },
    {
      $set: {
        isApproved: false,
        rejectionReason: reason.trim(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("user", "fullName email username");

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};

/* ======================== Product Moderation ======================== */

// get pending products
const getPendingProducts = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  const [products, total] = await Promise.all([
    Product.find({
      status: PRODUCT_STATUS.PENDING_APPROVAL,
    })
      .populate("vendor", "shopName")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),

    Product.countDocuments({
      status: PRODUCT_STATUS.PENDING_APPROVAL,
    }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get all products with search, filters and pagination.
export const getAllProducts = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  const filter = {
    deletedAt: null,
  };

  if (query.search?.trim()) {
    const regex = {
      $regex: query.search.trim(),
      $options: "i",
    };

    filter.$or = [
      { name: regex },
      { slug: regex },
      { sku: regex },
    ];
  }

  if (
    ["draft", "pending_approval", "published", "rejected", "archived"]
      .includes(query.status)
  ) {
    filter.status = query.status;
  }

  if (["true", "false"].includes(String(query.isActive))) {
    filter.isActive = String(query.isActive) === "true";
  }

  if (query.category && mongoose.isValidObjectId(query.category)) {
    filter.category = query.category;
  }

  if (query.vendor && mongoose.isValidObjectId(query.vendor)) {
    filter.vendor = query.vendor;
  }

  // Build sort option
  let sortOption = { createdAt: -1 };
  if (query.sortBy) {
    const sortValue = String(query.sortBy).toLowerCase();
    const isAscending = sortValue.includes("asc");

    if (sortValue.includes("price")) {
      sortOption = { price: isAscending ? 1 : -1 };
    } else if (sortValue.includes("stock") || sortValue.includes("quantity")) {
      sortOption = { stock: isAscending ? 1 : -1 };
    } else if (sortValue.includes("name")) {
      sortOption = { name: isAscending ? 1 : -1 };
    } else if (sortValue === "oldest") {
      sortOption = { createdAt: 1 };
    }
  }

  // Stock status filter
  if (["in_stock", "low_stock", "out_of_stock"].includes(query.stockStatus)) {
    if (query.stockStatus === "in_stock") {
      filter.stock = { $gt: 0 };
    } else if (query.stockStatus === "low_stock") {
      filter.stock = { $gt: 0, $lte: 10 };
    } else if (query.stockStatus === "out_of_stock") {
      filter.stock = { $eq: 0 };
    }
  }

  const [products, total] = await Promise.all([
    Product.aggregate([
      { $match: filter },
      { $sort: sortOption },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "vendor",
          foreignField: "_id",
          as: "vendorUser",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $lookup: {
          from: "vendors",
          localField: "vendor",
          foreignField: "user",
          as: "vendor",
          pipeline: [{ $limit: 1 }],
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          shortDescription: 1,
          description: 1,
          price: 1,
          sellingPrice: 1,
          salePrice: 1,
          discountPrice: 1,
          mrp: 1,
          discount: 1,
          stock: 1,
          sku: 1,
          images: 1,
          thumbnail: 1,
          featured: 1,
          flashSale: 1,
          bestSeller: 1,
          trending: 1,
          newArrival: 1,
          isActive: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          category: { $arrayElemAt: ["$category", 0] },
          brand: { $arrayElemAt: ["$brand", 0] },
          vendor: {
            fullName: { $arrayElemAt: ["$vendorUser.fullName", 0] },
            email: { $arrayElemAt: ["$vendorUser.email", 0] },
            shopName: { $arrayElemAt: ["$vendor.shopName", 0] },
            shopSlug: { $arrayElemAt: ["$vendor.shopSlug", 0] },
          },
        },
      },
    ]),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get single product details.
export const getProductById = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: productId,
    deletedAt: null,
  })
    .populate("category", "name")
    .populate("brand", "name")
    .populate("vendor", "fullName email")
    .lean();

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

// Edit product fields permitted for admin.
export const updateProductByAdmin = async (productId, data = {}) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const allowedFields = [
    "name",
    "slug",
    "shortDescription",
    "description",
    "category",
    "brand",
    "price",
    "stock",
    "sku",
    "tags",
    "specifications",
    "featured",
    "flashSale",
    "bestSeller",
    "trending",
    "newArrival",
    "seoTitle",
    "seoDescription",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No permitted product fields provided");
  }

  if (
    updateData.category &&
    !mongoose.isValidObjectId(updateData.category)
  ) {
    throw new ApiError(400, "Invalid category ID");
  }

  if (
    updateData.brand &&
    !mongoose.isValidObjectId(updateData.brand)
  ) {
    throw new ApiError(400, "Invalid brand ID");
  }

  if (updateData.slug !== undefined) {
    updateData.slug = String(updateData.slug).trim().toLowerCase();
  }

  if (updateData.sku !== undefined) {
    updateData.sku = String(updateData.sku).trim().toUpperCase();
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      deletedAt: null,
    },
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("category", "name")
    .populate("brand", "name")
    .populate("vendor", "fullName email");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

// Soft-delete product.
export const deleteProductByAdmin = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      deletedAt: null,
    },
    {
      $set: {
        deletedAt: new Date(),
        isActive: false,
        status: "archived",
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) {
    throw new ApiError(404, "Product not found or already deleted");
  }

  return { deletedProductId: productId };
};

//approve products
const approveProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { status: PRODUCT_STATUS.PUBLISHED, isActive: true },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

// reject products
const rejectProduct = async (productId, reason) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    {
      status: PRODUCT_STATUS.REJECTED,
      rejectionReason: reason,
    },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

// Update product activation status (Enable/Disable)
// Only allowed for products with status: "published" (approved products)
const updateProductStatus = async (productId, isActive) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean value");
  }

  // Find the product and check if status allows toggle
  const product = await Product.findOne({
    _id: productId,
    deletedAt: null,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Only allow toggle for published products (approved and ready for sale)
  // Prevent enabling draft, pending_approval, rejected, archived products
  if (product.status !== PRODUCT_STATUS.PUBLISHED && product.status !== "active") {
    throw new ApiError(
      400,
      `Cannot ${isActive ? "activate" : "deactivate"} product with status: ${product.status}. Only published products can be enabled/disabled.`
    );
  }

  // Update only the isActive field, preserve status
  product.isActive = isActive;

  await product.save();

  return product;
};

/* ======================== Order Management ======================== */


// 1. All orders with search, filters and pagination
export const getAllOrders = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  const filter = {};

  if (query.status && query.status !== "all") {
    filter.orderStatus = query.status;
  }

  if (query.paymentStatus && query.paymentStatus !== "all") {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.paymentMethod && query.paymentMethod !== "all") {
    filter.paymentMethod = query.paymentMethod;
  }

  // Handle dateRange shortcuts
  if (query.dateRange && query.dateRange !== "all") {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (query.dateRange) {
      case "today":
        filter.createdAt = { $gte: todayStart, $lt: tomorrow };
        break;
      case "yesterday": {
        const yesterday = new Date(todayStart);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        filter.createdAt = { $gte: yesterday, $lt: yesterdayEnd };
        break;
      }
      case "last7days":
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filter.createdAt = { $gte: sevenDaysAgo, $lt: tomorrow };
        break;
      case "last30days":
        const thirtyDaysAgo = new Date(todayStart);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filter.createdAt = { $gte: thirtyDaysAgo, $lt: tomorrow };
        break;
      case "thisMonth":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        filter.createdAt = { $gte: monthStart, $lt: nextMonth };
        break;
      case "lastMonth":
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        filter.createdAt = { $gte: lastMonthStart, $lt: lastMonthEnd };
        break;
    }
  }

  if ((query.startDate || query.endDate) && !filter.createdAt) {
    filter.createdAt = {};

    if (query.startDate) {
      const start = new Date(query.startDate);
      if (Number.isNaN(start.getTime())) {
        throw new ApiError(400, "Invalid start date");
      }
      filter.createdAt.$gte = start;
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      if (Number.isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid end date");
      }
      filter.createdAt.$lte = end;
    }
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    const matchingUsers = await User.find({
      $or: [{ fullName: regex }, { email: regex }, { username: regex }],
    }).select("_id");

    filter.$or = [
      { orderNumber: regex },
      { trackingNumber: regex },
      { razorpayOrderId: regex },
      { user: { $in: matchingUsers.map((user) => user._id) } },
    ];
  }

  const getSort = (sortParam) => {
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { totalAmount: -1 },
      lowest: { totalAmount: 1 },
    };
    return sortMap[sortParam] || sortMap.newest;
  };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "fullName email username")
      .sort(getSort(query.sort))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 2. Single order details
export const getOrderById = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId)
    .populate("user", "fullName email username phone")
    .populate("items.product", "name slug thumbnail")
    .populate("items.vendor", "fullName email")
    .lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

// 3. Update order status
export const updateOrderStatus = async (orderId, status, note = "") => {
  const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out For Delivery",
    "Delivered",
    "Cancelled",
    "Returned",
    "Refunded",
  ];

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (["Cancelled", "Refunded", "Returned"].includes(order.orderStatus)) {
    throw new ApiError(400, "This order status cannot be changed");
  }

  order.orderStatus = status;

  if (status === "Delivered") {
    order.deliveredAt = new Date();
  }

  order.statusHistory.push({
    status,
    note: String(note).trim(),
    updatedAt: new Date(),
  });

  await order.save();

  return order;
};

// 4. Cancel order
export const cancelOrder = async (orderId, reason = "") => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (
    ["Delivered", "Cancelled", "Returned", "Refunded"].includes(
      order.orderStatus,
    )
  ) {
    throw new ApiError(400, "This order cannot be cancelled");
  }

  order.orderStatus = "Cancelled";
  order.cancelledAt = new Date();
  order.notes = reason.trim() || order.notes;

  order.statusHistory.push({
    status: "Cancelled",
    note: reason.trim() || "Order cancelled by admin",
    updatedAt: new Date(),
  });

  await order.save();

  return order;
};

// 5. Get refund records
export const getRefundRequests = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  // Schema currently has no separate refund-request status.
  const filter = {
    $or: [
      { orderStatus: "Returned" },
      { refundAmount: { $gt: 0 } },
      { paymentStatus: "Refunded" },
    ],
  };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "fullName email")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 6. Record refund
export const processRefund = async (
  orderId,
  amount,
  reason,
  razorpayPaymentId
) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentMethod !== "RAZORPAY") {
    throw new ApiError(
      400,
      "Razorpay refund is only available for Razorpay payments"
    );
  }

  if (order.paymentStatus !== "Paid") {
    throw new ApiError(
      400,
      "Order payment is not eligible for refund"
    );
  }

  if (!razorpayPaymentId?.trim()) {
    throw new ApiError(400, "Razorpay payment ID not found");
  }

  if (!reason?.trim()) {
    throw new ApiError(400, "Refund reason is required");
  }

  const totalAmount = Number(order.totalAmount);
  const alreadyRefunded = Number(order.refundAmount || 0);

  const remainingAmount = Number(
    (totalAmount - alreadyRefunded).toFixed(2)
  );

  const refundAmount =
    amount === undefined || amount === null || amount === ""
      ? remainingAmount
      : Number(amount);

  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw new ApiError(400, "Invalid refund amount");
  }

  if (refundAmount > remainingAmount) {
    throw new ApiError(
      400,
      "Refund exceeds remaining order amount"
    );
  }

  // Use Razorpay Payment ID from the Payment document.
  const refund = await razorpay.payments.refund(
    razorpayPaymentId.trim(),
    {
      amount: Math.round(refundAmount * 100),
      notes: {
        orderId: String(order._id),
        reason: reason.trim(),
      },
    }
  );

  order.refundAmount = Number(
    (alreadyRefunded + refundAmount).toFixed(2)
  );

  order.refundReason = reason.trim();
  order.refundedAt = new Date();

  if (order.refundAmount >= totalAmount) {
    order.paymentStatus = "Refunded";
    order.orderStatus = "Refunded";

    order.statusHistory.push({
      status: "Refunded",
      updatedAt: new Date(),
      note: `Razorpay refund ${refund.id}: ${reason.trim()}`,
    });
  }

  await order.save();

  return {
    order,
    refund: {
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      paymentId: refund.payment_id,
    },
  };
};


// 7. Update shipping and tracking
export const updateOrderShipping = async (orderId, data = {}) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const allowedFields = [
    "trackingNumber",
    "courierPartner",
    "expectedDeliveryDate",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updates[field] = data[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No shipping fields provided");
  }

  if (updates.expectedDeliveryDate) {
    const date = new Date(updates.expectedDeliveryDate);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(400, "Invalid expected delivery date");
    }

    updates.expectedDeliveryDate = date;
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { $set: updates },
    { new: true, runValidators: true },
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

// 8. Get order status history
export const getOrderStatusHistory = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(orderId)
    .select("orderNumber orderStatus statusHistory")
    .lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order.statusHistory;
};


/*                categories management               */

/* -------------------- 1. Get All Categories -------------------- */

export const getAllCategories = async (query = {}) => {
  // Pagination
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  // Exclude soft-deleted categories
  const filter = { deletedAt: null };

  // Search by category name or description
  if (query.search?.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  // Filter by active/inactive status
  if (query.isActive !== undefined) {
    if (!["true", "false"].includes(String(query.isActive))) {
      throw new ApiError(400, "Invalid category status");
    }

    filter.isActive = String(query.isActive) === "true";
  }

  // Filter featured categories
  if (query.isFeatured !== undefined) {
    if (!["true", "false"].includes(String(query.isFeatured))) {
      throw new ApiError(400, "Invalid featured status");
    }

    filter.isFeatured = String(query.isFeatured) === "true";
  }

  // Filter by parent category
  if (query.parentCategory !== undefined) {
    if (
      query.parentCategory !== "null" &&
      !mongoose.isValidObjectId(query.parentCategory)
    ) {
      throw new ApiError(400, "Invalid parent category ID");
    }

    filter.parentCategory =
      query.parentCategory === "null" ? null : query.parentCategory;
  }

  // Fetch categories and total count
  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("parentCategory", "name slug")
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Category.countDocuments(filter),
  ]);

  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* -------------------- 2. Get Single Category -------------------- */

export const getCategoryById = async (id) => {
  // Validate category ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // Fetch category and parent details
  const category = await Category.findOne({
    _id: id,
    deletedAt: null,
  })
    .populate("parentCategory", "name slug")
    .lean();

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

/* -------------------- 3. Create Category -------------------- */

export const createCategory = async (data = {}) => {
  // Validate and normalize category name
  if (typeof data.name !== "string" || !data.name.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const name = data.name.trim();

  // Generate slug if not provided
  const slug =
    typeof data.slug === "string" && data.slug.trim()
      ? data.slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      : name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

  if (!slug) {
    throw new ApiError(400, "A valid category slug is required");
  }

  // Check duplicate name or slug, including soft-deleted records
  const existing = await Category.findOne({
    $or: [{ name }, { slug }],
  });

  if (existing) {
    throw new ApiError(409, "Category name or slug already exists");
  }

  // Validate parent category and determine hierarchy level
  let parentCategory = null;
  let level = 1;

  if (data.parentCategory) {
    if (!mongoose.isValidObjectId(data.parentCategory)) {
      throw new ApiError(400, "Invalid parent category ID");
    }

    const parent = await Category.findOne({
      _id: data.parentCategory,
      deletedAt: null,
    });

    if (!parent) {
      throw new ApiError(404, "Parent category not found");
    }

    parentCategory = parent._id;
    level = parent.level + 1;
  }

  // Create category using the actual schema fields
  const category = await Category.create({
    name,
    slug,
    description: data.description ?? "",
    image: {
      url: data.image?.url ?? "",
      publicId: data.image?.publicId ?? "",
    },
    parentCategory,
    level,
    isFeatured: data.isFeatured ?? false,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
  });

  return category;
};

/* -------------------- 4. Update Category -------------------- */

export const updateCategory = async (id, data = {}) => {
  // Validate category ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // Find existing category
  const category = await Category.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Update name
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      throw new ApiError(400, "Category name cannot be empty");
    }

    category.name = data.name.trim();
  }

  // Update slug
  if (data.slug !== undefined) {
    if (typeof data.slug !== "string" || !data.slug.trim()) {
      throw new ApiError(400, "Category slug cannot be empty");
    }

    category.slug = data.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  } else if (data.name !== undefined) {
    // Regenerate slug when name changes unless slug is explicitly supplied
    category.slug = category.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Prevent duplicate names or slugs
  const duplicate = await Category.findOne({
    _id: { $ne: id },
    $or: [{ name: category.name }, { slug: category.slug }],
  });

  if (duplicate) {
    throw new ApiError(409, "Category name or slug already exists");
  }

  // Update description
  if (data.description !== undefined) {
    category.description = data.description;
  }

  // Update nested image fields
  if (data.image !== undefined) {
    if (
      !data.image ||
      typeof data.image !== "object" ||
      Array.isArray(data.image)
    ) {
      throw new ApiError(400, "Image must be an object");
    }

    if (data.image.url !== undefined) {
      category.image.url = data.image.url;
    }

    if (data.image.publicId !== undefined) {
      category.image.publicId = data.image.publicId;
    }
  }

  // Update parent category and hierarchy level
  if (data.parentCategory !== undefined) {
    if (data.parentCategory === null || data.parentCategory === "") {
      category.parentCategory = null;
      category.level = 1;
    } else {
      if (!mongoose.isValidObjectId(data.parentCategory)) {
        throw new ApiError(400, "Invalid parent category ID");
      }

      // A category cannot be its own parent
      if (String(data.parentCategory) === String(id)) {
        throw new ApiError(400, "Category cannot be its own parent");
      }

      const parent = await Category.findOne({
        _id: data.parentCategory,
        deletedAt: null,
      });

      if (!parent) {
        throw new ApiError(404, "Parent category not found");
      }

      category.parentCategory = parent._id;
      category.level = parent.level + 1;
    }
  }

  // Update featured flag, sort order and active status
  if (data.isFeatured !== undefined) {
    category.isFeatured = data.isFeatured;
  }

  if (data.sortOrder !== undefined) {
    category.sortOrder = data.sortOrder;
  }

  if (data.isActive !== undefined) {
    category.isActive = data.isActive;
  }

  // Save changes with schema validation
  await category.save();

  return category;
};

/* -------------------- 5. Delete Category -------------------- */

export const deleteCategory = async (id) => {
  // Validate category ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // Find category that has not already been deleted
  const category = await Category.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Soft delete: preserve the database record
  category.deletedAt = new Date();
  category.isActive = false;

  await category.save();

  return {
    id: category._id,
    message: "Category deleted successfully",
  };
};

/* -------------------- 6. Activate / Deactivate Category -------------------- */

export const updateCategoryStatus = async (id, isActive) => {
  // Validate category ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // Validate status value
  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  // Find category and exclude soft-deleted records
  const category = await Category.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Update category status
  category.isActive = isActive;

  await category.save();

  return category;
};


/* ======================== Brand Management ======================== */

const createBrandSlug = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const validateBrandId = (brandId) => {
  if (!mongoose.isValidObjectId(brandId)) {
    throw new ApiError(400, "Invalid brand ID");
  }
};

const getBrandByIdOrFail = async (brandId) => {
  validateBrandId(brandId);

  const brand = await Brand.findOne({
    _id: brandId,
    deletedAt: null,
  });

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  return brand;
};

const parseBrandBoolean = (value, fieldName) => {
  if (typeof value === "boolean") return value;

  if (value === "true") return true;
  if (value === "false") return false;

  throw new ApiError(400, `${fieldName} must be a boolean`);
};

/* -------------------- Get All Brands -------------------- */

export const getAllBrands = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  const filter = { deletedAt: null };

  if (query.search?.trim()) {
    const search = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  if (query.isActive !== undefined) {
    filter.isActive = parseBrandBoolean(query.isActive, "isActive");
  }

  if (query.isFeatured !== undefined) {
    filter.isFeatured = parseBrandBoolean(
      query.isFeatured,
      "isFeatured",
    );
  }

  const [brands, total] = await Promise.all([
    Brand.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Brand.countDocuments(filter),
  ]);

  return {
    brands,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* -------------------- Get Brand By ID -------------------- */

export const getBrandById = async (brandId) => {
  const brand = await getBrandByIdOrFail(brandId);
  return brand;
};

/* -------------------- Create Brand -------------------- */

export const createBrand = async (data = {}, imageFile = null) => {
  if (typeof data.name !== "string" || !data.name.trim()) {
    throw new ApiError(400, "Brand name is required");
  }

  const name = data.name.trim();
  const slug = createBrandSlug(
    typeof data.slug === "string" && data.slug.trim()
      ? data.slug
      : name,
  );

  if (!slug) {
    throw new ApiError(400, "A valid brand slug is required");
  }

  const existingBrand = await Brand.findOne({
    $or: [{ name }, { slug }],
  });

  if (existingBrand) {
    throw new ApiError(409, "Brand name or slug already exists");
  }

  const sortOrder =
    data.sortOrder === undefined || data.sortOrder === ""
      ? 0
      : Number(data.sortOrder);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new ApiError(400, "sortOrder must be a non-negative integer");
  }

  let uploadedLogo = null;

  try {
    if (imageFile?.path) {
      const uploadResult = await uploadOnCloudinary(
        imageFile.path,
        "shopsphere/brands",
      );

      if (!uploadResult?.secure_url || !uploadResult?.public_id) {
        throw new ApiError(500, "Brand logo upload failed");
      }

      uploadedLogo = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }

    const brand = await Brand.create({
      name,
      slug,
      description: data.description ?? "",
      logo: uploadedLogo ?? { url: "", publicId: "" },
      website: data.website ?? "",
      isFeatured:
        data.isFeatured === undefined
          ? false
          : parseBrandBoolean(data.isFeatured, "isFeatured"),
      sortOrder,
      isActive:
        data.isActive === undefined
          ? true
          : parseBrandBoolean(data.isActive, "isActive"),
    });

    return brand;
  } catch (error) {
    if (uploadedLogo?.publicId) {
      await deleteFromCloudinary(uploadedLogo.publicId).catch(() => null);
    }

    throw error;
  }
};

/* -------------------- Update Brand -------------------- */

export const updateBrand = async (
  brandId,
  data = {},
  imageFile = null,
) => {
  const brand = await getBrandByIdOrFail(brandId);

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      throw new ApiError(400, "Brand name cannot be empty");
    }

    brand.name = data.name.trim();
  }

  if (data.slug !== undefined) {
    if (typeof data.slug !== "string" || !data.slug.trim()) {
      throw new ApiError(400, "Brand slug cannot be empty");
    }

    brand.slug = createBrandSlug(data.slug);
  } else if (data.name !== undefined) {
    brand.slug = createBrandSlug(brand.name);
  }

  if (!brand.slug) {
    throw new ApiError(400, "A valid brand slug is required");
  }

  const duplicate = await Brand.findOne({
    _id: { $ne: brandId },
    $or: [{ name: brand.name }, { slug: brand.slug }],
  });

  if (duplicate) {
    throw new ApiError(409, "Brand name or slug already exists");
  }

  if (data.description !== undefined) {
    brand.description = data.description;
  }

  if (data.website !== undefined) {
    brand.website = data.website;
  }

  if (data.isFeatured !== undefined) {
    brand.isFeatured = parseBrandBoolean(
      data.isFeatured,
      "isFeatured",
    );
  }

  if (data.isActive !== undefined) {
    brand.isActive = parseBrandBoolean(data.isActive, "isActive");
  }

  if (data.sortOrder !== undefined) {
    const sortOrder = Number(data.sortOrder);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new ApiError(400, "sortOrder must be a non-negative integer");
    }

    brand.sortOrder = sortOrder;
  }

  let uploadedLogo = null;
  const oldLogoPublicId = brand.logo?.publicId;

  try {
    if (imageFile?.path) {
      const uploadResult = await uploadOnCloudinary(
        imageFile.path,
        "shopsphere/brands",
      );

      if (!uploadResult?.secure_url || !uploadResult?.public_id) {
        throw new ApiError(500, "Brand logo upload failed");
      }

      uploadedLogo = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };

      brand.logo = uploadedLogo;
    }

    await brand.save();

    if (
      uploadedLogo &&
      oldLogoPublicId &&
      oldLogoPublicId !== uploadedLogo.publicId
    ) {
      await deleteFromCloudinary(oldLogoPublicId).catch(() => null);
    }

    return brand;
  } catch (error) {
    if (uploadedLogo?.publicId) {
      await deleteFromCloudinary(uploadedLogo.publicId).catch(() => null);
    }

    throw error;
  }
};

/* -------------------- Soft Delete Brand -------------------- */

export const deleteBrand = async (brandId) => {
  const brand = await getBrandByIdOrFail(brandId);

  brand.deletedAt = new Date();
  brand.isActive = false;

  await brand.save();

  return {
    id: brand._id,
    message: "Brand deleted successfully",
  };
};

/* -------------------- Update Brand Status -------------------- */

export const updateBrandStatus = async (brandId, isActive) => {
  const activeStatus = parseBrandBoolean(isActive, "isActive");
  const brand = await getBrandByIdOrFail(brandId);

  brand.isActive = activeStatus;
  await brand.save();

  return brand;
};

/* -------------------- Update Brand Logo -------------------- */

export const updateBrandLogo = async (brandId, imageFile) => {
  if (!imageFile?.path) {
    throw new ApiError(400, "Brand logo image is required");
  }

  return updateBrand(brandId, {}, imageFile);
};

/* -------------------- Delete Brand Logo -------------------- */

export const deleteBrandLogo = async (brandId) => {
  const brand = await getBrandByIdOrFail(brandId);
  const oldPublicId = brand.logo?.publicId;

  brand.logo = { url: "", publicId: "" };
  await brand.save();

  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }

  return brand;
};


/*                 Coupons management                  */

/* -------------------- 1. Get All Coupons -------------------- */

export const getAllCoupons = async (query = {}) => {
  // Pagination
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  // Search and filter
  const filter = {};

  if (query.search?.trim()) {
    const search = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (query.isActive !== undefined) {
    if (!["true", "false"].includes(String(query.isActive))) {
      throw new ApiError(400, "Invalid coupon status");
    }

    filter.isActive = String(query.isActive) === "true";
  }

  if (query.discountType !== undefined) {
    if (!["percentage", "fixed"].includes(query.discountType)) {
      throw new ApiError(400, "Invalid discount type");
    }

    filter.discountType = query.discountType;
  }

  if (query.startDate || query.endDate) {
    filter.expiryDate = {};

    if (query.startDate) {
      const startDate = new Date(query.startDate);

      if (Number.isNaN(startDate.getTime())) {
        throw new ApiError(400, "Invalid start date filter");
      }

      filter.expiryDate.$gte = startDate;
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);

      if (Number.isNaN(endDate.getTime())) {
        throw new ApiError(400, "Invalid end date filter");
      }

      filter.expiryDate.$lte = endDate;
    }
  }

  // Fetch coupons and total count
  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .populate("applicableCategories", "name slug")
      .populate("applicableProducts", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Coupon.countDocuments(filter),
  ]);

  return {
    coupons,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* -------------------- 2. Get Single Coupon -------------------- */

export const getCouponById = async (id) => {
  // Validate coupon ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  // Fetch coupon details
  const coupon = await Coupon.findById(id)
    .populate("applicableCategories", "name slug")
    .populate("applicableProducts", "name slug")
    .populate("usedBy.user", "fullName email")
    .lean();

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return coupon;
};

/* -------------------- 3. Create Coupon -------------------- */

export const createCoupon = async (data = {}) => {
  // Normalize and validate coupon code
  if (typeof data.code !== "string" || !data.code.trim()) {
    throw new ApiError(400, "Coupon code is required");
  }

  const code = data.code.trim().toUpperCase();

  // Validate discount type
  if (!["percentage", "fixed"].includes(data.discountType)) {
    throw new ApiError(400, "Discount type must be percentage or fixed");
  }

  const discountValue = Number(data.discountValue);

  if (!Number.isFinite(discountValue) || discountValue < 1) {
    throw new ApiError(400, "Discount value must be at least 1");
  }

  if (data.discountType === "percentage" && discountValue > 100) {
    throw new ApiError(400, "Percentage discount cannot exceed 100");
  }

  // Check duplicate coupon code
  const existingCoupon = await Coupon.findOne({ code });

  if (existingCoupon) {
    throw new ApiError(409, "Coupon code already exists");
  }

  // Validate applicable category IDs
  const categoryIds = data.applicableCategories ?? [];

  if (!Array.isArray(categoryIds)) {
    throw new ApiError(400, "Applicable categories must be an array");
  }

  for (const id of categoryIds) {
    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(400, "Invalid applicable category ID");
    }
  }

  if (categoryIds.length) {
    const count = await Category.countDocuments({
      _id: { $in: categoryIds },
      deletedAt: null,
    });

    if (count !== new Set(categoryIds.map(String)).size) {
      throw new ApiError(400, "One or more categories do not exist");
    }
  }

  // Validate applicable product IDs
  const productIds = data.applicableProducts ?? [];

  if (!Array.isArray(productIds)) {
    throw new ApiError(400, "Applicable products must be an array");
  }

  for (const id of productIds) {
    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(400, "Invalid applicable product ID");
    }
  }

  if (productIds.length) {
    const count = await Product.countDocuments({
      _id: { $in: productIds },
    });

    if (count !== new Set(productIds.map(String)).size) {
      throw new ApiError(400, "One or more products do not exist");
    }
  }

  // Create coupon; Mongoose validates dates and schema fields
  const coupon = await Coupon.create({
    code,
    description: data.description ?? "",
    discountType: data.discountType,
    discountValue,
    minimumOrderAmount: data.minimumOrderAmount ?? 0,
    maximumDiscount: data.maximumDiscount ?? 0,
    startDate: data.startDate,
    expiryDate: data.expiryDate,
    usageLimit: data.usageLimit ?? 1,
    isActive: data.isActive ?? true,
    applicableCategories: categoryIds,
    applicableProducts: productIds,
  });

  return coupon;
};

/* -------------------- 4. Update Coupon -------------------- */

export const updateCoupon = async (id, data = {}) => {
  // Validate coupon ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  // Prevent changes to usage history and usage counter
  const allowedFields = [
    "code",
    "description",
    "discountType",
    "discountValue",
    "minimumOrderAmount",
    "maximumDiscount",
    "startDate",
    "expiryDate",
    "usageLimit",
    "isActive",
    "applicableCategories",
    "applicableProducts",
  ];

  for (const key of Object.keys(data)) {
    if (!allowedFields.includes(key)) {
      throw new ApiError(400, `Field '${key}' cannot be updated`);
    }
  }

  // Normalize and check coupon code
  if (data.code !== undefined) {
    if (typeof data.code !== "string" || !data.code.trim()) {
      throw new ApiError(400, "Coupon code cannot be empty");
    }

    const code = data.code.trim().toUpperCase();

    const duplicate = await Coupon.findOne({
      code,
      _id: { $ne: id },
    });

    if (duplicate) {
      throw new ApiError(409, "Coupon code already exists");
    }

    coupon.code = code;
  }

  // Validate discount type
  const discountType = data.discountType ?? coupon.discountType;

  if (!["percentage", "fixed"].includes(discountType)) {
    throw new ApiError(400, "Invalid discount type");
  }

  const discountValue =
    data.discountValue !== undefined
      ? Number(data.discountValue)
      : coupon.discountValue;

  if (!Number.isFinite(discountValue) || discountValue < 1) {
    throw new ApiError(400, "Discount value must be at least 1");
  }

  if (discountType === "percentage" && discountValue > 100) {
    throw new ApiError(400, "Percentage discount cannot exceed 100");
  }

  // Update discount fields
  if (data.discountType !== undefined) {
    coupon.discountType = data.discountType;
  }

  if (data.discountValue !== undefined) {
    coupon.discountValue = discountValue;
  }

  // Update simple fields
  const simpleFields = [
    "description",
    "minimumOrderAmount",
    "maximumDiscount",
    "startDate",
    "expiryDate",
    "usageLimit",
    "isActive",
  ];

  for (const field of simpleFields) {
    if (data[field] !== undefined) {
      coupon[field] = data[field];
    }
  }

  // Do not reduce the usage limit below coupons already used
  if (coupon.usageLimit < coupon.usedCount) {
    throw new ApiError(400, "Usage limit cannot be less than used count");
  }

  // Validate and update applicable category IDs
  if (data.applicableCategories !== undefined) {
    if (!Array.isArray(data.applicableCategories)) {
      throw new ApiError(400, "Applicable categories must be an array");
    }

    for (const categoryId of data.applicableCategories) {
      if (!mongoose.isValidObjectId(categoryId)) {
        throw new ApiError(400, "Invalid applicable category ID");
      }
    }

    const uniqueIds = [...new Set(data.applicableCategories.map(String))];

    const count = await Category.countDocuments({
      _id: { $in: uniqueIds },
      deletedAt: null,
    });

    if (count !== uniqueIds.length) {
      throw new ApiError(400, "One or more categories do not exist");
    }

    coupon.applicableCategories = uniqueIds;
  }

  // Validate and update applicable product IDs
  if (data.applicableProducts !== undefined) {
    if (!Array.isArray(data.applicableProducts)) {
      throw new ApiError(400, "Applicable products must be an array");
    }

    for (const productId of data.applicableProducts) {
      if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid applicable product ID");
      }
    }

    const uniqueIds = [...new Set(data.applicableProducts.map(String))];

    const count = await Product.countDocuments({
      _id: { $in: uniqueIds },
    });

    if (count !== uniqueIds.length) {
      throw new ApiError(400, "One or more products do not exist");
    }

    coupon.applicableProducts = uniqueIds;
  }

  // Save with schema validation
  await coupon.save();

  return coupon;
};

/* -------------------- 5. Delete Coupon -------------------- */

export const deleteCoupon = async (id) => {
  // Validate coupon ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  // Deactivate instead of permanently deleting usage history
  coupon.isActive = false;
  await coupon.save();

  return {
    id: coupon._id,
    code: coupon.code,
    isActive: coupon.isActive,
    message: "Coupon deactivated successfully",
  };
};

/* -------------------- 6. Activate / Deactivate Coupon -------------------- */

export const updateCouponStatus = async (id, isActive) => {
  // Validate coupon ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  // Validate status
  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  // Do not activate an expired coupon
  if (isActive && coupon.expiryDate <= new Date()) {
    throw new ApiError(400, "Expired coupon cannot be activated");
  }

  coupon.isActive = isActive;
  await coupon.save();

  return coupon;
};

/* -------------------- 7. Get Coupon Usage Statistics -------------------- */

export const getCouponUsage = async (id) => {
  // Validate coupon ID
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  // Fetch coupon and recorded users
  const coupon = await Coupon.findById(id)
    .populate("usedBy.user", "fullName email")
    .lean();

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  const usedBy = coupon.usedBy ?? [];

  return {
    couponId: coupon._id,
    code: coupon.code,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    remainingUses: Math.max(0, coupon.usageLimit - coupon.usedCount),
    usagePercentage:
      coupon.usageLimit > 0
        ? Math.min(
            100,
            Number(((coupon.usedCount / coupon.usageLimit) * 100).toFixed(2)),
          )
        : 0,
    users: usedBy,
  };
};

/*                     review managements                            */

// Get all reviews with search, filters and pagination.
export const getAllReviews = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search?.trim()) {
    const search = query.search.trim();
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    filter.$or = [
      { title: regex },
      { comment: regex },
    ];
  }

  if (query.rating !== undefined) {
    const rating = Number(query.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }

    filter.rating = rating;
  }

  if (query.isApproved !== undefined) {
    if (!["true", "false"].includes(query.isApproved)) {
      throw new ApiError(400, "Invalid approval filter");
    }

    filter.isApproved = query.isApproved === "true";
  }

  if (query.isVerifiedPurchase !== undefined) {
    if (!["true", "false"].includes(query.isVerifiedPurchase)) {
      throw new ApiError(400, "Invalid verified purchase filter");
    }

    filter.isVerifiedPurchase = query.isVerifiedPurchase === "true";
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "fullName username email")
      .populate("product", "name slug")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// Get single review details.
export const getReviewById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(id)
    .populate("user", "fullName username email phone")
    .populate("product", "name slug")
    .populate("order", "orderNumber")
    .lean();

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  return review;
};


// Approve, reject or hide a review.
export const updateReviewStatus = async (id, status) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  if (!["approved", "rejected", "hidden"].includes(status)) {
    throw new ApiError(
      400,
      "Status must be approved, rejected or hidden"
    );
  }

  const review = await Review.findById(id);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Current schema stores only approved/unapproved.
  review.isApproved = status === "approved";
  await review.save();

  return review;
};


// Delete a review permanently.
export const deleteReview = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findByIdAndDelete(id);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  return {
    message: "Review deleted successfully",
    reviewId: id,
  };
};


// Get reported reviews.
export const getReportedReviews = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  // Requires isReported field in the Review schema.
  const filter = { isReported: true };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "fullName username email")
      .populate("product", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                manage payments and vendor payouts                   */

// GET all payments with filters and pagination
export const getAllPayments = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const filter = {};

  if (query.status) filter.status = query.status.toUpperCase();
  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod.toUpperCase();
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      if (Number.isNaN(startDate.getTime())) {
        throw new ApiError(400, "Invalid startDate");
      }
      filter.createdAt.$gte = startDate;
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      if (Number.isNaN(endDate.getTime())) {
        throw new ApiError(400, "Invalid endDate");
      }
      filter.createdAt.$lte = endDate;
    }
  }

  if (query.search?.trim()) {
    const search = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(search, "i");

    filter.$or = [
      { transactionId: regex },
      { razorpayOrderId: regex },
      { razorpayPaymentId: regex },
      { refundId: regex },
    ];
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("user", "fullName username email")
      .populate("order", "orderNumber totalAmount paymentStatus orderStatus")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// GET single payment details
export const getPaymentById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid payment ID");
  }

  const payment = await Payment.findById(id)
    .populate("user", "fullName username email phone")
    .populate("order");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return payment;
};


// POST process refund
export const refundPayment = async (id, data = {}) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid payment ID");
  }

  const payment = await Payment.findById(id);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (payment.status !== "SUCCESS") {
    throw new ApiError(400, "Only successful payments can be refunded");
  }

  if (!payment.order) {
    throw new ApiError(400, "Payment is not linked to an order");
  }

  if (!data.reason?.trim()) {
    throw new ApiError(400, "Refund reason is required");
  }

  // Existing function calls Razorpay and updates the Order.
  const result = await processRefund(
    payment.order,
    data.amount,
    data.reason,
    payment.razorpayPaymentId
  );

  // Sync the Payment record after the refund succeeds.
  payment.refundId = result.refund.id;
  payment.refundAmount = Number(result.order.refundAmount || 0);
  payment.refundReason = data.reason.trim();
  payment.refundedAt = result.order.refundedAt || new Date();

  if (result.order.paymentStatus === "Refunded") {
    payment.status = "REFUNDED";
  }

  await payment.save();

  return {
    payment,
    refund: result.refund,
  };
};


// POST reconcile payment against Razorpay
export const reconcilePayment = async (paymentId) => {
  if (!mongoose.isValidObjectId(paymentId)) {
    throw new ApiError(400, "Invalid payment ID");
  }

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (!payment.razorpayPaymentId) {
    throw new ApiError(400, "Razorpay payment ID not found");
  }

  // Fetch the current status directly from Razorpay.
  const gatewayPayment = await razorpay.payments.fetch(
    payment.razorpayPaymentId
  );

  if (
    payment.razorpayOrderId &&
    gatewayPayment.order_id &&
    payment.razorpayOrderId !== gatewayPayment.order_id
  ) {
    throw new ApiError(409, "Razorpay order ID mismatch");
  }

  const gatewayStatus = gatewayPayment.status;

  const statusMap = {
    created: "CREATED",
    authorized: "PENDING",
    captured: "SUCCESS",
    failed: "FAILED",
  };

  const reconciledStatus = statusMap[gatewayStatus];

  if (!reconciledStatus) {
    throw new ApiError(
      400,
      `Unsupported Razorpay payment status: ${gatewayStatus}`
    );
  }

  // Do not overwrite an already-recorded full refund.
  if (payment.status !== "REFUNDED") {
    payment.status = reconciledStatus;
  }

  payment.gatewayResponse = gatewayPayment;

  if (reconciledStatus === "SUCCESS" && !payment.paidAt) {
    payment.paidAt = gatewayPayment.created_at
      ? new Date(gatewayPayment.created_at * 1000)
      : new Date();
  }

  await payment.save();

  const order = await Order.findById(payment.order);

  if (order && order.paymentStatus !== "Refunded") {
    if (reconciledStatus === "SUCCESS") {
      order.paymentStatus = "Paid";
      order.razorpayPaymentId = payment.razorpayPaymentId;
      order.paidAt = payment.paidAt;
    } else if (reconciledStatus === "FAILED") {
      order.paymentStatus = "Failed";
    } else {
      order.paymentStatus = "Pending";
    }

    await order.save();
  }

  return {
    payment,
    gateway: {
      paymentId: gatewayPayment.id,
      status: gatewayStatus,
      amount: gatewayPayment.amount / 100,
      currency: gatewayPayment.currency,
    },
  };
};

// GET all vendor payouts with filters and pagination
export const getAllVendorPayouts = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const filter = {};

  if (query.status) {
    const status = query.status.toUpperCase();
    const allowedStatuses = ["PENDING", "PROCESSING", "PAID", "FAILED"];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid payout status");
    }

    filter.status = status;
  }

  if (query.vendor) {
    if (!mongoose.isValidObjectId(query.vendor)) {
      throw new ApiError(400, "Invalid vendor ID");
    }

    filter.vendor = query.vendor;
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      if (Number.isNaN(startDate.getTime())) {
        throw new ApiError(400, "Invalid startDate");
      }
      filter.createdAt.$gte = startDate;
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      if (Number.isNaN(endDate.getTime())) {
        throw new ApiError(400, "Invalid endDate");
      }
      filter.createdAt.$lte = endDate;
    }
  }

  const [payouts, total] = await Promise.all([
    VendorPayout.find(filter)
      .populate("vendor")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    VendorPayout.countDocuments(filter),
  ]);

  return {
    payouts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// GET single vendor payout
export const getVendorPayoutById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid payout ID");
  }

  const payout = await VendorPayout.findById(id).populate("vendor");

  if (!payout) {
    throw new ApiError(404, "Vendor payout not found");
  }

  return payout;
};


// PATCH vendor payout status
export const updateVendorPayoutStatus = async (id, status) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid payout ID");
  }

  const allowedStatuses = ["PENDING", "PROCESSING", "PAID", "FAILED"];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid payout status");
  }

  const payout = await VendorPayout.findById(id);

  if (!payout) {
    throw new ApiError(404, "Vendor payout not found");
  }

  if (payout.status === "PAID" && status !== "PAID") {
    throw new ApiError(400, "A paid payout cannot be moved to another status");
  }

  payout.status = status;

  if (status === "PAID") {
    payout.paidAt = payout.paidAt || new Date();
  }

  await payout.save();

  return payout;
};


/* ======================== Admin Reports ======================== */

// Validate report date filters.
// Date-only endDate includes the entire selected day.
const getReportDateRange = (query = {}) => {
  const now = new Date();
  let startDate;
  let endDate;

  if (query.startDate) {
    startDate = new Date(query.startDate);

    if (Number.isNaN(startDate.getTime())) {
      throw new ApiError(400, "Invalid startDate");
    }
  }

  if (query.endDate) {
    endDate = new Date(query.endDate);

    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(400, "Invalid endDate");
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(query.endDate)) {
      endDate.setHours(23, 59, 59, 999);
    }
  }

  if (startDate && endDate && startDate > endDate) {
    throw new ApiError(400, "startDate cannot be after endDate");
  }

  return {
    startDate,
    endDate,
    createdAt: {
      ...(startDate && { $gte: startDate }),
      ...(endDate && { $lte: endDate }),
    },
  };
};

// Sales report grouped by date.
export const getSalesReport = async (query = {}) => {
  const range = getReportDateRange(query);
  const match = Object.keys(range.createdAt).length
    ? { createdAt: range.createdAt }
    : {};

  const [sales, totals] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          totalOrders: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0],
            },
          },
          grossSales: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "Paid"] },
                { $ifNull: ["$totalAmount", 0] },
                0,
              ],
            },
          },
          refunds: { $sum: { $ifNull: ["$refundAmount", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalOrders: 1,
          paidOrders: 1,
          grossSales: 1,
          refunds: 1,
          netRevenue: {
            $subtract: ["$grossSales", "$refunds"],
          },
        },
      },
      { $sort: { date: 1 } },
    ]),

    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0],
            },
          },
          grossSales: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "Paid"] },
                { $ifNull: ["$totalAmount", 0] },
                0,
              ],
            },
          },
          refunds: { $sum: { $ifNull: ["$refundAmount", 0] } },
        },
      },
    ]),
  ]);

  return {
    startDate: range.startDate ?? null,
    endDate: range.endDate ?? null,
    summary: totals[0]
      ? {
          ...totals[0],
          netRevenue: totals[0].grossSales - totals[0].refunds,
        }
      : {
          totalOrders: 0,
          paidOrders: 0,
          grossSales: 0,
          refunds: 0,
          netRevenue: 0,
        },
    sales,
  };
};

// Revenue report grouped by date.
export const getRevenueReport = async (query = {}) => {
  const report = await getSalesReport(query);

  return {
    startDate: report.startDate,
    endDate: report.endDate,
    totalGrossRevenue: report.summary.grossSales,
    totalRefunds: report.summary.refunds,
    netRevenue: report.summary.netRevenue,
    dailyRevenue: report.sales.map((item) => ({
      date: item.date,
      grossRevenue: item.grossSales,
      refunds: item.refunds,
      netRevenue: item.netRevenue,
    })),
  };
};

// Overall report summary.
export const getReportSummary = async (query = {}) => {
  const range = getReportDateRange(query);
  const match = Object.keys(range.createdAt).length
    ? { createdAt: range.createdAt }
    : {};

  const [orderStats, paymentStats, productCount, userCount] =
    await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            paidOrders: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0],
              },
            },
            grossSales: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "Paid"] },
                  { $ifNull: ["$totalAmount", 0] },
                  0,
                ],
              },
            },
            refunds: { $sum: { $ifNull: ["$refundAmount", 0] } },
            cancelledOrders: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "Cancelled"] }, 1, 0],
              },
            },
          },
        },
      ]),

      Payment.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),

      Product.countDocuments(),
      User.countDocuments(),
    ]);

  const orders = orderStats[0] ?? {
    totalOrders: 0,
    paidOrders: 0,
    grossSales: 0,
    refunds: 0,
    cancelledOrders: 0,
  };

  return {
    startDate: range.startDate ?? null,
    endDate: range.endDate ?? null,
    orders: {
      ...orders,
      netRevenue: orders.grossSales - orders.refunds,
    },
    payments: paymentStats,
    totalProducts: productCount,
    totalUsers: userCount,
  };
};

/* ======================== Activity Logs ======================== */

// List activity logs with filters and pagination.
export const getActivityLogs = async (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );

  const filter = {};

  if (query.user) {
    if (!mongoose.isValidObjectId(query.user)) {
      throw new ApiError(400, "Invalid user ID");
    }

    filter.user = query.user;
  }

  if (query.startDate || query.endDate) {
    const range = getReportDateRange(query);

    if (Object.keys(range.createdAt).length) {
      filter.createdAt = range.createdAt;
    }
  }

  if (query.search?.trim()) {
    const escaped = query.search.trim().replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const regex = new RegExp(escaped, "i");

    filter.$or = [
      { activity: regex },
      { description: regex },
      { ip: regex },
      { device: regex },
    ];
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate("user", "fullName username email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    ActivityLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Single activity log.
export const getActivityLogById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid activity log ID");
  }

  const log = await ActivityLog.findById(id)
    .populate("user", "fullName username email role")
    .lean();

  if (!log) {
    throw new ApiError(404, "Activity log not found");
  }

  return log;
};

// Export report rows as CSV or Excel-compatible XLS.
export const exportReport = async (query = {}) => {
  const format = String(query.format || "csv").toLowerCase();

  if (!["csv", "xls"].includes(format)) {
    throw new ApiError(400, "format must be csv or xls");
  }

  const report = await getSalesReport(query);

  const rows = [
    [
      "Date",
      "Total Orders",
      "Paid Orders",
      "Gross Sales",
      "Refunds",
      "Net Revenue",
    ],
    ...report.sales.map((item) => [
      item.date,
      item.totalOrders,
      item.paidOrders,
      item.grossSales,
      item.refunds,
      item.netRevenue,
    ]),
  ];

  const escapeCell = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  if (format === "csv") {
    return {
      format,
      filename: "sales-report.csv",
      contentType: "text/csv; charset=utf-8",
      content: "\uFEFF" + rows.map((row) => row.map(escapeCell).join(",")).join("\r\n"),
    };
  }

  // SpreadsheetML XML is Excel-compatible and requires no extra package.
  const xmlEscape = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const xmlRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell, index) => {
            const type = index === 0 || typeof cell === "string"
              ? "String"
              : "Number";

            return `<Cell><Data ss:Type="${type}">${xmlEscape(cell)}</Data></Cell>`;
          })
          .join("")}</Row>`,
    )
    .join("");

  const content = [
    '<?xml version="1.0"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    "<Worksheet ss:Name=\"Sales Report\"><Table>",
    xmlRows,
    "</Table></Worksheet></Workbook>",
  ].join("");

  return {
    format,
    filename: "sales-report.xls",
    contentType: "application/vnd.ms-excel; charset=utf-8",
    content,
  };
};

/* ======================== Inventory Management ======================== */

// Get inventory with search, filters and pagination.
const getInventory = async (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );

  const filter = {};

  if (query.search?.trim()) {
    const regex = new RegExp(
      query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    const products = await Product.find({
      $or: [{ name: regex }, { sku: regex }],
    }).select("_id");

    filter.product = { $in: products.map((item) => item._id) };
  }

  if (query.status === "low-stock") {
    filter.$expr = {
      $and: [
        { $gt: ["$stock", 0] },
        { $lte: ["$stock", "$lowStockLimit"] },
      ],
    };
  } else if (query.status === "out-of-stock") {
    filter.stock = 0;
  } else if (query.status === "available") {
    filter.$expr = { $gt: ["$stock", "$lowStockLimit"] };
  }

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate({
        path: "product",
        select: "name sku price thumbnail vendor status",
        populate: { path: "vendor", select: "fullName email" },
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Inventory.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

// Get low-stock inventory.
const getLowStockInventory = async (query = {}) => {
  return getInventory({ ...query, status: "low-stock" });
};

// Get out-of-stock inventory.
const getOutOfStockInventory = async (query = {}) => {
  return getInventory({ ...query, status: "out-of-stock" });
};

// Get stock details for one product.
const getInventoryByProductId = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const inventory = await Inventory.findOne({ product: productId })
    .populate({
      path: "product",
      select: "name sku price thumbnail vendor status stock sold",
      populate: { path: "vendor", select: "fullName email" },
    })
    .lean();

  if (!inventory) {
    throw new ApiError(404, "Inventory record not found");
  }

  return {
    ...inventory,
    availableStock: Math.max(
      0,
      inventory.stock - inventory.reservedStock,
    ),
  };
};

// Adjust stock and save a movement record.
const adjustInventoryStock = async (
  productId,
  { quantity, mode = "delta", reason } = {},
  adminId,
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (!mongoose.isValidObjectId(adminId)) {
    throw new ApiError(400, "Invalid admin ID");
  }

  if (!reason?.trim()) {
    throw new ApiError(400, "Stock adjustment reason is required");
  }

  if (!["delta", "set"].includes(mode)) {
    throw new ApiError(400, "Mode must be delta or set");
  }

  const numericQuantity = Number(quantity);

  if (
    !Number.isFinite(numericQuantity) ||
    !Number.isInteger(numericQuantity) ||
    (mode === "set" && numericQuantity < 0) ||
    (mode === "delta" && numericQuantity === 0)
  ) {
    throw new ApiError(400, "Invalid stock quantity");
  }

  const product = await Product.findOne({
    _id: productId,
    deletedAt: null,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let inventory = await Inventory.findOne({ product: productId });

  if (!inventory) {
    inventory = await Inventory.create({
      product: productId,
      stock: Math.max(0, Number(product.stock) || 0),
      soldStock: Number(product.sold) || 0,
    });
  }

  const previousStock = inventory.stock;
  const newStock =
    mode === "set" ? numericQuantity : previousStock + numericQuantity;

  if (newStock < 0) {
    throw new ApiError(400, "Stock cannot be negative");
  }

  if (newStock < inventory.reservedStock) {
    throw new ApiError(
      400,
      "Stock cannot be lower than reserved stock",
    );
  }

  const movementType =
    mode === "set"
      ? "SET"
      : numericQuantity > 0
        ? "INCREASE"
        : "DECREASE";

  inventory.stock = newStock;
  inventory.status = newStock > 0 ? "AVAILABLE" : "OUT_OF_STOCK";

  await inventory.save();

  // Keep Product.stock synchronized with Inventory.stock.
  product.stock = newStock;
  await product.save();

  const movement = await InventoryMovement.create({
    product: productId,
    inventory: inventory._id,
    type: movementType,
    previousStock,
    quantity: newStock - previousStock,
    newStock,
    reason: reason.trim(),
    adjustedBy: adminId,
  });

  return { inventory, movement };
};

// Get paginated stock movement history for one product.
const getInventoryMovements = async (productId, query = {}) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );

  const product = await Product.findById(productId).select("_id");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const filter = { product: productId };

  const [movements, total] = await Promise.all([
    InventoryMovement.find(filter)
      .populate("adjustedBy", "fullName username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    InventoryMovement.countDocuments(filter),
  ]);

  return {
    movements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* -------------------- GET ALL SETTINGS -------------------- */

const getSettings = async (query = {}) => {
  const { page = 1, limit = 10, search, category } = query;

  const filter = { isDeleted: false };

  if (category) {
    filter.category = category.toUpperCase();
  }

  if (search) {
    filter.$or = [
      { key: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [settings, total] = await Promise.all([
    Setting.find(filter)
      .sort({ category: 1, key: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("updatedBy", "fullName email"),

    Setting.countDocuments(filter),
  ]);

  return {
    settings,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/* -------------------- GET SETTING BY KEY -------------------- */

const getSettingByKey = async (key) => {
  const setting = await Setting.findOne({
    key: key.toUpperCase(),
    isDeleted: false,
  }).populate("updatedBy", "fullName email");

  if (!setting) {
    throw new ApiError(404, "Setting not found");
  }

  return setting;
};

/* -------------------- UPDATE SINGLE SETTING -------------------- */

const updateSetting = async (key, payload, adminId) => {
  const setting = await Setting.findOne({
    key: key.toUpperCase(),
    isDeleted: false,
  });

  if (!setting) {
    throw new ApiError(404, "Setting not found");
  }

  if (!setting.isEditable) {
    throw new ApiError(403, "This setting is not editable");
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "value")) {
    throw new ApiError(400, "Setting value is required");
  }

  const oldValue = setting.value;
  const newValue = payload.value;

  setting.value = newValue;

  if (payload.type !== undefined) setting.type = payload.type;
  if (payload.category !== undefined) {
    setting.category = payload.category.toUpperCase();
  }
  if (payload.description !== undefined) {
    setting.description = payload.description;
  }
  if (payload.isPublic !== undefined) {
    setting.isPublic = payload.isPublic;
  }

  setting.updatedBy = adminId;

  await setting.save();

  await SettingHistory.create({
    key: setting.key,
    category: setting.category,
    oldValue,
    newValue,
    changedBy: adminId,
    action: "UPDATED",
  });

  return setting;
};

/* -------------------- UPDATE MULTIPLE SETTINGS -------------------- */

const updateMultipleSettings = async (payload, adminId) => {
  const settingsPayload = payload.settings;

  if (
    !settingsPayload ||
    typeof settingsPayload !== "object" ||
    Array.isArray(settingsPayload)
  ) {
    throw new ApiError(400, "Settings must be an object of key-value pairs");
  }

  const results = [];

  for (const [key, value] of Object.entries(settingsPayload)) {
    const setting = await Setting.findOne({
      key: key.toUpperCase(),
      isDeleted: false,
    });

    if (!setting) {
      throw new ApiError(404, `Setting not found: ${key}`);
    }

    if (!setting.isEditable) {
      throw new ApiError(403, `Setting is not editable: ${key}`);
    }

    const oldValue = setting.value;

    setting.value = value;
    setting.updatedBy = adminId;

    await setting.save();

    await SettingHistory.create({
      key: setting.key,
      category: setting.category,
      oldValue,
      newValue: value,
      changedBy: adminId,
      action: "UPDATED",
    });

    results.push(setting);
  }

  return results;
};

/* -------------------- GET SETTINGS HISTORY -------------------- */

const getSettingsHistory = async (query = {}) => {
  const { page = 1, limit = 10, key, category, action } = query;

  const filter = {};

  if (key) filter.key = key.toUpperCase();
  if (category) filter.category = category.toUpperCase();
  if (action) filter.action = action.toUpperCase();

  const skip = (Number(page) - 1) * Number(limit);

  const [history, total] = await Promise.all([
    SettingHistory.find(filter)
      .populate("changedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),

    SettingHistory.countDocuments(filter),
  ]);

  return {
    history,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};



/* -------------------- GET ALL TAXES -------------------- */

const getTaxes = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    type,
    category,
    country,
    state,
    isActive,
  } = query;

  const filter = { isDeleted: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  if (type) filter.type = type.toUpperCase();
  if (category) filter.category = category;
  if (country) filter.country = country;
  if (state) filter.state = state;

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (pageNumber - 1) * limitNumber;

  const [taxes, total] = await Promise.all([
    Tax.find(filter)
      .populate("category", "name")
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),

    Tax.countDocuments(filter),
  ]);

  return {
    taxes,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

/* -------------------- GET TAX BY ID -------------------- */

const getTaxById = async (taxId) => {
  if (!mongoose.Types.ObjectId.isValid(taxId)) {
    throw new ApiError(400, "Invalid tax ID");
  }

  const tax = await Tax.findOne({
    _id: taxId,
    isDeleted: false,
  })
    .populate("category", "name")
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email");

  if (!tax) {
    throw new ApiError(404, "Tax rule not found");
  }

  return tax;
};

/* -------------------- CREATE TAX -------------------- */

const createTax = async (payload, adminId) => {
  const {
    name,
    code,
    description,
    category,
    type,
    rate,
    country,
    state,
    effectiveFrom,
    effectiveTo,
    isActive,
    priority,
  } = payload;

  if (!name || !code || rate === undefined) {
    throw new ApiError(400, "Name, code and rate are required");
  }

  if (category && !mongoose.Types.ObjectId.isValid(category)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const existingTax = await Tax.findOne({
    code: code.trim().toUpperCase(),
  });

  if (existingTax) {
    throw new ApiError(409, "Tax code already exists");
  }

  if (
    effectiveFrom &&
    effectiveTo &&
    new Date(effectiveTo) < new Date(effectiveFrom)
  ) {
    throw new ApiError(400, "Effective end date cannot be before start date");
  }

  const tax = await Tax.create({
    name,
    code: code.trim().toUpperCase(),
    description,
    category: category || null,
    type: type || "GST",
    rate,
    country,
    state,
    effectiveFrom,
    effectiveTo,
    isActive,
    priority,
    createdBy: adminId,
    updatedBy: adminId,
  });

  return tax;
};

/* -------------------- UPDATE TAX -------------------- */

const updateTax = async (taxId, payload, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(taxId)) {
    throw new ApiError(400, "Invalid tax ID");
  }

  const tax = await Tax.findOne({
    _id: taxId,
    isDeleted: false,
  });

  if (!tax) {
    throw new ApiError(404, "Tax rule not found");
  }

  const allowedFields = [
    "name",
    "code",
    "description",
    "category",
    "type",
    "rate",
    "country",
    "state",
    "effectiveFrom",
    "effectiveTo",
    "isActive",
    "priority",
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      tax[field] =
        field === "code"
          ? payload[field].trim().toUpperCase()
          : payload[field];
    }
  }

  if (
    tax.category &&
    !mongoose.Types.ObjectId.isValid(tax.category)
  ) {
    throw new ApiError(400, "Invalid category ID");
  }

  if (
    tax.effectiveFrom &&
    tax.effectiveTo &&
    tax.effectiveTo < tax.effectiveFrom
  ) {
    throw new ApiError(400, "Effective end date cannot be before start date");
  }

  tax.updatedBy = adminId;

  await tax.save();

  return tax;
};

/* -------------------- DELETE TAX -------------------- */

const deleteTax = async (taxId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(taxId)) {
    throw new ApiError(400, "Invalid tax ID");
  }

  const tax = await Tax.findOne({
    _id: taxId,
    isDeleted: false,
  });

  if (!tax) {
    throw new ApiError(404, "Tax rule not found");
  }

  tax.isDeleted = true;
  tax.deletedAt = new Date();
  tax.isActive = false;
  tax.updatedBy = adminId;

  await tax.save();

  return tax;
};

/* -------------------- UPDATE TAX STATUS -------------------- */

const updateTaxStatus = async (taxId, isActive, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(taxId)) {
    throw new ApiError(400, "Invalid tax ID");
  }

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  const tax = await Tax.findOne({
    _id: taxId,
    isDeleted: false,
  });

  if (!tax) {
    throw new ApiError(404, "Tax rule not found");
  }

  tax.isActive = isActive;
  tax.updatedBy = adminId;

  await tax.save();

  return tax;
};


/* -------------------- GET ALL SHIPPING ZONES -------------------- */

const getShippingZones = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    country,
    state,
    isActive,
  } = query;

  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (country) {
    filter.countries = { $in: [country] };
  }

  if (state) {
    filter.states = { $in: [state] };
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (pageNumber - 1) * limitNumber;

  const [zones, total] = await Promise.all([
    ShippingZone.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),

    ShippingZone.countDocuments(filter),
  ]);

  return {
    zones,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

/* -------------------- GET SHIPPING ZONE BY ID -------------------- */

const getShippingZoneById = async (zoneId) => {
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    throw new ApiError(400, "Invalid shipping zone ID");
  }

  const zone = await ShippingZone.findById(zoneId);

  if (!zone) {
    throw new ApiError(404, "Shipping zone not found");
  }

  return zone;
};

/* -------------------- CREATE SHIPPING ZONE -------------------- */

const createShippingZone = async (payload) => {
  const {
    name,
    countries = [],
    states = [],
    pincodes = [],
    shippingCharge = 0,
    freeShippingAbove = 0,
    estimatedDays = {},
    isActive = true,
  } = payload;

  if (!name?.trim()) {
    throw new ApiError(400, "Shipping zone name is required");
  }

  if (!Array.isArray(countries) ||
      !Array.isArray(states) ||
      !Array.isArray(pincodes)) {
    throw new ApiError(
      400,
      "Countries, states and pincodes must be arrays"
    );
  }

  if (
    !Number.isFinite(Number(shippingCharge)) ||
    Number(shippingCharge) < 0
  ) {
    throw new ApiError(400, "Invalid shipping charge");
  }

  if (
    !Number.isFinite(Number(freeShippingAbove)) ||
    Number(freeShippingAbove) < 0
  ) {
    throw new ApiError(400, "Invalid free shipping amount");
  }

  const minDays = Number(estimatedDays.min ?? 2);
  const maxDays = Number(estimatedDays.max ?? 7);

  if (
    !Number.isInteger(minDays) ||
    !Number.isInteger(maxDays) ||
    minDays < 0 ||
    maxDays < minDays
  ) {
    throw new ApiError(400, "Invalid estimated delivery days");
  }

  const zone = await ShippingZone.create({
    name: name.trim(),
    countries,
    states,
    pincodes,
    shippingCharge: Number(shippingCharge),
    freeShippingAbove: Number(freeShippingAbove),
    estimatedDays: {
      min: minDays,
      max: maxDays,
    },
    isActive,
  });

  return zone;
};

/* -------------------- UPDATE SHIPPING ZONE -------------------- */

const updateShippingZone = async (zoneId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    throw new ApiError(400, "Invalid shipping zone ID");
  }

  const zone = await ShippingZone.findById(zoneId);

  if (!zone) {
    throw new ApiError(404, "Shipping zone not found");
  }

  const allowedFields = [
    "name",
    "countries",
    "states",
    "pincodes",
    "shippingCharge",
    "freeShippingAbove",
    "estimatedDays",
    "isActive",
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      zone[field] = payload[field];
    }
  }

  if (!zone.name?.trim()) {
    throw new ApiError(400, "Shipping zone name is required");
  }

  if (
    !Array.isArray(zone.countries) ||
    !Array.isArray(zone.states) ||
    !Array.isArray(zone.pincodes)
  ) {
    throw new ApiError(
      400,
      "Countries, states and pincodes must be arrays"
    );
  }

  if (
    !Number.isFinite(zone.shippingCharge) ||
    zone.shippingCharge < 0
  ) {
    throw new ApiError(400, "Invalid shipping charge");
  }

  if (
    !Number.isFinite(zone.freeShippingAbove) ||
    zone.freeShippingAbove < 0
  ) {
    throw new ApiError(400, "Invalid free shipping amount");
  }

  if (
    !Number.isInteger(zone.estimatedDays.min) ||
    !Number.isInteger(zone.estimatedDays.max) ||
    zone.estimatedDays.min < 0 ||
    zone.estimatedDays.max < zone.estimatedDays.min
  ) {
    throw new ApiError(400, "Invalid estimated delivery days");
  }

  await zone.save();

  return zone;
};

/* -------------------- DELETE SHIPPING ZONE -------------------- */

const deleteShippingZone = async (zoneId) => {
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    throw new ApiError(400, "Invalid shipping zone ID");
  }

  const zone = await ShippingZone.findById(zoneId);

  if (!zone) {
    throw new ApiError(404, "Shipping zone not found");
  }

  await ShippingZone.findByIdAndDelete(zoneId);

  return zone;
};

/* -------------------- UPDATE SHIPPING ZONE STATUS -------------------- */

const updateShippingZoneStatus = async (zoneId, isActive) => {
  if (!mongoose.Types.ObjectId.isValid(zoneId)) {
    throw new ApiError(400, "Invalid shipping zone ID");
  }

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  const zone = await ShippingZone.findByIdAndUpdate(
    zoneId,
    { $set: { isActive } },
    { new: true, runValidators: true }
  );

  if (!zone) {
    throw new ApiError(404, "Shipping zone not found");
  }

  return zone;
};

/* -------------------- SUPPORT TICKETS -------------------- */

const createTicketActivity = async ({
  user,
  ticket,
  activity,
  description,
  metadata = {},
}) => {
  await ActivityLog.create({
    user,
    activity,
    description,
    metadata: {
      ...metadata,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
    },
  });
};

const getSupportTickets = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    category,
    assignedTo,
    user,
    startDate,
    endDate,
  } = query;

  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = { isDeleted: false };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (user) filter.user = user;

  if (search) {
    filter.$or = [
      { ticketNumber: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      const from = new Date(startDate);
      if (Number.isNaN(from.getTime())) {
        throw new ApiError(400, "Invalid start date");
      }
      filter.createdAt.$gte = from;
    }

    if (endDate) {
      const to = new Date(endDate);
      if (Number.isNaN(to.getTime())) {
        throw new ApiError(400, "Invalid end date");
      }
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  const [tickets, totalTickets] = await Promise.all([
    SupportTicket.find(filter)
      .populate("user", "fullName username email avatar")
      .populate("order", "orderNumber totalAmount orderStatus")
      .populate("assignedTo", "fullName username email avatar")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .lean(),

    SupportTicket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      totalTickets,
      currentPage,
      totalPages: Math.ceil(totalTickets / perPage),
      limit: perPage,
      hasNextPage: currentPage * perPage < totalTickets,
      hasPrevPage: currentPage > 1,
    },
  };
};

const getSupportTicketById = async (ticketId) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  })
    .populate("user", "fullName username email phone avatar")
    .populate("order", "orderNumber totalAmount orderStatus")
    .populate("assignedTo", "fullName username email avatar")
    .populate("resolvedBy", "fullName username email")
    .populate("replies.user", "fullName username email role avatar")
    .populate("attachments")
    .lean();

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  return ticket;
};

const updateSupportTicketStatus = async ({ ticketId, status, adminId }) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  const allowedStatuses = [
    "OPEN",
    "IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid ticket status");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  if (ticket.status === "CLOSED") {
    throw new ApiError(
      400,
      "Closed ticket cannot be updated. Reopen it first.",
    );
  }

  const previousStatus = ticket.status;

  ticket.status = status;

  if (status === "RESOLVED") {
    ticket.resolvedBy = adminId;
    ticket.resolvedAt = new Date();
  } else {
    ticket.resolvedBy = null;
    ticket.resolvedAt = null;
  }

  await ticket.save();

  await createTicketActivity({
    user: adminId,
    ticket,
    activity: "SUPPORT_TICKET_STATUS_UPDATED",
    description: `Ticket status changed from ${previousStatus} to ${status}`,
    metadata: { previousStatus, newStatus: status },
  });

  return ticket;
};

const updateSupportTicketPriority = async ({ ticketId, priority, adminId }) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  if (!allowedPriorities.includes(priority)) {
    throw new ApiError(400, "Invalid ticket priority");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  const previousPriority = ticket.priority;
  ticket.priority = priority;

  await ticket.save();

  await createTicketActivity({
    user: adminId,
    ticket,
    activity: "SUPPORT_TICKET_PRIORITY_UPDATED",
    description: `Ticket priority changed from ${previousPriority} to ${priority}`,
    metadata: { previousPriority, newPriority: priority },
  });

  return ticket;
};

const assignSupportTicket = async ({ ticketId, assignedTo, adminId }) => {
  if (
    !mongoose.isValidObjectId(ticketId) ||
    !mongoose.isValidObjectId(assignedTo)
  ) {
    throw new ApiError(400, "Invalid ticket or admin ID");
  }

  const [ticket, assignedAdmin] = await Promise.all([
    SupportTicket.findOne({
      _id: ticketId,
      isDeleted: false,
    }),

    User.findOne({
      _id: assignedTo,
      role: "admin",
      isBlocked: false,
      deletedAt: null,
    }).select("_id fullName email role"),
  ]);

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  if (!assignedAdmin) {
    throw new ApiError(404, "Active admin user not found");
  }

  const previousAssignee = ticket.assignedTo;

  ticket.assignedTo = assignedAdmin._id;

  if (ticket.status === "OPEN") {
    ticket.status = "IN_PROGRESS";
  }

  await ticket.save();

  await createTicketActivity({
    user: adminId,
    ticket,
    activity: "SUPPORT_TICKET_ASSIGNED",
    description: `Ticket assigned to ${assignedAdmin.fullName}`,
    metadata: {
      previousAssignee,
      assignedTo: assignedAdmin._id,
    },
  });

  return ticket.populate("assignedTo", "fullName username email avatar");
};

const replyToSupportTicket = async ({ ticketId, message, adminId }) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  if (typeof message !== "string" || !message.trim()) {
    throw new ApiError(400, "Reply message is required");
  }

  if (message.trim().length > 5000) {
    throw new ApiError(400, "Reply cannot exceed 5000 characters");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  if (ticket.status === "CLOSED") {
    throw new ApiError(400, "Cannot reply to a closed ticket");
  }

  ticket.replies.push({
    user: adminId,
    message: message.trim(),
  });

  if (ticket.status === "WAITING_FOR_CUSTOMER") {
    ticket.status = "IN_PROGRESS";
  }

  await ticket.save();

  await createTicketActivity({
    user: adminId,
    ticket,
    activity: "SUPPORT_TICKET_REPLIED",
    description: "Admin replied to support ticket",
    metadata: { message: message.trim() },
  });

  return ticket.populate("replies.user", "fullName username email role avatar");
};

const addSupportTicketNote = async ({ ticketId, note, adminId }) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  if (typeof note !== "string" || !note.trim()) {
    throw new ApiError(400, "Internal note is required");
  }

  if (note.trim().length > 3000) {
    throw new ApiError(400, "Internal note cannot exceed 3000 characters");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  const timestamp = new Date().toISOString();

  ticket.adminNote = [
    ticket.adminNote,
    `[${timestamp}] Admin ${adminId}: ${note.trim()}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  await ticket.save();

  await createTicketActivity({
    user: adminId,
    ticket,
    activity: "SUPPORT_TICKET_INTERNAL_NOTE_ADDED",
    description: "Internal note added to support ticket",
    metadata: { note: note.trim() },
  });

  return ticket;
};

const closeSupportTicket = async ({ ticketId, adminId, resolution }) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  if (ticket.status === "CLOSED") {
    throw new ApiError(400, "Ticket is already closed");
  }

  if (resolution !== undefined) {
    if (typeof resolution !== "string" || resolution.length > 3000) {
      throw new ApiError(400, "Invalid resolution");
    }

    ticket.resolution = resolution.trim() || null;
  }

  ticket.status = "CLOSED";
  ticket.closedAt = new Date();
  ticket.resolvedBy = adminId;
  ticket.resolvedAt = ticket.resolvedAt || new Date();

  await ticket.save();

  await createTicketActivity({
    user: adminId,
    ticket,
    activity: "SUPPORT_TICKET_CLOSED",
    description: "Support ticket closed",
    metadata: { resolution: ticket.resolution },
  });

  return ticket;
};

const reopenSupportTicket = async ({ ticketId, adminId }) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  });

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  if (ticket.status !== "CLOSED") {
    throw new ApiError(400, "Only closed tickets can be reopened");
  }

  ticket.status = "OPEN";
  ticket.closedAt = null;
  ticket.resolvedAt = null;
  ticket.resolvedBy = null;

  await ticket.save();

  await createTicketActivity({
    user: adminId,
    ticket,
    activity: "SUPPORT_TICKET_REOPENED",
    description: "Support ticket reopened",
  });

  return ticket;
};

const getSupportTicketHistory = async (ticketId, query = {}) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new ApiError(400, "Invalid ticket ID");
  }

  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    isDeleted: false,
  }).select("_id ticketNumber");

  if (!ticket) {
    throw new ApiError(404, "Support ticket not found");
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  const [history, total] = await Promise.all([
    ActivityLog.find({
      "metadata.ticketId": ticket._id,
    })
      .populate("user", "fullName username email role avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    ActivityLog.countDocuments({
      "metadata.ticketId": ticket._id,
    }),
  ]);

  return {
    ticketNumber: ticket.ticketNumber,
    history,
    pagination: {
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    },
  };
};

/* ======================== Export ======================== */

export default {
  //Dashboard
  getDashboardStats,
  getDashboardAnalytics,
  getRecentOrders,
  getLowStockProducts,

  // Users
  getAllUsers,
  getUserById,
  getAllUsersbyAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  toggleUserStatus,

  // Vendors
  getAllVendors,
  getAllVendorRequests,
  getVendorRequestById,
  getPendingVendorRequests,
  getVendorById,
  updateVendor,
  deleteVendor,
  toggleVendorStatus,
  approveVendor,
  rejectVendor,

  // Products
  getPendingProducts,
  getAllProducts,
  getProductById,
  updateProductByAdmin,
  deleteProductByAdmin,
  approveProduct,
  rejectProduct,
  updateProductStatus,

  // Orders
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getRefundRequests,
  processRefund,
  updateOrderShipping,
  getOrderStatusHistory,

  // Categories
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,

  // Brands
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  updateBrandStatus,
  updateBrandLogo,
  deleteBrandLogo,

  // Coupon
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  updateCouponStatus,
  getCouponUsage,

  // Review
  getAllReviews,
  getReviewById,
  updateReviewStatus,
  deleteReview,
  getReportedReviews,

  // Payments
  getAllPayments,
  getPaymentById,
  refundPayment,
  reconcilePayment,

  getAllVendorPayouts,
  getVendorPayoutById,
  updateVendorPayoutStatus,

  // Reports
  getSalesReport,
  getRevenueReport,
  getReportSummary,
  exportReport,

  // Activity Logs
  getActivityLogs,
  getActivityLogById,

  // Inventory
  getInventory,
  getLowStockInventory,
  getOutOfStockInventory,
  getInventoryByProductId,
  adjustInventoryStock,
  getInventoryMovements,

  // Setting
  getSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
  getSettingsHistory,

  // Tax
  getTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
  updateTaxStatus,

  // Shipping Zone
  getShippingZones,
  getShippingZoneById,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  updateShippingZoneStatus,

  // Support Tickets
  getSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  updateSupportTicketPriority,
  assignSupportTicket,
  replyToSupportTicket,
  addSupportTicketNote,
  closeSupportTicket,
  reopenSupportTicket,
  getSupportTicketHistory,
};
