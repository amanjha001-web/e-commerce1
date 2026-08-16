import { Router } from "express";

import { productController } from "../controllers/index.js";

import { authMiddleware as verifyJWT } from "../middlewares/index.js";
import { authorizeRoles } from "../middlewares/index.js";
import { uploadProductImages } from "../middlewares/index.js";
import { validate } from "../middlewares/index.js";

import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} from "../validators/index.js";

const router = Router();


// Public Routes


// Get all products
router.get("/", productController.getAllProducts);

// Flash Sale Products
router.get("/flash-sale", productController.getFlashSaleProducts);

// Get product by slug
router.get("/slug/:slug", productController.getProductBySlug);

// get product by sku
router.get("/sku/:sku", productController.getProductBySku);

//get trending products
router.get("/trending", productController.getTrendingProducts);

//get best sellers
router.get("/best-sellers", productController.getBestSellerProducts);


//get new arrivals products
router.get("/new-arrivals", productController.getNewArrivalProducts);

// Get product by id
router.get("/:id", productController.getProductById);


// Protected Routes (Vendor/Admin)


// Create Product
router.post(
  "/",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  uploadProductImages,
  validate(createProductSchema),
  productController.createProduct,
);

// Approve / Publish Product
router.patch(
  "/:id/approve",
  verifyJWT,
  authorizeRoles("admin"),
  validate(productIdSchema),
  productController.approveProduct,
);

// Update Product
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  uploadProductImages,
  validate(updateProductSchema),
  productController.updateProduct,
);

// Delete Product (Soft Delete)
router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  productController.deleteProduct,
);

// Restore Product
router.patch(
  "/:id/restore",
  verifyJWT,
  authorizeRoles("admin"),
  validate(productIdSchema),
  productController.restoreProduct,
);

//toggle product status

router.patch(
  "/:id/toggle-status",
  verifyJWT,
  authorizeRoles("admin", "vendor"),
  validate(productIdSchema),
  productController.toggleProductStatus,
);

// Update Product Stock
router.patch(
  "/:id/stock",
  verifyJWT,
  authorizeRoles("vendor", "admin"),
  validate(productIdSchema),
  productController.updateProductStock,
);

export default router;
