import { z } from "zod";

import { objectId } from "./common.validator.js";

/*                               Enums                                        */

const paymentMethod = z.enum(["COD", "RAZORPAY"]);

const orderStatus = z.enum([
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
  "Refunded",
]);

/*                           Create Order                                     */

export const createOrderSchema = z.object({
  body: z.object({
    addressId: objectId,

    paymentMethod: paymentMethod.default("COD"),

    couponCode: z.string().trim().optional().or(z.literal("")),

    notes: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});

/*                         Update Order Status                                */

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    status: orderStatus,

    trackingNumber: z.string().trim().max(100).optional().or(z.literal("")),

    courier: z.string().trim().max(100).optional().or(z.literal("")),

    remark: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});

/*                           Cancel Order                                     */

export const cancelOrderSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    reason: z
      .string()
      .trim()
      .min(5, "Cancellation reason is required")
      .max(500),
  }),
});

/*                           Return Order                                     */

export const returnOrderSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    reason: z.string().trim().min(5).max(500),
  }),
});

/*                           Refund Order                                     */

export const refundOrderSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    reason: z.string().trim().min(5).max(500),
  }),
});

/*                              Order Id                                      */

export const orderIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
