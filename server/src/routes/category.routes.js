import { Router } from "express";

import {
  categoryController
} from "../controllers/index.js";

import {authMiddleware as verifyJWT } from "../middlewares/index.js";
import {authorizeRoles} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";
import { uploadCategoryImage } from "../middlewares/index.js";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/index.js";

const router = Router();


// Public Routes

// Get All Categories
router.get("/", categoryController.getAllCategories);

// Get Category By Slug
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// Get Category By ID
router.get("/:id", categoryController.getCategoryById);


// Protected Routes (Admin Only)

// Create Category
router.post(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  uploadCategoryImage,
  validate(createCategorySchema),
  categoryController.createCategory,
);

// Update Category
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  uploadCategoryImage,
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

// Delete Category
router.delete("/:id", verifyJWT, authorizeRoles("admin"), categoryController.deleteCategory);

export default router;
