import { z } from 'zod';

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseDateInput = (value, { endOfDay = false } = {}) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).trim();
  if (!str) return undefined;
  if (ISO_DATE_ONLY_REGEX.test(str)) {
    return new Date(endOfDay ? `${str}T23:59:59.999Z` : `${str}T00:00:00.000Z`);
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeRawCouponBody = (raw = {}, isUpdate = false) => {
  if (!raw || typeof raw !== 'object') return {};

  const normalized = { ...raw };

  if (normalized.code !== undefined) {
    normalized.code = String(normalized.code).trim().toUpperCase();
  }

  if (normalized.discountType !== undefined) {
    normalized.discountType = String(normalized.discountType).trim().toLowerCase();
  }

  if (normalized.discountAmount === undefined) {
    const aliasAmount = normalized.discountValue ?? normalized.discount ?? normalized.value;
    if (aliasAmount !== undefined && aliasAmount !== '') {
      normalized.discountAmount = aliasAmount;
    }
  }

  if (normalized.minPurchaseAmount === undefined) {
    const aliasMin = normalized.minOrderAmount ?? normalized.minimumOrderAmount;
    if (aliasMin !== undefined && aliasMin !== '') {
      normalized.minPurchaseAmount = aliasMin;
    }
  }

  if (normalized.maxDiscountAmount === undefined) {
    const aliasMax = normalized.maximumDiscountAmount;
    if (aliasMax !== undefined && aliasMax !== '') {
      normalized.maxDiscountAmount = aliasMax;
    }
  }

  if (normalized.startDate === undefined && normalized.startsAt !== undefined) {
    normalized.startDate = normalized.startsAt;
  }
  if (normalized.startDate === '') {
    normalized.startDate = isUpdate ? null : undefined;
  } else if (normalized.startDate !== undefined && normalized.startDate !== null) {
    const parsedStart = parseDateInput(normalized.startDate, { endOfDay: false });
    if (parsedStart === null) {
      normalized.startDate = 'INVALID_DATE';
    } else if (parsedStart !== undefined) {
      normalized.startDate = parsedStart;
    }
  }

  if (normalized.expiryDate === undefined && normalized.expiresAt !== undefined) {
    normalized.expiryDate = normalized.expiresAt;
  }
  if (normalized.expiryDate !== undefined && normalized.expiryDate !== null && normalized.expiryDate !== '') {
    const parsedExpiry = parseDateInput(normalized.expiryDate, { endOfDay: true });
    if (parsedExpiry === null) {
      normalized.expiryDate = 'INVALID_DATE';
    } else if (parsedExpiry !== undefined) {
      normalized.expiryDate = parsedExpiry;
    }
  }

  if (normalized.usageLimit === undefined && normalized.maxUses !== undefined) {
    normalized.usageLimit = normalized.maxUses;
  }
  if (normalized.usageLimit === '' || normalized.usageLimit === 0 || normalized.usageLimit === '0') {
    normalized.usageLimit = null;
  }

  if (normalized.usageLimitPerUser === undefined && normalized.perUserLimit !== undefined) {
    normalized.usageLimitPerUser = normalized.perUserLimit;
  }
  if (normalized.usageLimitPerUser === '') {
    normalized.usageLimitPerUser = undefined;
  }

  if (typeof normalized.isActive === 'string') {
    normalized.isActive = normalized.isActive.toLowerCase() === 'true';
  }
  if (typeof normalized.isPublic === 'string') {
    normalized.isPublic = normalized.isPublic.toLowerCase() === 'true';
  }

  return normalized;
};

const dateFieldSchema = z.date({
  required_error: 'Expiry date is required',
  invalid_type_error: 'Invalid date format',
});

const baseCouponShape = {
  code: z.string().trim().min(3, 'Coupon code must be at least 3 characters').max(30, 'Coupon code cannot exceed 30 characters'),
  description: z.string().trim().max(300, 'Description cannot exceed 300 characters').optional(),
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  discountAmount: z.coerce.number({ invalid_type_error: 'Discount amount must be a number' }).positive('Discount amount must be greater than 0'),
  minPurchaseAmount: z.coerce.number().nonnegative('Minimum purchase amount cannot be negative').default(0),
  maxDiscountAmount: z.coerce.number().nonnegative('Maximum discount amount cannot be negative').default(0),
  startDate: dateFieldSchema.optional().nullable(),
  expiryDate: dateFieldSchema,
  usageLimit: z.coerce.number().int().positive('Usage limit must be at least 1').optional().nullable(),
  usageLimitPerUser: z.coerce.number().int().positive('Per-user limit must be at least 1').default(1),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
};

const addBusinessRefinements = (schema) =>
  schema.superRefine((data, ctx) => {
    if (
      data.discountType === 'percentage' &&
      typeof data.discountAmount === 'number' &&
      data.discountAmount > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountAmount'],
        message: 'Percentage discount cannot exceed 100%',
      });
    }

    if (
      data.startDate instanceof Date &&
      data.expiryDate instanceof Date &&
      data.expiryDate.getTime() < data.startDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: 'Expiry date must be on or after start date',
      });
    }
  });

export const createCouponSchema = z.preprocess(
  (raw) => normalizeRawCouponBody(raw, false),
  addBusinessRefinements(z.object(baseCouponShape))
);

export const updateCouponSchema = z.preprocess(
  (raw) => normalizeRawCouponBody(raw, true),
  addBusinessRefinements(
    z
      .object({
        code: baseCouponShape.code.optional(),
        description: baseCouponShape.description,
        discountType: z.enum(['percentage', 'fixed']).optional(),
        discountAmount: baseCouponShape.discountAmount.optional(),
        minPurchaseAmount: z.coerce.number().nonnegative('Minimum purchase amount cannot be negative').optional(),
        maxDiscountAmount: z.coerce.number().nonnegative('Maximum discount amount cannot be negative').optional(),
        startDate: dateFieldSchema.optional().nullable(),
        expiryDate: dateFieldSchema.optional(),
        usageLimit: baseCouponShape.usageLimit,
        usageLimitPerUser: z.coerce.number().int().positive('Per-user limit must be at least 1').optional(),
        isActive: z.boolean().optional(),
        isPublic: z.boolean().optional(),
      })
  )
);
