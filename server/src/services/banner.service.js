import mongoose from "mongoose";
import slugify from "slugify";

import bannerRepository from "../repositories/banner.repository.js";

import ApiError from "../utils/ApiError.js";


/*                            Create Banner                                   */


const createBanner = async (bannerData) => {
  const slug = slugify(bannerData.title, {
    lower: true,
    strict: true,
    trim: true,
  });

  const existingBanner = await bannerRepository.findBannerBySlug(slug);

  if (existingBanner) {
    throw new ApiError(409, "Banner already exists.");
  }

  return bannerRepository.createBanner({
    ...bannerData,
    slug,
  });
};


/*                           Get Banner By Id                                 */


const getBannerById = async (bannerId) => {
  if (!mongoose.Types.ObjectId.isValid(bannerId)) {
    throw new ApiError(400, "Invalid banner id.");
  }

  const banner = await bannerRepository.findBannerById(bannerId);

  if (!banner) {
    throw new ApiError(404, "Banner not found.");
  }

  return banner;
};


/*                         Get Banner By Slug                                 */


const getBannerBySlug = async (slug) => {
  const banner = await bannerRepository.findBannerBySlug(slug);

  if (!banner) {
    throw new ApiError(404, "Banner not found.");
  }

  return banner;
};


/*                       Get Active Banners                                   */


const getActiveBanners = async (filter = {}) => {
  return bannerRepository.findActiveBanners(filter);
};


/*                         Get All Banners                                    */


const getBanners = async (filter = {}, query = {}) => {
  return bannerRepository.findBanners(filter, query);
};


/*                          Update Banner                                     */


const updateBanner = async (bannerId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(bannerId)) {
    throw new ApiError(400, "Invalid banner id.");
  }

  if (updateData.title) {
    const slug = slugify(updateData.title, {
      lower: true,
      strict: true,
      trim: true,
    });

    const existingBanner = await bannerRepository.findBannerBySlug(slug);

    if (existingBanner && existingBanner._id.toString() !== bannerId) {
      throw new ApiError(409, "Banner title already exists.");
    }

    updateData.slug = slug;
  }

  const banner = await bannerRepository.updateBanner(bannerId, updateData);

  if (!banner) {
    throw new ApiError(404, "Banner not found.");
  }

  return banner;
};


/*                          Increment Click                                   */


const incrementClick = async (bannerId) => {
  if (!mongoose.Types.ObjectId.isValid(bannerId)) {
    throw new ApiError(400, "Invalid banner id.");
  }

  return bannerRepository.incrementClick(bannerId);
};


/*                       Increment Impression                                 */


const incrementImpression = async (bannerId) => {
  if (!mongoose.Types.ObjectId.isValid(bannerId)) {
    throw new ApiError(400, "Invalid banner id.");
  }

  return bannerRepository.incrementImpression(bannerId);
};


/*                          Delete Banner                                     */


const deleteBanner = async (bannerId) => {
  if (!mongoose.Types.ObjectId.isValid(bannerId)) {
    throw new ApiError(400, "Invalid banner id.");
  }

  const banner = await bannerRepository.softDeleteBanner(bannerId);

  if (!banner) {
    throw new ApiError(404, "Banner not found.");
  }

  return banner;
};

export default {
  createBanner,
  getBannerById,
  getBannerBySlug,
  getActiveBanners,
  getBanners,
  updateBanner,
  incrementClick,
  incrementImpression,
  deleteBanner,
};
