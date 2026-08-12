/**
 * Admin Routes
 *
 * Base Route:
 * /api/v1/admin
 */

import { Router } from "express";

import {
  adminController
} from "../controllers/index.js";

import { authMiddleware} from "../middlewares/index.js";
import {authorizeRoles as roleMiddleware} from "../middlewares/index.js";
import {permissionMiddleware} from "../middlewares/index.js";

import { ROLES } from "../constants/index.js";
import { PERMISSIONS } from "../constants/index.js";

const router = Router();

/*                           Dashboard                                        */

router.get(
  "/dashboard",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.DASHBOARD_VIEW),

  adminController.getDashboardStats,
);

/*                           User Management                                  */

router.get(
  "/users",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.USER_READ),

  adminController.getAllUsersbyAdmin,
);

router.get(
  "/users/:id",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.USER_READ),

  adminController.getUserByIdbyAdmin,
);

router.patch(
  "/users/:id/status",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.USER_UPDATE),

  adminController.updateUserStatusbyAdmin,
);

/*                           Vendor Management                                */

router.get(
  "/vendors",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.VENDOR_READ),

  adminController.getAllVendorsbyAdmin,
);

router.patch(
  "/vendors/:id/approve",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.VENDOR_APPROVE),

  adminController.approveVendor,
);

router.patch(
  "/vendors/:id/reject",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.VENDOR_REJECT),

  adminController.rejectVendor,
);
/*                           Product Moderation                               */

router.get(
  "/products/pending",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_READ),

  adminController.getPendingProducts,
);

router.patch(
  "/products/:id/approve",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_APPROVE),

  adminController.approveProduct,
);

router.patch(
  "/products/:id/reject",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_REJECT),

  adminController.rejectProduct,
);

/*                           Order Management                                 */

router.get(
  "/orders",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.ORDER_READ),

  adminController.getAllOrders,
);

/*                           Export Router                                   */

export default router;
