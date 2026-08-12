import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    
    /*                              Owner                                     */
    

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    
    /*                              File Info                                 */
    

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      default: null,
      index: true,
    },

    
    /*                           Storage                                      */
    

    provider: {
      type: String,
      enum: ["CLOUDINARY", "AWS_S3", "LOCAL"],
      default: "CLOUDINARY",
    },

    
    /*                           File Type                                    */
    

    type: {
      type: String,
      enum: ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO", "OTHER"],
      default: "IMAGE",
    },

    category: {
      type: String,
      enum: [
        "PROFILE",
        "PRODUCT",
        "CATEGORY",
        "BRAND",
        "CHAT",
        "DOCUMENT",
        "OTHER",
      ],
      default: "OTHER",
    },

    mimeType: {
      type: String,
      trim: true,
      default: null,
    },

    extension: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },

    
    /*                           Metadata                                     */
    

    metadata: {
      width: Number,
      height: Number,
      duration: Number,
    },

    
    /*                           Soft Delete                                  */
    

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    restoredAt: {
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


fileSchema.index({
  uploadedBy: 1,
  createdAt: -1,
});

fileSchema.index({
  category: 1,
  type: 1,
});

fileSchema.index({
  isDeleted: 1,
});

export default mongoose.model("File", fileSchema);
