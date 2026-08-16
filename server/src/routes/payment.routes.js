import { Router } from "express";

import { paymentController } from "../controllers/index.js";

import { authMiddleware as verifyJWT } from "../middlewares/index.js";
import { validate } from "../middlewares/index.js";

import {
  createRazorpayOrderSchema,
  verifyPaymentSchema,
  paymentFailureSchema,
  orderIdSchema,
} from "../validators/index.js";

const router = Router();

/*                         Create Razorpay Order                              */

router.post(
  "/create-order",
  verifyJWT,
  validate(createRazorpayOrderSchema),
  paymentController.createRazorpayOrder,
);

/*                            Verify Payment                                  */

router.post(
  "/verify",
  verifyJWT,
  validate(verifyPaymentSchema),
  paymentController.verifyPayment,
);

router.post(
  "/failure",
  verifyJWT,
  validate(paymentFailureSchema),
  paymentController.handlePaymentFailure,
);

/*                         Get Payment By Order                              */

router.get(
  "/order/:id",
  verifyJWT,
  validate(orderIdSchema),
  paymentController.getPaymentByOrder,
);

export default router;
