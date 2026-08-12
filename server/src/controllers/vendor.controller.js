import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import vendorService from "../services/vendor.service.js";

/*                               Create Vendor                                */

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendor(
    req.body,
    req.files,
    req.user,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, vendor, "Vendor profile created successfully"));
});

/*                              Get All Vendors                               */

const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await vendorService.getAllVendors(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, vendors, "Vendors fetched successfully"));
});

/*                              Get Vendor By ID                              */

const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor fetched successfully"));
});

/*                            Get Vendor By Slug                              */

const getVendorBySlug = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorBySlug(req.params.slug);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor fetched successfully"));
});

/*                               Update Vendor                                */

const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(
    req.params.id,
    req.body,
    req.files,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor updated successfully"));
});

/*                               Delete Vendor                                */

const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.deleteVendor(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor deleted successfully"));
});

export default{
  createVendor,
  getAllVendors,
  getVendorById,
  getVendorBySlug,
  updateVendor,
  deleteVendor,
};
