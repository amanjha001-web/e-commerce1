import { customerPaymentService } from '../../services/customer/payment.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await customerPaymentService.createPaymentOrder(req.user._id, orderId);
  return ApiResponse.success(res, result, 'Payment order created');
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await customerPaymentService.verifyPayment(req.user._id, req.body);
  return ApiResponse.success(res, result, result.message);
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await customerPaymentService.getPaymentById(req.params.paymentId, req.user._id);
  return ApiResponse.success(res, payment, 'Payment details');
});

export const getOrderPayment = asyncHandler(async (req, res) => {
  const payment = await customerPaymentService.getOrderPayment(req.params.orderId, req.user._id);
  return ApiResponse.success(res, payment, 'Order payment details');
});

export const getPaymentStatus = asyncHandler(async (req, res) => {
  const result = await customerPaymentService.getPaymentStatus(req.params.paymentId, req.user._id);
  return ApiResponse.success(res, result, 'Payment status');
});

export const retryPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await customerPaymentService.retryPayment(req.user._id, orderId);
  return ApiResponse.success(res, result, 'Payment order regenerated for retry');
});

export const requestRefund = asyncHandler(async (req, res) => {
  const result = await customerPaymentService.requestRefund(req.user._id, req.params.paymentId, req.body);
  return ApiResponse.success(res, result, 'Refund requested');
});
