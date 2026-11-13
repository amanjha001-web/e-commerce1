import { Router } from 'express';
import * as couponController from '../../controllers/admin/coupon.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCouponSchema, updateCouponSchema } from '../../validators/coupon.validator.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', couponController.getCoupons);
router.post('/', validate({ body: createCouponSchema }), couponController.createCoupon);
router.get('/:couponId', couponController.getCouponById);
router.patch('/:couponId', validate({ body: updateCouponSchema }), couponController.updateCoupon);
router.delete('/:couponId', couponController.deleteCoupon);
router.patch('/:couponId/status', couponController.toggleCouponStatus);
router.get('/:couponId/usage', couponController.getCouponUsage);

export default router;
