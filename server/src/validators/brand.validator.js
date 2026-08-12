import { z } from "zod";

import { objectId, booleanField, slug } from "./common.validator.js";

/*                               Base Schema                                  */

const brandBody = {
  name: z
    .string()
    .trim()
    .min(2, "Brand name must be at least 2 characters")
    .max(100, "Brand name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .url("Please enter a valid website URL")
    .optional()
    .or(z.literal("")),

  sortOrder: z.coerce
    .number()
    .int()
    .min(0, "Sort order cannot be negative")
    .optional(),

  isFeatured: booleanField.optional(),

  isActive: booleanField.optional(),

  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),

  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
};

/*                             Create Brand                                   */

export const createBrandSchema = z.object({
  body: z.object(brandBody),
});

/*                             Update Brand                                   */

export const updateBrandSchema = z.object({
  body: z.object({
    name: brandBody.name.optional(),

    description: brandBody.description,

    website: brandBody.website,

    sortOrder: brandBody.sortOrder,

    isFeatured: brandBody.isFeatured,

    isActive: brandBody.isActive,

    seoTitle: brandBody.seoTitle,

    seoDescription: brandBody.seoDescription,
  }),
});

/*                              Brand Params                                  */

export const brandIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                               Brand Slug                                   */

export const brandSlugSchema = z.object({
  params: z.object({
    slug,
  }),
});
