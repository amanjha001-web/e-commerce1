import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import reportService from "../services/report.service.js";

/*                             Create Report                                  */

const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport({
    ...req.body,
    reportedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, report, "Report created successfully."));
});

/*                          Get Report By Id                                  */

const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await reportService.getReportById(reportId);

  return res.json(new ApiResponse(200, report, "Report fetched successfully."));
});

/*                         Get My Reports                                    */

const getMyReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getUserReports(req.user._id, req.query);

  return res.json(
    new ApiResponse(200, reports, "User reports fetched successfully."),
  );
});

/*                         Get All Reports                                   */

const getAllReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getAllReports(req.query, req.query);

  return res.json(
    new ApiResponse(200, reports, "All reports fetched successfully."),
  );
});

/*                          Update Report                                    */

const updateReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await reportService.updateReport(reportId, req.body);

  return res.json(new ApiResponse(200, report, "Report updated successfully."));
});

/*                         Resolve Report                                    */

const resolveReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await reportService.resolveReport(
    reportId,
    req.user._id,
    req.body.adminNote,
  );

  return res.json(
    new ApiResponse(200, report, "Report resolved successfully."),
  );
});

/*                          Delete Report                                    */

const deleteReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await reportService.deleteReport(reportId);

  return res.json(new ApiResponse(200, report, "Report deleted successfully."));
});

export default{
  createReport,
  getReportById,
  getMyReports,
  getAllReports,
  updateReport,
  resolveReport,
  deleteReport,
};
