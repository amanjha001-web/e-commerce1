import { Router } from "express";

import {
  bannerController
} from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";
import { authorize } from "../middlewares/index.js";

const router = Router();

/*                              Public Routes                                 */

// Active banners
router.get("/active", bannerController.getActiveBanners);

// Banner by slug
router.get("/slug/:slug", bannerController.getBannerBySlug);

// Record banner impression
router.patch("/:bannerId/impression", bannerController.incrementImpression);

// Record banner click
router.patch("/:bannerId/click", bannerController.incrementClick);

/*                              Admin Routes                                  */

// Create banner
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  bannerController.createBanner,
);

// Get all banners
router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  bannerController.getAllBanners,
);

// Get banner by id
router.get(
  "/:bannerId",
  authMiddleware,
  authorize("ADMIN"),
  bannerController.getBannerById,
);

// Update banner
router.patch(
  "/:bannerId",
  authMiddleware,
  authorize("ADMIN"),
  bannerController.updateBanner,
);

// Delete banner (Soft Delete)
router.delete(
  "/:bannerId",
  authMiddleware,
  authorize("ADMIN"),
  bannerController.deleteBanner,
);

export default router;
