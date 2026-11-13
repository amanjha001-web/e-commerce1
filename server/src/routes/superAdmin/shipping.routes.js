import { Router } from 'express';
import * as shippingController from '../../controllers/superAdmin/shipping.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', shippingController.getShippingZones);
router.post('/', shippingController.createShippingZone);
router.get('/:zoneId', shippingController.getShippingZoneById);
router.patch('/:zoneId', shippingController.updateShippingZone);
router.delete('/:zoneId', shippingController.deleteShippingZone);
router.patch('/:zoneId/status', shippingController.updateShippingZoneStatus);

export default router;
