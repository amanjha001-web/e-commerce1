import { Router } from 'express';
import * as vendorStoreController from '../../controllers/vendor/store.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorStoreController.getMyStore);
router.patch('/', vendorStoreController.updateStore);
router.patch('/logo', upload.single('logo'), vendorStoreController.updateStoreLogo);
router.patch('/banner', upload.single('banner'), vendorStoreController.updateStoreBanner);

router.get('/dashboard', vendorStoreController.getDashboard);
router.get('/stats', vendorStoreController.getStats);
router.get('/sales', vendorStoreController.getSalesReport);

export default router;
