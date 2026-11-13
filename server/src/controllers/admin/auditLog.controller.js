import { adminAuditLogService } from '../../services/admin/auditLog.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getActivityLogs = asyncHandler(async (req, res) => {
  const result = await adminAuditLogService.getActivityLogs(req.query);
  return ApiResponse.success(res, result, 'Activity logs');
});

export const getActivityLogById = asyncHandler(async (req, res) => {
  const log = await adminAuditLogService.getActivityLogById(req.params.logId);
  return ApiResponse.success(res, log, 'Activity log details');
});
