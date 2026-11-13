import { Banner } from '../../models/Banner.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, slugify } from '../../utils/helpers.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

export class AdminBannerService {
  async getAll(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.isActive !== undefined) {
      filter.isActive = params.isActive === 'true';
    }
    if (params.position) filter.position = params.position;

    const [banners, total] = await Promise.all([
      Banner.find(filter).sort(sort).skip(skip).limit(limit),
      Banner.countDocuments(filter),
    ]);

    return {
      banners,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(bannerId) {
    const banner = await Banner.findById(bannerId);
    if (!banner) throw ApiError.notFound('Banner not found');
    return banner;
  }

  async create(bannerData, file) {
    let image = bannerData.image;
    if (file) {
      const uploaded = await uploadToCloudinary(file.buffer, 'banners');
      image = { url: uploaded.url, publicId: uploaded.publicId };
    }

    if (!image || !image.url) {
      image = { url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80', publicId: '' };
    }

    const slug = `${slugify(bannerData.title)}-${Math.floor(Math.random() * 1000)}`;

    return Banner.create({
      ...bannerData,
      image,
      slug,
    });
  }

  async update(bannerId, bannerData, file) {
    const banner = await Banner.findById(bannerId);
    if (!banner) throw ApiError.notFound('Banner not found');

    if (file) {
      if (banner.image?.publicId) {
        await deleteFromCloudinary(banner.image.publicId).catch(() => {});
      }
      const uploaded = await uploadToCloudinary(file.buffer, 'banners');
      bannerData.image = { url: uploaded.url, publicId: uploaded.publicId };
    }

    const updated = await Banner.findByIdAndUpdate(bannerId, bannerData, {
      new: true,
      runValidators: true,
    });
    return updated;
  }

  async delete(bannerId) {
    const banner = await Banner.findByIdAndDelete(bannerId);
    if (!banner) throw ApiError.notFound('Banner not found');

    if (banner.image?.publicId) {
      await deleteFromCloudinary(banner.image.publicId).catch(() => {});
    }

    return { message: 'Banner deleted successfully' };
  }
}

export const adminBannerService = new AdminBannerService();
export default adminBannerService;
