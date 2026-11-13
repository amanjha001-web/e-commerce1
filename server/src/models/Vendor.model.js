import mongoose from 'mongoose';
import { VENDOR_STATUS, VENDOR_STATUS_LIST } from '../constants/vendorStatus.constant.js';

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    banner: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    businessDetails: {
      taxNumber: String,
      businessLicense: String,
      bankAccount: {
        accountHolderName: String,
        accountNumber: String,
        bankName: String,
        ifscCode: String,
        routingNumber: String,
      },
    },
    commissionRate: {
      type: Number,
      default: 10, // percentage e.g. 10%
    },
    status: {
      type: String,
      enum: VENDOR_STATUS_LIST,
      default: VENDOR_STATUS.PENDING,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ status: 1 });

export const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
