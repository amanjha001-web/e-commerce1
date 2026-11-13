import { brandService } from '../../services/common/brand.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await brandService.getBrands(req.query);
  return ApiResponse.success(res, brands, 'Brands retrieved');
});

export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.brandId || req.params.id);
  return ApiResponse.success(res, brand, 'Brand details retrieved');
});

export const getBrandBySlug = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.slug);
  return ApiResponse.success(res, brand, 'Brand details retrieved');
});

export const getBrandProducts = asyncHandler(async (req, res) => {
  const products = await brandService.getBrandProducts(req.params.brandId, req.query);
  return ApiResponse.success(res, products, 'Brand products retrieved');
});
