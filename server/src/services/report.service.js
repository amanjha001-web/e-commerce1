import mongoose from "mongoose";

import reportRepository from "../repositories/report.repository.js";

import ApiError from "../utils/ApiError.js";

/*                             Create Report                                  */

const createReport = async (reportData) => {
  const { reportedBy, targetType, targetId } = reportData;

  if (!mongoose.Types.ObjectId.isValid(reportedBy)) {
    throw new ApiError(400, "Invalid user id.");
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    throw new ApiError(400, "Invalid target id.");
  }

  return reportRepository.createReport(reportData);
};

/*                          Get Report By Id                                  */

const getReportById = async (reportId) => {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw new ApiError(400, "Invalid report id.");
  }

  const report = await reportRepository.findReportById(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  return report;
};

/*                         Get User Reports                                   */

const getUserReports = async (userId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  return reportRepository.findReportsByUser(userId, query);
};

/*                           Get All Reports                                  */

const getAllReports = async (filter = {}, query = {}) => {
  return reportRepository.findReports(filter, query);
};

/*                            Update Report                                   */

const updateReport = async (reportId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw new ApiError(400, "Invalid report id.");
  }

  const report = await reportRepository.updateReport(reportId, updateData);

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  return report;
};

/*                           Resolve Report                                   */

const resolveReport = async (reportId, resolvedBy, adminNote) => {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw new ApiError(400, "Invalid report id.");
  }

  if (!mongoose.Types.ObjectId.isValid(resolvedBy)) {
    throw new ApiError(400, "Invalid resolver id.");
  }

  const report = await reportRepository.resolveReport(reportId, {
    resolvedBy,
    adminNote,
  });

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  return report;
};

/*                              Delete Report                                 */

const deleteReport = async (reportId) => {
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    throw new ApiError(400, "Invalid report id.");
  }

  const report = await reportRepository.softDeleteReport(reportId);

  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  return report;
};

export default {
  createReport,
  getReportById,
  getUserReports,
  getAllReports,
  updateReport,
  resolveReport,
  deleteReport,
};
