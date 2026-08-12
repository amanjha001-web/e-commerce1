import mongoose from "mongoose";

const { Schema } = mongoose;


/*                          Vendor Request Schema                             */


const vendorRequestSchema = new Schema(
  {
    
    /* User                                                                    */
    

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    
    /* Business Information                                                    */
    

    shopName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    logo: {
      url: String,
      publicId: String,
    },

    banner: {
      url: String,
      publicId: String,
    },

    
    /* Contact                                                                 */
    

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    
    /* Address                                                                 */
    

    address: {
      country: String,
      state: String,
      city: String,
      postalCode: String,
      addressLine1: String,
      addressLine2: String,
    },

    
    /* Documents                                                               */
    

    documents: [
      {
        type: {
          type: String,
          enum: ["gst", "pan", "aadhaar", "shop_license", "other"],
        },

        number: String,

        url: String,

        publicId: String,
      },
    ],

    
    /* Bank Details                                                            */
    

    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
      upiId: String,
    },

    
    /* Status                                                                  */
    

    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    
    /* Review                                                                  */
    

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    
    /* Soft Delete                                                             */
    

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
  },
);


/*                                  Indexes                                   */


vendorRequestSchema.index({
  user: 1,
  status: 1,
});

vendorRequestSchema.index({
  shopName: "text",
  businessName: "text",
});

vendorRequestSchema.index({
  createdAt: -1,
});


/*                                 Export                                     */


const VendorRequest = mongoose.model("VendorRequest", vendorRequestSchema);

export default VendorRequest;
