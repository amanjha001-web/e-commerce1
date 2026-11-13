import { vendorStoreService } from '../../services/vendor/store.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getMyStore = asyncHandler(async (req, res) => {
  const store = await vendorStoreService.getMyStore(req.user._id);
  return ApiResponse.success(res, store, 'Store details');
});

export const updateStore = asyncHandler(async (req, res) => {
  const updated = await vendorStoreService.updateStore(req.user._id, req.body);
  return ApiResponse.success(res, updated, 'Store updated');
});

export const updateStoreLogo = asyncHandler(async (req, res) => {
  const updated = await vendorStoreService.updateStoreLogo(req.user._id, req.file);
  return ApiResponse.success(res, updated, 'Store logo updated');
});

export const updateStoreBanner = asyncHandler(async (req, res) => {
  const updated = await vendorStoreService.updateStoreBanner(req.user._id, req.file);
  return ApiResponse.success(res, updated, 'Store banner updated');
});

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await vendorStoreService.getDashboard(req.user._id);
  return ApiResponse.success(res, data, 'Vendor dashboard metrics');
});

export const getStats = asyncHandler(async (req, res) => {
  const data = await vendorStoreService.getStats(req.user._id);
  return ApiResponse.success(res, data, 'Vendor stats');
});

export const getSalesReport = asyncHandler(async (req, res) => {
  const sales = await vendorStoreService.getSalesReport(req.user._id);
  return ApiResponse.success(res, sales, 'Sales report');
});
