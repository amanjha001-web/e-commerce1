import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    type: {
      type: String,
      enum: [
        "PAYMENT",
        "REFUND",
        "COMMISSION",
        "PAYOUT",
        "WALLET_CREDIT",
        "WALLET_DEBIT",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentGateway: {
      type: String,
      enum: ["RAZORPAY", "STRIPE", "COD", "OTHER"],
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({
  vendor: 1,
  createdAt: -1,
});

export default mongoose.model("Transaction", transactionSchema);
