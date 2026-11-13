import { ProductReview } from '../../models/ProductReview.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class VendorReviewService {
  async getVendorId(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor._id;
  }

  async getVendorReviews(userId, params = {}) {
    const vendorId = await this.getVendorId(userId);
    const { page, limit, skip } = parsePagination(params);

    const [reviews, total] = await Promise.all([
      ProductReview.find({ vendorId })
        .populate('productId', 'name slug images')
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProductReview.countDocuments({ vendorId }),
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

  async replyToReview(userId, reviewId, reply) {
    const vendorId = await this.getVendorId(userId);
    const review = await ProductReview.findOne({ _id: reviewId, vendorId });
    if (!review) throw ApiError.notFound('Review not found or not for your store');

    review.vendorReply = {
      comment: reply,
      repliedAt: new Date(),
    };
    await review.save();

    return review;
  }
}

export const vendorReviewService = new VendorReviewService();
export default vendorReviewService;
