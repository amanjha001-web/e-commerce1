import { z } from "zod";

import { objectId, booleanField, slug } from "./common.validator.js";

/*                              Base Schema                                   */

const categoryBody = {
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),

  parentCategory: objectId.optional(),

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

/*                           Create Category                                  */

export const createCategorySchema = z.object({
  body: z.object(categoryBody),
});

/*                           Update Category                                  */

export const updateCategorySchema = z.object({
  body: z.object({
    name: categoryBody.name.optional(),

    description: categoryBody.description,

    parentCategory: categoryBody.parentCategory,

    sortOrder: categoryBody.sortOrder,

    isFeatured: categoryBody.isFeatured,

    isActive: categoryBody.isActive,

    seoTitle: categoryBody.seoTitle,

    seoDescription: categoryBody.seoDescription,
  }),
});

/*                           Category Params                                  */

export const categoryIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                           Category Slug                                    */

export const categorySlugSchema = z.object({
  params: z.object({
    slug,
  }),
});

/*                           Parent Category                                  */

export const parentCategorySchema = z.object({
  params: z.object({
    parentId: objectId,
  }),
});
