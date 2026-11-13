import { Router } from 'express';
import * as orderController from '../../controllers/customer/order.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createOrderSchema,
  cancelOrderSchema,
  returnOrderSchema,
} from '../../validators/order.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createOrderSchema }), orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:orderId', orderController.getOrderById);
router.patch('/:orderId/cancel', validate({ body: cancelOrderSchema }), orderController.cancelOrder);
router.post('/:orderId/return', validate({ body: returnOrderSchema }), orderController.returnOrder);
router.get('/:orderId/track', orderController.trackOrder);

export default router;
