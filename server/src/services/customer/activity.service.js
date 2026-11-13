import { RecentlyViewed } from '../../models/RecentlyViewed.model.js';
import { ProductReview } from '../../models/ProductReview.model.js';
import { Order } from '../../models/Order.model.js';

export class CustomerActivityService {
  async getRecentlyViewed(userId) {
    const list = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(20)
      .populate({
        path: 'productId',
        select: 'name slug price images rating numReviews category brand',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'brand', select: 'name slug' },
        ],
      });

    return list.map((item) => item.productId).filter(Boolean);
  }

  async getMyReviews(userId) {
    return ProductReview.find({ userId })
      .populate('productId', 'name slug images price')
      .sort({ createdAt: -1 });
  }

  async getActivitySummary(userId) {
    const [ordersCount, reviewsCount, recentViewsCount] = await Promise.all([
      Order.countDocuments({ userId }),
      ProductReview.countDocuments({ userId }),
      RecentlyViewed.countDocuments({ userId }),
    ]);

    return {
      ordersCount,
      reviewsCount,
      recentViewsCount,
    };
  }
}

export const customerActivityService = new CustomerActivityService();
export default customerActivityService;
