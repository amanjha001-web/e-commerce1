import { customerProfileService } from '../../services/customer/profile.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await customerProfileService.getProfile(req.user._id);
  return ApiResponse.success(res, profile, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await customerProfileService.updateProfile(req.user._id, req.body);
  return ApiResponse.success(res, updated, 'Profile updated');
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const updated = await customerProfileService.updateAvatar(req.user._id, req.file);
  return ApiResponse.success(res, updated, 'Avatar updated');
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const updated = await customerProfileService.deleteAvatar(req.user._id);
  return ApiResponse.success(res, updated, 'Avatar removed');
});

export const updateUsername = asyncHandler(async (req, res) => {
  const updated = await customerProfileService.updateUsername(req.user._id, req.body.username);
  return ApiResponse.success(res, updated, 'Username updated');
});

export const updateEmail = asyncHandler(async (req, res) => {
  const updated = await customerProfileService.updateEmail(req.user._id, req.body.email);
  return ApiResponse.success(res, updated, 'Email updated');
});

export const deactivateAccount = asyncHandler(async (req, res) => {
  const result = await customerProfileService.deactivateAccount(req.user._id);
  return ApiResponse.success(res, result, result.message);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await customerProfileService.deleteAccount(req.user._id);
  return ApiResponse.success(res, result, result.message);
});
