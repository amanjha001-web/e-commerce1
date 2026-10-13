import VendorEarning from "../models/VendorEarning.model.js";

/*                       Create Vendor Earnings                              */

const createMany = async (earningData, session = null) => {
  if (!earningData.length) {
    return [];
  }

  return VendorEarning.insertMany(earningData, {
    session,
  });
};

/*                    Update Earnings By Order                               */

const updateStatusByOrder = async (orderId, status, session = null) => {
  const filter = {
    order: orderId,
    status: { $ne: "withdrawn" },
  };

  const update = {
    $set: { status },
  };

  if (status === "available") {
    update.$set.availableAt = new Date();
  }

  const options = session ? { session } : {};

  return VendorEarning.updateMany(filter, update, options);
};

/*                       Get Earnings By Order                               */

const getByOrder = async (orderId, session = null) => {
  let query = VendorEarning.find({
    order: orderId,
  });

  if (session) {
    query = query.session(session);
  }

  return query.lean();
};

export default {
  createMany,
  updateStatusByOrder,
  getByOrder,
};
