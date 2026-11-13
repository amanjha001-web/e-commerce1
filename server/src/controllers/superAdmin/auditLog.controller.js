import { superAdminAuditLogService } from '../../services/superAdmin/auditLog.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await superAdminAuditLogService.getAuditLogs(req.query);
  return ApiResponse.success(res, result, 'Global audit logs');
});
