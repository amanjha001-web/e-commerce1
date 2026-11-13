import { adminUserService } from '../../services/admin/user.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getUsers = asyncHandler(async (req, res) => {
  const result = await adminUserService.getUsers(req.query);
  return ApiResponse.success(res, result, 'Users list');
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await adminUserService.getUserById(req.params.userId);
  return ApiResponse.success(res, user, 'User details');
});

export const updateUser = asyncHandler(async (req, res) => {
  const updated = await adminUserService.updateUser(req.params.userId, req.body, req.user);
  return ApiResponse.success(res, updated, 'User updated');
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const status = req.body.status !== undefined ? req.body.status : req.body.isActive;
  const updated = await adminUserService.updateUserStatus(req.params.userId, status, req.user);
  return ApiResponse.success(res, updated, 'User status updated');
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await adminUserService.getUserById(req.params.userId);
  const updated = await adminUserService.updateUserStatus(req.params.userId, !user.isActive, req.user);
  return ApiResponse.success(res, updated, 'User status toggled');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await adminUserService.deleteUser(req.params.userId, req.user);
  return ApiResponse.success(res, result, result.message);
});
