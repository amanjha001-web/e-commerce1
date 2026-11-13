import { AuditLog } from '../../models/AuditLog.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';

export class AdminAuditLogService {
  async getActivityLogs(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.action) filter.action = params.action;
    if (params.resource) filter.resource = params.resource;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivityLogById(logId) {
    const log = await AuditLog.findById(logId).populate('userId', 'name email role');
    if (!log) throw ApiError.notFound('Audit log not found');
    return log;
  }

  async recordLog({ userId, action, resource, resourceId, changes, status = 'SUCCESS', ipAddress = '', userAgent = '' }) {
    return AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      changes,
      status,
      ipAddress,
      userAgent,
    });
  }
}

export const adminAuditLogService = new AdminAuditLogService();
export default adminAuditLogService;
