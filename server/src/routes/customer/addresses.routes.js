import { Router } from 'express';
import * as addressController from '../../controllers/customer/address.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { addressSchema } from '../../validators/address.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', addressController.getAddresses);
router.post('/', validate({ body: addressSchema }), addressController.addAddress);
router.get('/default', addressController.getDefaultAddress);
router.get('/:addressId', addressController.getAddressById);
router.patch('/:addressId', validate({ body: addressSchema.partial() }), addressController.updateAddress);
router.delete('/:addressId', addressController.deleteAddress);
router.patch('/:addressId/default', addressController.setDefaultAddress);

export default router;
