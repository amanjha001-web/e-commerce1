import { Router } from 'express';
import * as productController from '../../controllers/admin/product.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', productController.getAdminProducts);
router.get('/pending', productController.getPendingProducts);
router.get('/:productId', productController.getProductById);
router.patch('/:productId/approve', productController.approveProduct);
router.patch('/:productId/reject', productController.rejectProduct);
router.patch('/:productId', productController.updateProduct);
router.patch('/:productId/status', productController.updateProductStatus);
router.delete('/:productId', productController.deleteProduct);

export default router;
