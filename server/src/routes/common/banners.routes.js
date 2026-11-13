import { Router } from 'express';
import * as bannerController from '../../controllers/common/banner.controller.js';

const router = Router();

router.get('/', bannerController.getActiveBanners);
router.get('/active', bannerController.getActiveBanners);
router.get('/slug/:slug', bannerController.getBannerBySlug);
router.get('/:bannerId', bannerController.getBannerById);
router.patch('/:bannerId/impression', bannerController.incrementImpression);
router.patch('/:bannerId/click', bannerController.incrementClick);

export default router;
