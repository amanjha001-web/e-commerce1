import { Router } from 'express';
import * as reportController from '../../controllers/admin/report.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', reportController.getReports);
router.get('/summary', reportController.getReportSummary);
router.get('/sales', reportController.getSalesReport);
router.get('/revenue', reportController.getRevenueReport);
router.get('/export', reportController.exportReport);

export default router;
