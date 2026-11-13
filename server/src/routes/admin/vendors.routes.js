import { Router } from 'express';
import * as vendorController from '../../controllers/admin/vendor.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', vendorController.getVendors);
router.get('/:vendorId', vendorController.getVendorById);
router.patch('/:vendorId', vendorController.updateVendor);
router.patch('/:vendorId/status', vendorController.toggleVendorStatus);
router.patch('/:vendorId/approve', vendorController.approveVendor);
router.patch('/:vendorId/reject', vendorController.rejectVendor);
router.delete('/:vendorId', vendorController.deleteVendor);

export default router;
