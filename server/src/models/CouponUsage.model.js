import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

couponUsageSchema.index({ couponId: 1, userId: 1 });

export const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);
export default CouponUsage;
