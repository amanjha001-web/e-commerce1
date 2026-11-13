import { customerActivityService } from '../../services/customer/activity.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const products = await customerActivityService.getRecentlyViewed(req.user._id);
  return ApiResponse.success(res, products, 'Recently viewed products');
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await customerActivityService.getMyReviews(req.user._id);
  return ApiResponse.success(res, reviews, 'Your reviews');
});

export const getActivitySummary = asyncHandler(async (req, res) => {
  const summary = await customerActivityService.getActivitySummary(req.user._id);
  return ApiResponse.success(res, summary, 'Activity summary');
});
