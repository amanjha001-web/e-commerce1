import mongoose from "mongoose";

const taxSchema = new mongoose.Schema(
  {
    
    /*                              Basic Info                                    */
    

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    
    /*                              Tax Details                                   */
    

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
      default: null,
    },

    type: {
      type: String,
      enum: ["GST", "VAT", "CGST", "SGST", "IGST", "CESS", "OTHER"],
      default: "GST",
      index: true,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    
    /*                           Location                                         */
    

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    state: {
      type: String,
      default: "ALL",
      trim: true,
    },

    
    /*                           Validity                                         */
    

    effectiveFrom: {
      type: Date,
      default: Date.now,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    
    /*                            Status                                           */
    

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    priority: {
      type: Number,
      default: 1,
      min: 1,
    },

    
    /*                              Metadata                                      */
    

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

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


/*                                  Indexes                                   */


taxSchema.index({
  category: 1,
  isActive: 1,
});

taxSchema.index({
  country: 1,
  state: 1,
});

taxSchema.index({
  effectiveFrom: 1,
  effectiveTo: 1,
});

export default mongoose.model("Tax", taxSchema);
