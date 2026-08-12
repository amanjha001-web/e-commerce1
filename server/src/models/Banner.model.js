import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    
    /*                               Banner Info                                 */
    

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    
    /*                                   Images                                  */
    

    desktopImage: {
      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    mobileImage: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    tabletImage: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    
    /*                               Redirect                                     */
    

    redirectType: {
      type: String,
      enum: [
        "PRODUCT",
        "CATEGORY",
        "BRAND",
        "COLLECTION",
        "SHOP",
        "EXTERNAL",
        "NONE",
      ],
      default: "NONE",
      index: true,
    },

    redirectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    redirectUrl: {
      type: String,
      trim: true,
      default: "",
    },

    
    /*                                 Display                                   */
    

    position: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    section: {
      type: String,
      enum: [
        "HOME_HERO",
        "HOME_MIDDLE",
        "HOME_BOTTOM",
        "CATEGORY",
        "PRODUCT",
        "APP",
      ],
      default: "HOME_HERO",
      index: true,
    },

    device: {
      type: String,
      enum: ["ALL", "DESKTOP", "MOBILE", "TABLET"],
      default: "ALL",
    },

    
    /*                                  Status                                   */
    

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SCHEDULED"],
      default: "ACTIVE",
      index: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    
    /*                               Analytics                                   */
    

    clickCount: {
      type: Number,
      default: 0,
    },

    impressionCount: {
      type: Number,
      default: 0,
    },

    
    /*                                  Audit                                    */
    

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    
    /*                              Soft Delete                                  */
    

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


bannerSchema.index({
  status: 1,
  section: 1,
  position: 1,
});

bannerSchema.index({
  startDate: 1,
  endDate: 1,
});

bannerSchema.index({
  isDeleted: 1,
  status: 1,
});

export default mongoose.model("Banner", bannerSchema);
