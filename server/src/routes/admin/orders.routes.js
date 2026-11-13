import { Router } from 'express';
import * as orderController from '../../controllers/admin/order.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderById);
router.patch('/:orderId/status', orderController.updateOrderStatus);
router.patch('/:orderId/cancel', orderController.cancelOrder);
router.post('/:orderId/refund', orderController.processRefund);
router.patch('/:orderId/shipping', orderController.updateOrderShipping);
router.patch('/:orderId/return/approve', orderController.approveReturn);
router.patch('/:orderId/return/reject', orderController.rejectReturn);

export default router;
