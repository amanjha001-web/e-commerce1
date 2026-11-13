import { Router } from 'express';
import { Brand } from '../../models/Brand.model.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { slugify } from '../../utils/helpers.js';
import { ApiError } from '../../utils/apiError.js';
import { uploadToCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  return ApiResponse.success(res, brands, 'Admin brands');
}));

router.get('/:brandId', asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.brandId);
  if (!brand) throw ApiError.notFound('Brand not found');
  return ApiResponse.success(res, brand, 'Brand details');
}));

router.post('/', asyncHandler(async (req, res) => {
  const slug = req.body.slug || slugify(req.body.name);
  const brand = await Brand.create({ ...req.body, slug });
  return ApiResponse.created(res, brand, 'Brand created');
}));

router.patch('/:brandId', asyncHandler(async (req, res) => {
  if (req.body.name && !req.body.slug) {
    req.body.slug = slugify(req.body.name);
  }
  const brand = await Brand.findByIdAndUpdate(req.params.brandId, req.body, { new: true });
  if (!brand) throw ApiError.notFound('Brand not found');
  return ApiResponse.success(res, brand, 'Brand updated');
}));

router.patch('/:brandId/status', asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.brandId);
  if (!brand) throw ApiError.notFound('Brand not found');
  brand.isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !brand.isActive;
  await brand.save();
  return ApiResponse.success(res, brand, 'Brand status updated');
}));

router.patch('/:brandId/logo', upload.single('logo'), asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.brandId);
  if (!brand) throw ApiError.notFound('Brand not found');
  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file.buffer, 'brands');
    brand.logo = { url: uploaded.url, publicId: uploaded.publicId };
    await brand.save();
  }
  return ApiResponse.success(res, brand, 'Brand logo updated');
}));

router.delete('/:brandId/logo', asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.brandId);
  if (!brand) throw ApiError.notFound('Brand not found');
  brand.logo = undefined;
  await brand.save();
  return ApiResponse.success(res, brand, 'Brand logo removed');
}));

router.delete('/:brandId', asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.brandId);
  if (!brand) throw ApiError.notFound('Brand not found');
  return ApiResponse.success(res, null, 'Brand deleted');
}));

export default router;
