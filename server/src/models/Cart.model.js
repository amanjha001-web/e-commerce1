import mongoose from "mongoose";


/*                            Cart Item Schema                                */


const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    // Snapshot price when added to cart
    priceAtPurchase: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);


/*                               Cart Schema                                  */


const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: function (items) {
          const productIds = items.map((item) => item.product.toString());

          return productIds.length === new Set(productIds).size;
        },
        message: "Duplicate products are not allowed in cart.",
      },
    },

    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  },
);




/*                                   Model                                    */


const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

export default Cart;
