import { Coupon } from '../../models/Coupon.model.js';
import { CouponUsage } from '../../models/CouponUsage.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const assertValidObjectId = (id, label = 'Coupon ID') => {
  if (!id || !OBJECT_ID_REGEX.test(String(id).trim())) {
    throw ApiError.badRequest(`Invalid ${label} format`);
  }
};

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumericValue = (raw) => {
  if (raw === undefined || raw === null) return 0;
  if (typeof raw === 'number') return Number.isNaN(raw) ? 0 : raw;
  const cleaned = String(raw).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const resolveDateField = (primary, fallback) => {
  const candidate = primary ?? fallback ?? null;
  if (!candidate) return null;
  const parsed = candidate instanceof Date ? candidate : new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const computeLifecycleStatus = (raw, now = new Date()) => {
  const startDate = resolveDateField(raw.startDate, raw.startsAt);
  const expiryDate = resolveDateField(raw.expiryDate, raw.expiresAt);
  const isActive =
    raw.isActive !== false &&
    String(raw.status || '').trim().toLowerCase() !== 'inactive' &&
    String(raw.status || '').trim().toLowerCase() !== 'disabled';
  const isPublic = raw.isPublic !== false;

  const nowMs = now.getTime();
  const isExpired = expiryDate !== null && expiryDate.getTime() < nowMs;
  const isScheduled =
    !isExpired && isActive && startDate !== null && startDate.getTime() > nowMs;

  let computedStatus = 'active';
  let statusLabel = 'Active';

  if (isExpired) {
    computedStatus = 'expired';
    statusLabel = 'Expired';
  } else if (!isActive) {
    computedStatus = 'inactive';
    statusLabel = 'Inactive';
  } else if (isScheduled) {
    computedStatus = 'scheduled';
    statusLabel = 'Scheduled';
  }

  return {
    startDate,
    expiryDate,
    isActive,
    isPublic,
    isExpired,
    isScheduled,
    computedStatus,
    statusLabel,
  };
};

export const formatAdminCoupon = (doc, now = new Date()) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const lifecycle = computeLifecycleStatus(raw, now);

  const discountType =
    String(raw.discountType || raw.type || 'percentage').toLowerCase() === 'fixed'
      ? 'fixed'
      : 'percentage';

  const rawDiscount =
    raw.discountAmount ?? raw.discountValue ?? raw.discount ?? raw.value ?? 0;
  const discountAmount = Math.max(0, parseNumericValue(rawDiscount));
  const minPurchaseAmount = Math.max(
    0,
    Number(raw.minPurchaseAmount ?? raw.minOrderAmount ?? raw.minimumOrderAmount ?? 0) || 0
  );
  const maxDiscountAmount = Math.max(
    0,
    Number(raw.maxDiscountAmount ?? raw.maximumDiscountAmount ?? 0) || 0
  );
  const usageLimitRaw = raw.usageLimit ?? raw.maxUses ?? null;
  const usageLimit =
    usageLimitRaw !== null && usageLimitRaw !== undefined && Number(usageLimitRaw) > 0
      ? Number(usageLimitRaw)
      : null;
  const usageLimitPerUser = Math.max(
    1,
    Number(raw.usageLimitPerUser ?? raw.perUserLimit ?? 1) || 1
  );
  const usageCount = Math.max(0, Number(raw.usageCount ?? raw.usedCount ?? 0) || 0);
  const remainingUses =
    usageLimit !== null ? Math.max(0, usageLimit - usageCount) : null;

  const vendorObj =
    raw.vendorId && typeof raw.vendorId === 'object' && raw.vendorId._id ? raw.vendorId : null;
  const vendorName =
    vendorObj?.storeName || vendorObj?.shopName || vendorObj?.name || null;

  return {
    ...raw,
    _id: raw._id,
    id: raw._id,
    code: String(raw.code || raw.couponCode || '').toUpperCase().trim(),
    description: raw.description || '',
    discountType,
    discountAmount,
    discountValue: discountAmount,
    minPurchaseAmount,
    minOrderAmount: minPurchaseAmount,
    maxDiscountAmount,
    startDate: lifecycle.startDate,
    expiryDate: lifecycle.expiryDate,
    usageLimit,
    usageLimitPerUser,
    usageCount,
    usedCount: usageCount,
    remainingUses,
    isActive: lifecycle.isActive,
    isPublic: lifecycle.isPublic,
    isExpired: lifecycle.isExpired,
    isScheduled: lifecycle.isScheduled,
    computedStatus: lifecycle.computedStatus,
    statusLabel: lifecycle.statusLabel,
    scope: raw.vendorId ? 'vendor' : 'global',
    vendorName,
  };
};

const buildNotExpiredCondition = (now) => ({
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
});

const buildExpiredCondition = (now) => ({
  $or: [
    { expiryDate: { $lt: now } },
    {
      $and: [
        { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }] },
        { expiresAt: { $lt: now } },
      ],
    },
  ],
});

const buildStartedCondition = (now) => ({
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
});

const buildScheduledStartCondition = (now) => ({
  $or: [
    { startDate: { $gt: now } },
    {
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: null }] },
        { startsAt: { $gt: now } },
      ],
    },
  ],
});

const buildStatusConditions = (status, now) => {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'expired') {
    return [buildExpiredCondition(now)];
  }
  if (key === 'inactive') {
    return [{ isActive: false }, buildNotExpiredCondition(now)];
  }
  if (key === 'scheduled') {
    return [
      { isActive: { $ne: false } },
      buildScheduledStartCondition(now),
      buildNotExpiredCondition(now),
    ];
  }
  if (key === 'active') {
    return [
      { isActive: { $ne: false } },
      buildStartedCondition(now),
      buildNotExpiredCondition(now),
    ];
  }
  return [];
};

const runCouponQuery = (filter, { sort, skip, limit }) => {
  let query = Coupon.find(filter);
  if (typeof query.populate === 'function') {
    query = query.populate('vendorId', 'storeName shopName name');
  }
  if (typeof query.sort === 'function') {
    query = query.sort(sort);
  }
  if (typeof query.skip === 'function') {
    query = query.skip(skip);
  }
  if (typeof query.limit === 'function') {
    query = query.limit(limit);
  }
  if (typeof query.lean === 'function') {
    query = query.lean();
  }
  return query;
};

export class AdminCouponService {
  async getCoupons(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const now = new Date();
    const andConditions = [];

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      andConditions.push(...buildStatusConditions(params.status, now));
    } else if (params.isActive !== undefined && params.isActive !== '') {
      const wantActive = String(params.isActive).toLowerCase() === 'true';
      andConditions.push(wantActive ? { isActive: { $ne: false } } : { isActive: false });
    }

    const discountType = params.discountType || params.type;
    if (discountType && String(discountType).toLowerCase() !== 'all') {
      andConditions.push({ discountType: String(discountType).toLowerCase() });
    }

    const visibility = params.visibility || params.isPublic;
    if (visibility !== undefined && visibility !== '' && String(visibility).toLowerCase() !== 'all') {
      const normalizedVis = String(visibility).toLowerCase();
      if (normalizedVis === 'public' || normalizedVis === 'true') {
        andConditions.push({ isPublic: { $ne: false } });
      } else if (normalizedVis === 'private' || normalizedVis === 'false') {
        andConditions.push({ isPublic: false });
      }
    }

    if (params.scope === 'global') {
      andConditions.push({ $or: [{ vendorId: null }, { vendorId: { $exists: false } }] });
    } else if (params.scope === 'vendor') {
      andConditions.push({ vendorId: { $ne: null } });
    }

    if (params.search && String(params.search).trim()) {
      const rx = { $regex: escapeRegex(String(params.search).trim()), $options: 'i' };
      andConditions.push({
        $or: [{ code: rx }, { description: rx }],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const safeCount = (cond) =>
      Promise.resolve(Coupon.countDocuments(cond))
        .then((n) => Math.max(0, Number(n) || 0))
        .catch(() => 0);

    const [rawCoupons, total, allTotal, activeCount, scheduledCount, expiredCount, inactiveCount, publicCount] =
      await Promise.all([
        runCouponQuery(filter, { sort, skip, limit }),
        Coupon.countDocuments(filter),
        safeCount({}),
        safeCount({ $and: buildStatusConditions('active', now) }),
        safeCount({ $and: buildStatusConditions('scheduled', now) }),
        safeCount({ $and: buildStatusConditions('expired', now) }),
        safeCount({ $and: buildStatusConditions('inactive', now) }),
        safeCount({ isPublic: { $ne: false } }),
      ]);

    const coupons = Array.isArray(rawCoupons)
      ? rawCoupons.map((doc) => formatAdminCoupon(doc, now))
      : [];

    const totalNum = Math.max(0, Number(total) || 0);

    return {
      coupons,
      summary: {
        total: allTotal,
        active: activeCount,
        scheduled: scheduledCount,
        expired: expiredCount,
        inactive: inactiveCount,
        publicCount,
      },
      pagination: {
        total: totalNum,
        page,
        limit,
        totalPages: Math.ceil(totalNum / limit) || 1,
      },
    };
  }

  async getCouponById(couponId) {
    assertValidObjectId(couponId);
    let query = Coupon.findById(couponId);
    if (typeof query?.populate === 'function') {
      query = query.populate('vendorId', 'storeName shopName name');
    }
    if (typeof query?.lean === 'function') {
      query = query.lean();
    }
    const coupon = await query;
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return formatAdminCoupon(coupon);
  }

  async createCoupon(couponData) {
    const cleanCode = String(couponData.code || '').trim().toUpperCase();
    if (!cleanCode) {
      throw ApiError.badRequest('Coupon code is required');
    }

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) throw ApiError.conflict('Coupon code already exists');

    const discountType =
      String(couponData.discountType || 'percentage').toLowerCase() === 'fixed'
        ? 'fixed'
        : 'percentage';
    const discountAmount = Math.max(
      0,
      Number(couponData.discountAmount ?? couponData.discountValue ?? 0) || 0
    );

    if (discountAmount <= 0) {
      throw ApiError.badRequest('Discount amount must be greater than 0');
    }
    if (discountType === 'percentage' && discountAmount > 100) {
      throw ApiError.badRequest('Percentage discount cannot exceed 100%');
    }

    const startDate = resolveDateField(couponData.startDate, couponData.startsAt);
    const expiryDate = resolveDateField(couponData.expiryDate, couponData.expiresAt);
    if (!expiryDate) {
      throw ApiError.badRequest('Valid expiry date is required');
    }
    if (startDate && expiryDate.getTime() < startDate.getTime()) {
      throw ApiError.badRequest('Expiry date must be on or after start date');
    }

    const created = await Coupon.create({
      code: cleanCode,
      description: couponData.description || '',
      discountType,
      discountAmount,
      minPurchaseAmount: Math.max(
        0,
        Number(couponData.minPurchaseAmount ?? couponData.minOrderAmount ?? 0) || 0
      ),
      maxDiscountAmount: Math.max(0, Number(couponData.maxDiscountAmount ?? 0) || 0),
      startDate: startDate || new Date(),
      expiryDate,
      usageLimit:
        couponData.usageLimit !== undefined &&
        couponData.usageLimit !== null &&
        Number(couponData.usageLimit) > 0
          ? Number(couponData.usageLimit)
          : null,
      usageLimitPerUser: Math.max(
        1,
        Number(couponData.usageLimitPerUser ?? 1) || 1
      ),
      vendorId: couponData.vendorId || null,
      isActive: couponData.isActive !== undefined ? Boolean(couponData.isActive) : true,
      isPublic: couponData.isPublic !== undefined ? Boolean(couponData.isPublic) : true,
    });

    return formatAdminCoupon(created);
  }

  async updateCoupon(couponId, couponData) {
    assertValidObjectId(couponId);

    const existing = await Coupon.findById(couponId);
    if (!existing) throw ApiError.notFound('Coupon not found');

    const updatePayload = { ...couponData };

    if (updatePayload.code !== undefined) {
      const cleanCode = String(updatePayload.code).trim().toUpperCase();
      if (!cleanCode) {
        throw ApiError.badRequest('Coupon code cannot be empty');
      }
      const duplicate = await Coupon.findOne({
        code: cleanCode,
        _id: { $ne: couponId },
      });
      if (duplicate) {
        throw ApiError.conflict('Coupon code already exists');
      }
      updatePayload.code = cleanCode;
    }

    if (
      updatePayload.discountAmount === undefined &&
      updatePayload.discountValue !== undefined
    ) {
      updatePayload.discountAmount = Number(updatePayload.discountValue);
    }
    delete updatePayload.discountValue;

    const mergedType = String(
      updatePayload.discountType ?? existing.discountType ?? 'percentage'
    ).toLowerCase();
    const mergedAmount = Number(
      updatePayload.discountAmount ?? existing.discountAmount ?? 0
    );

    if (mergedAmount <= 0) {
      throw ApiError.badRequest('Discount amount must be greater than 0');
    }
    if (mergedType === 'percentage' && mergedAmount > 100) {
      throw ApiError.badRequest('Percentage discount cannot exceed 100%');
    }

    const mergedStart =
      updatePayload.startDate !== undefined
        ? resolveDateField(updatePayload.startDate, null)
        : resolveDateField(existing.startDate, existing.startsAt);
    const mergedExpiry =
      updatePayload.expiryDate !== undefined
        ? resolveDateField(updatePayload.expiryDate, null)
        : resolveDateField(existing.expiryDate, existing.expiresAt);

    if (mergedStart && mergedExpiry && mergedExpiry.getTime() < mergedStart.getTime()) {
      throw ApiError.badRequest('Expiry date must be on or after start date');
    }

    let updatedQuery = Coupon.findByIdAndUpdate(couponId, updatePayload, {
      new: true,
      runValidators: true,
    });
    if (typeof updatedQuery?.populate === 'function') {
      updatedQuery = updatedQuery.populate('vendorId', 'storeName shopName name');
    }
    const updated = await updatedQuery;
    if (!updated) throw ApiError.notFound('Coupon not found');

    return formatAdminCoupon(updated);
  }

  async deleteCoupon(couponId) {
    assertValidObjectId(couponId);
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return { message: 'Coupon deleted successfully' };
  }

  async toggleCouponStatus(couponId, isActive) {
    assertValidObjectId(couponId);
    const coupon = await Coupon.findById(couponId);
    if (!coupon) throw ApiError.notFound('Coupon not found');

    coupon.isActive = typeof isActive === 'boolean' ? isActive : !coupon.isActive;
    await coupon.save();
    return formatAdminCoupon(coupon);
  }

  async getCouponUsage(couponId) {
    assertValidObjectId(couponId);
    let couponQuery = Coupon.findById(couponId);
    if (typeof couponQuery?.lean === 'function') {
      couponQuery = couponQuery.lean();
    }
    const coupon = await couponQuery;
    if (!coupon) throw ApiError.notFound('Coupon not found');

    let usagesQuery = CouponUsage.find({ couponId });
    if (typeof usagesQuery?.populate === 'function') {
      usagesQuery = usagesQuery
        .populate('userId', 'name email')
        .populate('orderId', 'orderNumber totalAmount orderStatus status createdAt');
    }
    if (typeof usagesQuery?.sort === 'function') {
      usagesQuery = usagesQuery.sort({ createdAt: -1 });
    }
    if (typeof usagesQuery?.lean === 'function') {
      usagesQuery = usagesQuery.lean();
    }

    const rawUsages = await usagesQuery;
    const usages = Array.isArray(rawUsages) ? rawUsages : [];
    const storedUsed = Number(coupon.usageCount ?? coupon.usedCount ?? 0) || 0;
    const usedCount = Math.max(storedUsed, usages.length);
    const usageLimit =
      coupon.usageLimit !== null && coupon.usageLimit !== undefined && Number(coupon.usageLimit) > 0
        ? Number(coupon.usageLimit)
        : null;
    const remainingUses =
      usageLimit !== null ? Math.max(0, usageLimit - usedCount) : null;
    const usagePercentage =
      usageLimit !== null && usageLimit > 0
        ? Math.min(100, Math.round((usedCount / usageLimit) * 100))
        : 0;

    return {
      couponId: coupon._id,
      code: String(coupon.code || '').toUpperCase(),
      usedCount,
      usageLimit,
      usagePercentage,
      remainingUses,
      usages,
    };
  }
}

export const adminCouponService = new AdminCouponService();
export default adminCouponService;
