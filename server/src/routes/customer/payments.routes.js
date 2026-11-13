import { Router } from 'express';
import * as paymentController from '../../controllers/customer/payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  verifyPaymentSchema,
  refundPaymentSchema,
} from '../../validators/payment.validator.js';

const router = Router();

router.use(authenticate);

router.post('/create-order', paymentController.createPaymentOrder);
router.post('/verify', validate({ body: verifyPaymentSchema }), paymentController.verifyPayment);
router.get('/:paymentId', paymentController.getPaymentById);
router.get('/order/:orderId', paymentController.getOrderPayment);
router.get('/:paymentId/status', paymentController.getPaymentStatus);
router.post('/retry', paymentController.retryPayment);
router.post('/:paymentId/refund', validate({ body: refundPaymentSchema }), paymentController.requestRefund);

export default router;
