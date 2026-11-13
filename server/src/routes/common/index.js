import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './products.routes.js';
import categoryRoutes from './categories.routes.js';
import brandRoutes from './brands.routes.js';
import searchRoutes from './search.routes.js';
import couponRoutes from './coupons.routes.js';
import reviewRoutes from './reviews.routes.js';
import chatRoutes from './chat.routes.js';
import notificationRoutes from './notifications.routes.js';
import webhookRoutes from './webhook.routes.js';
import healthRoutes from './health.routes.js';
import bannerRoutes from './banners.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/search', searchRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/health', healthRoutes);
router.use('/banners', bannerRoutes);

export default router;
