import { Router } from 'express';
import * as dashboardController from '../../controllers/admin/dashboard.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', dashboardController.getDashboard);
router.get('/analytics', dashboardController.getDashboardAnalytics);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/low-stock', dashboardController.getLowStockProducts);

export default router;
