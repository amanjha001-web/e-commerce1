import { Router } from 'express';
import * as inventoryController from '../../controllers/admin/inventory.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', inventoryController.getInventory);
router.get('/low-stock', inventoryController.getLowStockInventory);
router.get('/out-of-stock', inventoryController.getOutOfStockInventory);
router.get('/:productId', inventoryController.getInventoryByProductId);
router.patch('/:productId', inventoryController.adjustInventoryStock);
router.patch('/:productId/adjust', inventoryController.adjustInventoryStock);
router.get('/:productId/movements', inventoryController.getInventoryMovements);

export default router;
