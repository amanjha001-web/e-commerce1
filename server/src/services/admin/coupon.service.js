import { Coupon } from '../../models/Coupon.model.js';
import { CouponUsage } from '../../models/CouponUsage.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class AdminCouponService {
  async getCoupons(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.isActive !== undefined) {
      filter.isActive = params.isActive === 'true';
    }
    if (params.discountType) {
      filter.discountType = params.discountType;
    }
    if (params.search) {
      filter.code = { $regex: params.search, $options: 'i' };
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort(sort).skip(skip).limit(limit),
      Coupon.countDocuments(filter),
    ]);

    return {
      coupons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCouponById(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return coupon;
  }

  async createCoupon(couponData) {
    const existing = await Coupon.findOne({ code: couponData.code.toUpperCase() });
    if (existing) throw ApiError.conflict('Coupon code already exists');

    return Coupon.create({
      ...couponData,
      code: couponData.code.toUpperCase(),
    });
  }

  async updateCoupon(couponId, couponData) {
    if (couponData.code) {
      couponData.code = couponData.code.toUpperCase();
    }
    const coupon = await Coupon.findByIdAndUpdate(couponId, couponData, {
      new: true,
      runValidators: true,
    });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return coupon;
  }

  async deleteCoupon(couponId) {
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return { message: 'Coupon deleted successfully' };
  }

  async toggleCouponStatus(couponId, isActive) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) throw ApiError.notFound('Coupon not found');

    coupon.isActive = isActive !== undefined ? isActive : !coupon.isActive;
    await coupon.save();
    return coupon;
  }

  async getCouponUsage(couponId) {
    const usages = await CouponUsage.find({ couponId })
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber totalAmount');

    return usages;
  }
}

export const adminCouponService = new AdminCouponService();
export default adminCouponService;
