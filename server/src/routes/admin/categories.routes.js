import { Router } from 'express';
import { Category } from '../../models/Category.model.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { slugify } from '../../utils/helpers.js';
import { ApiError } from '../../utils/apiError.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find().populate('parent', 'name slug').sort({ sortOrder: 1, name: 1 });
  return ApiResponse.success(res, categories, 'Admin categories');
}));

router.get('/:categoryId', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  return ApiResponse.success(res, category, 'Category details');
}));

router.post('/', asyncHandler(async (req, res) => {
  const slug = req.body.slug || slugify(req.body.name);
  const category = await Category.create({ ...req.body, slug });
  return ApiResponse.created(res, category, 'Category created');
}));

router.patch('/:categoryId', asyncHandler(async (req, res) => {
  if (req.body.name && !req.body.slug) {
    req.body.slug = slugify(req.body.name);
  }
  const category = await Category.findByIdAndUpdate(req.params.categoryId, req.body, { new: true });
  if (!category) throw ApiError.notFound('Category not found');
  return ApiResponse.success(res, category, 'Category updated');
}));

router.patch('/:categoryId/status', asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  category.isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !category.isActive;
  await category.save();
  return ApiResponse.success(res, category, 'Category status updated');
}));

router.delete('/:categoryId', asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  return ApiResponse.success(res, null, 'Category deleted');
}));

export default router;
