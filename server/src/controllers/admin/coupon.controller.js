import { adminCouponService } from '../../services/admin/coupon.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getCoupons = asyncHandler(async (req, res) => {
  const result = await adminCouponService.getCoupons(req.query);
  return ApiResponse.success(res, result, 'Coupons list');
});

export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await adminCouponService.getCouponById(req.params.couponId);
  return ApiResponse.success(res, coupon, 'Coupon details');
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await adminCouponService.createCoupon(req.body);
  return ApiResponse.created(res, coupon, 'Coupon created');
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await adminCouponService.updateCoupon(req.params.couponId, req.body);
  return ApiResponse.success(res, coupon, 'Coupon updated');
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const result = await adminCouponService.deleteCoupon(req.params.couponId);
  return ApiResponse.success(res, result, result.message);
});

export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await adminCouponService.toggleCouponStatus(req.params.couponId, req.body.isActive);
  return ApiResponse.success(res, coupon, 'Coupon status toggled');
});

export const getCouponUsage = asyncHandler(async (req, res) => {
  const usage = await adminCouponService.getCouponUsage(req.params.couponId);
  return ApiResponse.success(res, usage, 'Coupon usage history');
});
