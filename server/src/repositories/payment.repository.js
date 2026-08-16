import Payment from "../models/Payment.model.js";

/*                              Create Payment                                */

const createPayment = async (paymentData, session = null) => {
  const payment = await Payment.create([paymentData], {
    session,
  });

  return payment[0];
};

/*                           Get Payment By Id                                */

const getPaymentById = async (paymentId) => {
  return await Payment.findById(paymentId)
    .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
    .populate("user", "fullName email phone")
    .lean();
};

/*                        Get Payment By Order Id                             */

const getPaymentByOrderId = async (orderId) => {
  return await Payment.findOne({
    order: orderId,
  })
    .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
    .populate("user", "fullName email phone")
    .lean();
};

/*                          Get Payments By User                              */

const getPaymentsByUser = async (userId, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const skip = (page - 1) * limit;

  const query = {
    user: userId,
  };

  const [payments, totalPayments] = await Promise.all([
    Payment.find(query)
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Payment.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalPayments / limit);

  return {
    payments,

    pagination: {
      totalPayments,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/*                    Get Payment By Razorpay Order Id                        */

const getPaymentByRazorpayOrderId = async (razorpayOrderId) => {
  return await Payment.findOne({
    razorpayOrderId,
  })
    .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
    .populate("user", "fullName email phone")
    .lean();
};

/*                   Get Payment By Razorpay Payment Id                       */

const getPaymentByPaymentId = async (razorpayPaymentId) => {
  return await Payment.findOne({
    razorpayPaymentId,
  })
    .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
    .populate("user", "fullName email phone")
    .lean();
};

/*                            Get All Payments                                */

const getAllPayments = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const [payments, totalPayments] = await Promise.all([
    Payment.find(filter)
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("user", "fullName email phone")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Payment.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalPayments / limit);

  return {
    payments,

    pagination: {
      totalPayments,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/*                             Update Payment                                 */

const updatePayment = async (paymentId, updateData, session = null) => {
  return await Payment.findByIdAndUpdate(paymentId, updateData, {
    new: true,
    runValidators: true,
    session,
  })
    .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
    .populate("user", "fullName email phone");
};

/*                         Update Payment Status                               */

const updatePaymentStatus = async (paymentId, status, session = null) => {
  const updateData = {
    status,
  };

  if (status === "SUCCESS") {
    updateData.paidAt = new Date();
  }

  if (status === "REFUNDED") {
    updateData.refundedAt = new Date();
  }

  return await Payment.findByIdAndUpdate(paymentId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                            Search Payments                                 */

const searchPayments = async (keyword) => {
  if (!keyword?.trim()) {
    return [];
  }

  return await Payment.find({
    $or: [
      {
        razorpayOrderId: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        razorpayPaymentId: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        transactionId: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
    ],
  })
    .populate("user", "fullName email phone")
    .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
    .lean();
};

/*                            Get Total Revenue                               */

const getTotalRevenue = async () => {
  const result = await Payment.aggregate([
    {
      $match: {
        status: "SUCCESS",
      },
    },
    {
      $group: {
        _id: null,

        totalRevenue: {
          $sum: "$amount",
        },

        totalPayments: {
          $sum: 1,
        },
      },
    },
  ]);

  return (
    result[0] || {
      totalRevenue: 0,
      totalPayments: 0,
    }
  );
};

/*                             Delete Payment                                 */

const deletePayment = async (paymentId, session = null) => {
  return await Payment.findByIdAndDelete(paymentId, {
    session,
  });
};

/*                                  Export                                    */

export default {
  createPayment,

  getPaymentById,
  getPaymentByOrderId,
  getPaymentsByUser,

  getPaymentByRazorpayOrderId,
  getPaymentByPaymentId,

  getAllPayments,

  updatePayment,
  updatePaymentStatus,

  searchPayments,

  getTotalRevenue,

  deletePayment,
};
