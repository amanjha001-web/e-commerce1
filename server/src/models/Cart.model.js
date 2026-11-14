import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    items: [cartItemSchema],
    coupon: {
      code: String,
      discount: { type: Number, default: 0 },
      discountType: { type: String, enum: ['percentage', 'fixed'] },
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.pre('validate', function (next) {
  if (this.userId && !this.user) {
    this.user = this.userId;
  } else if (this.user && !this.userId) {
    this.userId = this.user;
  }

  // Prevent NaN or null cast failures on numeric fields
  if (this.totalAmount === undefined || this.totalAmount === null || Number.isNaN(Number(this.totalAmount))) {
    this.totalAmount = 0;
  } else {
    this.totalAmount = Number(this.totalAmount);
  }

  if (this.discountAmount === undefined || this.discountAmount === null || Number.isNaN(Number(this.discountAmount))) {
    this.discountAmount = 0;
  } else {
    this.discountAmount = Number(this.discountAmount);
  }

  if (this.finalAmount === undefined || this.finalAmount === null || Number.isNaN(Number(this.finalAmount))) {
    this.finalAmount = Math.max(0, this.totalAmount - this.discountAmount);
  } else {
    this.finalAmount = Number(this.finalAmount);
  }

  if (this.coupon) {
    if (this.coupon.discount === undefined || this.coupon.discount === null || Number.isNaN(Number(this.coupon.discount))) {
      this.coupon.discount = 0;
    } else {
      this.coupon.discount = Number(this.coupon.discount);
    }
  }

  next();
});

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
