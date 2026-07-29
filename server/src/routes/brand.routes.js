import { Router } from "express";

import {
  createBrand,
  getAllBrands,
  getBrandById,
  getBrandBySlug,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadBrandImage } from "../middlewares/upload.middleware.js";

import {
  createBrandSchema,
  updateBrandSchema,
} from "../validators/brand.validator.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                               Public Routes                                */
/* -------------------------------------------------------------------------- */

// Get All Brands
router.get("/", getAllBrands);

// Get Brand By Slug
router.get("/slug/:slug", getBrandBySlug);

// Get Brand By ID
router.get("/:id", getBrandById);

/* -------------------------------------------------------------------------- */
/*                           Protected Routes (Admin)                         */
/* -------------------------------------------------------------------------- */

// Create Brand
router.post(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  uploadBrandImage,
  validate(createBrandSchema),
  createBrand,
);

// Update Brand
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  uploadBrandImage,
  validate(updateBrandSchema),
  updateBrand,
);

// Delete Brand
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteBrand);

export default router;
