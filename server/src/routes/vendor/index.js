import { Router } from 'express';
import profileRoutes from './profile.routes.js';
import storeRoutes from './store.routes.js';
import productRoutes from './products.routes.js';
import variantRoutes from './variants.routes.js';
import inventoryRoutes from './inventory.routes.js';
import orderRoutes from './orders.routes.js';
import earningsRoutes from './earnings.routes.js';
import payoutRoutes from './payouts.routes.js';
import reviewRoutes from './reviews.routes.js';
import requestRoutes from './requests.routes.js';
import couponRoutes from './coupons.routes.js';

import * as vendorStoreController from '../../controllers/vendor/store.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

// Vendor Dashboard & Analytics aliases
router.get('/dashboard', authenticate, requireVendor, vendorStoreController.getDashboard);
router.get('/stats', authenticate, requireVendor, vendorStoreController.getStats);
router.get('/sales', authenticate, requireVendor, vendorStoreController.getSalesReport);

router.use('/profile', profileRoutes);
router.use('/store', storeRoutes);
router.use('/products', productRoutes);
router.use('/variants', variantRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/earnings', earningsRoutes);
router.use('/payouts', payoutRoutes);
router.use('/reviews', reviewRoutes);
router.use('/requests', requestRoutes);
router.use('/coupons', couponRoutes);

export default router;
