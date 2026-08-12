import Report from "../models/Report.model.js";

/*                             Create Report                                  */

const createReport = async (reportData, session = null) => {
  const [report] = await Report.create([reportData], {
    session,
  });

  return report;
};

/*                         Find Report By Id                                 */

const findReportById = async (reportId) => {
  return Report.findById(reportId)
    .populate("reportedBy", "name email avatar")
    .populate("resolvedBy", "name email")
    .populate("attachments");
};

/*                      Find User Reports                                    */

const findReportsByUser = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const reports = await Report.find({
    reportedBy: userId,
    isDeleted: false,
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Report.countDocuments({
    reportedBy: userId,
    isDeleted: false,
  });

  return {
    reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                         Find All Reports                                   */

const findReports = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const reports = await Report.find({
    ...filter,
    isDeleted: false,
  })
    .populate("reportedBy", "name email avatar")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Report.countDocuments({
    ...filter,
    isDeleted: false,
  });

  return {
    reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                            Update Report                                  */

const updateReport = async (reportId, updateData) => {
  return Report.findByIdAndUpdate(reportId, updateData, {
    new: true,
    runValidators: true,
  });
};

/*                         Resolve Report                                    */

const resolveReport = async (reportId, data) => {
  return Report.findByIdAndUpdate(
    reportId,
    {
      ...data,
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                          Delete Report                                    */

const softDeleteReport = async (reportId) => {
  return Report.findByIdAndUpdate(
    reportId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                          Count Reports                                    */

const countReports = async (filter = {}) => {
  return Report.countDocuments({
    ...filter,
    isDeleted: false,
  });
};

export default {
  createReport,
  findReportById,
  findReportsByUser,
  findReports,
  updateReport,
  resolveReport,
  softDeleteReport,
  countReports,
};
