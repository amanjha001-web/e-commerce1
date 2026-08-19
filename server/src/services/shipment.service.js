import mongoose from "mongoose";

import shipmentRepository from "../repositories/shipment.repository.js";

import ApiError from "../utils/ApiError.js";

import Vendor from "../models/Vendor.model.js";

/*                           Allowed Status Flow                              */

const STATUS_FLOW = {
  PENDING: ["READY_TO_SHIP", "CANCELLED"],

  READY_TO_SHIP: ["PACKED", "CANCELLED"],

  PACKED: ["PICKED_UP", "CANCELLED"],

  PICKED_UP: ["SHIPPED"],

  SHIPPED: ["IN_TRANSIT"],

  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED"],

  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],

  FAILED: ["OUT_FOR_DELIVERY", "RETURNED"],

  DELIVERED: [],

  RETURNED: [],

  CANCELLED: [],
};

/*                           Create Shipment                                  */

const createShipment = async (shipmentData) => {
  const existingShipment = await shipmentRepository.findShipmentByOrder(
    shipmentData.order,
  );

  if (existingShipment) {
    throw new ApiError(409, "Shipment already exists for this order.");
  }

  shipmentData.history = [
    {
      status: "PENDING",
      message: "Shipment created.",
    },
  ];

  return shipmentRepository.createShipment(shipmentData);
};

/*                          Get Shipment By Id                                */

const getShipmentById = async (shipmentId) => {
  if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipment id.");
  }

  const shipment = await shipmentRepository.findShipmentById(shipmentId);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found.");
  }

  return shipment;
};

/*                         Get Shipment By Order                              */

const getShipmentByOrder = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order id.");
  }

  const shipment = await shipmentRepository.findShipmentByOrder(orderId);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found.");
  }

  return shipment;
};

/*                       Get Shipment By Tracking Id                          */

const getShipmentByTrackingId = async (trackingId) => {
  const shipment =
    await shipmentRepository.findShipmentByTrackingId(trackingId);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found.");
  }

  return shipment;
};

/*                           Get All Shipments                               */

const getShipments = async (filter = {}, query = {}) => {
  return shipmentRepository.findShipments(filter, query);
};

/*                        Get Vendor Shipments                               */

const getVendorShipments = async (userId, query = {}) => {
  const vendor = await Vendor.findOne({
    user: userId,
    deletedAt: null,
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor profile not found.");
  }

  return shipmentRepository.findVendorShipments(vendor._id, query);
};

/*                          Update Shipment                                  */

const updateShipment = async (shipmentId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipment id.");
  }

  const shipment = await shipmentRepository.updateShipment(
    shipmentId,
    updateData,
  );

  if (!shipment) {
    throw new ApiError(404, "Shipment not found.");
  }

  return shipment;
};

/*                      Update Shipment Status                               */

const updateShipmentStatus = async (
  shipmentId,
  status,
  updatedBy,
  message = "",
) => {
  const shipment = await getShipmentById(shipmentId);

  const allowedStatuses = STATUS_FLOW[shipment.status] || [];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Cannot change shipment status from ${shipment.status} to ${status}.`,
    );
  }

  const history = {
    status,
    message: message || `Shipment status updated to ${status}.`,
    updatedBy,
  };

  const updateData = {
    status,
  };

  switch (status) {
    case "PICKED_UP":
      updateData.pickupDate = new Date();
      break;

    case "SHIPPED":
      updateData.shippedDate = new Date();
      break;

    case "DELIVERED":
      updateData.deliveredDate = new Date();
      break;

    case "RETURNED":
      updateData.returnedAt = new Date();
      break;

    case "CANCELLED":
      updateData.cancelledAt = new Date();
      break;
  }

  await shipmentRepository.updateShipment(shipmentId, updateData);

  return shipmentRepository.addShipmentHistory(shipmentId, history);
};

/*                         Delete Shipment                                   */

const deleteShipment = async (shipmentId) => {
  if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipment id.");
  }

  const shipment = await shipmentRepository.softDeleteShipment(shipmentId);

  if (!shipment) {
    throw new ApiError(404, "Shipment not found.");
  }

  return shipment;
};

export default {
  createShipment,
  getShipmentById,
  getShipmentByOrder,
  getShipmentByTrackingId,
  getShipments,
  getVendorShipments,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
};
