import { categoryService } from '../../services/common/category.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.query);
  return ApiResponse.success(res, categories, 'Categories retrieved');
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.categoryId || req.params.id);
  return ApiResponse.success(res, category, 'Category details retrieved');
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.slug);
  return ApiResponse.success(res, category, 'Category details retrieved');
});

export const getCategoryProducts = asyncHandler(async (req, res) => {
  const products = await categoryService.getCategoryProducts(req.params.categoryId, req.query);
  return ApiResponse.success(res, products, 'Category products retrieved');
});
