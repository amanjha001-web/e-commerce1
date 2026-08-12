import mongoose from "mongoose";


/*                            Order Item Schema                               */


const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    sku: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    priceAtPurchase: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    vendorAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    platformCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);


/*                         Shipping Address Schema                            */


const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);


/*                              Order Schema                                  */


const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item.",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    /*                   Pricing                                   */

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    /*                    Coupon                   -- */

    coupon: {
      code: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      discountType: {
        type: String,
        default: "",
      },

      discountValue: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    /*                 Payment                 */

    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY", "UPI", "CARD", "NETBANKING", "WALLET", "EMI"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },

    razorpaySignature: {
      type: String,
      default: "",
      trim: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    /*                    Refund                   -- */

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundReason: {
      type: String,
      default: "",
      trim: true,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    /*                         Order Status                         */

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
        "Refunded",
      ],
      default: "Pending",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    /*                  Shipping Info                         */

    trackingNumber: {
      type: String,
      default: "",
      trim: true,
    },

    courierPartner: {
      type: String,
      default: "",
      trim: true,
    },

    expectedDeliveryDate: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    /* -------------------------- Status History                         */

    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },

        note: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);


/*                                  Indexes                                   */




orderSchema.index({
  user: 1,
});

orderSchema.index({
  orderStatus: 1,
});

orderSchema.index({
  paymentStatus: 1,
});

orderSchema.index({
  createdAt: -1,
});

orderSchema.index({
  "items.vendor": 1,
});

orderSchema.index({
  razorpayOrderId: 1,
});

orderSchema.index({
  razorpayPaymentId: 1,
});

orderSchema.index({
  trackingNumber: 1,
});


/*                         Generate Order Number                              */


orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber =
      "ORD-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);

    this.statusHistory.push({
      status: this.orderStatus,
      note: "Order created",
    });
  }

  next();
});


/*                                   Model                                    */


const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;