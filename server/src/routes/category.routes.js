import { Router } from "express";

import {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadCategoryImage } from "../middlewares/upload.middleware.js";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Get All Categories
router.get("/", getAllCategories);

// Get Category By Slug
router.get("/slug/:slug", getCategoryBySlug);

// Get Category By ID
router.get("/:id", getCategoryById);

/*
|--------------------------------------------------------------------------
| Protected Routes (Admin Only)
|--------------------------------------------------------------------------
*/

// Create Category
router.post(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  uploadCategoryImage,
  validate(createCategorySchema),
  createCategory,
);

// Update Category
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  uploadCategoryImage,
  validate(updateCategorySchema),
  updateCategory,
);

// Delete Category
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteCategory);

export default router;
