import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import adminService from "../services/admin.service.js";

/* ======================== Admin Dashboard ======================== */

// Dashboard Stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

// Dashboard Analytics
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  const analytics = await adminService.getDashboardAnalytics(period);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        analytics,
        "Dashboard analytics fetched successfully",
      ),
    );
});

// Recent Orders
const getRecentOrders = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const orders = await adminService.getRecentOrders(limit);

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Recent orders fetched successfully"));
});

// Low Stock Products
const getLowStockProducts = asyncHandler(async (req, res) => {
  const { threshold = 10, limit = 10 } = req.query;

  const result = await adminService.getLowStockProducts(threshold, limit);

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Low stock products fetched successfully"),
    );
});

/* ======================== User Management ======================== */

// Get all user
const getAllUsersbyAdmin = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsersbyAdmin(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

//get single user
const getUserByIdbyAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

// user status update
const updateUserStatusbyAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserStatus(
    req.params.id,
    req.body.status,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User status updated successfully"));
});

// Update User Profile
export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserByAdmin(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, { user }, "User profile updated successfully")
  );
});

// Delete User
export const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUserByAdmin(
    req.params.id,
    req.user?._id || req.user?.id
  );

  return res.status(200).json(
    new ApiResponse(200, result, "User deleted successfully")
  );
});

// Toggle user status (block/unblock)
export const toggleUserStatusbyAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.toggleUserStatus(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, result, "User status updated successfully")
  );
});

/* ======================== Vendor Management ======================== */

// Get all vendors
const getAllVendorsbyAdmin = asyncHandler(async (req, res) => {
  const vendors = await adminService.getAllVendors(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, vendors, "Vendors fetched successfully"));
});

// Get all vendors request
export const getAllVendorRequests = asyncHandler(async (req, res) => {
  const result = await adminService.getAllVendorRequests(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Vendor requests fetched successfully"));
});

//get single vendor request
export const getVendorRequestById = asyncHandler(async (req, res) => {
  const request = await adminService.getVendorRequestById(req.params.id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { request }, "Vendor request fetched successfully"),
    );
});

// get pending vendor request
export const getPendingVendorRequests = asyncHandler(async (req, res) => {
  const result = await adminService.getPendingVendorRequests(req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Pending vendor requests fetched successfully",
      ),
    );
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

//get pending products
const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await adminService.getPendingProducts(req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, products, "Pending products fetched successfully"),
    );
});

// get all products
export const getAllProducts = asyncHandler(async (req, res) => {
  const result = await adminService.getAllProducts(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Products fetched successfully"));
});

//get single products
export const getProductById = asyncHandler(async (req, res) => {
  const product = await adminService.getProductById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, { product }, "Product fetched successfully"));
});

//update products
export const updateProductByAdmin = asyncHandler(async (req, res) => {
  const product = await adminService.updateProductByAdmin(
    req.params.id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { product }, "Product updated successfully"));
});

// delete products
export const deleteProductByAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.deleteProductByAdmin(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Product deleted successfully"));
});

// approve products
export const approveProduct = asyncHandler(async (req, res) => {
  const product = await adminService.approveProduct(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product approved successfully"));
});

// reject products
export const rejectProduct = asyncHandler(async (req, res) => {
  const product = await adminService.rejectProduct(
    req.params.id,
    req.body.reason,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product rejected successfully"));
});

/* ======================== Order Management ======================== */

// 1. All orders
export const getAllOrders = asyncHandler(async (req, res) => {
  const result = await adminService.getAllOrders(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Orders fetched successfully"),
  );
});

// 2. Single order
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await adminService.getOrderById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { order }, "Order fetched successfully"),
  );
});

// 3. Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await adminService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.body.note,
  );

  return res.status(200).json(
    new ApiResponse(200, { order }, "Order status updated successfully"),
  );
});

// 4. Cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await adminService.cancelOrder(
    req.params.id,
    req.body.reason,
  );

  return res.status(200).json(
    new ApiResponse(200, { order }, "Order cancelled successfully"),
  );
});

// 5. Refund requests
export const getRefundRequests = asyncHandler(async (req, res) => {
  const result = await adminService.getRefundRequests(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Refund requests fetched successfully"),
  );
});

// 6. Process refund
export const processRefund = asyncHandler(async (req, res) => {
  const order = await adminService.processRefund(
    req.params.id,
    req.body.amount,
    req.body.reason,
  );

  return res.status(200).json(
    new ApiResponse(200, { order }, "Refund recorded successfully"),
  );
});

// 7. Update shipping
export const updateOrderShipping = asyncHandler(async (req, res) => {
  const order = await adminService.updateOrderShipping(
    req.params.id,
    req.body,
  );

  return res.status(200).json(
    new ApiResponse(200, { order }, "Shipping details updated successfully"),
  );
});

// 8. Status history
export const getOrderStatusHistory = asyncHandler(async (req, res) => {
  const history = await adminService.getOrderStatusHistory(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { history }, "Order history fetched successfully"),
  );
});

/* -------------------- Category Management -------------------- */

// Get all categories
export const getAllCategories = asyncHandler(async (req, res) => {
  const result = await adminService.getAllCategories(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Categories fetched successfully"),
  );
});

//get single categories
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await adminService.getCategoryById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { category }, "Category fetched successfully"),
  );
});

// create categories
export const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.body);

  return res.status(201).json(
    new ApiResponse(201, { category }, "Category created successfully"),
  );
});

// update categories
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await adminService.updateCategory(
    req.params.id,
    req.body,
  );

  return res.status(200).json(
    new ApiResponse(200, { category }, "Category updated successfully"),
  );
});

// delete categories
export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await adminService.deleteCategory(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, result, "Category deleted successfully"),
  );
});

// update categories status
export const updateCategoryStatus = asyncHandler(async (req, res) => {
  const category = await adminService.updateCategoryStatus(
    req.params.id,
    req.body.isActive,
  );

  return res.status(200).json(
    new ApiResponse(200, { category }, "Category status updated successfully"),
  );
});


/* -------------------- Brand Management -------------------- */

// Get all brands
export const getAllBrands = asyncHandler(async (req, res) => {
  const result = await adminService.getAllBrands(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Brands fetched successfully"),
  );
});

// Get brand by ID
export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await adminService.getBrandById(req.params.brandId);

  return res.status(200).json(
    new ApiResponse(200, { brand }, "Brand fetched successfully"),
  );
});

// Create brand
export const createBrand = asyncHandler(async (req, res) => {
  const imageFile = req.files?.image?.[0] ?? null;

  const brand = await adminService.createBrand(req.body, imageFile);

  return res.status(201).json(
    new ApiResponse(201, { brand }, "Brand created successfully"),
  );
});

// Update brand
export const updateBrand = asyncHandler(async (req, res) => {
  const imageFile = req.files?.image?.[0] ?? null;

  const brand = await adminService.updateBrand(
    req.params.brandId,
    req.body,
    imageFile,
  );

  return res.status(200).json(
    new ApiResponse(200, { brand }, "Brand updated successfully"),
  );
});

// Soft delete brand
export const deleteBrand = asyncHandler(async (req, res) => {
  const result = await adminService.deleteBrand(req.params.brandId);

  return res.status(200).json(
    new ApiResponse(200, result, "Brand deleted successfully"),
  );
});

// Activate/deactivate brand
export const updateBrandStatus = asyncHandler(async (req, res) => {
  const brand = await adminService.updateBrandStatus(
    req.params.brandId,
    req.body.isActive,
  );

  return res.status(200).json(
    new ApiResponse(200, { brand }, "Brand status updated successfully"),
  );
});

// Upload/change brand logo
export const updateBrandLogo = asyncHandler(async (req, res) => {
  const imageFile = req.files?.image?.[0] ?? null;

  const brand = await adminService.updateBrandLogo(
    req.params.brandId,
    imageFile,
  );

  return res.status(200).json(
    new ApiResponse(200, { brand }, "Brand logo updated successfully"),
  );
});

// Remove brand logo
export const deleteBrandLogo = asyncHandler(async (req, res) => {
  const brand = await adminService.deleteBrandLogo(req.params.brandId);

  return res.status(200).json(
    new ApiResponse(200, { brand }, "Brand logo removed successfully"),
  );
});


/* -------------------- Coupon Management -------------------- */

// Get all coupons with search, filters and pagination
export const getAllCoupons = asyncHandler(async (req, res) => {
  const result = await adminService.getAllCoupons(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Coupons fetched successfully"),
  );
});

// Get single coupon details
export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await adminService.getCouponById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { coupon }, "Coupon fetched successfully"),
  );
});

// Create a new coupon
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await adminService.createCoupon(req.body);

  return res.status(201).json(
    new ApiResponse(201, { coupon }, "Coupon created successfully"),
  );
});

// Update existing coupon
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await adminService.updateCoupon(
    req.params.id,
    req.body,
  );

  return res.status(200).json(
    new ApiResponse(200, { coupon }, "Coupon updated successfully"),
  );
});

// Delete by deactivating the coupon
export const deleteCoupon = asyncHandler(async (req, res) => {
  const result = await adminService.deleteCoupon(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, result, "Coupon deactivated successfully"),
  );
});

// Activate or deactivate coupon
export const updateCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await adminService.updateCouponStatus(
    req.params.id,
    req.body.isActive,
  );

  return res.status(200).json(
    new ApiResponse(200, { coupon }, "Coupon status updated successfully"),
  );
});

// Get coupon usage statistics
export const getCouponUsage = asyncHandler(async (req, res) => {
  const result = await adminService.getCouponUsage(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, result, "Coupon usage fetched successfully"),
  );
});

/*                      review management                   */

// Get all reviews.
export const getAllReviews = asyncHandler(async (req, res) => {
  const result = await adminService.getAllReviews(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Reviews fetched successfully"));
});


// Get single review.
export const getReviewById = asyncHandler(async (req, res) => {
  const result = await adminService.getReviewById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Review fetched successfully"));
});


// Approve, reject or hide review.
export const updateReviewStatus = asyncHandler(async (req, res) => {
  const result = await adminService.updateReviewStatus(
    req.params.id,
    req.body.status
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Review status updated successfully"));
});


// Delete review.
export const deleteReview = asyncHandler(async (req, res) => {
  const result = await adminService.deleteReview(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Review deleted successfully"));
});


// Get reported reviews.
export const getReportedReviews = asyncHandler(async (req, res) => {
  const result = await adminService.getReportedReviews(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Reported reviews fetched successfully"));
});

/*         manage payments and vendor payouts            */
// Get all payments
export const getAllPayments = asyncHandler(async (req, res) => {
  const result = await adminService.getAllPayments(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Payments fetched successfully"));
});


// Get payment details
export const getPaymentById = asyncHandler(async (req, res) => {
  const result = await adminService.getPaymentById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Payment fetched successfully"));
});


// Process refund
export const refundPayment = asyncHandler(async (req, res) => {
  const result = await adminService.refundPayment(
    req.params.id,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Refund processed successfully"));
});


// Reconcile payment
export const reconcilePayment = asyncHandler(async (req, res) => {
  const result = await adminService.reconcilePayment(req.body.paymentId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Payment reconciled successfully"));
});


// Get all vendor payouts
export const getAllVendorPayouts = asyncHandler(async (req, res) => {
  const result = await adminService.getAllVendorPayouts(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Vendor payouts fetched successfully"));
});


// Get vendor payout details
export const getVendorPayoutById = asyncHandler(async (req, res) => {
  const result = await adminService.getVendorPayoutById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Vendor payout fetched successfully"));
});


// Update vendor payout status
export const updateVendorPayoutStatus = asyncHandler(async (req, res) => {
  const result = await adminService.updateVendorPayoutStatus(
    req.params.id,
    req.body.status
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Vendor payout status updated successfully"));
});


/* ======================== Reports ======================== */

export const getSalesReport = asyncHandler(async (req, res) => {
  const result = await adminService.getSalesReport(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Sales report fetched successfully"),
  );
});

export const getRevenueReport = asyncHandler(async (req, res) => {
  const result = await adminService.getRevenueReport(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Revenue report fetched successfully"),
  );
});

export const getReportSummary = asyncHandler(async (req, res) => {
  const result = await adminService.getReportSummary(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Report summary fetched successfully"),
  );
});

export const exportReport = asyncHandler(async (req, res) => {
  const result = await adminService.exportReport(req.query);

  res.setHeader("Content-Type", result.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${result.filename}"`,
  );

  return res.status(200).send(result.content);
});

/* ======================== Activity Logs ======================== */

export const getActivityLogs = asyncHandler(async (req, res) => {
  const result = await adminService.getActivityLogs(req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Activity logs fetched successfully"),
  );
});

export const getActivityLogById = asyncHandler(async (req, res) => {
  const result = await adminService.getActivityLogById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, result, "Activity log fetched successfully"),
  );
});

/* ======================== Inventory Management ======================== */

// GET inventory list
export const getInventory = asyncHandler(async (req, res) => {
  const result = await adminService.getInventory(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Inventory fetched successfully"));
});

// GET low-stock products
export const getLowStockInventory = asyncHandler(async (req, res) => {
  const result = await adminService.getLowStockInventory(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Low-stock inventory fetched successfully"));
});

// GET out-of-stock products
export const getOutOfStockInventory = asyncHandler(async (req, res) => {
  const result = await adminService.getOutOfStockInventory(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Out-of-stock inventory fetched successfully"));
});

// GET inventory by product ID
export const getInventoryByProductId = asyncHandler(async (req, res) => {
  const result = await adminService.getInventoryByProductId(
    req.params.productId,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Inventory details fetched successfully"));
});

// PATCH adjust stock
export const adjustInventoryStock = asyncHandler(async (req, res) => {
  const result = await adminService.adjustInventoryStock(
    req.params.productId,
    req.body,
    req.user?._id || req.user?.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Inventory stock adjusted successfully"));
});

// GET stock movement history
export const getInventoryMovements = asyncHandler(async (req, res) => {
  const result = await adminService.getInventoryMovements(
    req.params.productId,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Inventory movements fetched successfully"));
});


/* -------------------- GET ALL SETTINGS -------------------- */

export const getSettings = asyncHandler(async (req, res) => {
  const result = await adminService.getSettings(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Settings fetched successfully"));
});

/* -------------------- GET SETTING BY KEY -------------------- */

export const getSettingByKey = asyncHandler(async (req, res) => {
  const result = await adminService.getSettingByKey(req.params.key);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Setting fetched successfully"));
});

/* -------------------- UPDATE SINGLE SETTING -------------------- */

export const updateSetting = asyncHandler(async (req, res) => {
  const result = await adminService.updateSetting(
    req.params.key,
    req.body,
    req.user?._id || req.user?.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Setting updated successfully"));
});

/* -------------------- UPDATE MULTIPLE SETTINGS -------------------- */

export const updateMultipleSettings = asyncHandler(async (req, res) => {
  const result = await adminService.updateMultipleSettings(
    req.body,
    req.user?._id || req.user?.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Settings updated successfully"));
});

/* -------------------- GET SETTINGS HISTORY -------------------- */

export const getSettingsHistory = asyncHandler(async (req, res) => {
  const result = await adminService.getSettingsHistory(req.query);

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Settings history fetched successfully"),
    );
});



/* -------------------- GET ALL TAXES -------------------- */

export const getTaxes = asyncHandler(async (req, res) => {
  const result = await adminService.getTaxes(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tax rules fetched successfully"));
});

/* -------------------- GET TAX BY ID -------------------- */

export const getTaxById = asyncHandler(async (req, res) => {
  const result = await adminService.getTaxById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tax details fetched successfully"));
});

/* -------------------- CREATE TAX -------------------- */

export const createTax = asyncHandler(async (req, res) => {
  const result = await adminService.createTax(
    req.body,
    req.user?._id || req.user?.id,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Tax rule created successfully"));
});

/* -------------------- UPDATE TAX -------------------- */

export const updateTax = asyncHandler(async (req, res) => {
  const result = await adminService.updateTax(
    req.params.id,
    req.body,
    req.user?._id || req.user?.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tax rule updated successfully"));
});

/* -------------------- DELETE TAX -------------------- */

export const deleteTax = asyncHandler(async (req, res) => {
  const result = await adminService.deleteTax(
    req.params.id,
    req.user?._id || req.user?.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tax rule deleted successfully"));
});

/* -------------------- UPDATE TAX STATUS -------------------- */

export const updateTaxStatus = asyncHandler(async (req, res) => {
  const result = await adminService.updateTaxStatus(
    req.params.id,
    req.body.isActive,
    req.user?._id || req.user?.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tax status updated successfully"));
});



/* -------------------- GET ALL SHIPPING ZONES -------------------- */

export const getShippingZones = asyncHandler(async (req, res) => {
  const result = await adminService.getShippingZones(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Shipping zones fetched successfully"));
});

/* -------------------- GET SHIPPING ZONE BY ID -------------------- */

export const getShippingZoneById = asyncHandler(async (req, res) => {
  const result = await adminService.getShippingZoneById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Shipping zone fetched successfully"));
});

/* -------------------- CREATE SHIPPING ZONE -------------------- */

export const createShippingZone = asyncHandler(async (req, res) => {
  const result = await adminService.createShippingZone(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Shipping zone created successfully"));
});

/* -------------------- UPDATE SHIPPING ZONE -------------------- */

export const updateShippingZone = asyncHandler(async (req, res) => {
  const result = await adminService.updateShippingZone(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Shipping zone updated successfully"));
});

/* -------------------- DELETE SHIPPING ZONE -------------------- */

export const deleteShippingZone = asyncHandler(async (req, res) => {
  const result = await adminService.deleteShippingZone(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Shipping zone deleted successfully"));
});

/* -------------------- UPDATE SHIPPING ZONE STATUS -------------------- */

export const updateShippingZoneStatus = asyncHandler(async (req, res) => {
  const result = await adminService.updateShippingZoneStatus(
    req.params.id,
    req.body.isActive,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Shipping zone status updated successfully"),
    );
});

/* -------------------- SUPPORT TICKETS MANAGEMENT -------------------- */

const getSupportTickets = asyncHandler(async (req, res) => {
  const result = await adminService.getSupportTickets(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Support tickets fetched successfully"));
});

const getSupportTicketById = asyncHandler(async (req, res) => {
  const ticket = await adminService.getSupportTicketById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Support ticket fetched successfully"));
});

const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await adminService.updateSupportTicketStatus({
    ticketId: req.params.id,
    status: req.body.status,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket status updated successfully"));
});

const updateSupportTicketPriority = asyncHandler(async (req, res) => {
  const ticket = await adminService.updateSupportTicketPriority({
    ticketId: req.params.id,
    priority: req.body.priority,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket priority updated successfully"));
});

const assignSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await adminService.assignSupportTicket({
    ticketId: req.params.id,
    assignedTo: req.body.assignedTo,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket assigned successfully"));
});

const replyToSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await adminService.replyToSupportTicket({
    ticketId: req.params.id,
    message: req.body.message,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Reply sent successfully"));
});

const addSupportTicketNote = asyncHandler(async (req, res) => {
  const ticket = await adminService.addSupportTicketNote({
    ticketId: req.params.id,
    note: req.body.note,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Internal note added successfully"));
});

const closeSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await adminService.closeSupportTicket({
    ticketId: req.params.id,
    adminId: req.user._id,
    resolution: req.body.resolution,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket closed successfully"));
});

const reopenSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await adminService.reopenSupportTicket({
    ticketId: req.params.id,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket reopened successfully"));
});

const getSupportTicketHistory = asyncHandler(async (req, res) => {
  const history = await adminService.getSupportTicketHistory(
    req.params.id,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, history, "Ticket history fetched successfully"));
});



/* ======================== Export ======================== */

export default {
  //Dashboard
  getDashboardStats,
  getDashboardAnalytics,
  getRecentOrders,
  getLowStockProducts,

  // Users
  getAllUsersbyAdmin,
  getUserByIdbyAdmin,
  updateUserStatusbyAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  toggleUserStatusbyAdmin,

  // Vendors
  getAllVendorsbyAdmin,
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
