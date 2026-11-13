import { Router } from 'express';
import * as vendorEarningsController from '../../controllers/vendor/earnings.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorEarningsController.getEarnings);
router.get('/summary', vendorEarningsController.getEarningsSummary);

export default router;
