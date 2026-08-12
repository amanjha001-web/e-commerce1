import { z } from "zod";

import { page, limit, sortOrder, keyword } from "./common.validator.js";

/*                          Pagination Query                                  */

export const paginationSchema = z.object({
  query: z.object({
    page: page.optional().default(1),

    limit: limit.optional().default(10),

    keyword,

    sortBy: z.string().trim().optional(),

    order: sortOrder.optional().default("desc"),
  }),
});

/*                         Product Pagination                                 */

export const productPaginationSchema = z.object({
  query: paginationSchema.shape.query.extend({
    category: z.string().trim().optional(),

    brand: z.string().trim().optional(),

    vendor: z.string().trim().optional(),

    minPrice: z.coerce.number().min(0).optional(),

    maxPrice: z.coerce.number().min(0).optional(),

    featured: z.coerce.boolean().optional(),

    flashSale: z.coerce.boolean().optional(),

    bestSeller: z.coerce.boolean().optional(),

    trending: z.coerce.boolean().optional(),

    newArrival: z.coerce.boolean().optional(),

    inStock: z.coerce.boolean().optional(),
  }),
});

/*                         Order Pagination                                   */

export const orderPaginationSchema = z.object({
  query: paginationSchema.shape.query.extend({
    status: z.string().trim().optional(),

    paymentMethod: z.string().trim().optional(),

    paymentStatus: z.string().trim().optional(),
  }),
});

/*                         Review Pagination                                  */

export const reviewPaginationSchema = z.object({
  query: paginationSchema.shape.query.extend({
    rating: z.coerce.number().min(1).max(5).optional(),
  }),
});

/*                         Vendor Pagination                                  */

export const vendorPaginationSchema = z.object({
  query: paginationSchema.shape.query.extend({
    isVerified: z.coerce.boolean().optional(),

    isApproved: z.coerce.boolean().optional(),

    isActive: z.coerce.boolean().optional(),
  }),
});
