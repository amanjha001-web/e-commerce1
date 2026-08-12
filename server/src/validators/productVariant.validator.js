import { z } from "zod";

import { objectId, money, positiveInteger } from "./common.validator.js";

/*                         Variant Attributes                                 */

const attributesSchema = z.record(z.string(), z.string()).optional();

/*                              Image Schema                                  */

const imageSchema = z.object({
  url: z.string().trim().url("Invalid image URL"),

  publicId: z.string().trim().optional(),
});

/*                         Create Variant                                     */

export const createVariantSchema = z.object({
  params: z.object({
    productId: objectId,
  }),

  body: z.object({
    sku: z
      .string()
      .trim()
      .min(3, "SKU must be at least 3 characters")
      .max(50, "SKU cannot exceed 50 characters")
      .toUpperCase(),

    barcode: z.string().trim().optional(),

    attributes: attributesSchema,

    price: money,

    compareAtPrice: money.optional(),

    costPrice: money.optional(),

    discount: z.number().min(0).max(100).optional(),

    stock: z.number().int().min(0).default(0),

    lowStockThreshold: positiveInteger.optional(),

    images: z.array(imageSchema).optional(),

    isDefault: z.boolean().optional(),
  }),
});

/*                         Get Variant                                        */

export const getVariantSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                    Get Product Variants                                    */

export const getProductVariantsSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                         Update Variant                                     */

export const updateVariantSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    sku: z.string().trim().min(3).max(50).toUpperCase().optional(),

    barcode: z.string().trim().optional(),

    attributes: attributesSchema,

    price: money.optional(),

    compareAtPrice: money.optional(),

    costPrice: money.optional(),

    discount: z.number().min(0).max(100).optional(),

    images: z.array(imageSchema).optional(),

    isActive: z.boolean().optional(),

    isDefault: z.boolean().optional(),
  }),
});

/*                         Delete Variant                                     */

export const deleteVariantSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                         Restore Variant                                    */

export const restoreVariantSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                         Stock Validation                                   */

const stockSchema = z.object({
  quantity: positiveInteger,
});

export const increaseStockSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: stockSchema,
});

export const decreaseStockSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: stockSchema,
});

export const reserveStockSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: stockSchema,
});

export const releaseStockSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: stockSchema,
});

/*                         SKU Check                                          */

export const checkSkuSchema = z.object({
  params: z.object({
    sku: z.string().trim().min(3).max(50),
  }),
});

export default {
  createVariantSchema,

  getVariantSchema,

  getProductVariantsSchema,

  updateVariantSchema,

  deleteVariantSchema,

  restoreVariantSchema,

  increaseStockSchema,

  decreaseStockSchema,

  reserveStockSchema,

  releaseStockSchema,

  checkSkuSchema,
};
