import mongoose from "mongoose";

const { Schema } = mongoose;


/*                       Vendor Earning Schema                                */


const vendorEarningSchema = new Schema(
  {
    
    /*                          References                                    */
    

    vendor: {
      type: Schema.Types.ObjectId,

      ref: "Vendor",

      required: true,

      index: true,
    },

    order: {
      type: Schema.Types.ObjectId,

      ref: "Order",

      required: true,

      index: true,
    },

    orderItem: {
      type: Schema.Types.ObjectId,

      ref: "OrderItem",

      required: true,
    },

    product: {
      type: Schema.Types.ObjectId,

      ref: "Product",

      required: true,
    },

    
    /*                         Amount Details                                 */
    

    grossAmount: {
      type: Number,

      required: true,

      min: 0,
    },

    discountAmount: {
      type: Number,

      default: 0,

      min: 0,
    },

    taxAmount: {
      type: Number,

      default: 0,

      min: 0,
    },

    shippingAmount: {
      type: Number,

      default: 0,

      min: 0,
    },

    commissionAmount: {
      type: Number,

      default: 0,

      min: 0,
    },

    refundAmount: {
      type: Number,

      default: 0,

      min: 0,
    },

    netEarning: {
      type: Number,

      required: true,

      min: 0,
    },

    
    /*                         Transaction Type                               */
    

    type: {
      type: String,

      enum: ["sale", "refund", "adjustment", "bonus"],

      default: "sale",
    },

    
    /*                           Status                                       */
    

    status: {
      type: String,

      enum: ["pending", "available", "withdrawn", "cancelled"],

      default: "pending",

      index: true,
    },

    
    /*                       Settlement Details                               */
    

    availableAt: {
      type: Date,

      default: null,
    },

    payout: {
      type: Schema.Types.ObjectId,

      ref: "Payout",

      default: null,
    },

    paidAt: {
      type: Date,

      default: null,
    },

    
    /*                           Metadata                                     */
    

    description: {
      type: String,

      trim: true,

      maxlength: 500,
    },

    referenceId: {
      type: String,

      trim: true,

      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,

      ref: "User",
    },
  },

  {
    timestamps: true,
  },
);


/*                              Indexes                                       */


vendorEarningSchema.index({
  vendor: 1,

  status: 1,
});

vendorEarningSchema.index({
  vendor: 1,

  createdAt: -1,
});

vendorEarningSchema.index({
  order: 1,
});

vendorEarningSchema.index({
  referenceId: 1,
});


/*                         Pre Validate                                      */


vendorEarningSchema.pre("validate", function (next) {
  if (this.grossAmount !== undefined) {
    this.netEarning = Number(
      (
        this.grossAmount -
        this.discountAmount +
        this.shippingAmount +
        this.taxAmount -
        this.commissionAmount -
        this.refundAmount
      ).toFixed(2),
    );
  }

  next();
});

const VendorEarning = mongoose.model("VendorEarning", vendorEarningSchema);

export default VendorEarning;
