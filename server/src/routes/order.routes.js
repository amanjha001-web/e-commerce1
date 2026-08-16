import { Router } from "express";

import { orderController } from "../controllers/index.js";

import { authMiddleware as verifyJWT } from "../middlewares/index.js";
import { authorizeRoles } from "../middlewares/index.js";
import { validate } from "../middlewares/index.js";

import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdSchema,
} from "../validators/index.js";

const router = Router();

/*                            Customer Routes                                 */

// Create Order
router.post(
  "/",
  verifyJWT,
  authorizeRoles("customer"),
  validate(createOrderSchema),
  orderController.createOrder,
);

// My Orders
router.get(
  "/my",
  verifyJWT,
  authorizeRoles("customer"),
  orderController.getMyOrders,
);

// Vendor Orders
router.get(
  "/vendor",
  verifyJWT,
  authorizeRoles("vendor"),
  orderController.getVendorOrders,
);

/*                         Admin Routes                         */

// Get All Orders
router.get(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  orderController.getAllOrders,
);

// Order Details
router.get(
  "/:id",
  verifyJWT,
  validate(orderIdSchema),
  orderController.getOrderById,
);

// Cancel Order
router.patch(
  "/:id/cancel",
  verifyJWT,
  authorizeRoles("customer"),
  validate(orderIdSchema),
  orderController.cancelOrder,
);

/*                              Admin Routes                                  */

// Update Order Status
router.patch(
  "/:id/status",
  verifyJWT,
  authorizeRoles("admin"),
  validate(orderIdSchema),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);

export default router;
