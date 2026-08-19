import { Router } from "express";

import {
  taxController
} from "../controllers/index.js";

import { authMiddleware, authorize, validate } from "../middlewares/index.js";

import taxValidator from "../validators/tax.validator.js";

const router = Router();

/*                              Public Routes                                 */

// Get active taxes
router.get(
  "/active",
  validate(taxValidator.getTaxes),
  taxController.getActiveTaxes,
);

// Calculate tax

router.post(
  "/calculate",
  validate(taxValidator.calculateTax),
  taxController.calculateTax,
);

// Get tax by code
router.get(
  "/code/:code",
  validate(taxValidator.taxCodeParam),
  taxController.getTaxByCode,
);

// Get taxes by category
router.get(
  "/category/:categoryId",
  validate(taxValidator.categoryIdParam),
  taxController.getTaxesByCategory,
);

// Get taxes by location
router.get(
  "/location",
  validate(taxValidator.getTaxesByLocation),
  taxController.getTaxesByLocation,
);



/*                              Admin Routes                                  */

// Create tax
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(taxValidator.createTax),
  taxController.createTax,
);

// Get all taxes
router.get(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(taxValidator.getTaxes),
  taxController.getAllTaxes,
);

// Get tax by id
router.get(
  "/:taxId",
  authMiddleware,
  authorize("admin"),
  validate(taxValidator.taxIdParam),
  taxController.getTaxById,
);

// Update tax status

router.patch(
  "/:taxId/status",
  authMiddleware,
  authorize("admin"),
  validate(taxValidator.updateTaxStatus),
  taxController.updateTaxStatus,
);

// Update tax
router.patch(
  "/:taxId",
  authMiddleware,
  authorize("admin"),
  validate(taxValidator.updateTax),
  taxController.updateTax,
);

// Soft delete tax
router.delete(
  "/:taxId",
  authMiddleware,
  authorize("admin"),
  validate(taxValidator.taxIdParam),
  taxController.deleteTax,
);

export default router;
