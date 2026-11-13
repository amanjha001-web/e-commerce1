import { Router } from 'express';
import * as requestController from '../../controllers/admin/vendorRequest.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', requestController.getVendorRequests);
router.get('/pending', requestController.getPendingVendorRequests);
router.get('/:requestId', requestController.getVendorRequestById);
router.patch('/:requestId/approve', requestController.approveVendorRequest);
router.patch('/:requestId/reject', requestController.rejectVendorRequest);
router.patch('/:requestId/review', requestController.reviewVendorRequest);
router.patch('/:requestId/restore', requestController.restoreVendorRequest);
router.delete('/:requestId', requestController.deleteVendorRequest);

export default router;
