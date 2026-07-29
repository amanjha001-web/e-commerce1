import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);
const specificationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      trim: true,
    },

    value: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    thumbnail: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    images: {
      type: [imageSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: "Discount price cannot be greater than actual price.",
      },
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    sold: {
      type: Number,
      default: 0,
      min: 0,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    specifications: {
      type: [specificationSchema],
      default: [],
    },

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

    featured: {
      type: Boolean,
      default: false,
    },

    flashSale: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    trending: {
      type: Boolean,
      default: false,
    },

    newArrival: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    seoTitle: {
      type: String,
      trim: true,
      default: "",
    },

    seoDescription: {
      type: String,
      trim: true,
      default: "",
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

productSchema.pre("save", function (next) {
  if (!this.sku) {
    this.sku = "SKU-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  }

  next();
});

productSchema.index({ name: "text", description: "text" });

productSchema.index({
  category: 1,
  brand: 1,
});

productSchema.index({
  price: 1,
});

productSchema.index({
  averageRating: -1,
});

productSchema.index({
  createdAt: -1,
});

productSchema.index({
  featured: 1,
});

productSchema.index({
  flashSale: 1,
});

productSchema.index({
  bestSeller: 1,
});

productSchema.index({
  trending: 1,
});

productSchema.index({
  newArrival: 1,
});

productSchema.virtual("discountPercentage").get(function () {
  if (this.discountPrice <= 0 || this.discountPrice >= this.price) {
    return 0;
  }

  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

productSchema.set("toJSON", {
  virtuals: true,
});

productSchema.set("toObject", {
  virtuals: true,
});

const Product = mongoose.model("Product", productSchema);

export default Product;