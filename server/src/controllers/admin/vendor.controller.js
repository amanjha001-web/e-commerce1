import { adminVendorService } from '../../services/admin/vendor.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getVendors = asyncHandler(async (req, res) => {
  const result = await adminVendorService.getVendors(req.query);
  return ApiResponse.success(res, result, 'Vendors list');
});

export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await adminVendorService.getVendorById(req.params.vendorId);
  return ApiResponse.success(res, vendor, 'Vendor details');
});

export const updateVendor = asyncHandler(async (req, res) => {
  const updated = await adminVendorService.updateVendor(req.params.vendorId, req.body);
  return ApiResponse.success(res, updated, 'Vendor updated');
});

export const toggleVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await adminVendorService.toggleVendorStatus(req.params.vendorId, req.body.isActive);
  return ApiResponse.success(res, vendor, 'Vendor status toggled');
});

export const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await adminVendorService.approveVendor(req.params.vendorId);
  return ApiResponse.success(res, vendor, 'Vendor approved');
});

export const rejectVendor = asyncHandler(async (req, res) => {
  const vendor = await adminVendorService.rejectVendor(req.params.vendorId, req.body.reason);
  return ApiResponse.success(res, vendor, 'Vendor application rejected');
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const result = await adminVendorService.deleteVendor(req.params.vendorId);
  return ApiResponse.success(res, result, result.message);
});
