import { Router } from 'express';
import { Coupon } from '../../models/Coupon.model.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate, requireVendor);

// List vendor's own coupons
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId || req.user._id;
    const { page = 1, limit = 20, search } = req.query;
    const query = { $or: [{ vendorId }, { vendorId: req.user._id }] };

    if (search) {
      query.code = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Coupon.countDocuments(query),
    ]);

    return ApiResponse.success(res, {
      coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    }, 'Vendor coupons retrieved');
  })
);

// Create coupon for vendor store
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId || req.user._id;
    const {
      code,
      discountType = 'percentage',
      discountAmount,
      minPurchaseAmount = 0,
      maxDiscountAmount = 0,
      expiryDate,
      usageLimit,
      usageLimitPerUser = 1,
      description,
    } = req.body;

    if (!code || !discountAmount || !expiryDate) {
      throw ApiError.badRequest('Code, discountAmount, and expiryDate are required');
    }

    const existing = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
    if (existing) {
      throw ApiError.conflict('Coupon code already exists');
    }

    const coupon = await Coupon.create({
      code: String(code).toUpperCase().trim(),
      description,
      discountType,
      discountAmount: Number(discountAmount),
      minPurchaseAmount: Number(minPurchaseAmount),
      maxDiscountAmount: Number(maxDiscountAmount),
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usageLimitPerUser: Number(usageLimitPerUser),
      vendorId,
      isActive: true,
    });

    return ApiResponse.created(res, coupon, 'Store coupon created successfully');
  })
);

// Update vendor coupon
router.patch(
  '/:couponId',
  asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId || req.user._id;
    const coupon = await Coupon.findOne({
      _id: req.params.couponId,
      $or: [{ vendorId }, { vendorId: req.user._id }],
    });

    if (!coupon) {
      throw ApiError.notFound('Coupon not found or does not belong to your store');
    }

    const allowedUpdates = [
      'description',
      'discountType',
      'discountAmount',
      'minPurchaseAmount',
      'maxDiscountAmount',
      'expiryDate',
      'usageLimit',
      'usageLimitPerUser',
      'isActive',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        coupon[field] = req.body[field];
      }
    });

    await coupon.save();
    return ApiResponse.success(res, coupon, 'Coupon updated successfully');
  })
);

// Delete vendor coupon
router.delete(
  '/:couponId',
  asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId || req.user._id;
    const coupon = await Coupon.findOneAndDelete({
      _id: req.params.couponId,
      $or: [{ vendorId }, { vendorId: req.user._id }],
    });

    if (!coupon) {
      throw ApiError.notFound('Coupon not found or does not belong to your store');
    }

    return ApiResponse.success(res, null, 'Coupon deleted successfully');
  })
);

export default router;
