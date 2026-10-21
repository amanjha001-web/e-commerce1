import mongoose from "mongoose";

import User from "../models/User.model.js";
import Vendor from "../models/Vendor.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";
import VendorRequest from "../models/VendorRequest.model.js";

import ApiError from "../utils/ApiError.js";

import { PRODUCT_STATUS } from "../constants/index.js";

/* ======================== Dashboard Statistics ======================== */

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

/* ======================== User Management ======================== */

const getAllUsers = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const { status, search } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

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
      .select("-password -refreshToken")
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

const approveProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { status: PRODUCT_STATUS.ACTIVE },
    { new: true, runValidators: true },
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
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

/* ======================== Order Management ======================== */

const getAllOrders = async (query = {}) => {
  return Order.find(query)
    .populate("user", "fullName email")
    .sort({ createdAt: -1 });
};

/* ======================== Export ======================== */

export default {
  getDashboardStats,

  // Users
  getAllUsers,
  getUserById,
  updateUserStatus,

  // Vendors
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  toggleVendorStatus,
  approveVendor,
  rejectVendor,

  // Products
  getPendingProducts,
  approveProduct,
  rejectProduct,

  // Orders
  getAllOrders,
};
