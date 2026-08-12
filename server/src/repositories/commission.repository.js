import Commission from "../models/Commission.model.js";

/*                           Create Commission                                */

const createCommission = async (commissionData, session = null) => {
  const options = session ? { session } : {};

  const [commission] = await Commission.create([commissionData], options);

  return commission;
};

/*                         Find Commission By Id                              */

const findById = async (commissionId) => {
  return Commission.findById(commissionId)
    .populate("vendor", "shopName businessName")
    .populate("order", "orderNumber status")
    .populate("orderItem")
    .populate("payout")
    .populate("createdBy", "fullName email");
};

/*                     Find Commission By Order Item                          */

const findByOrderItem = async (orderItemId) => {
  return Commission.findOne({
    orderItem: orderItemId,
  });
};

/*                       Find Vendor Commissions                              */

const findByVendor = async (vendorId, options = {}) => {
  const {
    page = 1,

    limit = 10,

    status,

    sort = {
      createdAt: -1,
    },
  } = options;

  const filter = {
    vendor: vendorId,
  };

  if (status) {
    filter.status = status;
  }

  return Commission.find(filter)

    .populate("order", "orderNumber")

    .populate("orderItem")

    .skip((page - 1) * limit)

    .limit(limit)

    .sort(sort);
};

/*                     Find By Order                                          */

const findByOrder = async (orderId) => {
  return Commission.find({
    order: orderId,
  });
};

/*                     Find By Status                                         */

const findByStatus = async (status, options = {}) => {
  const {
    page = 1,

    limit = 20,
  } = options;

  return Commission.find({
    status,
  })

    .populate("vendor", "shopName")

    .populate("order", "orderNumber")

    .skip((page - 1) * limit)

    .limit(limit)

    .sort({
      createdAt: -1,
    });
};

/*                      Count Vendor Commission                               */

const countVendorCommissions = async (vendorId) => {
  return Commission.countDocuments({
    vendor: vendorId,
  });
};

/*                        Count Pending                                       */

const countPending = async (vendorId) => {
  return Commission.countDocuments({
    vendor: vendorId,

    status: "pending",
  });
};
/*                         Commission Summary                                 */

const getSummary = async (
  vendorId
) => {

  const [summary] = await Commission.aggregate([

    {
      $match: {
        vendor: vendorId,
      },
    },

    {
      $group: {

        _id: "$vendor",

        totalSale: {
          $sum: "$saleAmount",
        },

        totalCommission: {
          $sum: "$commissionAmount",
        },

        totalVendorAmount: {
          $sum: "$vendorAmount",
        },

        pendingCommission: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$status",
                  "pending",
                ],
              },
              "$commissionAmount",
              0,
            ],
          },
        },

        approvedCommission: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$status",
                  "approved",
                ],
              },
              "$commissionAmount",
              0,
            ],
          },
        },

        paidCommission: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$status",
                  "paid",
                ],
              },
              "$commissionAmount",
              0,
            ],
          },
        },

        totalOrders: {
          $sum: 1,
        },

      },
    },

  ]);



  return (
    summary || {

      totalSale: 0,

      totalCommission: 0,

      totalVendorAmount: 0,

      pendingCommission: 0,

      approvedCommission: 0,

      paidCommission: 0,

      totalOrders: 0,

    }
  );

};





/*                        Update Commission                                   */

const updateCommission = async (
  commissionId,
  updateData,
  session = null
) => {

  const options = {
    new: true,
  };

  if (session) {
    options.session = session;
  }

  return Commission.findByIdAndUpdate(
    commissionId,
    updateData,
    options
  );

};





/*                        Mark Commission Paid                                */

const markPaid = async (
  commissionId,
  payoutId,
  session = null
) => {

  const options = {
    new: true,
  };

  if (session) {
    options.session = session;
  }

  return Commission.findByIdAndUpdate(

    commissionId,

    {
      status: "paid",

      payout: payoutId,

      paidAt: new Date(),

    },

    options

  );

};





/*                        Pending Payouts                                     */

const getPendingPayouts = async (
  vendorId
) => {

  return Commission.find({

    vendor: vendorId,

    status: "approved",

  })

    .populate(
      "order",
      "orderNumber"
    )

    .populate(
      "orderItem"
    )

    .sort({
      createdAt: 1,
    });

};





/*                           Delete Commission                                */

const deleteCommission = async (
  commissionId
) => {

  return Commission.findByIdAndDelete(
    commissionId
  );

};





/*                              Export                                        */

export default {

  createCommission,

  findById,

  findByVendor,

  findByOrderItem,

  findByOrder,

  findByStatus,

  countVendorCommissions,

  countPending,

  getSummary,

  updateCommission,

  markPaid,

  getPendingPayouts,

  deleteCommission,

};