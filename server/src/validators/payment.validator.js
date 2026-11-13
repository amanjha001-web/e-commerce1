import { z } from 'zod';

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Razorpay Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Razorpay Signature is required'),
  orderId: z.string().optional(),
});

export const refundPaymentSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  reason: z.string().min(3, 'Refund reason is required'),
});
