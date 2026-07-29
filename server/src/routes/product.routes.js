import { Router } from "express";

import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import { uploadProductImages } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Get all products
router.get("/", getAllProducts);

// Get product by slug
router.get("/slug/:slug", getProductBySlug);

// Get product by id
router.get("/:id", getProductById);

/*
|--------------------------------------------------------------------------
| Protected Routes (Vendor/Admin)
|--------------------------------------------------------------------------
*/

// Create Product
router.post(
  "/",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  uploadProductImages,
  validate(createProductSchema),
  createProduct,
);

// Update Product
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  uploadProductImages,
  validate(updateProductSchema),
  updateProduct,
);

// Delete Product (Soft Delete)
router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  deleteProduct,
);

export default router;
