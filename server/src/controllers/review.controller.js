import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import reviewService from "../services/review.service.js";

/*                              Create Review                                 */

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review created successfully"));
});

/*                         Get Product Reviews                                */

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getProductReviews(req.params.productId);

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

/*                            Get All Reviews                                 */

const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getAllReviews();

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "All reviews fetched successfully"));
});

/*                            Update Review                                   */

const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(
    req.params.id,
    req.user._id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

/*                            Delete Review                                   */

const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user._id, req.user.role);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted successfully"));
});

export default{
  createReview,
  getProductReviews,
  getAllReviews,
  updateReview,
  deleteReview,
};
