import { adminReportService } from '../../services/admin/report.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getReports = asyncHandler(async (req, res) => {
  const summary = await adminReportService.getReportSummary();
  return ApiResponse.success(res, summary, 'Report summary');
});

export const getReportSummary = asyncHandler(async (req, res) => {
  const summary = await adminReportService.getReportSummary();
  return ApiResponse.success(res, summary, 'Report summary');
});

export const getSalesReport = asyncHandler(async (req, res) => {
  const sales = await adminReportService.getSalesReport(req.query);
  return ApiResponse.success(res, sales, 'Sales report');
});

export const getRevenueReport = asyncHandler(async (req, res) => {
  const revenue = await adminReportService.getRevenueReport(req.query);
  return ApiResponse.success(res, revenue, 'Revenue report');
});

export const exportReport = asyncHandler(async (req, res) => {
  const csv = await adminReportService.exportReport(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
  return res.send(csv);
});
