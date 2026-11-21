import { Router } from 'express';
import { getPublicCoupons, validateCoupon } from '../../controllers/common/coupon.controller.js';
import { optionalAuthenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuthenticate, getPublicCoupons);
router.get('/public', optionalAuthenticate, getPublicCoupons);
router.post('/validate', optionalAuthenticate, validateCoupon);

export default router;
