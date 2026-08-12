import mongoose from "mongoose";


/*                               Image Schema                                 */


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
      maxlength: 200,
    },
  },
  {
    _id: false,
  },
);


/*                          Specification Schema                              */


const specificationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
  },
  {
    _id: false,
  },
);


/*                              Product Schema                                */


const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
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
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
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
        trim: true,
      },

      publicId: {
        type: String,
        default: "",
        trim: true,
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
      default: "",
      trim: true,
      maxlength: 200,
    },

    seoDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
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

/*                             Generate SKU                                   */


productSchema.pre("save", function (next) {
  if (!this.sku) {
    this.sku =
      "SKU-" +
      Date.now() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);
  }

  next();
});


/*                                 Virtuals                                   */


// Discount Percentage
productSchema.virtual("discountPercentage").get(function () {
  if (
    this.discountPrice <= 0 ||
    this.discountPrice >= this.price
  ) {
    return 0;
  }

  return Math.round(
    ((this.price - this.discountPrice) / this.price) * 100,
  );
});

// Final Selling Price
productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice > 0
    ? this.discountPrice
    : this.price;
});

// Stock Status
productSchema.virtual("stockStatus").get(function () {
  if (this.stock <= 0) {
    return "OUT_OF_STOCK";
  }

  if (this.stock <= 5) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
});


/*                                  Indexes                                   */


// Text Search
productSchema.index({
  name: "text",
  shortDescription: "text",
  description: "text",
});

// Category + Brand
productSchema.index({
  category: 1,
  brand: 1,
});

// Vendor
productSchema.index({
  vendor: 1,
});

// Price Filter
productSchema.index({
  price: 1,
});

// Rating Sort
productSchema.index({
  averageRating: -1,
});

// Latest Products
productSchema.index({
  createdAt: -1,
});

// Product Status
productSchema.index({
  status: 1,
});

// Active Products
productSchema.index({
  isActive: 1,
});

// Featured
productSchema.index({
  featured: 1,
});

// Flash Sale
productSchema.index({
  flashSale: 1,
});

// Best Seller
productSchema.index({
  bestSeller: 1,
});

// Trending
productSchema.index({
  trending: 1,
});

// New Arrival
productSchema.index({
  newArrival: 1,
});

// Stock
productSchema.index({
  stock: 1,
});


/*                           Include Virtuals                                 */


productSchema.set("toJSON", {
  virtuals: true,
});

productSchema.set("toObject", {
  virtuals: true,
});


/*                                   Model                                    */


const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;