import { Router } from 'express';
import * as vendorVariantController from '../../controllers/vendor/variants.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/product/:productId', vendorVariantController.getVariants);
router.post('/product/:productId', vendorVariantController.createVariant);
router.patch('/:variantId', vendorVariantController.updateVariant);
router.delete('/:variantId', vendorVariantController.deleteVariant);

export default router;
