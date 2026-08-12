import { Router } from "express";

import {
  taxController
} from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";
import { authorize } from "../middlewares/index.js";

const router = Router();

/*                              Public Routes                                 */

// Get active taxes
router.get("/active", taxController.getActiveTaxes);

// Get tax by code
router.get("/code/:code", taxController.getTaxByCode);

// Get taxes by category
router.get("/category/:categoryId", taxController.getTaxesByCategory);

// Get taxes by location
router.get("/location", taxController.getTaxesByLocation);

/*                              Admin Routes                                  */

// Create tax
router.post("/", authMiddleware, authorize("ADMIN"), taxController.createTax);

// Get all taxes
router.get("/", authMiddleware, authorize("ADMIN"), taxController.getAllTaxes);

// Get tax by id
router.get(
  "/:taxId",
  authMiddleware,
  authorize("ADMIN"),
  taxController.getTaxById,
);

// Update tax
router.patch(
  "/:taxId",
  authMiddleware,
  authorize("ADMIN"),
  taxController.updateTax,
);

// Soft delete tax
router.delete(
  "/:taxId",
  authMiddleware,
  authorize("ADMIN"),
  taxController.deleteTax,
);

export default router;
