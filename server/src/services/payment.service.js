import crypto from "crypto";
import mongoose from "mongoose";

import razorpay from "../config/razorpay.js";

import ApiError from "../utils/ApiError.js";

import paymentRepository from "../repositories/payment.repository.js";
import orderRepository from "../repositories/order.repository.js";


/*                               Helper Functions                             */


const convertToPaise = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Invalid payment amount");
  }

  return Math.round(numericAmount * 100);
};

const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new ApiError(500, "Razorpay secret key is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "utf8"),
    Buffer.from(razorpaySignature, "utf8"),
  );
};

const startTransaction = async () => {
  const session = await mongoose.startSession();

  session.startTransaction();

  return session;
};


/*                         Create Razorpay Payment                            */


const createPayment = async (orderId, userId) => {
  if (!orderId || !userId) {
    throw new ApiError(400, "Order ID and user ID are required");
  }

  const order = await orderRepository.getOrderById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!order.user) {
    throw new ApiError(500, "Order user information is missing");
  }

  const orderUserId = order.user._id?.toString() || order.user.toString();

  if (orderUserId !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to pay for this order");
  }

  if (order.orderStatus === "Cancelled") {
    throw new ApiError(400, "Cancelled order cannot be paid");
  }

  if (order.paymentStatus === "Paid") {
    throw new ApiError(400, "Order is already paid");
  }

  if (order.paymentStatus === "Refunded") {
    throw new ApiError(400, "Refunded order cannot be paid");
  }

  const amountInPaise = convertToPaise(order.totalAmount);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: userId.toString(),
    },
  });

  if (!razorpayOrder?.id) {
    throw new ApiError(500, "Failed to create Razorpay order");
  }

  const payment = await paymentRepository.createPayment({
    order: order._id,
    user: userId,
    amount: order.totalAmount,
    currency: "INR",
    paymentGateway: "RAZORPAY",
    paymentMethod: "UPI",
    razorpayOrderId: razorpayOrder.id,
    status: "CREATED",
  });

  return {
    paymentId: payment._id,
    orderId: order._id,
    orderNumber: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};


/*                              Verify Payment                                */


const verifyPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const session = await startTransaction();

  try {
    const payment =
      await paymentRepository.getPaymentByRazorpayOrderId(razorpayOrderId);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.status === "SUCCESS") {
      throw new ApiError(400, "Payment already verified");
    }

    if (payment.status === "REFUNDED") {
      throw new ApiError(400, "Payment has already been refunded");
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      await paymentRepository.updatePayment(
        payment._id,
        {
          razorpayPaymentId,
          razorpaySignature,
          status: "FAILED",
          failureReason: "Invalid Razorpay payment signature",
        },
        session,
      );

      await session.commitTransaction();
      session.endSession();

      throw new ApiError(400, "Invalid payment signature");
    }

    await paymentRepository.updatePayment(
      payment._id,
      {
        razorpayPaymentId,
        razorpaySignature,
        status: "SUCCESS",
        paidAt: new Date(),
      },
      session,
    );

    await orderRepository.updateOrder(
      payment.order._id || payment.order,
      {
        paymentStatus: "Paid",
      },
      session,
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      paymentId: payment._id,
      orderId: payment.order._id || payment.order,
      razorpayOrderId,
      razorpayPaymentId,
      paymentStatus: "SUCCESS",
      orderPaymentStatus: "Paid",
      message: "Payment verified successfully",
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    throw error;
  }
};


/*                           Get Payment By Order                             */


const getPaymentByOrder = async (orderId) => {
  const payment = await paymentRepository.getPaymentByOrderId(orderId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return payment;
};


/*                              Refund Payment                                */


const refundPayment = async (paymentId, refundAmount, reason = "") => {
  const session = await startTransaction();

  try {
    const payment = await paymentRepository.getPaymentById(paymentId);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.status !== "SUCCESS") {
      throw new ApiError(400, "Only successful payments can be refunded");
    }

    if (payment.refundAmount > 0) {
      throw new ApiError(400, "Payment has already been refunded");
    }

    const amount =
      refundAmount === undefined || refundAmount === null
        ? payment.amount
        : Number(refundAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, "Invalid refund amount");
    }

    if (amount > payment.amount) {
      throw new ApiError(400, "Refund amount cannot exceed payment amount");
    }

    if (!payment.razorpayPaymentId) {
      throw new ApiError(400, "Razorpay payment ID not found");
    }

    const razorpayRefund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: convertToPaise(amount),
        notes: {
          paymentId: payment._id.toString(),
          orderId: payment.order._id?.toString() || payment.order.toString(),
          reason: reason || "",
        },
      },
    );

    await paymentRepository.updatePayment(
      paymentId,
      {
        refundId: razorpayRefund.id || "",
        refundAmount: amount,
        refundReason: reason || "",
        refundedAt: new Date(),
        status: "REFUNDED",
        gatewayResponse: razorpayRefund,
      },
      session,
    );

    await orderRepository.updateOrder(
      payment.order._id || payment.order,
      {
        paymentStatus: "Refunded",
        refundAmount: amount,
        refundReason: reason || "",
        refundedAt: new Date(),
      },
      session,
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      paymentId,
      refundId: razorpayRefund.id,
      refundAmount: amount,
      status: "REFUNDED",
      message: "Refund completed successfully",
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    throw error;
  }
};


/*                             Get All Payments                               */


const getAllPayments = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    paymentStatus,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const normalizedPage = Math.max(Number(page) || 1, 1);

  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const filter = {};

  if (paymentStatus) {
    filter.status = paymentStatus;
  }

  const sort = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  return await paymentRepository.getAllPayments(filter, {
    page: normalizedPage,
    limit: normalizedLimit,
    sort,
  });
};

const handlePaymentFailure = async ({
  razorpayOrderId,
  failureReason = "",
  gatewayResponse = {},
}) => {
  const payment =
    await paymentRepository.getPaymentByRazorpayOrderId(razorpayOrderId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  // Already successful payment ko FAILED mat karo
  if (payment.status === "SUCCESS") {
    throw new ApiError(400, "Successful payment cannot be marked as failed");
  }

  // Already failed payment
  if (payment.status === "FAILED") {
    return payment;
  }

  const updatedPayment = await paymentRepository.updatePayment(payment._id, {
    status: "FAILED",
    failureReason,
    gatewayResponse,
  });

  await orderRepository.updateOrder(payment.order._id || payment.order, {
    paymentStatus: "Failed",
  });

  return updatedPayment;
};

/*                                  Export                                    */


export default {
  createPayment,
  verifyPayment,
  getPaymentByOrder,
  refundPayment,
  getAllPayments,
  handlePaymentFailure,
};
