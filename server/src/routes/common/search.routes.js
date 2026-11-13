import { Router } from 'express';
import { searchProducts } from '../../controllers/common/product.controller.js';

const router = Router();

router.get('/', searchProducts);

export default router;
