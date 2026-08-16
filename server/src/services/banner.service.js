import mongoose from "mongoose";
import slugify from "slugify";

import bannerRepository from "../repositories/banner.repository.js";

import ApiError from "../utils/ApiError.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";


/*                            Create Banner                                   */


const createBanner = async (bannerData) => {
  const { files, ...data } = bannerData;

  const slug = slugify(data.title, {
    lower: true,
    strict: true,
    trim: true,
  });

  const existingBanner = await bannerRepository.findBannerBySlug(slug);

  if (existingBanner) {
    throw new ApiError(409, "Banner already exists.");
  }

  const desktopFile = files?.desktopImage?.[0];

  if (!desktopFile) {
    throw new ApiError(400, "Desktop banner image is required.");
  }

  const desktopUpload = await uploadOnCloudinary(
    desktopFile.path,
    "shopsphere/banners",
  );

  const bannerDataToSave = {
    ...data,

    slug,

    desktopImage: {
      url: desktopUpload.secure_url,
      publicId: desktopUpload.public_id,
    },
  };

  const mobileFile = files?.mobileImage?.[0];

  if (mobileFile) {
    const mobileUpload = await uploadOnCloudinary(
      mobileFile.path,
      "shopsphere/banners",
    );

    bannerDataToSave.mobileImage = {
      url: mobileUpload.secure_url,
      publicId: mobileUpload.public_id,
    };
  }

  const tabletFile = files?.tabletImage?.[0];

  if (tabletFile) {
    const tabletUpload = await uploadOnCloudinary(
      tabletFile.path,
      "shopsphere/banners",
    );

    bannerDataToSave.tabletImage = {
      url: tabletUpload.secure_url,
      publicId: tabletUpload.public_id,
    };
  }

  return bannerRepository.createBanner(bannerDataToSave);
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
