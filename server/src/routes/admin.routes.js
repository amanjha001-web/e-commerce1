/**
 * Admin Routes
 *
 * Base Route:
 * /api/v1/admin
 */

import { Router } from "express";

import { adminController } from "../controllers/index.js";

import { authMiddleware } from "../middlewares/index.js";
import { authorizeRoles as roleMiddleware } from "../middlewares/index.js";
import { permissionMiddleware } from "../middlewares/index.js";

import { uploadBrandImage } from "../middlewares/upload.middleware.js";

import {
  getSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
  getSettingsHistory,
} from "../controllers/admin.controller.js";
import {
  getTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
  updateTaxStatus,
} from "../controllers/admin.controller.js";
import {
  getShippingZones,
  getShippingZoneById,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  updateShippingZoneStatus,
} from "../controllers/admin.controller.js";

import { ROLES } from "../constants/index.js";
import { PERMISSIONS } from "../constants/index.js";

const router = Router();

/*                           Dashboard                                        */

//get dashboard stats
router.get(
  "/dashboard",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),

  adminController.getDashboardStats,
);

// Sales & Revenue Analytics
router.get(
  "/dashboard/analytics",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),

  adminController.getDashboardAnalytics,
);

// Recent Orders
router.get(
  "/dashboard/recent-orders",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),

  adminController.getRecentOrders,
);

// Low Stock Products
router.get(
  "/dashboard/low-stock",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_READ),

  adminController.getLowStockProducts,
);

/*                           User Management                                  */

// get all users
router.get(
  "/users",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.USER_READ),

  adminController.getAllUsersbyAdmin,
);

// get single users
router.get(
  "/users/:id",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.USER_READ),

  adminController.getUserByIdbyAdmin,
);

// update user status
router.patch(
  "/users/:id/status",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.USER_UPDATE),

  adminController.updateUserStatusbyAdmin,
);

// Update user profile
router.patch(
  "/users/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.USER_UPDATE),
  adminController.updateUserByAdmin
);

// Delete user
router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.USER_DELETE),
  adminController.deleteUserByAdmin
);


/*                           Vendor Management                                */

// Get all vendors with search, filters and pagination
router.get(
  "/vendors",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_READ),
  adminController.getAllVendorsbyAdmin,
);

// Get all vendor requests
router.get(
  "/vendor-requests",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_READ),
  adminController.getAllVendorRequests
);

// Get pending vendor requests
router.get(
  "/vendor-requests/pending",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_READ),
  adminController.getPendingVendorRequests
);

// Get single vendor request
router.get(
  "/vendor-requests/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_READ),
  adminController.getVendorRequestById
);

// Get single vendor by ID
router.get(
  "/vendors/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_READ),
  adminController.getVendorById,
);

// Update vendor details
router.patch(
  "/vendors/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_UPDATE),
  adminController.updateVendor,
);

// Soft-delete vendor
router.delete(
  "/vendors/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_DELETE),
  adminController.deleteVendor,
);

// Activate / Deactivate vendor toggle vendor status
router.patch(
  "/vendors/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_UPDATE),
  adminController.toggleVendorStatus,
);

// Approve vendor application
router.patch(
  "/vendors/:id/approve",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_APPROVE),
  adminController.approveVendor,
);

// Reject vendor application
router.patch(
  "/vendors/:id/reject",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.VENDOR_REJECT),
  adminController.rejectVendor,
);



/*                           Product Moderation                               */

// get pending products
router.get(
  "/products/pending",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_READ),

  adminController.getPendingProducts,
);

// Get all products
router.get(
  "/products",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_READ),
  adminController.getAllProducts
);

// Get single product details
router.get(
  "/products/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_READ),
  adminController.getProductById
);

// Edit product
router.patch(
  "/products/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_UPDATE),
  adminController.updateProductByAdmin
);

// Delete product
router.delete(
  "/products/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_DELETE),
  adminController.deleteProductByAdmin
);

// approve products
router.patch(
  "/products/:id/approve",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_APPROVE),

  adminController.approveProduct,
);

// reject products
router.patch(
  "/products/:id/reject",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_REJECT),

  adminController.rejectProduct,
);

/*                           Order Management                                 */

// Order Management

// 1. All orders
router.get(
  "/orders",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_READ),
  adminController.getAllOrders,
);

// 2. Refund requests — keep before dynamic order routes
router.get(
  "/orders/refunds",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_READ),
  adminController.getRefundRequests,
);

// 3. Single order details
router.get(
  "/orders/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_READ),
  adminController.getOrderById,
);

// 4. Update order status
router.patch(
  "/orders/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_UPDATE),
  adminController.updateOrderStatus,
);

// 5. Cancel order
router.patch(
  "/orders/:id/cancel",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_UPDATE),
  adminController.cancelOrder,
);

// 6. Process refund
router.patch(
  "/orders/:id/refund",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_UPDATE),
  adminController.processRefund,
);

// 7. Update shipping details
router.patch(
  "/orders/:id/shipping",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_UPDATE),
  adminController.updateOrderShipping,
);

// 8. Order status history
router.get(
  "/orders/:id/history",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.ORDER_READ),
  adminController.getOrderStatusHistory,
);

/*                    Categories Management                   */

// Get all categories
router.get(
  "/categories",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.CATEGORY_READ),
  adminController.getAllCategories,
);

// Get single categories
router.get(
  "/categories/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.CATEGORY_READ),
  adminController.getCategoryById,
);

// Create categories
router.post(
  "/categories",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.CATEGORY_CREATE),
  adminController.createCategory,
);

// Edit categories
router.patch(
  "/categories/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.CATEGORY_UPDATE),
  adminController.updateCategory,
);

// Delete categories
router.delete(
  "/categories/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.CATEGORY_DELETE),
  adminController.deleteCategory,
);

// Status Active/Deactivate
router.patch(
  "/categories/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.CATEGORY_UPDATE),
  adminController.updateCategoryStatus,
);


/* -------------------- Brands Management -------------------- */

// Get all brands: search, filters, pagination
router.get(
  "/brands",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_READ),
  adminController.getAllBrands,
);

// Get brand details
router.get(
  "/brands/:brandId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_READ),
  adminController.getBrandById,
);

// Create brand, optionally with logo
router.post(
  "/brands",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_CREATE),
  uploadBrandImage,
  adminController.createBrand,
);

// Update brand, optionally replace logo
router.patch(
  "/brands/:brandId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_UPDATE),
  uploadBrandImage,
  adminController.updateBrand,
);

// Soft delete brand
router.delete(
  "/brands/:brandId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_DELETE),
  adminController.deleteBrand,
);

// Activate/deactivate brand
router.patch(
  "/brands/:brandId/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_UPDATE),
  adminController.updateBrandStatus,
);

// Upload/change brand logo
router.patch(
  "/brands/:brandId/logo",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_UPDATE),
  uploadBrandImage,
  adminController.updateBrandLogo,
);

// Remove brand logo
router.delete(
  "/brands/:brandId/logo",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.BRAND_DELETE),
  adminController.deleteBrandLogo,
);


/* -------------------- Coupon Management -------------------- */

// Get all coupons
router.get(
  "/coupons",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.COUPON_READ),
  adminController.getAllCoupons,
);

// Get single coupon details
router.get(
  "/coupons/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.COUPON_READ),
  adminController.getCouponById,
);

// Create coupon
router.post(
  "/coupons",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.COUPON_CREATE),
  adminController.createCoupon,
);

// Edit coupon
router.patch(
  "/coupons/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.COUPON_UPDATE),
  adminController.updateCoupon,
);

// Delete coupon
router.delete(
  "/coupons/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.COUPON_DELETE),
  adminController.deleteCoupon,
);

// Activate or deactivate coupon
router.patch(
  "/coupons/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.COUPON_UPDATE),
  adminController.updateCouponStatus,
);

// Get coupon usage statistics
router.get(
  "/coupons/:id/usage",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.COUPON_READ),
  adminController.getCouponUsage,
);

/*                reviews management                */

// get all reviews and pagination
router.get(
  "/reviews",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.REVIEW_READ),
  adminController.getAllReviews,
);

//review reports
router.get(
  "/reviews/reported",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.REVIEW_READ),
  adminController.getReportedReviews,
);

// get single reviews
router.get(
  "/reviews/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.REVIEW_READ),
  adminController.getReviewById,
);

// review approve/reject
router.patch(
  "/reviews/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.REVIEW_UPDATE),
  adminController.updateReviewStatus,
);

// review delete
router.delete(
  "/reviews/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.REVIEW_DELETE),
  adminController.deleteReview,
);

/*                   payments and vendor payout managements               */

// get all payments
router.get(
  "/payments",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PAYMENT_READ),
  adminController.getAllPayments
);

// get single payment
router.get(
  "/payments/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PAYMENT_READ),
  adminController.getPaymentById
);

// refund payment
router.post(
  "/payments/:id/refund",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PAYMENT_REFUND),
  adminController.refundPayment
);

// reconcile payment
router.post(
  "/payments/reconcile",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PAYMENT_RECONCILE),
  adminController.reconcilePayment
);

// get all vendor payout
router.get(
  "/vendor-payouts",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PAYOUT_READ),
  adminController.getAllVendorPayouts
);

//get single vendor payout
router.get(
  "/vendor-payouts/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PAYOUT_READ),
  adminController.getVendorPayoutById
);

// update vendor payout status
router.patch(
  "/vendor-payouts/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PAYOUT_UPDATE),
  adminController.updateVendorPayoutStatus
);


/* ======================== Reports ======================== */

// GET /api/v1/admin/reports/sales
router.get(
  "/reports/sales",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),
  adminController.getSalesReport,
);

// GET /api/v1/admin/reports/revenue
router.get(
  "/reports/revenue",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),
  adminController.getRevenueReport,
);

// GET /api/v1/admin/reports/summary
router.get(
  "/reports/summary",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),
  adminController.getReportSummary,
);

// GET /api/v1/admin/reports/export?format=csv
// GET /api/v1/admin/reports/export?format=xls
router.get(
  "/reports/export",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),
  adminController.exportReport,
);

/* ======================== Activity Logs ======================== */

// GET /api/v1/admin/activity-logs
router.get(
  "/activity-logs",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),
  adminController.getActivityLogs,
);

// GET /api/v1/admin/activity-logs/:id
router.get(
  "/activity-logs/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),
  adminController.getActivityLogById,
);

/* ======================== Inventory Management ======================== */

// All inventory — search, filter, pagination
router.get(
  "/inventory",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_READ),
  adminController.getInventory,
);

// Low-stock products
router.get(
  "/inventory/low-stock",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_READ),
  adminController.getLowStockInventory,
);

// Out-of-stock products
router.get(
  "/inventory/out-of-stock",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_READ),
  adminController.getOutOfStockInventory,
);

// Stock movement history
router.get(
  "/inventory/:productId/movements",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_READ),
  adminController.getInventoryMovements,
);

// Single product inventory
router.get(
  "/inventory/:productId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_READ),
  adminController.getInventoryByProductId,
);

// Adjust stock quantity
router.patch(
  "/inventory/:productId/adjust",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.PRODUCT_UPDATE),
  adminController.adjustInventoryStock,
);






// GET all settings
router.get(
  "/settings",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SETTINGS_READ),
  getSettings,
);

// GET settings history
router.get(
  "/settings/history",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SETTINGS_READ),
  getSettingsHistory,
);

// GET setting by key
router.get(
  "/settings/:key",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SETTINGS_READ),
  getSettingByKey,
);

// UPDATE multiple settings
router.patch(
  "/settings",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SETTINGS_UPDATE),
  updateMultipleSettings,
);

// UPDATE single setting
router.patch(
  "/settings/:key",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SETTINGS_UPDATE),
  updateSetting,
);




// GET all tax rules
router.get(
  "/taxes",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.TAX_READ),
  getTaxes,
);

// CREATE tax rule
router.post(
  "/taxes",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.TAX_CREATE),
  createTax,
);

// UPDATE tax status
router.patch(
  "/taxes/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.TAX_STATUS_UPDATE),
  updateTaxStatus,
);

// GET tax details
router.get(
  "/taxes/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.TAX_READ),
  getTaxById,
);

// UPDATE tax rule
router.patch(
  "/taxes/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.TAX_UPDATE),
  updateTax,
);

// DELETE tax rule
router.delete(
  "/taxes/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.TAX_DELETE),
  deleteTax,
);



/* -------------------- SHIPPING ZONES -------------------- */

// GET all shipping zones
router.get(
  "/shipping-zones",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SHIPPING_ZONE_READ),
  getShippingZones
);

// CREATE shipping zone
router.post(
  "/shipping-zones",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SHIPPING_ZONE_CREATE),
  createShippingZone
);

// UPDATE shipping zone status
router.patch(
  "/shipping-zones/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SHIPPING_ZONE_STATUS_UPDATE),
  updateShippingZoneStatus
);

// GET shipping zone details
router.get(
  "/shipping-zones/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SHIPPING_ZONE_READ),
  getShippingZoneById
);

// UPDATE shipping zone
router.patch(
  "/shipping-zones/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SHIPPING_ZONE_UPDATE),
  updateShippingZone
);

// DELETE shipping zone
router.delete(
  "/shipping-zones/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SHIPPING_ZONE_DELETE),
  deleteShippingZone
);


// Support Tickets

router.get(
  "/support-tickets",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_READ),
  adminController.getSupportTickets,
);

router.get(
  "/support-tickets/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_READ),
  adminController.getSupportTicketById,
);

router.patch(
  "/support-tickets/:id/status",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_UPDATE),
  adminController.updateSupportTicketStatus,
);

router.patch(
  "/support-tickets/:id/priority",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_UPDATE),
  adminController.updateSupportTicketPriority,
);

router.patch(
  "/support-tickets/:id/assign",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_ASSIGN),
  adminController.assignSupportTicket,
);

router.post(
  "/support-tickets/:id/reply",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_REPLY),
  adminController.replyToSupportTicket,
);

router.post(
  "/support-tickets/:id/notes",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_NOTE),
  adminController.addSupportTicketNote,
);

router.patch(
  "/support-tickets/:id/close",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_CLOSE),
  adminController.closeSupportTicket,
);

router.patch(
  "/support-tickets/:id/reopen",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_REOPEN),
  adminController.reopenSupportTicket,
);

router.get(
  "/support-tickets/:id/history",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  permissionMiddleware(PERMISSIONS.SUPPORT_TICKET_HISTORY),
  adminController.getSupportTicketHistory,
);




/*                           Export Router                                   */

export default router;
