import { ProductReview } from '../../models/ProductReview.model.js';
import { parsePagination } from '../../utils/helpers.js';
import { reviewRepository } from '../../repositories/review.repository.js';

export class ReviewCommonService {
  async getProductReviews(productId, params = {}) {
    const { page, limit } = parsePagination(params);
    return reviewRepository.findByProduct(productId, { page, limit });
  }

  async getProductRatingSummary(productId) {
    return reviewRepository.getRatingSummary(productId);
  }
}

export const reviewCommonService = new ReviewCommonService();
export default reviewCommonService;
