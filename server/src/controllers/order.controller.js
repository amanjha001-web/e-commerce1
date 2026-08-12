import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import orderService from "../services/order.service.js";

/*                              Create Order                                  */

const createOrder = asyncHandler(async (req, res) => {
  const paymentMethod = req.body.paymentMethod || "COD";

  const order = await orderService.createOrder(req.user._id, paymentMethod);

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order placed successfully"));
});

/*                              Get My Orders                                 */

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

/*                              Get Order By Id                               */

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user._id,
    req.user.role,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

/*                              Cancel Order                                  */

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order cancelled successfully"));
});

/*                          Update Order Status                               */

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await orderService.updateOrderStatus(req.params.id, status);

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});

export default{
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};
