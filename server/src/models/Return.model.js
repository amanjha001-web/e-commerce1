import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        quantity: Number,

        reason: String,
      },
    ],

    reason: {
      type: String,
      required: true,
    },

    description: String,

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "APPROVED",
        "PICKUP_SCHEDULED",
        "PICKED",
        "RECEIVED",
        "REJECTED",
        "COMPLETED",
      ],
      default: "REQUESTED",
    },

    images: [String],

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Return", returnSchema);
