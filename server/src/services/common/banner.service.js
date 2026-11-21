import { Banner } from '../../models/Banner.model.js';
import { bannerRepository } from '../../repositories/banner.repository.js';
import { ApiError } from '../../utils/apiError.js';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const assertValidObjectId = (id, label = 'Banner ID') => {
  if (!id || !OBJECT_ID_REGEX.test(String(id).trim())) {
    throw ApiError.badRequest(`Invalid ${label} format`);
  }
};

export class BannerCommonService {
  async getActiveBanners(params = {}) {
    return bannerRepository.findActiveBanners(params.position);
  }

  async getBannerById(id) {
    assertValidObjectId(id);
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
    assertValidObjectId(id);
    const updated = await bannerRepository.incrementImpression(id);
    if (!updated) throw ApiError.notFound('Banner not found');
    return updated;
  }

  async incrementClick(id) {
    assertValidObjectId(id);
    const updated = await bannerRepository.incrementClick(id);
    if (!updated) throw ApiError.notFound('Banner not found');
    return updated;
  }
}

export const bannerCommonService = new BannerCommonService();
export default bannerCommonService;
