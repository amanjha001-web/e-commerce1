import { Router } from 'express';
import adminRoutes from './admins.routes.js';
import roleRoutes from './roles.routes.js';
import permissionRoutes from './permissions.routes.js';
import settingRoutes from './settings.routes.js';
import taxRoutes from './taxes.routes.js';
import shippingRoutes from './shipping.routes.js';
import auditLogRoutes from './auditLogs.routes.js';

const router = Router();

router.use('/admins', adminRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/settings', settingRoutes);
router.use('/taxes', taxRoutes);
router.use('/shipping', shippingRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
