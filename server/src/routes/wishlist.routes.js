import { Router } from "express";

import {
  addToWishlist, getWishlist, removeFromWishlist, clearWishlist
} from "../controllers/index.js";

import {authMiddleware as verifyJWT } from "../middlewares/index.js";
import {authorizeRoles} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  addToWishlistSchema,
  removeFromWishlistSchema,
} from "../validators/wishlist.validator.js";

const router = Router();

/*                           Protected Routes                                 */

router.use(verifyJWT);
router.use(authorizeRoles("customer"));

router.post("/", validate(addToWishlistSchema), addToWishlist);

router.get("/", getWishlist);

router.delete(
  "/:productId",
  validate(removeFromWishlistSchema),
  removeFromWishlist,
);

router.delete("/", clearWishlist);

export default router;
