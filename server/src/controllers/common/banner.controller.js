import { bannerCommonService } from '../../services/common/banner.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await bannerCommonService.getActiveBanners(req.query);
  return ApiResponse.success(res, banners, 'Active banners retrieved');
});

export const getBannerById = asyncHandler(async (req, res) => {
  const banner = await bannerCommonService.getBannerById(req.params.bannerId || req.params.id);
  return ApiResponse.success(res, banner, 'Banner retrieved');
});

export const getBannerBySlug = asyncHandler(async (req, res) => {
  const banner = await bannerCommonService.getBannerBySlug(req.params.slug);
  return ApiResponse.success(res, banner, 'Banner retrieved');
});

export const incrementImpression = asyncHandler(async (req, res) => {
  await bannerCommonService.incrementImpression(req.params.bannerId);
  return ApiResponse.success(res, null, 'Impression recorded');
});

export const incrementClick = asyncHandler(async (req, res) => {
  await bannerCommonService.incrementClick(req.params.bannerId);
  return ApiResponse.success(res, null, 'Click recorded');
});
