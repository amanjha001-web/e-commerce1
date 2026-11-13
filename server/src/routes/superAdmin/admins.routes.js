import { Router } from 'express';
import * as adminController from '../../controllers/superAdmin/admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', adminController.getAdmins);
router.post('/', adminController.createAdmin);
router.patch('/:adminId', adminController.updateAdmin);
router.delete('/:adminId', adminController.deleteAdmin);

export default router;
