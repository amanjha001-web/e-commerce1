import { ROLES } from "../constants/roles";

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  VENDOR_VIEW: "vendor:view",
  VENDOR_CREATE: "vendor:create",
  VENDOR_UPDATE: "vendor:update",
  VENDOR_DELETE: "vendor:delete",
  VENDOR_APPROVE: "vendor:approve",

  PRODUCT_VIEW: "product:view",
  PRODUCT_CREATE: "product:create",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",

  CATEGORY_VIEW: "category:view",
  CATEGORY_CREATE: "category:create",
  CATEGORY_UPDATE: "category:update",
  CATEGORY_DELETE: "category:delete",

  BRAND_VIEW: "brand:view",
  BRAND_CREATE: "brand:create",
  BRAND_UPDATE: "brand:update",
  BRAND_DELETE: "brand:delete",

  ORDER_VIEW: "order:view",
  ORDER_UPDATE: "order:update",
  ORDER_CANCEL: "order:cancel",

  PAYMENT_VIEW: "payment:view",
  PAYMENT_REFUND: "payment:refund",

  COUPON_VIEW: "coupon:view",
  COUPON_CREATE: "coupon:create",
  COUPON_UPDATE: "coupon:update",
  COUPON_DELETE: "coupon:delete",

  REPORT_VIEW: "report:view",

  SUPPORT_VIEW: "support:view",
  SUPPORT_MANAGE: "support:manage",

  NOTIFICATION_VIEW: "notification:view",
  NOTIFICATION_MANAGE: "notification:manage",

  SETTINGS_VIEW: "settings:view",
  SETTINGS_UPDATE: "settings:update",

  PERMISSION_VIEW: "permission:view",
  PERMISSION_MANAGE: "permission:manage",
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.NOTIFICATION_VIEW,
  ],

  [ROLES.VENDOR]: [
    PERMISSIONS.DASHBOARD_VIEW,

    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,

    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,

    PERMISSIONS.COUPON_VIEW,
    PERMISSIONS.COUPON_CREATE,
    PERMISSIONS.COUPON_UPDATE,
    PERMISSIONS.COUPON_DELETE,

    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.NOTIFICATION_VIEW,
  ],

  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,

    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,

    PERMISSIONS.VENDOR_VIEW,
    PERMISSIONS.VENDOR_UPDATE,
    PERMISSIONS.VENDOR_APPROVE,

    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,

    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
    PERMISSIONS.CATEGORY_DELETE,

    PERMISSIONS.BRAND_VIEW,
    PERMISSIONS.BRAND_CREATE,
    PERMISSIONS.BRAND_UPDATE,
    PERMISSIONS.BRAND_DELETE,

    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_CANCEL,

    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_REFUND,

    PERMISSIONS.COUPON_VIEW,
    PERMISSIONS.COUPON_CREATE,
    PERMISSIONS.COUPON_UPDATE,
    PERMISSIONS.COUPON_DELETE,

    PERMISSIONS.REPORT_VIEW,

    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_MANAGE,

    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.NOTIFICATION_MANAGE,

    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,

    PERMISSIONS.PERMISSION_VIEW,
  ],

  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};

export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

export const hasPermission = (role, permission) => {
  const permissions = getRolePermissions(role);

  return permissions.includes(permission);
};

export const hasAnyPermission = (role, permissions = []) => {
  return permissions.some((permission) => hasPermission(role, permission));
};

export const hasAllPermissions = (role, permissions = []) => {
  return permissions.every((permission) => hasPermission(role, permission));
};

export const hasRole = (userRole, allowedRoles = []) => {
  return allowedRoles.includes(userRole);
};

export const isSuperAdmin = (role) => {
  return role === ROLES.SUPER_ADMIN;
};

export const isAdmin = (role) => {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
};

export const isVendor = (role) => {
  return role === ROLES.VENDOR;
};

export const isCustomer = (role) => {
  return role === ROLES.USER;
};

export default PERMISSIONS;
