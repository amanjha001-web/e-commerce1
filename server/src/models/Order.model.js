import mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_STATUS_LIST } from '../constants/orderStatus.constant.js';
import { PAYMENT_STATUS, PAYMENT_STATUS_LIST, PAYMENT_METHODS } from '../constants/paymentStatus.constant.js';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      apartment: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.RAZORPAY,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_LIST,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUS_LIST,
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    coupon: {
      code: String,
      discount: Number,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    tracking: {
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
      estimatedDeliveryDate: Date,
    },
    cancellation: {
      reason: String,
      cancelledAt: Date,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    returnRequest: {
      reason: String,
      status: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
      requestedAt: Date,
      actionedAt: Date,
      actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: String,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ 'items.vendorId': 1 });

export const Order = mongoose.model('Order', orderSchema);
export default Order;
