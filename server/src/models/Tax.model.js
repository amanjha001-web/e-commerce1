import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    type: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'GST',
    },
    description: {
      type: String,
      trim: true,
      default: '',
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
