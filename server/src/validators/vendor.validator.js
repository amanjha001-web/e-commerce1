import { z } from "zod";

import {
  objectId,
  email,
  phone,
  booleanField,
  slug,
} from "./common.validator.js";

/*                               Base Schema                                  */

const vendorBody = {
  shopName: z
    .string()
    .trim()
    .min(3, "Shop name must be at least 3 characters")
    .max(100, "Shop name cannot exceed 100 characters"),

  shopDescription: z.string().trim().max(1000).optional().or(z.literal("")),

  phone,

  email,

  gstNumber: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST Number",
    )
    .optional()
    .or(z.literal("")),

  panNumber: z
    .string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number")
    .optional()
    .or(z.literal("")),

  address: z.string().trim().optional().or(z.literal("")),

  city: z.string().trim().optional().or(z.literal("")),

  state: z.string().trim().optional().or(z.literal("")),

  country: z.string().trim().optional().or(z.literal("")),

  postalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Invalid Postal Code")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .url("Invalid Website")
    .optional()
    .or(z.literal("")),

  facebook: z.string().trim().url().optional().or(z.literal("")),

  instagram: z.string().trim().url().optional().or(z.literal("")),

  youtube: z.string().trim().url().optional().or(z.literal("")),

  isVerified: booleanField.optional(),

  isApproved: booleanField.optional(),

  isActive: booleanField.optional(),

  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),

  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
};

/*                           Create Vendor                                    */

export const createVendorSchema = z.object({
  body: z.object(vendorBody),
});

/*                           Update Vendor                                    */

export const updateVendorSchema = z.object({
  body: z.object({
    shopName: vendorBody.shopName.optional(),

    shopDescription: vendorBody.shopDescription,

    phone: phone.optional(),

    email: email.optional(),

    gstNumber: vendorBody.gstNumber,

    panNumber: vendorBody.panNumber,

    address: vendorBody.address,

    city: vendorBody.city,

    state: vendorBody.state,

    country: vendorBody.country,

    postalCode: vendorBody.postalCode,

    website: vendorBody.website,

    facebook: vendorBody.facebook,

    instagram: vendorBody.instagram,

    youtube: vendorBody.youtube,

    isVerified: vendorBody.isVerified,

    isApproved: vendorBody.isApproved,

    isActive: vendorBody.isActive,

    seoTitle: vendorBody.seoTitle,

    seoDescription: vendorBody.seoDescription,
  }),
});

/*                              Vendor Params                                 */

export const vendorIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                              Vendor Slug                                   */

export const vendorSlugSchema = z.object({
  params: z.object({
    slug,
  }),
});
