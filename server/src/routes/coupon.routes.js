import { Router } from "express";

import {
  couponController
} from "../controllers/index.js";

import {authMiddleware as verifyJWT } from "../middlewares/index.js";
import {authorizeRoles} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
  couponIdSchema,
  couponCodeSchema,
} from "../validators/index.js";

const router = Router();

/*                             Customer Routes                                */

// Apply Coupon
router.post("/apply", verifyJWT, validate(applyCouponSchema), couponController.applyCoupon);

// Get Coupon By Code
router.get("/:code", verifyJWT, validate(couponCodeSchema), couponController.getCouponByCode);

/*                               Admin Routes                                 */

// Create Coupon
router.post(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  validate(createCouponSchema),
  couponController.createCoupon,
);

// Get All Coupons
router.get("/", verifyJWT, authorizeRoles("admin"), couponController.getAllCoupons);

// Update Coupon
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  validate(couponIdSchema),
  validate(updateCouponSchema),
  couponController.updateCoupon,
);

// Delete Coupon
router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  validate(couponIdSchema),
  couponController.deleteCoupon,
);

export default router;
