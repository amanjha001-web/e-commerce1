import { z } from "zod";

import { objectId, booleanField } from "./common.validator.js";

/*                               Base Schema                                  */

const couponBody = {
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Coupon code must be at least 3 characters")
    .max(30, "Coupon code cannot exceed 30 characters"),

  description: z.string().trim().max(200).optional().or(z.literal("")),

  discountType: z.enum(["percentage", "fixed"]),

  discountValue: z.coerce
    .number()
    .positive("Discount value must be greater than 0"),

  minimumOrderAmount: z.coerce.number().min(0).optional(),

  maximumDiscount: z.coerce.number().min(0).optional(),

  startDate: z.coerce.date(),

  expiryDate: z.coerce.date(),

  usageLimit: z.coerce.number().int().positive().optional(),

  isActive: booleanField.optional(),

  applicableCategories: z.array(objectId).optional(),

  applicableProducts: z.array(objectId).optional(),
};

/*                           Create Coupon                                    */

export const createCouponSchema = z.object({
  body: z.object(couponBody).superRefine((data, ctx) => {
    if (data.discountType === "percentage" && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage discount cannot exceed 100",
      });
    }

    if (data.expiryDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiryDate"],
        message: "Expiry date must be after start date",
      });
    }
  }),
});

/*                           Update Coupon                                    */

export const updateCouponSchema = z.object({
  body: z.object({
    code: couponBody.code.optional(),

    description: couponBody.description,

    discountType: couponBody.discountType.optional(),

    discountValue: couponBody.discountValue.optional(),

    minimumOrderAmount: couponBody.minimumOrderAmount,

    maximumDiscount: couponBody.maximumDiscount,

    startDate: couponBody.startDate.optional(),

    expiryDate: couponBody.expiryDate.optional(),

    usageLimit: couponBody.usageLimit,

    isActive: couponBody.isActive,

    applicableCategories: couponBody.applicableCategories,

    applicableProducts: couponBody.applicableProducts,
  }),
});

/*                            Apply Coupon                                    */

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase().min(1),

    orderAmount: z.coerce.number().positive(),
  }),
});

/*                              Coupon Id                                     */

export const couponIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                             Coupon Code                                    */

export const couponCodeSchema = z.object({
  params: z.object({
    code: z.string().trim(),
  }),
});
