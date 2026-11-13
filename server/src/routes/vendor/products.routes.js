import { Router } from 'express';
import * as vendorProductController from '../../controllers/vendor/product.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';
import { checkVendorProductOwnership } from '../../middlewares/ownership.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../../validators/product.validator.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorProductController.getVendorProducts);
router.post('/', validate({ body: createProductSchema }), vendorProductController.createProduct);

router.patch(
  '/:productId',
  checkVendorProductOwnership,
  validate({ body: updateProductSchema }),
  vendorProductController.updateProduct
);

router.delete('/:productId', checkVendorProductOwnership, vendorProductController.deleteProduct);

router.patch(
  '/:productId/stock',
  checkVendorProductOwnership,
  validate({ body: updateStockSchema }),
  vendorProductController.updateProductStock
);

router.post(
  '/:productId/images',
  checkVendorProductOwnership,
  upload.array('images', 5),
  vendorProductController.uploadProductImages
);

router.delete(
  '/:productId/images/:imageId',
  checkVendorProductOwnership,
  vendorProductController.deleteProductImage
);

export default router;
