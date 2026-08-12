import mongoose from "mongoose";


/*                             Social Links                                   */


const socialLinksSchema = new mongoose.Schema(
  {
    facebook: {
      type: String,
      default: "",
      trim: true,
    },

    instagram: {
      type: String,
      default: "",
      trim: true,
    },

    twitter: {
      type: String,
      default: "",
      trim: true,
    },

    youtube: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);


/*                              Bank Details                                  */


const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      default: "",
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    ifscCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);


/*                              Vendor Schema                                 */


const vendorSchema = new mongoose.Schema(
  {
    
    /*                                User                                    */
    

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    
    /*                              Shop Info                                 */
    

    shopName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },

    shopSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    shopDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    
    /*                                Logo                                    */
    

    logo: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    
    /*                               Banner                                   */
    

    banner: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    
    /*                            Contact Info                                */
    

    website: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    
    /*                           Business Info                                */
    

    gstNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    panNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    
    /*                              Address                                   */
    

    address: {
      country: {
        type: String,
        default: "India",
        trim: true,
      },

      state: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
        trim: true,
      },

      postalCode: {
        type: String,
        default: "",
        trim: true,
      },

      addressLine1: {
        type: String,
        default: "",
        trim: true,
      },

      addressLine2: {
        type: String,
        default: "",
        trim: true,
      },
    },

    
    /*                            Statistics                                  */
    

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProducts: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    
    /*                           Social Links                                 */
    

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    
    /*                            Bank Details                                */
    

    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },

    
    /*                              Status                                    */
    

    isVerified: {
      type: Boolean,
      default: false,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    
    /*                            Soft Delete                                 */
    

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


vendorSchema.index({
  isApproved: 1,
});

vendorSchema.index({
  isVerified: 1,
});

vendorSchema.index({
  isActive: 1,
});

vendorSchema.index({
  averageRating: -1,
});

vendorSchema.index({
  createdAt: -1,
});


/*                                   Model                                    */


const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default Vendor;
