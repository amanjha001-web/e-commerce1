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

    const numericCartTotal = Math.max(0, Number(cartTotal) || 0);
    const minPurchase = Number(coupon.minPurchaseAmount) || 0;

    if (numericCartTotal < minPurchase) {
      throw ApiError.badRequest(
        `Minimum purchase amount of ₹${minPurchase} required for this coupon`
      );
    }

    const discountAmountValue = Math.max(
      0,
      Number(coupon.discountAmount ?? coupon.discountValue ?? coupon.discount ?? 0)
    );
    const discountType = (coupon.discountType || 'percentage').toLowerCase();
    const maxDiscount = Number(coupon.maxDiscountAmount) || 0;

    let discount = 0;
    if (discountType === 'percentage') {
      discount = (numericCartTotal * discountAmountValue) / 100;
      if (maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount);
      }
    } else {
      discount = discountAmountValue;
    }

    discount = Math.min(discount, numericCartTotal);
    const finalCalculatedDiscount = Number.isNaN(discount) ? 0 : Math.round(discount * 100) / 100;

    return {
      isValid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
        discountAmount: discountAmountValue,
        discountCalculated: finalCalculatedDiscount,
      },
    };
  }
}

export const couponCommonService = new CouponCommonService();
export default couponCommonService;
