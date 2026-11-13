import { Router } from 'express';
import * as permissionController from '../../controllers/superAdmin/permission.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', permissionController.getPermissions);
router.post('/', permissionController.createPermission);

export default router;
