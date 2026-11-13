import mongoose from 'mongoose';

const vendorPayoutSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payout amount must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      default: 'BANK_TRANSFER',
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
    transactionReference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

vendorPayoutSchema.index({ vendorId: 1, status: 1 });

export const VendorPayout = mongoose.model('VendorPayout', vendorPayoutSchema);
export default VendorPayout;
