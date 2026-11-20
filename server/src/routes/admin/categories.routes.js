import { Router } from 'express';
import { adminCategoryService } from '../../services/admin/category.service.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const result = await adminCategoryService.getCategories(req.query);
  return ApiResponse.success(res, result, 'Admin categories');
}));

router.get('/:categoryId', asyncHandler(async (req, res) => {
  const category = await adminCategoryService.getCategoryById(req.params.categoryId);
  return ApiResponse.success(res, category, 'Category details');
}));

router.post('/', upload.single('image'), asyncHandler(async (req, res) => {
  const category = await adminCategoryService.createCategory(req.body, req.file);
  return ApiResponse.created(res, category, 'Category created');
}));

router.patch('/:categoryId', upload.single('image'), asyncHandler(async (req, res) => {
  const category = await adminCategoryService.updateCategory(req.params.categoryId, req.body, req.file);
  return ApiResponse.success(res, category, 'Category updated');
}));

router.patch('/:categoryId/status', asyncHandler(async (req, res) => {
  const category = await adminCategoryService.updateCategoryStatus(
    req.params.categoryId,
    req.body?.isActive
  );
  return ApiResponse.success(res, category, 'Category status updated');
}));

router.delete('/:categoryId', asyncHandler(async (req, res) => {
  const result = await adminCategoryService.deleteCategory(req.params.categoryId);
  return ApiResponse.success(res, result, result.message);
}));

export default router;
