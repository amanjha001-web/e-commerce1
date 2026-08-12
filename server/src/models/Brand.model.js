import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    logo: {
      url: {
        type: String,
        default: "",
        trim: true,
      },

      publicId: {
        type: String,
        default: "",
        trim: true,
      },
    },

    website: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
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




brandSchema.index({
  isActive: 1,
});

brandSchema.index({
  isFeatured: 1,
});

brandSchema.index({
  sortOrder: 1,
});

brandSchema.index({
  name: "text",
  description: "text",
});


/*                                   Model                                    */


const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);

export default Brand;
