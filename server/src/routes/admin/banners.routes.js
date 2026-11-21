import { Router } from 'express';
import * as bannerController from '../../controllers/admin/banner.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createBannerSchema, updateBannerSchema } from '../../validators/banner.validator.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', bannerController.getAllBanners);
router.post('/', upload.single('image'), validate({ body: createBannerSchema }), bannerController.createBanner);
router.get('/:bannerId', bannerController.getBannerById);
router.patch('/:bannerId', upload.single('image'), validate({ body: updateBannerSchema }), bannerController.updateBanner);
router.patch('/:bannerId/status', bannerController.toggleBannerStatus);
router.delete('/:bannerId', bannerController.deleteBanner);

export default router;
