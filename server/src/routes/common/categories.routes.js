import { Router } from 'express';
import * as categoryController from '../../controllers/common/category.controller.js';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:categoryId', categoryController.getCategoryById);
router.get('/:categoryId/products', categoryController.getCategoryProducts);

export default router;
