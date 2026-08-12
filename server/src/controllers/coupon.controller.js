import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import couponService from "../services/coupon.service.js";

/*                             Create Coupon                                  */

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

/*                            Get All Coupons                                 */

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponService.getAllCoupons();

  return res
    .status(200)
    .json(new ApiResponse(200, coupons, "Coupons fetched successfully"));
});

/*                           Get Coupon By Code                               */

const getCouponByCode = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponByCode(req.params.code);

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon fetched successfully"));
});

/*                             Apply Coupon                                   */

const applyCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  const result = await couponService.applyCoupon(code, Number(orderAmount));

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Coupon applied successfully"));
});

/*                            Update Coupon                                   */

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon updated successfully"));
});

/*                            Delete Coupon                                   */

const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Coupon deleted successfully"));
});

export default{
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
};
