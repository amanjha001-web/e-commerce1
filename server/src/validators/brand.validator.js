import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                           Create Brand Schema                              */
/* -------------------------------------------------------------------------- */

export const createBrandSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Brand name must be at least 2 characters")
      .max(100, "Brand name cannot exceed 100 characters"),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    website: z
      .string()
      .trim()
      .url("Website must be a valid URL")
      .optional()
      .or(z.literal("")),

    isFeatured: z.coerce.boolean().optional(),

    sortOrder: z.coerce.number().min(0).optional(),
  }),
});

/* -------------------------------------------------------------------------- */
/*                           Update Brand Schema                              */
/* -------------------------------------------------------------------------- */

export const updateBrandSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Brand name must be at least 2 characters")
      .max(100, "Brand name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    website: z
      .string()
      .trim()
      .url("Website must be a valid URL")
      .optional()
      .or(z.literal("")),

    isFeatured: z.coerce.boolean().optional(),

    sortOrder: z.coerce.number().min(0).optional(),

    isActive: z.coerce.boolean().optional(),
  }),
});
