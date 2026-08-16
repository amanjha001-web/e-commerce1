import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import orderService from "../services/order.service.js";

/*                              Create Order                                  */

const createOrder = asyncHandler(async (req, res) => {
  const {
    addressId,
    paymentMethod = "COD",
    couponCode = "",
    notes = "",
  } = req.body;

  const order = await orderService.createOrder(req.user._id, {
    addressId,
    paymentMethod,
    couponCode,
    notes,
  });

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

/*                         Get All Orders - Admin                         */

const getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
  } = req.query;

  const orders = await orderService.getAllOrders(
    {},
    {
      page: Number(page),
      limit: Number(limit),
    },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        orders,
        "All orders fetched successfully",
      ),
    );
});

// get vendor order
const getVendorOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getVendorOrders(req.user._id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "Vendor orders fetched successfully"));
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
  getAllOrders,
  getVendorOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};
