import { Router } from 'express';
import { validateCoupon } from '../../controllers/common/coupon.controller.js';
import { optionalAuthenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/validate', optionalAuthenticate, validateCoupon);

export default router;
