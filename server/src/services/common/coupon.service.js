import { Coupon } from '../../models/Coupon.model.js';
import { CouponUsage } from '../../models/CouponUsage.model.js';
import { ApiError } from '../../utils/apiError.js';

const extractNumericDiscount = (raw) => {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === 'number') return Number.isNaN(raw) ? 0 : raw;
  const cleaned = String(raw).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export class CouponCommonService {
  async validateCoupon(code, cartTotal = 0, userId = null) {
    if (!code) throw ApiError.badRequest('Coupon code is required');

    const cleanCode = String(code).toUpperCase().trim();
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: cleanCode,
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gte: now } },
          ],
        },
      ],
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

    // Extract numeric discount value even if stored as "10%", "20", 20, etc.
    let rawDiscount = coupon.discountAmount;
    if (rawDiscount === undefined || rawDiscount === null || Number.isNaN(Number(rawDiscount)) || Number(rawDiscount) === 0) {
      rawDiscount = coupon.discountValue ?? coupon.discount ?? 0;
    }
    let discountAmountValue = Math.max(0, extractNumericDiscount(rawDiscount));

    // Fallback: If discountAmount is 0 or missing on coupon document, extract from coupon code (e.g. SAVE15 -> 15)
    if (discountAmountValue === 0 && cleanCode) {
      const codeMatch = cleanCode.match(/(\d+)/);
      if (codeMatch) {
        discountAmountValue = Math.max(0, parseFloat(codeMatch[1]) || 0);
      }
    }

    const discountType = String(coupon.discountType || (discountAmountValue <= 50 ? 'percentage' : 'fixed')).toLowerCase();
    const maxDiscount = Math.max(0, extractNumericDiscount(coupon.maxDiscountAmount));

    let discount = 0;
    if (discountType === 'percentage') {
      discount = (numericCartTotal * discountAmountValue) / 100;
      if (maxDiscount > 0) {
        discount = Math.min(discount, maxDiscount);
      }
    } else {
      // Fixed discount
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
