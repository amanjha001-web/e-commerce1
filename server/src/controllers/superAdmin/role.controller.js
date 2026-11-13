import { roleService } from '../../services/superAdmin/role.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getRoles();
  return ApiResponse.success(res, roles, 'Roles retrieved');
});

export const createRole = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body);
  return ApiResponse.created(res, role, 'Role created');
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.roleId, req.body);
  return ApiResponse.success(res, role, 'Role updated');
});

export const deleteRole = asyncHandler(async (req, res) => {
  const result = await roleService.deleteRole(req.params.roleId);
  return ApiResponse.success(res, result, result.message);
});
