import { customerOrderService } from '../../services/customer/order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const createOrder = asyncHandler(async (req, res) => {
  const order = await customerOrderService.createOrder(req.user._id, req.body, req.user);
  return ApiResponse.created(res, order, 'Order placed successfully');
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const result = await customerOrderService.getMyOrders(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Orders retrieved');
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await customerOrderService.getOrderById(req.params.orderId, req.user._id);
  return ApiResponse.success(res, order, 'Order details retrieved');
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await customerOrderService.cancelOrder(req.params.orderId, req.user._id, reason);
  return ApiResponse.success(res, order, 'Order cancelled');
});

export const returnOrder = asyncHandler(async (req, res) => {
  const order = await customerOrderService.returnOrder(req.params.orderId, req.user._id, req.body);
  return ApiResponse.success(res, order, 'Return requested');
});

export const trackOrder = asyncHandler(async (req, res) => {
  const tracking = await customerOrderService.trackOrder(req.params.orderId, req.user._id);
  return ApiResponse.success(res, tracking, 'Order tracking details');
});
