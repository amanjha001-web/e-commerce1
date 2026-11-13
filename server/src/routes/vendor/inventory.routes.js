import { Router } from 'express';
import * as vendorInventoryController from '../../controllers/vendor/inventory.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorInventoryController.getInventory);
router.patch('/:productId', vendorInventoryController.updateInventory);

export default router;
