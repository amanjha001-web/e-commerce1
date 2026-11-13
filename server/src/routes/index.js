import { Router } from 'express';

// Role-wise modular route routers
import commonRoutes from './common/index.js';
import customerRoutes from './customer/index.js';
import vendorRoutes from './vendor/index.js';
import adminRoutes from './admin/index.js';
import superAdminRoutes from './superAdmin/index.js';

// Direct domain routers for frontend compatibility
import authRoutes from './common/auth.routes.js';
import productRoutes from './common/products.routes.js';
import categoryRoutes from './common/categories.routes.js';
import brandRoutes from './common/brands.routes.js';
import bannerRoutes from './common/banners.routes.js';
import couponRoutes from './common/coupons.routes.js';
import reviewRoutes from './common/reviews.routes.js';
import chatRoutes from './common/chat.routes.js';
import notificationRoutes from './common/notifications.routes.js';
import webhookRoutes from './common/webhook.routes.js';
import healthRoutes from './common/health.routes.js';

import profileRoutes from './customer/profile.routes.js';
import addressRoutes from './customer/addresses.routes.js';
import cartRoutes from './customer/cart.routes.js';
import wishlistRoutes from './customer/wishlist.routes.js';
import orderRoutes from './customer/orders.routes.js';
import paymentRoutes from './customer/payments.routes.js';
import supportRoutes from './customer/support.routes.js';
import activityRoutes from './customer/activity.routes.js';
import vendorRequestRoutes from './vendor/requests.routes.js';

// Public vendor listing
import { Vendor } from '../models/Vendor.model.js';
import { Product } from '../models/Product.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import mongoose from 'mongoose';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireVendor } from '../middlewares/role.middleware.js';
import * as vendorStoreController from '../controllers/vendor/store.controller.js';

const router = Router();

// =====================================
// 1. ROLE-BASED ARCHITECTURAL ROUTERS
// =====================================
router.use('/common', commonRoutes);
router.use('/customer', customerRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/superAdmin', superAdminRoutes);

// =====================================
// 2. ROOT ALIASES FOR FRONTEND COMPATIBILITY
// =====================================
router.use('/auth', authRoutes);
router.use('/users', profileRoutes); // Customer profile & account management
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/banners', bannerRoutes);
router.use('/coupons', couponRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/addresses', addressRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/support', supportRoutes);
router.use('/activity', activityRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/health', healthRoutes);
router.use('/vendor-requests', vendorRequestRoutes);

// Public /vendors listing for frontend storefront
const publicVendorsRouter = Router();

publicVendorsRouter.get('/dashboard', authenticate, requireVendor, vendorStoreController.getDashboard);
publicVendorsRouter.get('/dashboard/stats', authenticate, requireVendor, vendorStoreController.getStats);
publicVendorsRouter.get('/dashboard/sales', authenticate, requireVendor, vendorStoreController.getSalesReport);

publicVendorsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const vendors = await Vendor.find({ status: 'approved', isActive: true })
      .select('storeName slug logo banner description rating numReviews address')
      .sort({ rating: -1 });
    return ApiResponse.success(res, vendors, 'Active vendors retrieved');
  })
);

publicVendorsRouter.get(
  '/:vendorId',
  asyncHandler(async (req, res) => {
    let vendor;
    if (mongoose.Types.ObjectId.isValid(req.params.vendorId)) {
      vendor = await Vendor.findById(req.params.vendorId);
    }
    if (!vendor) {
      vendor = await Vendor.findOne({ slug: req.params.vendorId });
    }
    if (!vendor) throw ApiError.notFound('Vendor not found');
    return ApiResponse.success(res, vendor, 'Vendor details');
  })
);

publicVendorsRouter.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const vendor = await Vendor.findOne({ slug: req.params.slug, isActive: true });
    if (!vendor) throw ApiError.notFound('Vendor not found');
    return ApiResponse.success(res, vendor, 'Vendor details');
  })
);

publicVendorsRouter.get(
  '/:vendorId/products',
  asyncHandler(async (req, res) => {
    let vendorId = req.params.vendorId;
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      const v = await Vendor.findOne({ slug: vendorId });
      if (v) vendorId = v._id;
    }
    const products = await Product.find({
      vendorId,
      status: 'published',
      isActive: true,
    }).populate('category', 'name slug');
    return ApiResponse.success(res, products, 'Vendor products');
  })
);

router.use('/vendors', publicVendorsRouter);

export default router;
