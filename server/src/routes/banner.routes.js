import { Router } from "express";

import { bannerController } from "../controllers/index.js";

import {
  authMiddleware,
  authorize,
  validate,
  uploadBannerImages,
} from "../middlewares/index.js";

import bannerValidator from "../validators/banner.validator.js";

const router = Router();

/* ============================ Public Routes ============================ */

// Get active banners
router.get("/active", bannerController.getActiveBanners);

// Get banner by slug
router.get("/slug/:slug", bannerController.getBannerBySlug);

// Record banner impression
router.patch("/:bannerId/impression", bannerController.incrementImpression);

// Record banner click
router.patch("/:bannerId/click", bannerController.incrementClick);

/* ============================= Admin Routes ============================ */

// Create banner
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  uploadBannerImages,
  validate(bannerValidator.createBanner),
  bannerController.createBanner,
);

// Get all banners
router.get(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(bannerValidator.getBanners),
  bannerController.getAllBanners,
);

// Get banner by ID
router.get(
  "/:bannerId",
  authMiddleware,
  authorize("admin"),
  validate(bannerValidator.bannerIdParam),
  bannerController.getBannerById,
);

// Update banner
router.patch(
  "/:bannerId",
  authMiddleware,
  authorize("admin"),
  validate(bannerValidator.updateBanner),
  bannerController.updateBanner,
);

// Delete banner
router.delete(
  "/:bannerId",
  authMiddleware,
  authorize("admin"),
  validate(bannerValidator.bannerIdParam),
  bannerController.deleteBanner,
);

export default router;
