import { vendorProfileService } from '../../services/vendor/profile.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await vendorProfileService.getProfile(req.user._id);
  return ApiResponse.success(res, profile, 'Vendor profile');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await vendorProfileService.updateProfile(req.user._id, req.body);
  return ApiResponse.success(res, updated, 'Vendor profile updated');
});
