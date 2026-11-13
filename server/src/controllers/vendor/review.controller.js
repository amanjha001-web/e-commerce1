import { vendorReviewService } from '../../services/vendor/review.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getVendorReviews = asyncHandler(async (req, res) => {
  const result = await vendorReviewService.getVendorReviews(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Vendor reviews');
});

export const replyToReview = asyncHandler(async (req, res) => {
  const review = await vendorReviewService.replyToReview(req.user._id, req.params.reviewId, req.body.reply);
  return ApiResponse.success(res, review, 'Reply posted');
});
