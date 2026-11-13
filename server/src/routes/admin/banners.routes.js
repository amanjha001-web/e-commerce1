import { Router } from 'express';
import * as bannerController from '../../controllers/admin/banner.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', bannerController.getAllBanners);
router.post('/', upload.single('image'), bannerController.createBanner);
router.get('/:bannerId', bannerController.getBannerById);
router.patch('/:bannerId', upload.single('image'), bannerController.updateBanner);
router.delete('/:bannerId', bannerController.deleteBanner);

export default router;
