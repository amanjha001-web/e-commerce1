import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1').default(1),
  variant: z.string().optional().nullable(),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
  variant: z.string().optional().nullable(),
});

export const applyCouponSchema = z.object({
  couponCode: z.string().min(1, 'Coupon code is required'),
});
