import crypto from "crypto";
import mongoose from "mongoose";

import razorpay from "../config/razorpay.js";

import ApiError from "../utils/ApiError.js";

import paymentRepository from "../repositories/payment.repository.js";
import orderRepository from "../repositories/order.repository.js";
import couponRepository from "../repositories/coupon.repository.js";
import productRepository from "../repositories/product.repository.js";
import cartRepository from "../repositories/cart.repository.js";

/*                               Helper Functions                             */

const convertToPaise = (amount) => Math.round(Number(amount) * 100);

const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
};

const startTransaction = async () => {
  const session = await mongoose.startSession();

  session.startTransaction();

  return session;
};

/*                            Create Payment                                  */

const createPayment = async (orderId) => {
  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "Paid") {
    throw new ApiError(400, "Order is already paid");
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: convertToPaise(order.totalAmount),
    currency: "INR",
    receipt: order._id.toString(),
    notes: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  });

  await paymentRepository.createPayment({
    order: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount: order.totalAmount,
    currency: "INR",
    paymentStatus: "Pending",
  });

  return razorpayOrder;
};
/*                            Verify Payment                                  */

const verifyPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const session =
    await startTransaction();

  try {
    const payment =
      await paymentRepository.getPaymentByRazorpayOrderId(
        razorpayOrderId,
      );

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found",
      );
    }

    if (
      payment.paymentStatus ===
      "Paid"
    ) {
      throw new ApiError(
        400,
        "Payment already verified",
      );
    }

    const isValid =
      verifyRazorpaySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

    if (!isValid) {
      throw new ApiError(
        400,
        "Invalid payment signature",
      );
    }

    await paymentRepository.updatePayment(
      payment._id,
      {
        razorpayPaymentId,
        razorpaySignature,
        paymentStatus: "Paid",
        paidAt: new Date(),
      },
      session,
    );

    await orderRepository.updateOrder(
      payment.order,
      {
        paymentStatus: "Paid",
      },
      session,
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message:
        "Payment verified successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
};

/*                          Get Payment By Order                              */

const getPaymentByOrder = async (
  orderId,
) => {
  const payment =
    await paymentRepository.getPaymentByOrderId(
      orderId,
    );

  if (!payment) {
    throw new ApiError(
      404,
      "Payment not found",
    );
  }

  return payment;
};
/*                             Refund Payment                                 */

const refundPayment = async (
  paymentId,
  refundAmount,
) => {
  const session =
    await startTransaction();

  try {
    const payment =
      await paymentRepository.getPaymentById(
        paymentId,
      );

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found",
      );
    }

    if (
      payment.paymentStatus !==
      "Paid"
    ) {
      throw new ApiError(
        400,
        "Only paid payments can be refunded",
      );
    }

    if (
      payment.refundStatus ===
      "Completed"
    ) {
      throw new ApiError(
        400,
        "Payment already refunded",
      );
    }

    const amount =
      refundAmount ||
      payment.amount;

    await paymentRepository.updatePayment(
      paymentId,
      {
        refundAmount: amount,
        refundStatus:
          "Completed",
        refundedAt:
          new Date(),
        paymentStatus:
          "Refunded",
      },
      session,
    );

    await orderRepository.updateOrder(
      payment.order,
      {
        paymentStatus:
          "Refunded",
        orderStatus:
          "Cancelled",
      },
      session,
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message:
        "Refund completed successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
};

/*                            Get All Payments                                */

const getAllPayments = async (
  query = {},
) => {
  const {
    page = 1,
    limit = 10,
    paymentStatus,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (paymentStatus) {
    filter.paymentStatus =
      paymentStatus;
  }

  const sort = {
    [sortBy]:
      order === "asc" ? 1 : -1,
  };

  return await paymentRepository.getAllPayments(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};

/*                                  Export                                    */

export default {
  createPayment,

  verifyPayment,

  getPaymentByOrder,

  refundPayment,

  getAllPayments,
};