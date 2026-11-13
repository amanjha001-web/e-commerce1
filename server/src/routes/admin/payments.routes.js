import { Router } from 'express';
import * as paymentController from '../../controllers/admin/payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', paymentController.getPayments);
router.get('/:paymentId', paymentController.getPaymentById);
router.post('/:paymentId/refund', paymentController.refundPayment);
router.post('/reconcile', paymentController.reconcilePayment);

export default router;
