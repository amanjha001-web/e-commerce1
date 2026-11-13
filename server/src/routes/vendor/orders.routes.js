import { Router } from 'express';
import * as vendorOrderController from '../../controllers/vendor/order.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorOrderController.getVendorOrders);
router.get('/:orderId', vendorOrderController.getVendorOrderById);
router.patch('/:orderId/status', vendorOrderController.updateOrderStatus);

export default router;
