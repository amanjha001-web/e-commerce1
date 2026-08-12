import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema(
  {
    
    /*                              References                                    */
    

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    
    /*                             Courier Details                                */
    

    courier: {
      name: {
        type: String,
        trim: true,
        default: "",
      },

      trackingId: {
        type: String,
        trim: true,
        index: true,
      },

      trackingUrl: {
        type: String,
        trim: true,
        default: "",
      },

      awbNumber: {
        type: String,
        trim: true,
        default: "",
      },
    },

    
    /*                                 Status                                     */
    

    status: {
      type: String,
      enum: [
        "PENDING",
        "READY_TO_SHIP",
        "PACKED",
        "PICKED_UP",
        "SHIPPED",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "RETURNED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    
    /*                                  Dates                                     */
    

    pickupDate: Date,

    shippedDate: Date,

    estimatedDelivery: Date,

    deliveredDate: Date,

    cancelledAt: Date,

    returnedAt: Date,

    
    /*                             Shipping Address                               */
    

    shippingAddress: {
      name: String,

      phone: String,

      email: String,

      addressLine1: String,

      addressLine2: String,

      landmark: String,

      city: String,

      state: String,

      country: {
        type: String,
        default: "India",
      },

      pincode: String,
    },

    
    /*                           Shipment History                                 */
    

    history: [
      {
        status: {
          type: String,
          required: true,
        },

        message: {
          type: String,
          trim: true,
        },

        location: {
          type: String,
          default: "",
        },

        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    
    /*                                Metadata                                    */
    

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


/*                                  Indexes                                   */


shipmentSchema.index({
  vendor: 1,
  status: 1,
});

shipmentSchema.index({
  "courier.trackingId": 1,
});

shipmentSchema.index({
  estimatedDelivery: 1,
});

shipmentSchema.index({
  deliveredDate: -1,
});

export default mongoose.model("Shipment", shipmentSchema);
