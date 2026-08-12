import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
    },

    module: {
      type: String,
      required: true,
    },

    oldData: Object,

    newData: Object,

    ipAddress: String,

    userAgent: String,
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({
  user: 1,
  createdAt: -1,
});

export default mongoose.model("AuditLog", auditLogSchema);
