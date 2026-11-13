import { adminBannerService } from '../../services/admin/banner.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getAllBanners = asyncHandler(async (req, res) => {
  const result = await adminBannerService.getAll(req.query);
  return ApiResponse.success(res, result, 'Banners retrieved');
});

export const getBannerById = asyncHandler(async (req, res) => {
  const banner = await adminBannerService.getById(req.params.bannerId);
  return ApiResponse.success(res, banner, 'Banner details');
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await adminBannerService.create(req.body, req.file);
  return ApiResponse.created(res, banner, 'Banner created');
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await adminBannerService.update(req.params.bannerId, req.body, req.file);
  return ApiResponse.success(res, banner, 'Banner updated');
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const result = await adminBannerService.delete(req.params.bannerId);
  return ApiResponse.success(res, result, result.message);
});
