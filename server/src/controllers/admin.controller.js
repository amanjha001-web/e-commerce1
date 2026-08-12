import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import adminService from "../services/admin.service.js";

/*                         Admin Dashboard                                    */

/**
 * Get Admin Dashboard Overview
 *
 * @route GET /api/v1/admin/dashboard
 * @access Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

/*                         User Management                                    */

/**
 * Get All Users
 *
 * @route GET /api/v1/admin/users
 */
const getAllUsersbyAdmin = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsers(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

/**
 * Get Single User
 *
 * @route GET /api/v1/admin/users/:id
 */
const getUserByIdbyAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * Update User Status
 *
 * @route PATCH /api/v1/admin/users/:id/status
 */
const updateUserStatusbyAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserStatus(
    req.params.id,
    req.body.status,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User status updated successfully"));
});

/*                         Vendor Management                                  */

/**
 * Get Vendor Applications
 *
 * @route GET /api/v1/admin/vendors
 */
const getAllVendorsbyAdmin = asyncHandler(async (req, res) => {
  const vendors = await adminService.getAllVendors(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, vendors, "Vendors fetched successfully"));
});

/**
 * Approve Vendor
 *
 * @route PATCH /api/v1/admin/vendors/:id/approve
 */
const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.approveVendor(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor approved successfully"));
});

/**
 * Reject Vendor
 *
 * @route PATCH /api/v1/admin/vendors/:id/reject
 */
const rejectVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.rejectVendor(
    req.params.id,
    req.body.reason,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor rejected successfully"));
});

/*                         Product Moderation                                 */

/**
 * Get Pending Products
 *
 * @route GET /api/v1/admin/products/pending
 */
const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await adminService.getPendingProducts(req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, products, "Pending products fetched successfully"),
    );
});

/**
 * Approve Product
 *
 * @route PATCH /api/v1/admin/products/:id/approve
 */
const approveProduct = asyncHandler(async (req, res) => {
  const product = await adminService.approveProduct(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product approved successfully"));
});

/**
 * Reject Product
 *
 * @route PATCH /api/v1/admin/products/:id/reject
 */
const rejectProduct = asyncHandler(async (req, res) => {
  const product = await adminService.rejectProduct(
    req.params.id,
    req.body.reason,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product rejected successfully"));
});

/*                         Order Management                                   */

/**
 * Get All Orders
 *
 * @route GET /api/v1/admin/orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await adminService.getAllOrders(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

/*                              Export                                        */

export default {
  getDashboardStats,

  getAllUsersbyAdmin,
  getUserByIdbyAdmin,
  updateUserStatusbyAdmin,

  getAllVendorsbyAdmin,
  approveVendor,
  rejectVendor,

  getPendingProducts,
  approveProduct,
  rejectProduct,

  getAllOrders,
};
