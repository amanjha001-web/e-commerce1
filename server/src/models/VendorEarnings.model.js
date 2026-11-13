import mongoose from 'mongoose';

const vendorEarningsSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalCommission: {
      type: Number,
      default: 0,
    },
    netEarnings: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const VendorEarnings = mongoose.model('VendorEarnings', vendorEarningsSchema);
export default VendorEarnings;
