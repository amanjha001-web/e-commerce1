import { vendorPayoutService } from '../../services/vendor/payout.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getPayouts = asyncHandler(async (req, res) => {
  const result = await vendorPayoutService.getPayouts(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Vendor payouts');
});

export const getPayoutById = asyncHandler(async (req, res) => {
  const payout = await vendorPayoutService.getPayoutById(req.user._id, req.params.payoutId);
  return ApiResponse.success(res, payout, 'Payout details');
});

export const requestPayout = asyncHandler(async (req, res) => {
  const payout = await vendorPayoutService.requestPayout(req.user._id, req.body);
  return ApiResponse.created(res, payout, 'Payout request submitted');
});
