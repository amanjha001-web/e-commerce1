import { adminVendorRequestService } from '../../services/admin/vendorRequest.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getVendorRequests = asyncHandler(async (req, res) => {
  const result = await adminVendorRequestService.getRequests(req.query);
  return ApiResponse.success(res, result, 'Vendor requests');
});

export const getPendingVendorRequests = asyncHandler(async (req, res) => {
  const result = await adminVendorRequestService.getRequests({ ...req.query, status: 'pending' });
  return ApiResponse.success(res, result, 'Pending vendor requests');
});

export const getVendorRequestById = asyncHandler(async (req, res) => {
  const request = await adminVendorRequestService.getRequestById(req.params.requestId);
  return ApiResponse.success(res, request, 'Vendor request details');
});

export const approveVendorRequest = asyncHandler(async (req, res) => {
  const result = await adminVendorRequestService.approveRequest(req.params.requestId, req.user._id);
  return ApiResponse.success(res, result, 'Vendor request approved');
});

export const rejectVendorRequest = asyncHandler(async (req, res) => {
  const request = await adminVendorRequestService.rejectRequest(req.params.requestId, req.user._id, req.body.reason);
  return ApiResponse.success(res, request, 'Vendor request rejected');
});

export const reviewVendorRequest = asyncHandler(async (req, res) => {
  const request = await adminVendorRequestService.reviewRequest(req.params.requestId, req.user._id, req.body);
  return ApiResponse.success(res, request, 'Vendor request marked under review');
});

export const restoreVendorRequest = asyncHandler(async (req, res) => {
  const request = await adminVendorRequestService.restoreRequest(req.params.requestId);
  return ApiResponse.success(res, request, 'Vendor request restored');
});

export const deleteVendorRequest = asyncHandler(async (req, res) => {
  const result = await adminVendorRequestService.deleteRequest(req.params.requestId);
  return ApiResponse.success(res, result, result.message);
});
