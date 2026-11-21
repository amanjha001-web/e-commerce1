import { BaseRepository } from './base.repository.js';
import { Banner } from '../models/Banner.model.js';

export class BannerRepository extends BaseRepository {
  constructor() {
    super(Banner);
  }

  async findActiveBanners(position = null) {
    const now = new Date();
    const andConditions = [
      { isActive: { $ne: false } },
      {
        $or: [
          { startDate: { $exists: false } },
          { startDate: null },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      },
    ];

    if (position) {
      andConditions.push({ position: String(position).trim().toLowerCase() });
    }

    return this.model
      .find({ $and: andConditions })
      .sort({ sortOrder: 1, createdAt: -1 });
  }

  async incrementImpression(bannerId) {
    return this.model.findByIdAndUpdate(bannerId, { $inc: { impressions: 1 } }, { new: true });
  }

  async incrementClick(bannerId) {
    return this.model.findByIdAndUpdate(bannerId, { $inc: { clicks: 1 } }, { new: true });
  }
}

export const bannerRepository = new BannerRepository();
export default bannerRepository;
