
import mongoose from "mongoose";

import Vendor from "../models/Vendor.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";
import VendorEarning from "../models/VendorEarning.model.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const getVendorProfile = async (userId) => {
  return Vendor.findOne({
    user: userId,
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
  })
    .populate("user", "name email")
    .lean();
};

const getProductStats = async (userId) => {
  const vendorUserId = toObjectId(userId);

  const [result] = await Product.aggregate([
    {
      $match: {
        vendor: vendorUserId,
        status: { $ne: "archived" },
      },
    },
    {
      $facet: {
        totalProducts: [{ $count: "count" }],

        lowStockProducts: [
          {
            $match: {
              isActive: true,
              stock: { $lte: 5 },
            },
          },
          { $count: "count" },
        ],

        topProducts: [
          { $sort: { sold: -1, createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 1,
              name: 1,
              title: 1,
              thumbnail: 1,
              images: 1,
              price: 1,
              sold: 1,
              stock: 1,
              status: 1,
            },
          },
        ],
      },
    },
  ]);

  return {
    totalProducts: result?.totalProducts?.[0]?.count ?? 0,
    lowStockProducts: result?.lowStockProducts?.[0]?.count ?? 0,
    topProducts: result?.topProducts ?? [],
  };
};

const getOrderStats = async (userId) => {
  const vendorUserId = toObjectId(userId);

  const [result] = await Order.aggregate([
    {
      $match: {
        "items.vendor": vendorUserId,
      },
    },
    {
      $unwind: "$items",
    },
    {
      $match: {
        "items.vendor": vendorUserId,
      },
    },
    {
      $group: {
        _id: "$_id",
        orderStatus: { $first: "$orderStatus" },
        createdAt: { $first: "$createdAt" },
        paymentStatus: { $first: "$paymentStatus" },

        itemSales: {
          $sum: {
            $ifNull: ["$items.totalPrice", 0],
          },
        },

        itemEarnings: {
          $sum: {
            $ifNull: ["$items.vendorAmount", 0],
          },
        },
      },
    },
    {
      $addFields: {
        normalizedOrderStatus: {
          $toLower: {
            $ifNull: ["$orderStatus", ""],
          },
        },
        normalizedPaymentStatus: {
          $toLower: {
            $ifNull: ["$paymentStatus", ""],
          },
        },
      },
    },
    {
      $group: {
        _id: null,

        // Unique orders containing this vendor's items.
        totalOrders: {
          $sum: 1,
        },

        // Failed/refunded payments should not count as pending orders.
        pendingOrders: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$normalizedOrderStatus", "pending"] },
                  {
                    $not: [
                      {
                        $in: [
                          "$normalizedPaymentStatus",
                          ["failed", "refunded"],
                        ],
                      },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },

        deliveredOrders: {
          $sum: {
            $cond: [
              { $eq: ["$normalizedOrderStatus", "delivered"] },
              1,
              0,
            ],
          },
        },

        // Sales include paid orders except cancelled/returned/refunded orders.
        totalSales: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$normalizedPaymentStatus", "paid"] },
                  {
                    $not: [
                      {
                        $in: [
                          "$normalizedOrderStatus",
                          ["cancelled", "returned", "refunded"],
                        ],
                      },
                    ],
                  },
                ],
              },
              "$itemSales",
              0,
            ],
          },
        },

        deliveredItemEarnings: {
          $sum: {
            $cond: [
              { $eq: ["$normalizedOrderStatus", "delivered"] },
              "$itemEarnings",
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    totalOrders: result?.totalOrders ?? 0,
    pendingOrders: result?.pendingOrders ?? 0,
    deliveredOrders: result?.deliveredOrders ?? 0,
    totalSales: result?.totalSales ?? 0,
    deliveredItemEarnings: result?.deliveredItemEarnings ?? 0,
  };
};


const getEarningStats = async (vendorId) => {
  const [result] = await VendorEarning.aggregate([
    {
      $match: {
        vendor: toObjectId(vendorId),
      },
    },
    {
      $lookup: {
        from: Order.collection.name,
        localField: "order",
        foreignField: "_id",
        as: "orderData",
      },
    },
    {
      $unwind: {
        path: "$orderData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        normalizedOrderStatus: {
          $toLower: {
            $ifNull: ["$orderData.orderStatus", ""],
          },
        },
        normalizedPaymentStatus: {
          $toLower: {
            $ifNull: ["$orderData.paymentStatus", ""],
          },
        },
      },
    },
    {
      $group: {
        _id: null,

        // Pending earnings count only for paid, eligible orders.
        pending: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "pending"] },
                  { $eq: ["$normalizedPaymentStatus", "paid"] },
                  {
                    $not: [
                      {
                        $in: [
                          "$normalizedOrderStatus",
                          ["cancelled", "returned", "refunded"],
                        ],
                      },
                    ],
                  },
                ],
              },
              { $ifNull: ["$netEarning", 0] },
              0,
            ],
          },
        },

        available: {
          $sum: {
            $cond: [
              { $eq: ["$status", "available"] },
              { $ifNull: ["$netEarning", 0] },
              0,
            ],
          },
        },

        withdrawn: {
          $sum: {
            $cond: [
              { $eq: ["$status", "withdrawn"] },
              { $ifNull: ["$netEarning", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    pending: result?.pending ?? 0,
    available: result?.available ?? 0,
    withdrawn: result?.withdrawn ?? 0,
  };
};


const getRecentOrders = async (userId) => {
  return Order.find({
    "items.vendor": userId,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select(
      "_id orderNumber orderStatus paymentStatus totalAmount createdAt items",
    )
    .lean();
};

const vendorDashboardRepository = {
  getVendorProfile,
  getProductStats,
  getOrderStats,
  getEarningStats,
  getRecentOrders,
};

export default vendorDashboardRepository;
