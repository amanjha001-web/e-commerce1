import { z } from "zod";

/*                                  Common                                    */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const taxType = z.enum(["GST", "VAT", "OTHER"]);

/*                               Create Tax                                   */

const createTax = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),

    category: objectId.optional(),

    rate: z.coerce.number().min(0).max(100),

    type: taxType.optional(),

    country: z.string().trim().min(2).max(100).optional(),

    state: z.string().trim().min(2).max(100).optional(),

    isActive: z.boolean().optional(),
  }),
});

/*                               Update Tax                                   */

const updateTax = z.object({
  params: z.object({
    taxId: objectId,
  }),

  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),

    category: objectId.optional(),

    rate: z.coerce.number().min(0).max(100).optional(),

    type: taxType.optional(),

    country: z.string().trim().min(2).max(100).optional(),

    state: z.string().trim().min(2).max(100).optional(),

    isActive: z.boolean().optional(),
  }),
});

/*                             Update Status                                  */

const updateTaxStatus = z.object({
  params: z.object({
    taxId: objectId,
  }),

  body: z.object({
    isActive: z.boolean(),
  }),
});

/*                                 Params                                     */

const taxIdParam = z.object({
  params: z.object({
    taxId: objectId,
  }),
});

const categoryIdParam = z.object({
  params: z.object({
    categoryId: objectId,
  }),
});

/*                                  Query                                     */

const getTaxes = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    search: z.string().trim().optional(),

    type: taxType.optional(),

    country: z.string().trim().optional(),

    state: z.string().trim().optional(),

    isActive: z.enum(["true", "false"]).optional(),

    sort: z.string().optional(),
  }),
});

export default {
  createTax,
  updateTax,
  updateTaxStatus,
  taxIdParam,
  categoryIdParam,
  getTaxes,
};
