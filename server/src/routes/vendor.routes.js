import { Router } from "express";

import {
  vendorController
} from "../controllers/index.js";


import {
  uploadVendorFiles,
  authorizeRoles,
  validate,
  authMiddleware as verifyJWT,
} from "../middlewares/index.js";

import {
  createVendorSchema,
  updateVendorSchema,
} from "../validators/index.js";

const router = Router();

/*                               Public Routes                                */

router.get("/", vendorController.getAllVendors);

router.get("/slug/:slug", vendorController.getVendorBySlug);

router.get("/:id", vendorController.getVendorById);

/*                             Protected Routes                               */

// Create Vendor Profile
router.post(
  "/",
  verifyJWT,
  authorizeRoles("vendor"),
  uploadVendorFiles,
  validate(createVendorSchema),
  vendorController.createVendor,
);

// Update Vendor Profile
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  uploadVendorFiles,
  validate(updateVendorSchema),
  vendorController.updateVendor,
);

// Delete Vendor Profile
router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  vendorController.deleteVendor,
);

export default router;
