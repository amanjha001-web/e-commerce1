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

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatPublicCoupon = (doc) => {
  const raw = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
  if (!raw) return null;

  const discountType =
    String(raw.discountType || raw.type || 'percentage').toLowerCase() === 'fixed'
      ? 'fixed'
      : 'percentage';

  let rawDiscount = raw.discountAmount;
  if (rawDiscount === undefined || rawDiscount === null || Number.isNaN(Number(rawDiscount)) || Number(rawDiscount) === 0) {
    rawDiscount = raw.discountValue ?? raw.discount ?? 0;
  }
  const discountAmount = Math.max(0, extractNumericDiscount(rawDiscount));
  const minPurchaseAmount = Math.max(0, Number(raw.minPurchaseAmount ?? raw.minOrderAmount ?? 0) || 0);
  const maxDiscountAmount = Math.max(0, Number(raw.maxDiscountAmount ?? 0) || 0);
  const usageLimit =
    raw.usageLimit !== null && raw.usageLimit !== undefined && Number(raw.usageLimit) > 0
      ? Number(raw.usageLimit)
      : null;
  const usageCount = Math.max(0, Number(raw.usageCount ?? raw.usedCount ?? 0) || 0);
  const remainingUses = usageLimit !== null ? Math.max(0, usageLimit - usageCount) : null;

  const vendorObj =
    raw.vendorId && typeof raw.vendorId === 'object' && raw.vendorId._id ? raw.vendorId : null;
  const vendorName =
    vendorObj?.storeName || vendorObj?.shopName || vendorObj?.name || null;

  return {
    id: raw._id,
    _id: raw._id,
    code: String(raw.code || '').toUpperCase().trim(),
    description: raw.description || '',
    discountType,
    discountAmount,
    discountLabel: discountType === 'fixed' ? `₹${discountAmount} OFF` : `${discountAmount}% OFF`,
    minPurchaseAmount,
    maxDiscountAmount,
    startDate: raw.startDate ?? raw.startsAt ?? null,
    expiryDate: raw.expiryDate ?? raw.expiresAt ?? null,
    usageLimitPerUser: Math.max(1, Number(raw.usageLimitPerUser ?? 1) || 1),
    remainingUses,
    vendorId: vendorObj?._id || raw.vendorId || null,
    vendorName,
    isGlobal: !raw.vendorId,
  };
};

export class CouponCommonService {
  async getPublicCoupons(params = {}) {
    const now = new Date();
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const andConditions = [
      { isActive: { $ne: false } },
      { isPublic: { $ne: false } },
      {
        $or: [
          {
            $and: [
              { $or: [{ startDate: { $exists: false } }, { startDate: null }] },
              { $or: [{ startsAt: { $exists: false } }, { startsAt: null }] },
            ],
          },
          { startDate: { $lte: now } },
          {
            $and: [
              { $or: [{ startDate: { $exists: false } }, { startDate: null }] },
              { startsAt: { $lte: now } },
            ],
          },
        ],
      },
      {
        $or: [
          {
            $and: [
              { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }] },
              { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }] },
            ],
          },
          { expiryDate: { $gte: now } },
          {
            $and: [
              { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }] },
              { expiresAt: { $gte: now } },
            ],
          },
        ],
      },
    ];

    if (params.scope === 'global') {
      andConditions.push({ $or: [{ vendorId: null }, { vendorId: { $exists: false } }] });
    } else if (params.vendorId && OBJECT_ID_REGEX.test(String(params.vendorId).trim())) {
      andConditions.push({ vendorId: String(params.vendorId).trim() });
    }

    if (params.discountType && ['percentage', 'fixed'].includes(String(params.discountType).toLowerCase())) {
      andConditions.push({ discountType: String(params.discountType).toLowerCase() });
    }

    if (params.search && String(params.search).trim()) {
      const rx = { $regex: escapeRegex(String(params.search).trim()), $options: 'i' };
      andConditions.push({ $or: [{ code: rx }, { description: rx }] });
    }

    let query = Coupon.find({ $and: andConditions });
    if (typeof query?.populate === 'function') {
      query = query.populate('vendorId', 'storeName shopName name');
    }
    if (typeof query?.sort === 'function') {
      query = query.sort({ createdAt: -1 });
    }
    if (typeof query?.limit === 'function') {
      query = query.limit(limit * 2);
    }
    if (typeof query?.lean === 'function') {
      query = query.lean();
    }

    const rawDocs = await query;
    const eligible = (Array.isArray(rawDocs) ? rawDocs : [])
      .filter((doc) => {
        const cap = Number(doc.usageLimit ?? doc.maxUses ?? 0);
        const used = Number(doc.usageCount ?? doc.usedCount ?? 0);
        if (cap > 0 && used >= cap) return false;
        return true;
      })
      .slice(0, limit)
      .map(formatPublicCoupon)
      .filter(Boolean);

    return {
      coupons: eligible,
      total: eligible.length,
    };
  }

  async validateCoupon(code, cartTotal = 0, userId = null) {
    if (!code) throw ApiError.badRequest('Coupon code is required');

    const cleanCode = String(code).toUpperCase().trim();
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: cleanCode,
      isActive: { $ne: false },
      $and: [
        {
          $or: [
            {
              $and: [
                { $or: [{ startDate: { $exists: false } }, { startDate: null }] },
                { $or: [{ startsAt: { $exists: false } }, { startsAt: null }] },
              ],
            },
            { startDate: { $lte: now } },
            {
              $and: [
                { $or: [{ startDate: { $exists: false } }, { startDate: null }] },
                { startsAt: { $lte: now } },
              ],
            },
          ],
        },
        {
          $or: [
            {
              $and: [
                { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }] },
                { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }] },
              ],
            },
            { expiryDate: { $gte: now } },
            {
              $and: [
                { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }] },
                { expiresAt: { $gte: now } },
              ],
            },
          ],
        },
      ],
    });

    if (!coupon) {
      throw ApiError.badRequest('Invalid or expired coupon code');
    }

    const rawCoupon = typeof coupon.toObject === 'function' ? coupon.toObject() : coupon;
    const totalUsageCap = Number(rawCoupon.usageLimit ?? rawCoupon.maxUses ?? 0) || 0;
    const totalUsageCount = Number(rawCoupon.usageCount ?? rawCoupon.usedCount ?? 0) || 0;

    if (totalUsageCap > 0 && totalUsageCount >= totalUsageCap) {
      throw ApiError.badRequest('This coupon has reached its total usage limit');
    }

    const perUserCap =
      Number(rawCoupon.usageLimitPerUser ?? rawCoupon.perUserLimit ?? 1) || 1;
    if (userId) {
      const userUsage = await CouponUsage.countDocuments({
        couponId: rawCoupon._id,
        userId,
      });
      if (userUsage >= perUserCap) {
        throw ApiError.badRequest('You have already used this coupon');
      }
    }

    const numericCartTotal = Math.max(0, Number(cartTotal) || 0);
    const minPurchase =
      Number(rawCoupon.minPurchaseAmount ?? rawCoupon.minOrderAmount ?? 0) || 0;

    if (numericCartTotal < minPurchase) {
      throw ApiError.badRequest(
        `Minimum purchase amount of ₹${minPurchase} required for this coupon`
      );
    }

    // Extract numeric discount value even if stored as "10%", "20", 20, etc.
    let rawDiscount = rawCoupon.discountAmount;
    if (rawDiscount === undefined || rawDiscount === null || Number.isNaN(Number(rawDiscount)) || Number(rawDiscount) === 0) {
      rawDiscount = rawCoupon.discountValue ?? rawCoupon.discount ?? 0;
    }
    let discountAmountValue = Math.max(0, extractNumericDiscount(rawDiscount));

    // Fallback: If discountAmount is 0 or missing on coupon document, extract from coupon code (e.g. SAVE15 -> 15)
    if (discountAmountValue === 0 && cleanCode) {
      const codeMatch = cleanCode.match(/(\d+)/);
      if (codeMatch) {
        discountAmountValue = Math.max(0, parseFloat(codeMatch[1]) || 0);
      }
    }

    const discountType = String(rawCoupon.discountType || (discountAmountValue <= 50 ? 'percentage' : 'fixed')).toLowerCase();
    const maxDiscount = Math.max(0, extractNumericDiscount(rawCoupon.maxDiscountAmount));

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
