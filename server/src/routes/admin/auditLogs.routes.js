import { Router } from 'express';
import * as auditLogController from '../../controllers/admin/auditLog.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', auditLogController.getActivityLogs);
router.get('/:logId', auditLogController.getActivityLogById);

export default router;
