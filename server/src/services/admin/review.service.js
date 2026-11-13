import { ProductReview } from '../../models/ProductReview.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class AdminReviewService {
  async getReviews(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status) filter.status = params.status;
    if (params.productId) filter.productId = params.productId;

    const [reviews, total] = await Promise.all([
      ProductReview.find(filter)
        .populate('productId', 'name slug images')
        .populate('userId', 'name email avatar')
        .populate('vendorId', 'storeName slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ProductReview.countDocuments(filter),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewById(reviewId) {
    const review = await ProductReview.findById(reviewId)
      .populate('productId')
      .populate('userId', 'name email avatar');

    if (!review) throw ApiError.notFound('Review not found');
    return review;
  }

  async approveReview(reviewId) {
    const review = await ProductReview.findByIdAndUpdate(
      reviewId,
      { status: 'approved' },
      { new: true }
    );
    if (!review) throw ApiError.notFound('Review not found');
    return review;
  }

  async rejectReview(reviewId, reason = '') {
    const review = await ProductReview.findByIdAndUpdate(
      reviewId,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!review) throw ApiError.notFound('Review not found');
    return review;
  }

  async deleteReview(reviewId) {
    const review = await ProductReview.findByIdAndDelete(reviewId);
    if (!review) throw ApiError.notFound('Review not found');
    return { message: 'Review deleted successfully' };
  }
}

export const adminReviewService = new AdminReviewService();
export default adminReviewService;
