import { Router } from 'express';
import * as auditLogController from '../../controllers/superAdmin/auditLog.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', auditLogController.getAuditLogs);

export default router;
