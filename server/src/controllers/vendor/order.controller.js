import { vendorOrderService } from '../../services/vendor/order.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getVendorOrders = asyncHandler(async (req, res) => {
  const result = await vendorOrderService.getVendorOrders(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Vendor orders');
});

export const getVendorOrderById = asyncHandler(async (req, res) => {
  const order = await vendorOrderService.getVendorOrderById(req.user._id, req.params.orderId);
  return ApiResponse.success(res, order, 'Vendor order details');
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await vendorOrderService.updateOrderStatus(req.user._id, req.params.orderId, { status, note });
  return ApiResponse.success(res, order, 'Order status updated');
});
