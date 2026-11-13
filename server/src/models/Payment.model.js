import mongoose from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_STATUS_LIST, PAYMENT_METHODS } from '../constants/paymentStatus.constant.js';

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.RAZORPAY,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS_LIST,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    failureReason: {
      type: String,
      default: '',
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ orderId: 1, status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
