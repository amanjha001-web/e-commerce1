import mongoose from "mongoose";


/*                            Wishlist Schema                                 */


const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);


/*                                  Indexes                                   */


// Fast User Lookup


// Fast Product Lookup
wishlistSchema.index({
  products: 1,
});


/*                          Pre Save Middleware                               */


wishlistSchema.pre("save", function (next) {
  this.totalItems = this.products.length;
  next();
});


/*                                   Model                                    */


const Wishlist =
  mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
