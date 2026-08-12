import mongoose from "mongoose";

const { Schema } = mongoose;


/*                         Commission Schema                                  */


const commissionSchema = new Schema(
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

   
    /*                           Amount Details                               */
   

    saleAmount: {
      type: Number,

      required: true,

      min: 0,
    },

    commissionRate: {
      type: Number,

      required: true,

      min: 0,

      max: 100,
    },

    commissionAmount: {
      type: Number,

      required: true,

      min: 0,
    },

    vendorAmount: {
      type: Number,

      required: true,

      min: 0,
    },

   
    /*                           Status                                       */
   

    status: {
      type: String,

      enum: ["pending", "approved", "paid", "cancelled"],

      default: "pending",

      index: true,
    },

   
    /*                          Settlement                                    */
   

    paidAt: {
      type: Date,

      default: null,
    },

    payout: {
      type: Schema.Types.ObjectId,

      ref: "Payout",

      default: null,
    },

   
    /*                         Commission Source                              */
   

    type: {
      type: String,

      enum: ["product_sale", "subscription", "other"],

      default: "product_sale",
    },

   
    /*                          Metadata                                      */
   

    notes: {
      type: String,

      trim: true,

      maxlength: 500,
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


commissionSchema.index({
  vendor: 1,

  status: 1,
});

commissionSchema.index({
  order: 1,
});

commissionSchema.index({
  createdAt: -1,
});


/*                         Pre Save Calculation                              */


commissionSchema.pre("validate", function (next) {
  if (this.saleAmount && this.commissionRate) {
    this.commissionAmount = Number(
      ((this.saleAmount * this.commissionRate) / 100).toFixed(2),
    );

    this.vendorAmount = Number(
      (this.saleAmount - this.commissionAmount).toFixed(2),
    );
  }

  next();
});

const Commission = mongoose.model("Commission", commissionSchema);

export default Commission;
