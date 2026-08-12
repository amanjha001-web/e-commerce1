import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import brandService from "../services/brand.service.js";

/*                               Create Brand                                 */

const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.createBrand(req.body, req.files);

  return res
    .status(201)
    .json(new ApiResponse(201, brand, "Brand created successfully"));
});

/*                               Get All Brands                               */

const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await brandService.getAllBrands(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, brands, "Brands fetched successfully"));
});

/*                               Get Brand By ID                              */

const getBrandById = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand fetched successfully"));
});

/*                             Get Brand By Slug                              */

const getBrandBySlug = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandBySlug(req.params.slug);

  return res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand fetched successfully"));
});

/*                               Update Brand                                 */

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.updateBrand(
    req.params.id,
    req.body,
    req.files,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand updated successfully"));
});

/*                               Delete Brand                                 */

const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.deleteBrand(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand deleted successfully"));
});

export default{
  createBrand,
  getAllBrands,
  getBrandById,
  getBrandBySlug,
  updateBrand,
  deleteBrand,
};
