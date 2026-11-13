import { Router } from 'express';
import * as vendorPayoutController from '../../controllers/vendor/payout.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorPayoutController.getPayouts);
router.post('/', vendorPayoutController.requestPayout);
router.get('/:payoutId', vendorPayoutController.getPayoutById);

export default router;
