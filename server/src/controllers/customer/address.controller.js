import { addressService } from '../../services/customer/address.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(req.user._id);
  return ApiResponse.success(res, addresses, 'Addresses retrieved');
});

export const getAddressById = asyncHandler(async (req, res) => {
  const address = await addressService.getAddressById(req.params.addressId, req.user._id);
  return ApiResponse.success(res, address, 'Address retrieved');
});

export const addAddress = asyncHandler(async (req, res) => {
  const address = await addressService.addAddress(req.user._id, req.body);
  return ApiResponse.created(res, address, 'Address added successfully');
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.params.addressId, req.user._id, req.body);
  return ApiResponse.success(res, address, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const result = await addressService.deleteAddress(req.params.addressId, req.user._id);
  return ApiResponse.success(res, result, result.message);
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefaultAddress(req.params.addressId, req.user._id);
  return ApiResponse.success(res, address, 'Default address set');
});

export const getDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.getDefaultAddress(req.user._id);
  return ApiResponse.success(res, address, 'Default address retrieved');
});
