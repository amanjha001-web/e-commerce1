import { BaseRepository } from './base.repository.js';
import { Banner } from '../models/Banner.model.js';

export class BannerRepository extends BaseRepository {
  constructor() {
    super(Banner);
  }

  async findActiveBanners(position = null) {
    const now = new Date();
    const query = {
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    };
    if (position) {
      query.position = position;
    }
    return this.model.find(query).sort({ sortOrder: 1, createdAt: -1 });
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
