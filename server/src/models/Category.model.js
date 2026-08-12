import mongoose from "mongoose";


/*                             Category Schema                                */


const categorySchema = new mongoose.Schema(
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

    image: {
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

    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
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




categorySchema.index({
  parentCategory: 1,
});

categorySchema.index({
  isActive: 1,
});

categorySchema.index({
  isFeatured: 1,
});

categorySchema.index({
  sortOrder: 1,
});

categorySchema.index({
  name: "text",
  description: "text",
});


/*                                   Model                                    */


const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
