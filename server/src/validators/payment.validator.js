import { z } from "zod";

import { objectId } from "./common.validator.js";

/*                      Create Razorpay Order                                 */

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    orderId: objectId,
  }),
});

/*                           Verify Razorpay Payment                          */

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().trim().min(1, "Razorpay Order ID is required"),

    razorpayPaymentId: z
      .string()
      .trim()
      .min(1, "Razorpay Payment ID is required"),

    razorpaySignature: z
      .string()
      .trim()
      .min(1, "Razorpay Signature is required"),
  }),
});

/*                           Payment Webhook                                  */

export const razorpayWebhookSchema = z.object({
  headers: z.object({
    "x-razorpay-signature": z.string(),
  }),
});

/*                            Refund Payment                                  */

export const refundPaymentSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    amount: z.coerce
      .number()
      .positive("Refund amount must be greater than 0")
      .optional(),

    reason: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});

/*                         Payment Status                                     */

export const paymentStatusSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const paymentFailureSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().trim().min(1, "Razorpay Order ID is required"),

    failureReason: z.string().trim().max(500).optional().or(z.literal("")),

    gatewayResponse: z.record(z.string(), z.any()).optional(),
  }),
});