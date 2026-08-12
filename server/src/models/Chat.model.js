import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Current active socket connection
    socketId: {
      type: String,
      trim: true,
      default: null,
    },

    // User online/offline status
    online: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Last activity time
    lastSeen: {
      type: Date,
      default: null,
    },

    // Device information
    deviceInfo: {
      browser: {
        type: String,
        trim: true,
        default: null,
      },

      os: {
        type: String,
        trim: true,
        default: null,
      },

      platform: {
        type: String,
        trim: true,
        default: null,
      },

      device: {
        type: String,
        trim: true,
        default: null,
      },

      ip: {
        type: String,
        trim: true,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


/*                                  Indexes                                   */


chatSchema.index({ conversation: 1, user: 1 }, { unique: true });

chatSchema.index({ user: 1, online: 1 });

chatSchema.index({ lastSeen: -1 });

export default mongoose.model("Chat", chatSchema);
