import mongoose from "mongoose";

const shippingZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    countries: [
      {
        type: String,
      },
    ],

    states: [
      {
        type: String,
      },
    ],

    pincodes: [
      {
        type: String,
      },
    ],

    shippingCharge: {
      type: Number,
      default: 0,
    },

    freeShippingAbove: {
      type: Number,
      default: 0,
    },

    estimatedDays: {
      min: {
        type: Number,
        default: 2,
      },

      max: {
        type: Number,
        default: 7,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

shippingZoneSchema.index({
  states: 1,
  isActive: 1,
});

export default mongoose.model("ShippingZone", shippingZoneSchema);
