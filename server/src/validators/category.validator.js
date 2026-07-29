import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Create Category Schema
|--------------------------------------------------------------------------
*/

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .max(100, "Category name cannot exceed 100 characters"),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    parentCategory: z.string().optional(),

    isFeatured: z.coerce.boolean().optional(),

    sortOrder: z.coerce.number().min(0).optional(),
  }),
});

/*
|--------------------------------------------------------------------------
| Update Category Schema
|--------------------------------------------------------------------------
*/

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .max(100, "Category name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    parentCategory: z.string().optional(),

    isFeatured: z.coerce.boolean().optional(),

    sortOrder: z.coerce.number().min(0).optional(),

    isActive: z.coerce.boolean().optional(),
  }),
});
