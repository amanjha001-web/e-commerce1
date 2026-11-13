import mongoose from 'mongoose';

const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

recentlyViewedSchema.index({ userId: 1, productId: 1 }, { unique: true });
recentlyViewedSchema.index({ userId: 1, viewedAt: -1 });

export const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);
export default RecentlyViewed;
