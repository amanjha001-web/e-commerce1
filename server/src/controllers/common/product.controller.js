import { productService } from '../../services/common/product.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  return ApiResponse.success(res, result, 'Products retrieved successfully');
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.productId || req.params.id);
  return ApiResponse.success(res, product, 'Product details retrieved');
});

export const searchProducts = asyncHandler(async (req, res) => {
  const query = req.query.search || req.query.q || '';
  const result = await productService.getProducts({ ...req.query, search: query });
  return ApiResponse.success(res, result, 'Product search results');
});

export const getFlashSaleProducts = asyncHandler(async (req, res) => {
  const products = await productService.getFlashSaleProducts(req.query);
  return ApiResponse.success(res, products, 'Flash sale products retrieved');
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await productService.getTrendingProducts(req.query);
  return ApiResponse.success(res, products, 'Trending products retrieved');
});

export const getBestSellerProducts = asyncHandler(async (req, res) => {
  const products = await productService.getBestSellerProducts(req.query);
  return ApiResponse.success(res, products, 'Best seller products retrieved');
});

export const getNewArrivalProducts = asyncHandler(async (req, res) => {
  const products = await productService.getNewArrivalProducts(req.query);
  return ApiResponse.success(res, products, 'New arrival products retrieved');
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getRelatedProducts(req.params.productId);
  return ApiResponse.success(res, products, 'Related products retrieved');
});

export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const products = await productService.getRecentlyViewed(req.user?._id);
  return ApiResponse.success(res, products, 'Recently viewed products');
});

export const addRecentlyViewed = asyncHandler(async (req, res) => {
  await productService.addRecentlyViewed(req.user?._id, req.params.productId);
  return ApiResponse.success(res, null, 'Added to recently viewed');
});

export const getProductsByCategory = asyncHandler(async (req, res) => {
  const result = await productService.getProducts({ ...req.query, category: req.params.categoryId });
  return ApiResponse.success(res, result, 'Category products retrieved');
});

export const getProductsByBrand = asyncHandler(async (req, res) => {
  const result = await productService.getProducts({ ...req.query, brand: req.params.brandId });
  return ApiResponse.success(res, result, 'Brand products retrieved');
});
