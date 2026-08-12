import mongoose from "mongoose";


/*                              Review Schema                                 */


const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },

    images: [
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
      },
    ],

    likes: {
      type: Number,
      default: 0,
      min: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
      min: 0,
    },

    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },

    isApproved: {
      type: Boolean,
      default: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);


/*                                  Indexes                                   */


// One review per product per user
reviewSchema.index(
  {
    user: 1,
    product: 1,
  },
  {
    unique: true,
  },
);

// Product Reviews
reviewSchema.index({
  product: 1,
  createdAt: -1,
});

// User Reviews
reviewSchema.index({
  user: 1,
});

// Rating Filter
reviewSchema.index({
  rating: -1,
});

// Verified Purchase
reviewSchema.index({
  isVerifiedPurchase: 1,
});

// Approval
reviewSchema.index({
  isApproved: 1,
});


/*                                   Model                                    */


const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
