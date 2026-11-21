import mongoose from 'mongoose';

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
        default: 'India',
      },
    ],
    states: [
      {
        type: String,
      },
    ],
    postalCodes: [
      {
        type: String,
      },
    ],
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    freeShippingThreshold: {
      type: Number,
      default: 0, // 0 means no free shipping
    },
    estimatedDays: {
      min: { type: Number, default: 2, min: 1 },
      max: { type: Number, default: 5, min: 1 },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);
export default ShippingZone;
