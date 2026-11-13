import { Banner } from '../../models/Banner.model.js';
import { bannerRepository } from '../../repositories/banner.repository.js';
import { ApiError } from '../../utils/apiError.js';

export class BannerCommonService {
  async getActiveBanners(params = {}) {
    return bannerRepository.findActiveBanners(params.position);
  }

  async getBannerById(id) {
    const banner = await Banner.findById(id);
    if (!banner) throw ApiError.notFound('Banner not found');
    return banner;
  }

  async getBannerBySlug(slug) {
    const banner = await Banner.findOne({ slug });
    if (!banner) throw ApiError.notFound('Banner not found');
    return banner;
  }

  async incrementImpression(id) {
    return bannerRepository.incrementImpression(id);
  }

  async incrementClick(id) {
    return bannerRepository.incrementClick(id);
  }
}

export const bannerCommonService = new BannerCommonService();
export default bannerCommonService;
