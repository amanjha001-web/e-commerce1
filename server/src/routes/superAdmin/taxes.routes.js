import { Router } from 'express';
import * as taxController from '../../controllers/superAdmin/tax.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', taxController.getTaxes);
router.post('/', taxController.createTax);
router.get('/:taxId', taxController.getTaxById);
router.patch('/:taxId', taxController.updateTax);
router.delete('/:taxId', taxController.deleteTax);
router.patch('/:taxId/status', taxController.updateTaxStatus);

export default router;
