import Shipment from "../models/Shipment.model.js";

/*                           Create Shipment                                  */

const createShipment = async (shipmentData, session = null) => {
  const [shipment] = await Shipment.create([shipmentData], {
    session,
  });

  return shipment;
};

/*                           Find Shipment By Id                              */

const findShipmentById = async (shipmentId) => {
  return Shipment.findOne({
    _id: shipmentId,
    isDeleted: false,
  })
    .populate("order")
    .populate("vendor")
    .populate("history.updatedBy", "name email");
};

/*                        Find Shipment By Order                              */

const findShipmentByOrder = async (orderId) => {
  return Shipment.findOne({
    order: orderId,
    isDeleted: false,
  })
    .populate("order")
    .populate("vendor");
};

/*                     Find Shipment By Tracking Id                           */

const findShipmentByTrackingId = async (trackingId) => {
  return Shipment.findOne({
    "courier.trackingId": trackingId,
    isDeleted: false,
  });
};

/*                        Find Vendor Shipments                               */

const findVendorShipments = async (vendorId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const shipments = await Shipment.find({
    vendor: vendorId,
    isDeleted: false,
  })
    .populate("order")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Shipment.countDocuments({
    vendor: vendorId,
    isDeleted: false,
  });

  return {
    shipments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                          Find All Shipments                                */

const findShipments = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const shipments = await Shipment.find({
    isDeleted: false,
    ...filter,
  })
    .populate("order")
    .populate("vendor")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Shipment.countDocuments({
    isDeleted: false,
    ...filter,
  });

  return {
    shipments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                         Update Shipment                                    */

const updateShipment = async (shipmentId, updateData, session = null) => {
  return Shipment.findByIdAndUpdate(shipmentId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                      Update Shipment Status                                */

const updateShipmentStatus = async (shipmentId, status, history) => {
  return Shipment.findByIdAndUpdate(
    shipmentId,
    {
      status,
      $push: {
        history,
      },
    },
    {
      new: true,
    },
  );
};

/*                          Add Shipment History                              */

const addShipmentHistory = async (shipmentId, history) => {
  return Shipment.findByIdAndUpdate(
    shipmentId,
    {
      $push: {
        history,
      },
    },
    {
      new: true,
    },
  );
};

/*                         Soft Delete Shipment                               */

const softDeleteShipment = async (shipmentId) => {
  return Shipment.findByIdAndUpdate(
    shipmentId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                          Count Shipments                                   */

const countShipments = async (filter = {}) => {
  return Shipment.countDocuments({
    isDeleted: false,
    ...filter,
  });
};

export default {
  createShipment,
  findShipmentById,
  findShipmentByOrder,
  findShipmentByTrackingId,
  findVendorShipments,
  findShipments,
  updateShipment,
  updateShipmentStatus,
  addShipmentHistory,
  softDeleteShipment,
  countShipments,
};
