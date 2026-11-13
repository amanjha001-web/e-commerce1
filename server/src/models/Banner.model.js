import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, default: '' },
    },
    link: {
      type: String,
      default: '',
    },
    position: {
      type: String,
      enum: ['home_hero', 'home_middle', 'home_bottom', 'category_top', 'sidebar'],
      default: 'home_hero',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({ isActive: 1, position: 1 });

export const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
