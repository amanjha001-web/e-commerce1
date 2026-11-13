import { adminProductService } from '../../services/admin/product.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getAdminProducts = asyncHandler(async (req, res) => {
  const result = await adminProductService.getAdminProducts(req.query);
  return ApiResponse.success(res, result, 'Products retrieved');
});

export const getPendingProducts = asyncHandler(async (req, res) => {
  const result = await adminProductService.getPendingProducts(req.query);
  return ApiResponse.success(res, result, 'Pending products for moderation');
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await adminProductService.getProductById(req.params.productId);
  return ApiResponse.success(res, product, 'Product details');
});

export const approveProduct = asyncHandler(async (req, res) => {
  const product = await adminProductService.approveProduct(req.params.productId);
  return ApiResponse.success(res, product, 'Product approved and published');
});

export const rejectProduct = asyncHandler(async (req, res) => {
  const product = await adminProductService.rejectProduct(req.params.productId, req.body.reason);
  return ApiResponse.success(res, product, 'Product rejected');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await adminProductService.updateProduct(req.params.productId, req.body);
  return ApiResponse.success(res, product, 'Product updated');
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await adminProductService.updateProductStatus(req.params.productId, req.body.isActive);
  return ApiResponse.success(res, product, 'Product status updated');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await adminProductService.deleteProduct(req.params.productId);
  return ApiResponse.success(res, result, result.message);
});
