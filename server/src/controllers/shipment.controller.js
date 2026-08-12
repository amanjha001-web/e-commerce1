import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import shipmentService from "../services/shipment.service.js";

/*                           Create Shipment                                  */

const createShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.createShipment(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, shipment, "Shipment created successfully."));
});

/*                           Get Shipment By Id                               */

const getShipmentById = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentById(req.params.shipmentId);

  return res.json(
    new ApiResponse(200, shipment, "Shipment fetched successfully."),
  );
});

/*                         Get Shipment By Order                              */

const getShipmentByOrder = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentByOrder(req.params.orderId);

  return res.json(
    new ApiResponse(200, shipment, "Shipment fetched successfully."),
  );
});

/*                      Get Shipment By Tracking Id                           */

const getShipmentByTrackingId = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.getShipmentByTrackingId(
    req.params.trackingId,
  );

  return res.json(
    new ApiResponse(200, shipment, "Shipment fetched successfully."),
  );
});

/*                          Get All Shipments                                */

const getAllShipments = asyncHandler(async (req, res) => {
  const { page, limit, sort, ...filter } = req.query;

  const shipments = await shipmentService.getShipments(filter, {
    page,
    limit,
    sort,
  });

  return res.json(
    new ApiResponse(200, shipments, "Shipments fetched successfully."),
  );
});

/*                      Get Vendor Shipments                                  */

const getVendorShipments = asyncHandler(async (req, res) => {
  const { page, limit, sort } = req.query;

  const shipments = await shipmentService.getVendorShipments(req.user.vendor, {
    page,
    limit,
    sort,
  });

  return res.json(
    new ApiResponse(200, shipments, "Vendor shipments fetched successfully."),
  );
});

/*                          Update Shipment                                   */

const updateShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.updateShipment(
    req.params.shipmentId,
    req.body,
  );

  return res.json(
    new ApiResponse(200, shipment, "Shipment updated successfully."),
  );
});

/*                      Update Shipment Status                                */

const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  const shipment = await shipmentService.updateShipmentStatus(
    req.params.shipmentId,
    status,
    req.user._id,
    message,
  );

  return res.json(
    new ApiResponse(200, shipment, "Shipment status updated successfully."),
  );
});

/*                          Delete Shipment                                   */

const deleteShipment = asyncHandler(async (req, res) => {
  const shipment = await shipmentService.deleteShipment(req.params.shipmentId);

  return res.json(
    new ApiResponse(200, shipment, "Shipment deleted successfully."),
  );
});

export default{
  createShipment,
  getShipmentById,
  getShipmentByOrder,
  getShipmentByTrackingId,
  getAllShipments,
  getVendorShipments,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
};
