import { adminPaymentService } from '../../services/admin/payment.service.js';
import { adminOrderService } from '../../services/admin/order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getPayments = asyncHandler(async (req, res) => {
  const result = await adminPaymentService.getPayments(req.query);
  return ApiResponse.success(res, result, 'Payments list');
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await adminPaymentService.getPaymentById(req.params.paymentId);
  return ApiResponse.success(res, payment, 'Payment details');
});

export const refundPayment = asyncHandler(async (req, res) => {
  const payment = await adminPaymentService.getPaymentById(req.params.paymentId);
  const result = await adminOrderService.processRefund(payment.orderId._id, req.body, req.body.reason, req.user._id);
  return ApiResponse.success(res, result, 'Payment refunded');
});

export const reconcilePayment = asyncHandler(async (req, res) => {
  const paymentId = req.params.paymentId || req.body.paymentId;
  const result = await adminPaymentService.reconcilePayment(paymentId);
  return ApiResponse.success(res, result, 'Payment reconciled');
});

export const getVendorPayouts = asyncHandler(async (req, res) => {
  const result = await adminPaymentService.getVendorPayouts(req.query);
  return ApiResponse.success(res, result, 'Vendor payouts');
});

export const getVendorPayoutById = asyncHandler(async (req, res) => {
  const payout = await adminPaymentService.getVendorPayoutById(req.params.payoutId);
  return ApiResponse.success(res, payout, 'Payout details');
});

export const updateVendorPayoutStatus = asyncHandler(async (req, res) => {
  const payout = await adminPaymentService.updateVendorPayoutStatus(req.params.payoutId, req.body.status, req.user._id);
  return ApiResponse.success(res, payout, 'Payout status updated');
});
