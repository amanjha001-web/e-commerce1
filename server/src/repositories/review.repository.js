import { BaseRepository } from './base.repository.js';
import { ProductReview } from '../models/ProductReview.model.js';

export class ReviewRepository extends BaseRepository {
  constructor() {
    super(ProductReview);
  }

  async findByProduct(productId, pagination = {}) {
    return this.paginate(
      { productId, status: 'approved' },
      {
        ...pagination,
        populate: { path: 'userId', select: 'name avatar' },
      }
    );
  }

  async getRatingSummary(productId) {
    const stats = await this.model.aggregate([
      { $match: { productId: new (ProductReview.base.Types.ObjectId)(productId), status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalReviews = 0;
    let sumRating = 0;

    stats.forEach((s) => {
      breakdown[s._id] = s.count;
      totalReviews += s.count;
      sumRating += s._id * s.count;
    });

    const averageRating = totalReviews > 0 ? (sumRating / totalReviews).toFixed(1) : 0;

    return {
      averageRating: Number(averageRating),
      totalReviews,
      breakdown,
    };
  }
}

export const reviewRepository = new ReviewRepository();
export default reviewRepository;
