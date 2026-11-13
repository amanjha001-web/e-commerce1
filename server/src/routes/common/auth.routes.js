import { Router } from 'express';
import * as authController from '../../controllers/common/auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  otpSchema,
} from '../../validators/auth.validator.js';
import { authRateLimiter } from '../../config/security.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getCurrentUser);

router.post('/send-verification-otp', authController.sendVerificationOTP);
router.post('/verify-otp', validate({ body: otpSchema }), authController.verifyOTP);
router.post('/verify-email', validate({ body: otpSchema }), authController.verifyEmail);

router.post('/forgot-password', authRateLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password/:token', validate({ body: resetPasswordSchema }), authController.resetPassword);
router.patch('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);

router.post('/google', authController.googleLogin);
router.get('/check-username/:username', authController.checkUsername);
router.get('/check-email/:email', authController.checkEmail);

export default router;
