import { z } from "zod";

import { keyword, sortOrder, page, limit } from "./common.validator.js";

/*                              Base Query                                    */

export const baseQuerySchema = z.object({
  query: z.object({
    page: page.optional().default(1),

    limit: limit.optional().default(10),

    keyword,

    sortBy: z.string().trim().optional(),

    order: sortOrder.optional().default("desc"),
  }),
});

/*                            Status Filter                                   */

export const statusQuerySchema = z.object({
  query: baseQuerySchema.shape.query.extend({
    isActive: z.coerce.boolean().optional(),

    isFeatured: z.coerce.boolean().optional(),

    deleted: z.coerce.boolean().optional(),
  }),
});

/*                           Price Filter                                     */

export const priceQuerySchema = z.object({
  query: baseQuerySchema.shape.query.extend({
    minPrice: z.coerce.number().min(0).optional(),

    maxPrice: z.coerce.number().min(0).optional(),
  }),
});

/*                            Product Filter                                  */

export const productQuerySchema = z.object({
  query: baseQuerySchema.shape.query.extend({
    category: z.string().trim().optional(),

    brand: z.string().trim().optional(),

    vendor: z.string().trim().optional(),

    featured: z.coerce.boolean().optional(),

    flashSale: z.coerce.boolean().optional(),

    bestSeller: z.coerce.boolean().optional(),

    trending: z.coerce.boolean().optional(),

    newArrival: z.coerce.boolean().optional(),

    inStock: z.coerce.boolean().optional(),

    minPrice: z.coerce.number().min(0).optional(),

    maxPrice: z.coerce.number().min(0).optional(),
  }),
});

/*                             Order Filter                                   */

export const orderQuerySchema = z.object({
  query: baseQuerySchema.shape.query.extend({
    status: z.string().trim().optional(),

    paymentMethod: z.string().trim().optional(),

    paymentStatus: z.string().trim().optional(),
  }),
});

/*                             Review Filter                                  */

export const reviewQuerySchema = z.object({
  query: baseQuerySchema.shape.query.extend({
    rating: z.coerce.number().min(1).max(5).optional(),
  }),
});

/*                             Vendor Filter                                  */

export const vendorQuerySchema = z.object({
  query: baseQuerySchema.shape.query.extend({
    isVerified: z.coerce.boolean().optional(),

    isApproved: z.coerce.boolean().optional(),

    isActive: z.coerce.boolean().optional(),
  }),
});
