import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import paymentService from "../services/payment.service.js";

/*                        Create Razorpay Order                               */

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const razorpayOrder = await paymentService.createRazorpayOrder(orderId);

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

/*                            Verify Payment                                  */

const verifyPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPaymentAndUpdateOrder({
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    razorpaySignature: req.body.razorpaySignature,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Payment verified successfully"));
});

/*                                  Export                                    */

export default{ createRazorpayOrder, verifyPayment };
