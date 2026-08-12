import { Router } from "express";

import { authController } from "../controllers/index.js";

import { validate } from "../middlewares/index.js";

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "../validators/index.js";

import { authMiddleware as verifyJWT } from "../middlewares/index.js";

const router = Router();

// Public Routes
router.post("/register", validate(registerSchema), authController.registerUser);

router.post("/login", validate(loginSchema), authController.loginUser);

router.route("/refresh-token").post(authController.refreshAccessToken);

router.post(
  "/verify-email/:token",
  validate(verifyEmailSchema),
  authController.verifyEmail,
);

router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  authController.resendVerification,
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// Protected Routes
router.route("/logout").post(verifyJWT, authController.logoutUser);

router.route("/current-user").get(verifyJWT, authController.getCurrentUser);

router
  .route("/change-password")
  .patch(verifyJWT, authController.changeCurrentPassword);

router
  .route("/update-account")
  .patch(verifyJWT, authController.updateAccountDetails);

export default router;
