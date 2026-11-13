import { reviewCommonService } from '../../services/common/review.service.js';
import { ProductReview } from '../../models/ProductReview.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';

export const getProductReviews = asyncHandler(async (req, res) => {
  const result = await reviewCommonService.getProductReviews(req.params.productId, req.query);
  return ApiResponse.success(res, result, 'Product reviews retrieved');
});

export const getProductRatingSummary = asyncHandler(async (req, res) => {
  const summary = await reviewCommonService.getProductRatingSummary(req.params.productId);
  return ApiResponse.success(res, summary, 'Product rating summary');
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  const existing = await ProductReview.findOne({ productId, userId: req.user._id });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  const review = await ProductReview.create({
    productId,
    userId: req.user._id,
    rating,
    title,
    comment,
    status: 'approved',
  });

  return ApiResponse.created(res, review, 'Review created successfully');
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await ProductReview.findOneAndUpdate(
    { _id: req.params.reviewId, userId: req.user._id },
    req.body,
    { new: true }
  );
  if (!review) throw ApiError.notFound('Review not found');
  return ApiResponse.success(res, review, 'Review updated');
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await ProductReview.findOneAndDelete({
    _id: req.params.reviewId,
    userId: req.user._id,
  });
  if (!review) throw ApiError.notFound('Review not found');
  return ApiResponse.success(res, null, 'Review deleted');
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await ProductReview.find({ userId: req.user._id })
    .populate('productId', 'name slug images price')
    .sort({ createdAt: -1 });
  return ApiResponse.success(res, reviews, 'Your reviews');
});

export const markHelpful = asyncHandler(async (req, res) => {
  const review = await ProductReview.findById(req.params.reviewId);
  if (!review) throw ApiError.notFound('Review not found');

  if (!review.helpfulUsers.includes(req.user._id)) {
    review.helpfulUsers.push(req.user._id);
    review.helpfulCount = review.helpfulUsers.length;
    await review.save();
  }

  return ApiResponse.success(res, { helpfulCount: review.helpfulCount }, 'Marked as helpful');
});

export const removeHelpful = asyncHandler(async (req, res) => {
  const review = await ProductReview.findById(req.params.reviewId);
  if (!review) throw ApiError.notFound('Review not found');

  review.helpfulUsers = review.helpfulUsers.filter(
    (u) => u.toString() !== req.user._id.toString()
  );
  review.helpfulCount = review.helpfulUsers.length;
  await review.save();

  return ApiResponse.success(res, { helpfulCount: review.helpfulCount }, 'Removed helpful mark');
});
