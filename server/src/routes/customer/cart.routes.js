import { Router } from 'express';
import * as cartController from '../../controllers/customer/cart.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
} from '../../validators/cart.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', validate({ body: addToCartSchema }), cartController.addToCart);
router.patch('/:productId', validate({ body: updateCartItemSchema }), cartController.updateCartItem);
router.delete('/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

router.post('/coupon', validate({ body: applyCouponSchema }), cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);
router.get('/validate', cartController.validateCart);

export default router;
