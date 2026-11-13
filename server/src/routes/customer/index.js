import { Router } from 'express';
import profileRoutes from './profile.routes.js';
import addressRoutes from './addresses.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import orderRoutes from './orders.routes.js';
import paymentRoutes from './payments.routes.js';
import refundRoutes from './refunds.routes.js';
import returnRoutes from './returns.routes.js';
import reviewRoutes from './reviews.routes.js';
import notificationRoutes from './notifications.routes.js';
import supportRoutes from './support.routes.js';
import activityRoutes from './activity.routes.js';

const router = Router();

router.use('/profile', profileRoutes);
router.use('/addresses', addressRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/returns', returnRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/activity', activityRoutes);

export default router;
