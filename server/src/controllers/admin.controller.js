import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import adminService from "../services/admin.service.js";

/* ======================== Admin Dashboard ======================== */

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

/* ======================== User Management ======================== */

const getAllUsersbyAdmin = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsers(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const getUserByIdbyAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateUserStatusbyAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserStatus(
    req.params.id,
    req.body.status,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User status updated successfully"));
});

/* ======================== Vendor Management ======================== */

// Get all vendors
const getAllVendorsbyAdmin = asyncHandler(async (req, res) => {
  const vendors = await adminService.getAllVendors(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, vendors, "Vendors fetched successfully"));
});

// View a single vendor
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await adminService.getVendorById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor fetched successfully"));
});

// Edit vendor details
const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.updateVendor(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor updated successfully"));
});

// Soft-delete vendor
const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.deleteVendor(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor deleted successfully"));
});

// Activate / Deactivate vendor
const toggleVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await adminService.toggleVendorStatus(
    req.params.id,
    req.body.isActive,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        vendor,
        `Vendor ${vendor.isActive ? "activated" : "deactivated"} successfully`,
      ),
    );
});

// Approve vendor application
const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.approveVendor(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor approved successfully"));
});

// Reject vendor application
const rejectVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.rejectVendor(
    req.params.id,
    req.body.reason,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor rejected successfully"));
});

/* ======================== Product Moderation ======================== */

const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await adminService.getPendingProducts(req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, products, "Pending products fetched successfully"),
    );
});

const approveProduct = asyncHandler(async (req, res) => {
  const product = await adminService.approveProduct(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product approved successfully"));
});

const rejectProduct = asyncHandler(async (req, res) => {
  const product = await adminService.rejectProduct(
    req.params.id,
    req.body.reason,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product rejected successfully"));
});

/* ======================== Order Management ======================== */

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await adminService.getAllOrders(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

/* ======================== Export ======================== */

export default {
  getDashboardStats,

  // Users
  getAllUsersbyAdmin,
  getUserByIdbyAdmin,
  updateUserStatusbyAdmin,

  // Vendors
  getAllVendorsbyAdmin,
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
