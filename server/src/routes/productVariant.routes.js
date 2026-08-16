/**
 * Product Variant Routes
 *
 * Base:
 * /api/v1
 *
 * Handles:
 * - Create variant
 * - Update variant
 * - Stock management
 * - Delete/restore variant
 */

import { Router } from "express";

import { productVariantController } from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";
import {authorizeRoles as roleMiddleware} from "../middlewares/index.js";
import {permissionMiddleware} from "../middlewares/index.js";

import { ROLES } from "../constants/roles.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

/*                         Variant Creation                                   */

/**
 * Create Product Variant
 *
 * POST
 * /products/:productId/variants
 *
 * Vendor/Admin
 */

router.post(
  "/products/:productId/variants",

  authMiddleware,

  roleMiddleware(ROLES.VENDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_CREATE),

  productVariantController.createVariant,
);

/*                         Get Variants                                       */

/**
 * Get Product Variants
 *
 * GET
 * /products/:productId/variants
 */

router.get(
  "/products/:productId/variants",

  productVariantController.getProductVariants,
);

/*                         SKU Check                                          */

/**
 * Check SKU Availability
 *
 * GET
 * /variants/check-sku/:sku
 */

router.get(
  "/variants/check-sku/:sku",

  authMiddleware,

  roleMiddleware(ROLES.VENDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  productVariantController.checkSkuAvailability,
);

/**
 * Get Single Variant
 *
 * GET
 * /variants/:id
 */

router.get(
  "/variants/:id",

  productVariantController.getVariantById,
);

/*                         Update Variant                                     */

/**
 * Update Variant
 *
 * PATCH
 * /variants/:id
 */

router.patch(
  "/variants/:id",

  authMiddleware,

  roleMiddleware(ROLES.VENDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_UPDATE),

  productVariantController.updateVariant,
);

/*                         Delete / Restore                                  */

/**
 * Soft Delete Variant
 *
 * DELETE
 * /variants/:id
 */

router.delete(
  "/variants/:id",

  authMiddleware,

  roleMiddleware(ROLES.VENDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_DELETE),

  productVariantController.deleteVariant,
);

/**
 * Restore Variant
 *
 * PATCH
 * /variants/:id/restore
 */

router.patch(
  "/variants/:id/restore",

  authMiddleware,

  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_UPDATE),

  productVariantController.restoreVariant,
);

/*                         Inventory Routes                                   */

/**
 * Increase Stock
 *
 * PATCH
 * /variants/:id/stock/increase
 */

router.patch(
  "/variants/:id/stock/increase",

  authMiddleware,

  roleMiddleware(ROLES.VENDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_UPDATE),

  productVariantController.increaseStock,
);

/**
 * Decrease Stock
 *
 * PATCH
 * /variants/:id/stock/decrease
 */

router.patch(
  "/variants/:id/stock/decrease",

  authMiddleware,

  roleMiddleware(ROLES.VENDOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  permissionMiddleware(PERMISSIONS.PRODUCT_UPDATE),

  productVariantController.decreaseStock,
);

/**
 * Reserve Stock
 *
 * PATCH
 * /variants/:id/stock/reserve
 */

router.patch(
  "/variants/:id/stock/reserve",

  authMiddleware,

  roleMiddleware(ROLES.SYSTEM, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  productVariantController.reserveStock,
);

/**
 * Release Reserved Stock
 *
 * PATCH
 * /variants/:id/stock/release
 */

router.patch(
  "/variants/:id/stock/release",

  authMiddleware,

  roleMiddleware(ROLES.SYSTEM, ROLES.ADMIN, ROLES.SUPER_ADMIN),

  productVariantController.releaseStock,
);



export default router;
