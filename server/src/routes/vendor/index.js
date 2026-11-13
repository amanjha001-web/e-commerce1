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

const router = Router();

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

export default router;
