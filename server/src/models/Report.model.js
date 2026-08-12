import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    
    /*                              Reporter                                  */
    

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    
    /*                            Target                                      */
    

    targetType: {
      type: String,
      enum: ["PRODUCT", "USER", "ORDER", "VENDOR", "REVIEW"],
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    
    /*                            Report Info                                 */
    

    reason: {
      type: String,
      enum: [
        "FAKE_PRODUCT",
        "WRONG_INFORMATION",
        "FRAUD",
        "ABUSE",
        "SPAM",
        "POOR_QUALITY",
        "OTHER",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],

    
    /*                            Management                                  */
    

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"],
      default: "OPEN",
      index: true,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


/*                                  Indexes                                   */


// Admin dashboard sorting
reportSchema.index({
  status: 1,
  createdAt: -1,
});

// Target based reports
reportSchema.index({
  targetType: 1,
  targetId: 1,
});

// Prevent duplicate open reports
reportSchema.index(
  {
    reportedBy: 1,
    targetType: 1,
    targetId: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("Report", reportSchema);
