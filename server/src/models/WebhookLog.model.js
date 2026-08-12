import mongoose from "mongoose";

const webhookLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
    },

    event: {
      type: String,
      required: true,
    },

    payload: {
      type: Object,
      required: true,
    },

    signature: String,

    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSED", "FAILED"],
      default: "RECEIVED",
    },

    errorMessage: String,

    processedAt: Date,
  },
  {
    timestamps: true,
  },
);

webhookLogSchema.index({
  provider: 1,
  event: 1,
});

export default mongoose.model("WebhookLog", webhookLogSchema);
