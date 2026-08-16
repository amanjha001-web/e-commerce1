import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import bannerService from "../services/banner.service.js";

/*                             Create Banner                                  */

const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner({
    ...req.body,
    files: req.files,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, banner, "Banner created successfully."));
});

/*                           Get Banner By Id                                 */

const getBannerById = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  const banner = await bannerService.getBannerById(bannerId);

  return res.json(new ApiResponse(200, banner, "Banner fetched successfully."));
});

/*                         Get Banner By Slug                                 */

const getBannerBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const banner = await bannerService.getBannerBySlug(slug);

  return res.json(new ApiResponse(200, banner, "Banner fetched successfully."));
});

/*                        Get Active Banners                                  */

const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await bannerService.getActiveBanners(req.query);

  return res.json(
    new ApiResponse(200, banners, "Active banners fetched successfully."),
  );
});

/*                         Get All Banners                                    */

const getAllBanners = asyncHandler(async (req, res) => {
  const { page, limit, sort, ...filter } = req.query;

  const banners = await bannerService.getBanners(filter, {
    page,
    limit,
    sort,
  });

  return res.json(
    new ApiResponse(200, banners, "Banners fetched successfully."),
  );
});

/*                           Update Banner                                    */

const updateBanner = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  const banner = await bannerService.updateBanner(bannerId, {
    ...req.body,
    files: req.files,
    updatedBy: req.user._id,
  });

  return res.json(new ApiResponse(200, banner, "Banner updated successfully."));
});

/*                         Increment Click                                    */

const incrementClick = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  await bannerService.incrementClick(bannerId);

  return res.json(new ApiResponse(200, null, "Banner click recorded."));
});

/*                      Increment Impression                                  */

const incrementImpression = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  await bannerService.incrementImpression(bannerId);

  return res.json(new ApiResponse(200, null, "Banner impression recorded."));
});

/*                           Delete Banner                                    */

const deleteBanner = asyncHandler(async (req, res) => {
  const { bannerId } = req.params;

  const banner = await bannerService.deleteBanner(bannerId);

  return res.json(new ApiResponse(200, banner, "Banner deleted successfully."));
});

export default{
  createBanner,
  getBannerById,
  getBannerBySlug,
  getActiveBanners,
  getAllBanners,
  updateBanner,
  incrementClick,
  incrementImpression,
  deleteBanner,
};
