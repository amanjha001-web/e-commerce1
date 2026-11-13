import { Router } from 'express';
import * as brandController from '../../controllers/common/brand.controller.js';

const router = Router();

router.get('/', brandController.getBrands);
router.get('/slug/:slug', brandController.getBrandBySlug);
router.get('/:brandId', brandController.getBrandById);
router.get('/:brandId/products', brandController.getBrandProducts);

export default router;
