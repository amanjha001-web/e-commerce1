import { Router } from "express";

import {addToCart, getMyCart, updateCartItem, removeCartItem, clearCart} from "../controllers/index.js";

import { authMiddleware as verifyJWT } from "../middlewares/index.js";
import {authorizeRoles} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "../validators/index.js";

const router = Router();

/*                          Protected Routes                                  */

router.use(verifyJWT);
router.use(authorizeRoles("customer", "admin"));

router.post("/", validate(addToCartSchema), addToCart);

router.get("/", getMyCart);

router.patch("/:productId", validate(updateCartItemSchema), updateCartItem);

router.delete("/:productId", validate(removeCartItemSchema), removeCartItem);

router.delete("/", clearCart);

export default router;
