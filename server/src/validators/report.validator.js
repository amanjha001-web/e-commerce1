import { z } from "zod";

/*                                  Common                                    */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const targetType = z.enum(["PRODUCT", "USER", "ORDER", "VENDOR", "REVIEW"]);

const reportStatus = z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]);

/*                              Create Report                                 */

const createReport = z.object({
  body: z.object({
    targetType,

    targetId: objectId,

    reason: z.string().trim().min(5).max(200),

    description: z.string().trim().max(1000).optional(),
  }),
});

/*                              Update Report                                 */

const updateReport = z.object({
  params: z.object({
    reportId: objectId,
  }),

  body: z.object({
    reason: z.string().trim().min(5).max(200).optional(),

    description: z.string().trim().max(1000).optional(),

    status: reportStatus.optional(),

    resolvedBy: objectId.optional(),

    resolvedAt: z.coerce.date().optional(),
  }),
});

/*                           Update Report Status                             */

const updateReportStatus = z.object({
  params: z.object({
    reportId: objectId,
  }),

  body: z.object({
    status: reportStatus,
  }),
});

/*                                 Params                                     */

const reportIdParam = z.object({
  params: z.object({
    reportId: objectId,
  }),
});

/*                                  Query                                     */

const getReports = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    targetType: targetType.optional(),

    status: reportStatus.optional(),

    reportedBy: objectId.optional(),

    search: z.string().trim().optional(),

    sort: z.string().optional(),
  }),
});

export default {
  createReport,
  updateReport,
  updateReportStatus,
  reportIdParam,
  getReports,
};
