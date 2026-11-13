import { Router } from 'express';
import * as vendorProfileController from '../../controllers/vendor/profile.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorProfileController.getProfile);
router.patch('/', vendorProfileController.updateProfile);

export default router;
