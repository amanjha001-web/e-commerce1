import { z } from "zod";

/*                              Create Notification                           */

export const createNotificationSchema = z.object({
  body: z.object({
    user: z.string().min(1, "User is required"),

    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(150, "Title cannot exceed 150 characters"),

    message: z
      .string()
      .trim()
      .min(1, "Message is required")
      .max(1000, "Message cannot exceed 1000 characters"),

    type: z
      .enum([
        "ORDER",
        "PAYMENT",
        "PRODUCT",
        "COUPON",
        "RETURN",
        "REFUND",
        "SHIPMENT",
        "VENDOR",
        "CHAT",
        "SYSTEM",
        "PROMOTION",
      ])
      .optional(),

    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

    resourceType: z
      .enum([
        "ORDER",
        "PRODUCT",
        "PAYMENT",
        "COUPON",
        "VENDOR",
        "RETURN",
        "REFUND",
        "CHAT",
        "NONE",
      ])
      .optional(),

    resourceId: z.string().optional().nullable(),

    data: z.record(z.any()).optional(),

    actionUrl: z.string().optional(),

    sentVia: z.array(z.enum(["APP", "EMAIL", "SMS", "PUSH"])).optional(),

    scheduledFor: z.string().datetime().optional(),

    expiresAt: z.string().datetime().optional(),
  }),
});

/*                            Notification Params                             */

export const notificationIdSchema = z.object({
  params: z.object({
    notificationId: z.string().min(1, "Notification ID is required"),
  }),
});

/*                           Notification Query                               */

export const notificationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),

    limit: z.coerce.number().int().min(1).max(100).optional(),

    type: z
      .enum([
        "ORDER",
        "PAYMENT",
        "PRODUCT",
        "COUPON",
        "RETURN",
        "REFUND",
        "SHIPMENT",
        "VENDOR",
        "CHAT",
        "SYSTEM",
        "PROMOTION",
      ])
      .optional(),

    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

    status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),

    isRead: z.enum(["true", "false"]).optional(),

    sortBy: z.enum(["createdAt", "updatedAt", "title", "priority"]).optional(),

    order: z.enum(["asc", "desc"]).optional(),
  }),
});

/*                                  Export                                    */

export default {
  createNotificationSchema,

  notificationIdSchema,

  notificationQuerySchema,
};
