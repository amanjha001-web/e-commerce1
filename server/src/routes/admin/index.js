import { Router } from 'express';
import dashboardRoutes from './dashboard.routes.js';
import userRoutes from './users.routes.js';
import vendorRoutes from './vendors.routes.js';
import vendorRequestRoutes from './vendorRequests.routes.js';
import productRoutes from './products.routes.js';
import categoryRoutes from './categories.routes.js';
import brandRoutes from './brands.routes.js';
import orderRoutes from './orders.routes.js';
import couponRoutes from './coupons.routes.js';
import paymentRoutes from './payments.routes.js';
import refundRoutes from './refunds.routes.js';
import inventoryRoutes from './inventory.routes.js';
import reviewRoutes from './reviews.routes.js';
import bannerRoutes from './banners.routes.js';
import supportRoutes from './support.routes.js';
import reportRoutes from './reports.routes.js';
import auditLogRoutes from './auditLogs.routes.js';

// Also import payout routes from payment controller for `/admin/vendor-payouts`
import * as paymentController from '../../controllers/admin/payment.controller.js';
import * as settingsController from '../../controllers/superAdmin/setting.controller.js';
import * as taxController from '../../controllers/superAdmin/tax.controller.js';
import * as shippingController from '../../controllers/superAdmin/shipping.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vendor-requests', vendorRequestRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/payments', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/banners', bannerRoutes);
router.use('/support', supportRoutes);
router.use('/support-tickets', supportRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/activity-logs', auditLogRoutes);

// Vendor Payouts alias for frontend compatibility
const payoutRouter = Router();
payoutRouter.use(authenticate, requireAdmin);
payoutRouter.get('/', paymentController.getVendorPayouts);
payoutRouter.get('/:payoutId', paymentController.getVendorPayoutById);
payoutRouter.patch('/:payoutId/status', paymentController.updateVendorPayoutStatus);
router.use('/vendor-payouts', payoutRouter);

// Settings alias
const settingsRouter = Router();
settingsRouter.use(authenticate, requireAdmin);
settingsRouter.get('/', settingsController.getSettings);
settingsRouter.patch('/', settingsController.updateSettings);
settingsRouter.get('/:key', settingsController.getSettingByKey);
settingsRouter.patch('/:key', settingsController.updateSetting);
router.use('/settings', settingsRouter);

// Taxes alias
const taxRouter = Router();
taxRouter.use(authenticate, requireAdmin);
taxRouter.get('/', taxController.getTaxes);
taxRouter.post('/', taxController.createTax);
taxRouter.get('/:taxId', taxController.getTaxById);
taxRouter.patch('/:taxId', taxController.updateTax);
taxRouter.delete('/:taxId', taxController.deleteTax);
taxRouter.patch('/:taxId/status', taxController.updateTaxStatus);
router.use('/taxes', taxRouter);

// Shipping Zones alias
const shippingRouter = Router();
shippingRouter.use(authenticate, requireAdmin);
shippingRouter.get('/', shippingController.getShippingZones);
shippingRouter.post('/', shippingController.createShippingZone);
shippingRouter.get('/:zoneId', shippingController.getShippingZoneById);
shippingRouter.patch('/:zoneId', shippingController.updateShippingZone);
shippingRouter.delete('/:zoneId', shippingController.deleteShippingZone);
shippingRouter.patch('/:zoneId/status', shippingController.updateShippingZoneStatus);
router.use('/shipping-zones', shippingRouter);

export default router;
