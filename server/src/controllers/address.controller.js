import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import addressService from "../services/address.service.js";

const addAddress = asyncHandler(async (req, res) => {
  const addresses = await addressService.addAddress(req.user._id, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, addresses, "Address added successfully"));
});

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, addresses, "Addresses fetched successfully"));
});

const updateAddress = asyncHandler(async (req, res) => {
  const addresses = await addressService.updateAddress(
    req.user._id,
    req.params.id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, addresses, "Address updated successfully"));
});

const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await addressService.deleteAddress(
    req.user._id,
    req.params.id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, addresses, "Address deleted successfully"));
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const addresses = await addressService.setDefaultAddress(
    req.user._id,
    req.params.id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, addresses, "Default address updated successfully"),
    );
});

export default {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
