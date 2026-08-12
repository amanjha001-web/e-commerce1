import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    activity: {
      type: String,
      required: true,
    },

    description: String,

    metadata: {
      type: Object,
      default: {},
    },

    ip: String,

    device: String,
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({
  user: 1,
  createdAt: -1,
});

export default mongoose.model("ActivityLog", activityLogSchema);
