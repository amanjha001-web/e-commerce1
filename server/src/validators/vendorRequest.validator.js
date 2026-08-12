import { z } from "zod";

import {
  objectId,
  email,
  phone,
  website,
  page,
  limit,
  keyword,
} from "./common.validator.js";

/*                              Address                                       */

const addressSchema = z.object({
  country: z.string().trim().min(2).max(100),

  state: z.string().trim().min(2).max(100),

  city: z.string().trim().min(2).max(100),

  postalCode: z.string().trim().min(3).max(20),

  addressLine1: z.string().trim().min(5).max(200),

  addressLine2: z.string().trim().max(200).optional(),
});

/*                            Bank Details                                    */

const bankDetailsSchema = z.object({
  accountHolderName: z.string().trim().min(2).max(120),

  accountNumber: z.string().trim().min(8).max(30),

  ifscCode: z
    .string()
    .trim()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),

  bankName: z.string().trim().min(2).max(100),

  branchName: z.string().trim().max(100).optional(),

  upiId: z.string().trim().optional(),
});

/*                         Vendor Request Create                              */

export const createVendorRequestSchema = z.object({
  body: z.object({
    shopName: z.string().trim().min(3).max(120),

    businessName: z.string().trim().min(3).max(120),

    description: z.string().trim().max(1000).optional(),

    email,

    phone,

    website: website.optional(),

    address: addressSchema,

    bankDetails: bankDetailsSchema,
  }),
});

/*                         Update Vendor Request                              */

export const updateVendorRequestSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z
    .object({
      shopName: z.string().trim().min(3).max(120).optional(),

      businessName: z.string().trim().min(3).max(120).optional(),

      description: z.string().trim().max(1000).optional(),

      email: email.optional(),

      phone: phone.optional(),

      website: website.optional(),

      address: addressSchema.partial().optional(),

      bankDetails: bankDetailsSchema.partial().optional(),
    })
    .strict(),
});

/*                              Request Id                                    */

export const vendorRequestIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                            Reject Request                                  */

export const rejectVendorRequestSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    reason: z.string().trim().min(5, "Reason is required").max(500),
  }),
});

/*                           Query Params                                     */

export const vendorRequestQuerySchema = z.object({
  query: z.object({
    page: page.optional(),

    limit: limit.optional(),

    search: keyword,

    status: z
      .enum(["pending", "under_review", "approved", "rejected"])
      .optional(),

    sort: z
      .enum(["createdAt", "-createdAt", "shopName", "-shopName"])
      .optional(),
  }),
});
