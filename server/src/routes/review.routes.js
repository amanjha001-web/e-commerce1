import { Router } from "express";

import {
  reviewController
} from "../controllers/index.js";

import {authMiddleware as verifyJWT } from "../middlewares/index.js";
import {authorizeRoles} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  productReviewSchema,
} from "../validators/index.js";

const router = Router();

/*                               Public Routes                                */

// Get Reviews of a Product
router.get(
  "/product/:productId",
  validate(productReviewSchema),
  reviewController.getProductReviews,
);

/*                             Customer Routes                                */

// Create Review
router.post(
  "/",
  verifyJWT,
  authorizeRoles("customer"),
  validate(createReviewSchema),
  reviewController.createReview,
);

// Update Review
router.patch(
  "/:id",
  verifyJWT,
  authorizeRoles("customer"),
  validate(reviewIdSchema),
  validate(updateReviewSchema),
  reviewController.updateReview,
);

// Delete Review
router.delete("/:id", verifyJWT, validate(reviewIdSchema), reviewController.deleteReview);

/*                               Admin Routes                                 */

// Get All Reviews
router.get("/", verifyJWT, authorizeRoles("admin"), reviewController.getAllReviews);

export default router;
