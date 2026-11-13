import { vendorEarningsService } from '../../services/vendor/earnings.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getEarnings = asyncHandler(async (req, res) => {
  const earnings = await vendorEarningsService.getEarnings(req.user._id);
  return ApiResponse.success(res, earnings, 'Vendor earnings');
});

export const getEarningsSummary = asyncHandler(async (req, res) => {
  const summary = await vendorEarningsService.getEarningsSummary(req.user._id);
  return ApiResponse.success(res, summary, 'Earnings summary');
});
