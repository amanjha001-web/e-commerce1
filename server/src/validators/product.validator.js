import { z } from "zod";

import {
  objectId,
  money,
  positiveNumber,
  booleanField,
} from "./common.validator.js";

/*                              Base Schema                                   */

const productBody = {
  name: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .max(150, "Product name cannot exceed 150 characters"),

  shortDescription: z
    .string()
    .trim()
    .min(10, "Short description must be at least 10 characters")
    .max(250, "Short description cannot exceed 250 characters"),

  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  category: objectId,

  brand: objectId,

  price: positiveNumber,

  discountPrice: money.optional(),

  costPrice: money.optional(),

  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),

  sku: z.string().trim().max(100).optional().or(z.literal("")),

  barcode: z.string().trim().max(100).optional().or(z.literal("")),

  weight: money.optional(),

  tags: z.union([z.array(z.string().trim()), z.string().trim()]).optional(),

  featured: booleanField.optional(),

  flashSale: booleanField.optional(),

  bestSeller: booleanField.optional(),

  trending: booleanField.optional(),

  newArrival: booleanField.optional(),

  isActive: booleanField.optional(),

  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),

  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
};

/*                           Create Product                                   */

export const createProductSchema = z.object({
  body: z.object(productBody).superRefine((data, ctx) => {
    if (data.discountPrice !== undefined && data.discountPrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountPrice"],
        message: "Discount price cannot be greater than price",
      });
    }

    if (data.costPrice !== undefined && data.costPrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["costPrice"],
        message: "Cost price cannot be greater than selling price",
      });
    }
  }),
});

/*                           Update Product                                   */

export const updateProductSchema = z.object({
  body: z
    .object({
      name: productBody.name.optional(),

      shortDescription: productBody.shortDescription.optional(),

      description: productBody.description.optional(),

      category: objectId.optional(),

      brand: objectId.optional(),

      price: positiveNumber.optional(),

      discountPrice: money.optional(),

      costPrice: money.optional(),

      stock: z.coerce.number().int().min(0).optional(),

      sku: productBody.sku,

      barcode: productBody.barcode,

      weight: money.optional(),

      tags: productBody.tags,

      featured: booleanField.optional(),

      flashSale: booleanField.optional(),

      bestSeller: booleanField.optional(),

      trending: booleanField.optional(),

      newArrival: booleanField.optional(),

      isActive: booleanField.optional(),

      seoTitle: productBody.seoTitle,

      seoDescription: productBody.seoDescription,
    })
    .superRefine((data, ctx) => {
      if (
        data.price !== undefined &&
        data.discountPrice !== undefined &&
        data.discountPrice > data.price
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountPrice"],
          message: "Discount price cannot be greater than price",
        });
      }

      if (
        data.price !== undefined &&
        data.costPrice !== undefined &&
        data.costPrice > data.price
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["costPrice"],
          message: "Cost price cannot be greater than selling price",
        });
      }
    }),
});

/*                             Product Params                                 */

export const productIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                          Product Slug Params                               */

export const productSlugSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1),
  }),
});
