import { z } from "zod";

import { objectId, keyword, page, limit } from "./common.validator.js";

import { USER_STATUS } from "../constants/userStatus.js";

import { VENDOR_STATUS } from "../constants/vendorStatus.js";

/*                          Dashboard                                         */

export const dashboardSchema = z.object({
  query: z.object({}).optional(),
});

/*                          Users                                             */

/**
 * Get All Users
 *
 * GET /admin/users
 */
export const getUsersSchema = z.object({
  query: z.object({
    page: page.optional(),

    limit: limit.optional(),

    search: keyword,

    status: z.enum(Object.values(USER_STATUS)).optional(),
  }),
});

/**
 * Get User By Id
 *
 * GET /admin/users/:id
 */
export const getUserSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Update User Status
 *
 * PATCH /admin/users/:id/status
 */
export const updateUserStatusSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    status: z.enum(Object.values(USER_STATUS)),
  }),
});

/*                          Vendors                                           */

/**
 * Get Vendors
 */
export const getVendorsSchema = z.object({
  query: z.object({
    page: page.optional(),

    limit: limit.optional(),

    status: z.enum(Object.values(VENDOR_STATUS)).optional(),
  }),
});

/**
 * Approve Vendor
 */
export const approveVendorSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Reject Vendor
 */
export const rejectVendorSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    reason: z
      .string()
      .trim()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(500, "Reason cannot exceed 500 characters"),
  }),
});

/*                          Products                                          */

/**
 * Pending Products
 */
export const pendingProductsSchema = z.object({
  query: z.object({
    page: page.optional(),

    limit: limit.optional(),
  }),
});

/**
 * Approve Product
 */
export const approveProductSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/**
 * Reject Product
 */
export const rejectProductSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    reason: z
      .string()
      .trim()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(500, "Reason cannot exceed 500 characters"),
  }),
});

/*                          Orders                                            */

/**
 * Get Orders
 */
export const getOrdersSchema = z.object({
  query: z.object({
    page: page.optional(),

    limit: limit.optional(),

    search: keyword,
  }),
});

/*                           Export                                           */

export default {
  dashboardSchema,

  getUsersSchema,
  getUserSchema,
  updateUserStatusSchema,

  getVendorsSchema,
  approveVendorSchema,
  rejectVendorSchema,

  pendingProductsSchema,
  approveProductSchema,
  rejectProductSchema,

  getOrdersSchema,
};
