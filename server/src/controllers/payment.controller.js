import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import paymentService from "../services/payment.service.js";

/*                         Create Razorpay Order                              */

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const razorpayOrder = await paymentService.createPayment(
    orderId,
    req.user._id,
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        razorpayOrder,
        "Razorpay order created successfully",
      ),
    );
});

/*                              Verify Payment                                */

const verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPayment({
    razorpayOrderId: req.body.razorpayOrderId,

    razorpayPaymentId: req.body.razorpayPaymentId,

    razorpaySignature: req.body.razorpaySignature,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Payment verified successfully"));
});

const handlePaymentFailure = asyncHandler(async (req, res) => {
  const result = await paymentService.handlePaymentFailure({
    razorpayOrderId: req.body.razorpayOrderId,

    failureReason: req.body.failureReason || "",

    gatewayResponse: req.body.gatewayResponse || {},
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Payment failure recorded successfully"),
    );
});

/*                         Get Payment By Order                              */

const getPaymentByOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await paymentService.getPaymentByOrder(id);

  return res.status(200).json(
    new ApiResponse(
      200,
      payment,
      "Payment fetched successfully",
    ),
  );
});

/*                                  Export                                    */

export default {
  createRazorpayOrder,
  verifyPayment,
  handlePaymentFailure,
  getPaymentByOrder,
};
