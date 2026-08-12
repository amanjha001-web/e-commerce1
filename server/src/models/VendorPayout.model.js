import mongoose from "mongoose";

const vendorPayoutSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],

    amount: {
      type: Number,
      required: true,
    },

    commission: {
      type: Number,
      default: 0,
    },

    finalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["BANK_TRANSFER", "UPI"],
      default: "BANK_TRANSFER",
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID", "FAILED"],
      default: "PENDING",
    },

    payoutId: String,

    paidAt: Date,
  },
  {
    timestamps: true,
  },
);

vendorPayoutSchema.index({
  vendor: 1,
  status: 1,
});

export default mongoose.model("VendorPayout", vendorPayoutSchema);
