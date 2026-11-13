import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  discountAmount: z.coerce.number().positive(),
  minPurchaseAmount: z.coerce.number().nonnegative().default(0),
  maxDiscountAmount: z.coerce.number().nonnegative().default(0),
  startDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  usageLimitPerUser: z.coerce.number().int().positive().default(1),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();
