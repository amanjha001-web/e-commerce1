import { Router } from "express";

import {
  brandController
} from "../controllers/index.js";

import { authMiddleware } from "../middlewares/index.js";
import {authorize} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";
import { uploadBrandImage } from "../middlewares/index.js";

import {
  createBrandSchema,
  updateBrandSchema,
} from "../validators/index.js";

const router = Router();

/*                               Public Routes                                */

// Get All Brands
router.get("/", brandController.getAllBrands);

// Get Brand By Slug
router.get("/slug/:slug", brandController.getBrandBySlug);

// Get Brand By ID
router.get("/:id", brandController.getBrandById);

/*                           Protected Routes (Admin)                         */

// Create Brand
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  uploadBrandImage,
  validate(createBrandSchema),
  brandController.createBrand,
);

// Update Brand
router.patch(
  "/:id",
  authMiddleware,
  authorize("admin"),
  uploadBrandImage,
  validate(updateBrandSchema),
  brandController.updateBrand,
);

// Delete Brand
router.delete("/:id", authMiddleware, authorize("admin"), brandController.deleteBrand);

export default router;
