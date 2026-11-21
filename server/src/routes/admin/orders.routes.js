import { Router } from 'express';
import * as orderController from '../../controllers/admin/order.controller.js';
import { adminRefundService } from '../../services/admin/refund.service.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', orderController.getOrders);
router.get('/refunds', asyncHandler(async (req, res) => {
  const result = await adminRefundService.getRefunds(req.query);
  return ApiResponse.success(res, result, 'Refund requests');
}));
router.get('/:orderId', orderController.getOrderById);
router.get('/:orderId/history', orderController.getOrderById);
router.patch('/:orderId/status', orderController.updateOrderStatus);
router.patch('/:orderId/cancel', orderController.cancelOrder);
router.post('/:orderId/refund', orderController.processRefund);
router.patch('/:orderId/refund', orderController.processRefund);
router.patch('/:orderId/shipping', orderController.updateOrderShipping);
router.patch('/:orderId/return/approve', orderController.approveReturn);
router.patch('/:orderId/return/reject', orderController.rejectReturn);

export default router;
