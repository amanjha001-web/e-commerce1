import { vendorProductService } from '../../services/vendor/product.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getVendorProducts = asyncHandler(async (req, res) => {
  const result = await vendorProductService.getVendorProducts(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Vendor products');
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await vendorProductService.createProduct(req.user._id, req.body);
  return ApiResponse.created(res, product, 'Product created and submitted for approval');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await vendorProductService.updateProduct(req.user._id, req.params.productId, req.body);
  return ApiResponse.success(res, product, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await vendorProductService.deleteProduct(req.user._id, req.params.productId);
  return ApiResponse.success(res, result, result.message);
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const product = await vendorProductService.updateProductStock(req.user._id, req.params.productId, req.body.stock);
  return ApiResponse.success(res, product, 'Stock updated');
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const product = await vendorProductService.uploadProductImages(req.user._id, req.params.productId, files);
  return ApiResponse.success(res, product, 'Images uploaded');
});

export const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await vendorProductService.deleteProductImage(req.user._id, req.params.productId, req.params.imageId);
  return ApiResponse.success(res, product, 'Image removed');
});
