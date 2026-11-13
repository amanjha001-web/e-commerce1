import { adminReviewService } from '../../services/admin/review.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getReviews = asyncHandler(async (req, res) => {
  const result = await adminReviewService.getReviews(req.query);
  return ApiResponse.success(res, result, 'Reviews list');
});

export const getReportedReviews = asyncHandler(async (req, res) => {
  const result = await adminReviewService.getReviews({ ...req.query, status: 'reported' });
  return ApiResponse.success(res, result, 'Reported reviews');
});

export const getReviewById = asyncHandler(async (req, res) => {
  const review = await adminReviewService.getReviewById(req.params.reviewId);
  return ApiResponse.success(res, review, 'Review details');
});

export const approveReview = asyncHandler(async (req, res) => {
  const review = await adminReviewService.approveReview(req.params.reviewId);
  return ApiResponse.success(res, review, 'Review approved');
});

export const rejectReview = asyncHandler(async (req, res) => {
  const review = await adminReviewService.rejectReview(req.params.reviewId, req.body.reason);
  return ApiResponse.success(res, review, 'Review rejected');
});

export const deleteReview = asyncHandler(async (req, res) => {
  const result = await adminReviewService.deleteReview(req.params.reviewId);
  return ApiResponse.success(res, result, result.message);
});
