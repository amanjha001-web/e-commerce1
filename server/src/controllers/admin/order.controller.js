import { adminOrderService } from '../../services/admin/order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getOrders = asyncHandler(async (req, res) => {
  const result = await adminOrderService.getOrders(req.query);
  return ApiResponse.success(res, result, 'Orders list');
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await adminOrderService.getOrderById(req.params.orderId);
  return ApiResponse.success(res, order, 'Order details');
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await adminOrderService.updateOrderStatus(req.params.orderId, status, note, req.user._id);
  return ApiResponse.success(res, order, 'Order status updated');
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await adminOrderService.cancelOrder(req.params.orderId, reason, req.user._id);
  return ApiResponse.success(res, order, 'Order cancelled by admin');
});

export const processRefund = asyncHandler(async (req, res) => {
  const result = await adminOrderService.processRefund(req.params.orderId, req.body, req.body.reason, req.user._id);
  return ApiResponse.success(res, result, 'Refund processed');
});

export const updateOrderShipping = asyncHandler(async (req, res) => {
  const order = await adminOrderService.updateOrderShipping(req.params.orderId, req.body);
  return ApiResponse.success(res, order, 'Shipping info updated');
});

export const approveReturn = asyncHandler(async (req, res) => {
  const order = await adminOrderService.approveReturn(req.params.orderId, req.user._id);
  return ApiResponse.success(res, order, 'Return approved');
});

export const rejectReturn = asyncHandler(async (req, res) => {
  const order = await adminOrderService.rejectReturn(req.params.orderId, req.body.reason, req.user._id);
  return ApiResponse.success(res, order, 'Return rejected');
});
