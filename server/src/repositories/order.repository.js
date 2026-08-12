import Order from "../models/Order.model.js";

/*                              Create Order                                  */

const createOrder = async (orderData, session = null) => {
  const order = await Order.create([orderData], {
    session,
  });

  return order[0];
};

/*                             Get Order By Id                                */

const getOrderById = async (orderId) => {
  return await Order.findById(orderId)
    .populate("user", "fullName email phone")
    .populate("items.product", "name slug thumbnail")
    .populate("items.vendor", "shopName shopSlug")
    .lean();
};

/*                         Get Order By Number                                */

const getOrderByNumber = async (orderNumber) => {
  return await Order.findOne({
    orderNumber,
  })
    .populate("user", "fullName email phone")
    .populate("items.product", "name slug thumbnail")
    .populate("items.vendor", "shopName shopSlug")
    .lean();
};

/*                           Get User Orders                                  */

const getOrdersByUser = async (userId, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const skip = (page - 1) * limit;

  const query = {
    user: userId,
  };

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate("items.product", "name slug thumbnail")
      .populate("items.vendor", "shopName")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Order.countDocuments(query),
  ]);

  return {
    orders,

    pagination: {
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalOrders / limit),
      hasPrevPage: page > 1,
    },
  };
};
/*                            Get All Orders                                  */

const getAllOrders = async (
  filter = {},
  options = {},
) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const [orders, totalOrders] =
    await Promise.all([
      Order.find(filter)
        .populate(
          "user",
          "fullName email phone",
        )
        .populate(
          "items.product",
          "name slug thumbnail",
        )
        .populate(
          "items.vendor",
          "shopName shopSlug",
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter),
    ]);

  return {
    orders,

    pagination: {
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      limit,
      hasNextPage:
        page < Math.ceil(totalOrders / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                        Get Vendor Orders                                   */

const getVendorOrders = async (
  vendorId,
  options = {},
) => {
  const {
    page = 1,
    limit = 10,
  } = options;

  const skip = (page - 1) * limit;

  const query = {
    "items.vendor": vendorId,
  };

  const [orders, totalOrders] =
    await Promise.all([
      Order.find(query)
        .populate(
          "user",
          "fullName email phone",
        )
        .populate(
          "items.product",
          "name slug thumbnail",
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(query),
    ]);

  return {
    orders,

    pagination: {
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      limit,
      hasNextPage:
        page < Math.ceil(totalOrders / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                      Get Orders By Status                                  */

const getOrdersByStatus = async (
  orderStatus,
) => {
  return await Order.find({
    orderStatus,
  })
    .populate(
      "user",
      "fullName email",
    )
    .sort({
      createdAt: -1,
    })
    .lean();
};

/*                  Get Orders By Payment Status                              */

const getOrdersByPaymentStatus = async (
  paymentStatus,
) => {
  return await Order.find({
    paymentStatus,
  })
    .populate(
      "user",
      "fullName email",
    )
    .sort({
      createdAt: -1,
    })
    .lean();
};

/*                        Get Recent Orders                                   */

const getRecentOrders = async (
  limit = 10,
) => {
  return await Order.find()
    .populate(
      "user",
      "fullName email",
    )
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .lean();
};
/*                            Update Order                                    */

const updateOrder = async (
  orderId,
  updateData,
  session = null,
) => {
  return await Order.findByIdAndUpdate(
    orderId,
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  )
    .populate(
      "user",
      "fullName email phone",
    )
    .populate(
      "items.product",
      "name slug thumbnail",
    )
    .populate(
      "items.vendor",
      "shopName shopSlug",
    );
};

/*                        Update Order Status                                 */

const updateOrderStatus = async (
  orderId,
  orderStatus,
  session = null,
) => {
  const updateData = {
    orderStatus,
  };

  if (orderStatus === "Delivered") {
    updateData.deliveredAt = new Date();
  }

  if (orderStatus === "Cancelled") {
    updateData.cancelledAt = new Date();
  }

  return await Order.findByIdAndUpdate(
    orderId,
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                      Update Payment Status                                 */

const updatePaymentStatus = async (
  orderId,
  paymentStatus,
  session = null,
) => {
  const updateData = {
    paymentStatus,
  };

  if (paymentStatus === "Paid") {
    updateData.paidAt = new Date();
  }

  return await Order.findByIdAndUpdate(
    orderId,
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                         Mark As Delivered                                  */

const markAsDelivered = async (
  orderId,
  session = null,
) => {
  return await Order.findByIdAndUpdate(
    orderId,
    {
      orderStatus: "Delivered",
      deliveredAt: new Date(),
    },
    {
      new: true,
      session,
    },
  );
};

/*                           Cancel Order                                     */

const cancelOrder = async (
  orderId,
  session = null,
) => {
  return await Order.findByIdAndUpdate(
    orderId,
    {
      orderStatus: "Cancelled",
      cancelledAt: new Date(),
    },
    {
      new: true,
      session,
    },
  );
}
/*                           Delete Order (Admin Only)                        */

const deleteOrder = async (
  orderId,
  session = null,
) => {
  return await Order.findByIdAndDelete(
    orderId,
    {
      session,
    },
  );
};

/*                           Count All Orders                                 */

const countOrders = async (
  filter = {},
) => {
  return await Order.countDocuments(filter);
};

/*                       Count Pending Orders                                 */

const countPendingOrders = async () => {
  return await Order.countDocuments({
    orderStatus: "Pending",
  });
};

/*                      Count Delivered Orders                                */

const countDeliveredOrders = async () => {
  return await Order.countDocuments({
    orderStatus: "Delivered",
  });
};

/*                      Count Cancelled Orders                                */

const countCancelledOrders = async () => {
  return await Order.countDocuments({
    orderStatus: "Cancelled",
  });
};

/*                         Get Total Revenue                                  */

const getTotalRevenue = async () => {
  const result = await Order.aggregate([
    {
      $match: {
        paymentStatus: "Paid",
        orderStatus: {
          $ne: "Cancelled",
        },
      },
    },
    {
      $group: {
        _id: null,

        totalRevenue: {
          $sum: "$totalAmount",
        },

        totalOrders: {
          $sum: 1,
        },
      },
    },
  ]);

  return (
    result[0] || {
      totalRevenue: 0,
      totalOrders: 0,
    }
  );
};

/*                                  Export                                    */

export default {
  createOrder,

  getOrderById,
  getOrderByNumber,

  getOrdersByUser,
  getAllOrders,
  getVendorOrders,

  getOrdersByStatus,
  getOrdersByPaymentStatus,
  getRecentOrders,

  updateOrder,
  updateOrderStatus,
  updatePaymentStatus,

  markAsDelivered,
  cancelOrder,

  deleteOrder,

  countOrders,
  countPendingOrders,
  countDeliveredOrders,
  countCancelledOrders,

  getTotalRevenue,
};