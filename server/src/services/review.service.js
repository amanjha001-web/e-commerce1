import ApiError from "../utils/ApiError.js";

import reviewRepository from "../repositories/review.repository.js";
import productRepository from "../repositories/product.repository.js";
import orderRepository from "../repositories/order.repository.js";

/*                             Helper Functions                               */

const refreshProductRating = async (
  productId,
) => {
  const stats =
    await reviewRepository.getProductReviewStats(
      productId,
    );

  await productRepository.updateProductRating(
    productId,
    Number(
      stats.averageRating.toFixed(1),
    ),
    stats.totalReviews,
  );
};

const validateReview = ({
  rating,
  title,
  comment,
}) => {
  if (!rating) {
    throw new ApiError(
      400,
      "Rating is required",
    );
  }

  if (
    Number(rating) < 1 ||
    Number(rating) > 5
  ) {
    throw new ApiError(
      400,
      "Rating must be between 1 and 5",
    );
  }

  if (
    title &&
    title.length > 100
  ) {
    throw new ApiError(
      400,
      "Title cannot exceed 100 characters",
    );
  }

  if (
    comment &&
    comment.length > 1000
  ) {
    throw new ApiError(
      400,
      "Comment cannot exceed 1000 characters",
    );
  }
};

/*                             Create Review                                  */

const createReview = async (userId, reviewData) => {
  const { product, rating, title, comment } = reviewData;

  validateReview({
    rating,
    title,
    comment,
  });

  const existingProduct = await productRepository.getProductById(product);

  if (!existingProduct) {
    throw new ApiError(404, "Product not found");
  }

  if (!existingProduct.isActive) {
    throw new ApiError(400, "Product is not available");
  }

  const alreadyReviewed = await reviewRepository.getReviewByUserAndProduct(
    userId,
    product,
  );

  if (alreadyReviewed) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  const orders = await orderRepository.getOrdersByUser(userId);

  const purchased = orders.some((order) =>
    order.items.some(
      (item) => item.product._id.toString() === product.toString(),
    ),
  );

  if (!purchased) {
    throw new ApiError(400, "Only purchased products can be reviewed");
  }
  /* ------------------------ Save Review ------------------------ */

  const review = await reviewRepository.createReview({
    user: userId,

    product,

    rating,

    title,

    comment,

    isVerifiedPurchase: true,
  });

  await refreshProductRating(product);

  return review;
};

/*                        Get Product Reviews                                 */

const getProductReviews = async (productId, query = {}) => {
  const {
    page = 1,
    limit = 10,
    rating,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const filter = {
    product: productId,
  };

  if (rating) {
    filter.rating = Number(rating);
  }

  const sort = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  return await reviewRepository.getReviewsByProduct(filter, {
    page: Number(page),
    limit: Number(limit),
    sort,
  });
};

/*                           Get All Reviews                                  */

const getAllReviews = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    rating,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (keyword) {
    filter.$or = [
      {
        title: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        comment: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
    ];
  }

  if (rating) {
    filter.rating = Number(rating);
  }

  const sort = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  return await reviewRepository.getAllReviews(filter, {
    page: Number(page),
    limit: Number(limit),
    sort,
  });
};
/*                             Update Review                                  */

const updateReview = async (
  reviewId,
  user,
  updateData,
) => {
  const review =
    await reviewRepository.getReviewById(
      reviewId,
    );

  if (!review) {
    throw new ApiError(
      404,
      "Review not found",
    );
  }

  if (
    user.role !== "admin" &&
    review.user._id.toString() !==
      user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to update this review",
    );
  }

  validateReview({
    rating:
      updateData.rating ??
      review.rating,
    title:
      updateData.title ??
      review.title,
    comment:
      updateData.comment ??
      review.comment,
  });

  const updatedReview =
    await reviewRepository.updateReview(
      reviewId,
      updateData,
    );

  await refreshProductRating(
    review.product._id,
  );

  return updatedReview;
};

/*                             Delete Review                                  */

const deleteReview = async (
  reviewId,
  user,
) => {
  const review =
    await reviewRepository.getReviewById(
      reviewId,
    );

  if (!review) {
    throw new ApiError(
      404,
      "Review not found",
    );
  }

  if (
    user.role !== "admin" &&
    review.user._id.toString() !==
      user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to delete this review",
    );
  }

  await reviewRepository.deleteReview(
    reviewId,
  );

  await refreshProductRating(
    review.product._id,
  );

  return {
    success: true,
    message:
      "Review deleted successfully",
  };
};

/*                                  Export                                    */

export default {
  createReview,

  getProductReviews,

  getAllReviews,

  updateReview,

  deleteReview,
};