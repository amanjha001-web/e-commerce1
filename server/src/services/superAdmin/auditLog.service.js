import { AuditLog } from '../../models/AuditLog.model.js';
import { parsePagination } from '../../utils/helpers.js';

export class SuperAdminAuditLogService {
  async getAuditLogs(params = {}) {
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
}

export const superAdminAuditLogService = new SuperAdminAuditLogService();
export default superAdminAuditLogService;
