import { permissionService } from '../../services/superAdmin/permission.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await permissionService.getPermissions();
  return ApiResponse.success(res, permissions, 'Permissions list');
});

export const createPermission = asyncHandler(async (req, res) => {
  const permission = await permissionService.createPermission(req.body);
  return ApiResponse.created(res, permission, 'Permission created');
});
