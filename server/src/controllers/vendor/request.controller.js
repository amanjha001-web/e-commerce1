import { vendorRequestService } from '../../services/vendor/request.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const createRequest = asyncHandler(async (req, res) => {
  const request = await vendorRequestService.createRequest(req.user._id, req.body);
  return ApiResponse.created(res, request, 'Vendor application submitted');
});

export const getMyRequest = asyncHandler(async (req, res) => {
  const request = await vendorRequestService.getMyRequest(req.user._id);
  return ApiResponse.success(res, request, 'Your vendor application');
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await vendorRequestService.getMyRequests(req.user._id);
  return ApiResponse.success(res, requests, 'Your vendor applications');
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await vendorRequestService.cancelRequest(req.user._id, req.params.requestId);
  return ApiResponse.success(res, request, 'Application cancelled');
});
