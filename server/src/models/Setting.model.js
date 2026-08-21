import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    /*                               Setting Key                                  */

    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
      index: true,
    },

    /*                              Setting Value                                 */

    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    type: {
      type: String,
      enum: ["STRING", "NUMBER", "BOOLEAN", "OBJECT", "ARRAY"],
      default: "STRING",
    },

    /*                                Metadata                                    */

    category: {
      type: String,
      enum: [
        "GENERAL",
        "PAYMENT",
        "ORDER",
        "SHIPPING",
        "EMAIL",
        "SMS",
        "SECURITY",
        "SEO",
        "SOCIAL",
        "OTHER",
      ],
      default: "GENERAL",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    isEditable: {
      type: Boolean,
      default: true,
    },

    /*                                Audit                                       */

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*                              Soft Delete                                   */

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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

/*                                   Indexes                                  */

settingSchema.index({
  category: 1,
  isDeleted: 1,
});

settingSchema.index({
  isPublic: 1,
});

export default mongoose.model("Setting", settingSchema);
