import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Tax rate cannot be negative'],
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
    state: {
      type: String,
      default: 'ALL',
    },
    isCompound: {
      type: Boolean,
      default: false,
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

export const Tax = mongoose.model('Tax', taxSchema);
export default Tax;
