import mongoose from 'mongoose';
import { VENDOR_STATUS, VENDOR_STATUS_LIST } from '../constants/vendorStatus.constant.js';

const vendorRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    businessType: {
      type: String,
      default: 'individual',
    },
    taxId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: VENDOR_STATUS_LIST,
      default: VENDOR_STATUS.PENDING,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

vendorRequestSchema.index({ userId: 1, status: 1 });
vendorRequestSchema.index({ status: 1 });

export const VendorRequest = mongoose.model('VendorRequest', vendorRequestSchema);
export default VendorRequest;
