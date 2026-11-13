import { adminDashboardService } from '../../services/admin/dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getDashboard();
  return ApiResponse.success(res, data, 'Dashboard data');
});

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getDashboardAnalytics();
  return ApiResponse.success(res, data, 'Dashboard analytics');
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const orders = await adminDashboardService.getRecentOrders(req.query.limit);
  return ApiResponse.success(res, orders, 'Recent orders');
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await adminDashboardService.getLowStockProducts(req.query.threshold);
  return ApiResponse.success(res, products, 'Low stock products');
});
