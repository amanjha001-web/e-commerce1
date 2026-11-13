import { Router } from 'express';
import * as roleController from '../../controllers/superAdmin/role.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', roleController.getRoles);
router.post('/', roleController.createRole);
router.patch('/:roleId', roleController.updateRole);
router.delete('/:roleId', roleController.deleteRole);

export default router;
