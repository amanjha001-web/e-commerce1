import mongoose from "mongoose";

const settingHistorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      default: "GENERAL",
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      enum: ["CREATED", "UPDATED"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

settingHistorySchema.index({ key: 1, createdAt: -1 });
settingHistorySchema.index({ createdAt: -1 });

export default mongoose.model("SettingHistory", settingHistorySchema);
