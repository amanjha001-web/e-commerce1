import { Coupon } from '../../models/Coupon.model.js';
import { CouponUsage } from '../../models/CouponUsage.model.js';
import { ApiError } from '../../utils/apiError.js';

export class CouponCommonService {
  async validateCoupon(code, cartTotal = 0, userId = null) {
    if (!code) throw ApiError.badRequest('Coupon code is required');

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gte: new Date() },
    });

    if (!coupon) {
      throw ApiError.badRequest('Invalid or expired coupon code');
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw ApiError.badRequest('This coupon has reached its total usage limit');
    }

    if (userId) {
      const userUsage = await CouponUsage.countDocuments({
        couponId: coupon._id,
        userId,
      });
      if (userUsage >= coupon.usageLimitPerUser) {
        throw ApiError.badRequest('You have already used this coupon');
      }
    }

    if (cartTotal < coupon.minPurchaseAmount) {
      throw ApiError.badRequest(
        `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required for this coupon`
      );
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountAmount) / 100;
      if (coupon.maxDiscountAmount > 0) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountAmount;
    }

    discount = Math.min(discount, cartTotal);

    return {
      isValid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
        discountCalculated: Math.round(discount * 100) / 100,
      },
    };
  }
}

export const couponCommonService = new CouponCommonService();
export default couponCommonService;
