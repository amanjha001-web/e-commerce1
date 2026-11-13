import { vendorVariantService } from '../../services/vendor/variants.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getVariants = asyncHandler(async (req, res) => {
  const variants = await vendorVariantService.getVariants(req.user._id, req.params.productId);
  return ApiResponse.success(res, variants, 'Variants retrieved');
});

export const createVariant = asyncHandler(async (req, res) => {
  const variant = await vendorVariantService.createVariant(req.user._id, req.params.productId, req.body);
  return ApiResponse.created(res, variant, 'Variant created');
});

export const updateVariant = asyncHandler(async (req, res) => {
  const variant = await vendorVariantService.updateVariant(req.user._id, req.params.variantId, req.body);
  return ApiResponse.success(res, variant, 'Variant updated');
});

export const deleteVariant = asyncHandler(async (req, res) => {
  const result = await vendorVariantService.deleteVariant(req.user._id, req.params.variantId);
  return ApiResponse.success(res, result, result.message);
});
