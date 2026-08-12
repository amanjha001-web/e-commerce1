import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import productVariantService from "../services/productVariant.service.js";

/*                         Create Variant                                     */

/**
 * Create Product Variant
 *
 * POST /api/v1/products/:productId/variants
 */

const createVariant = asyncHandler(async (req, res) => {
  const variant = await productVariantService.createVariant(
    req.params.productId,
    req.body,
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, variant, "Product variant created successfully"),
    );
});

/*                         Get Variant                                        */

/**
 * Get Variant By Id
 *
 * GET /api/v1/variants/:id
 */

const getVariantById = asyncHandler(async (req, res) => {
  const variant = await productVariantService.getVariantById(req.params.id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, variant, "Product variant fetched successfully"),
    );
});

/*                    Get Product Variants                                    */

/**
 * Get All Variants Of Product
 *
 * GET /api/v1/products/:productId/variants
 */

const getProductVariants = asyncHandler(async (req, res) => {
  const variants = await productVariantService.getProductVariants(
    req.params.productId,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, variants, "Product variants fetched successfully"),
    );
});

/*                         Update Variant                                     */

/**
 * Update Variant
 *
 * PATCH /api/v1/variants/:id
 */

const updateVariant = asyncHandler(async (req, res) => {
  const variant = await productVariantService.updateVariant(
    req.params.id,
    req.body,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, variant, "Product variant updated successfully"),
    );
});

/*                         Delete Variant                                     */

/**
 * Soft Delete Variant
 *
 * DELETE /api/v1/variants/:id
 */

const deleteVariant = asyncHandler(async (req, res) => {
  await productVariantService.deleteVariant(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product variant deleted successfully"));
});

/*                         Restore Variant                                    */

/**
 * Restore Variant
 *
 * PATCH /api/v1/variants/:id/restore
 */

const restoreVariant = asyncHandler(async (req, res) => {
  const variant = await productVariantService.restoreVariant(req.params.id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, variant, "Product variant restored successfully"),
    );
});

/*                         Stock Management                                   */

/**
 * Increase Stock
 *
 * PATCH /api/v1/variants/:id/stock/increase
 */

const increaseStock = asyncHandler(async (req, res) => {
  const variant = await productVariantService.increaseStock(
    req.params.id,
    req.body.quantity,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, variant, "Stock increased successfully"));
});

/**
 * Decrease Stock
 *
 * PATCH /api/v1/variants/:id/stock/decrease
 */

const decreaseStock = asyncHandler(async (req, res) => {
  const variant = await productVariantService.decreaseStock(
    req.params.id,
    req.body.quantity,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, variant, "Stock decreased successfully"));
});

/**
 * Reserve Stock
 *
 * PATCH /api/v1/variants/:id/stock/reserve
 */

const reserveStock = asyncHandler(async (req, res) => {
  const variant = await productVariantService.reserveStock(
    req.params.id,
    req.body.quantity,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, variant, "Stock reserved successfully"));
});

/**
 * Release Stock
 *
 * PATCH /api/v1/variants/:id/stock/release
 */

const releaseStock = asyncHandler(async (req, res) => {
  const variant = await productVariantService.releaseStock(
    req.params.id,
    req.body.quantity,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, variant, "Reserved stock released successfully"),
    );
});

/*                         SKU Check                                          */

/**
 * Check SKU Availability
 *
 * GET /api/v1/variants/check-sku/:sku
 */

const checkSkuAvailability = asyncHandler(async (req, res) => {
  const available = await productVariantService.checkSkuAvailability(
    req.params.sku,
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        available,
      },
      "SKU availability checked",
    ),
  );
});

export default{
  createVariant,

  getVariantById,

  getProductVariants,

  updateVariant,

  deleteVariant,

  restoreVariant,

  increaseStock,

  decreaseStock,

  reserveStock,

  releaseStock,

  checkSkuAvailability,
};
