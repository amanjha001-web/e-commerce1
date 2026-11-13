import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(6),
    street: z.string().min(3),
    apartment: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().default('India'),
  }).optional(),
  addressId: z.string().optional(),
  paymentMethod: z.enum(['razorpay', 'cod', 'wallet']).default('razorpay'),
  couponCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.string().min(1, 'Order status is required'),
  note: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required'),
});

export const returnOrderSchema = z.object({
  reason: z.string().min(3, 'Return reason is required'),
});
