import { superAdminManagementService } from '../../services/superAdmin/admin.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getAdmins = asyncHandler(async (req, res) => {
  const result = await superAdminManagementService.getAdmins(req.query);
  return ApiResponse.success(res, result, 'Admins list');
});

export const createAdmin = asyncHandler(async (req, res) => {
  const admin = await superAdminManagementService.createAdmin(req.body);
  return ApiResponse.created(res, admin, 'Admin created successfully');
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await superAdminManagementService.updateAdmin(req.params.adminId, req.body);
  return ApiResponse.success(res, admin, 'Admin updated');
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const result = await superAdminManagementService.deleteAdmin(req.params.adminId, req.user._id);
  return ApiResponse.success(res, result, result.message);
});
