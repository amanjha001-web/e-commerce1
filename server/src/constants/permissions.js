/**
 * Application Permissions
 *
 * Format:
 * RESOURCE_ACTION
 *
 * Used for:
 *  Role Based Access Control (RBAC)
 *  Middleware authorization
 *  Admin/Vendor access management
 */

export const PERMISSIONS = Object.freeze({
  /* User Permissions                                                         */

  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  /* Vendor Permissions                                                       */

  VENDOR_CREATE: "vendor:create",
  VENDOR_READ: "vendor:read",
  VENDOR_UPDATE: "vendor:update",
  VENDOR_DELETE: "vendor:delete",
  VENDOR_APPROVE: "vendor:approve",
  VENDOR_REJECT: "vendor:reject",
  VENDOR_SUSPEND: "vendor:suspend",

  /* Product Permissions                                                      */

  PRODUCT_CREATE: "product:create",
  PRODUCT_READ: "product:read",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",
  PRODUCT_APPROVE: "product:approve",
  PRODUCT_REJECT: "product:reject",

  /* Category Permissions                                                     */

  CATEGORY_CREATE: "category:create",
  CATEGORY_READ: "category:read",
  CATEGORY_UPDATE: "category:update",
  CATEGORY_DELETE: "category:delete",

  /* Brand Permissions                                                        */

  BRAND_CREATE: "brand:create",
  BRAND_READ: "brand:read",
  BRAND_UPDATE: "brand:update",
  BRAND_DELETE: "brand:delete",

  /* Order Permissions                                                        */

  ORDER_CREATE: "order:create",
  ORDER_READ: "order:read",
  ORDER_UPDATE: "order:update",
  ORDER_CANCEL: "order:cancel",
  ORDER_RETURN: "order:return",
  ORDER_REFUND: "order:refund",

  /* Payment Permissions                                                      */

  PAYMENT_READ: "payment:read",
  PAYMENT_PROCESS: "payment:process",
  PAYMENT_REFUND: "payment:refund",

  /* Review Permissions                                                       */

  REVIEW_CREATE: "review:create",
  REVIEW_READ: "review:read",
  REVIEW_UPDATE: "review:update",
  REVIEW_DELETE: "review:delete",
  REVIEW_MODERATE: "review:moderate",

  /* Coupon Permissions                                                       */

  COUPON_CREATE: "coupon:create",
  COUPON_READ: "coupon:read",
  COUPON_UPDATE: "coupon:update",
  COUPON_DELETE: "coupon:delete",

  /* Dashboard Permissions                                                    */

  DASHBOARD_VIEW: "dashboard:view",
  ANALYTICS_VIEW: "analytics:view",

  /* System Permissions                                                       */

  SETTINGS_MANAGE: "settings:manage",
  LOGS_VIEW: "logs:view",
});
