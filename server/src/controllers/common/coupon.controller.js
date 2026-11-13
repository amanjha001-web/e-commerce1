import { couponCommonService } from '../../services/common/coupon.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const validateCoupon = asyncHandler(async (req, res) => {
  const { couponCode, cartTotal, totalAmount } = req.body;
  const total = Number(cartTotal || totalAmount || 0);
  const result = await couponCommonService.validateCoupon(couponCode, total, req.user?._id);
  return ApiResponse.success(res, result, 'Coupon validated successfully');
});
