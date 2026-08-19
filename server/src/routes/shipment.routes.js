import { Router } from "express";

import { shipmentController } from "../controllers/index.js";
import { authMiddleware, authorize, validate } from "../middlewares/index.js";

import shipmentValidator from "../validators/shipment.validator.js";

const router = Router();

/*                         Public Routes                         */

// Track shipment
router.get("/track/:trackingId", shipmentController.getShipmentByTrackingId);

/*                         Vendor Routes                         */

router.get(
  "/vendor/my-shipments",
  authMiddleware,
  authorize("vendor"),
  shipmentController.getVendorShipments,
);

/*                          Admin Routes                         */

// Create shipment
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(shipmentValidator.createShipment),
  shipmentController.createShipment,
);

// Get all shipments
router.get(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(shipmentValidator.getShipments),
  shipmentController.getAllShipments,
);

// Get shipment by id
router.get(
  "/:shipmentId",
  authMiddleware,
  authorize("admin"),
  validate(shipmentValidator.shipmentIdParam),
  shipmentController.getShipmentById,
);

// Get shipment by order id
router.get(
  "/order/:orderId",
  authMiddleware,
  authorize("admin"),
  validate(shipmentValidator.orderIdParam),
  shipmentController.getShipmentByOrder,
);

// Update shipment
router.patch(
  "/:shipmentId",
  authMiddleware,
  authorize("admin"),
  validate(shipmentValidator.updateShipment),
  shipmentController.updateShipment,
);

// Update shipment status
router.patch(
  "/:shipmentId/status",
  authMiddleware,
  authorize("admin", "vendor"),
  validate(shipmentValidator.updateShipmentStatus),
  shipmentController.updateShipmentStatus,
);

// Soft delete shipment
router.delete(
  "/:shipmentId",
  authMiddleware,
  authorize("admin"),
  validate(shipmentValidator.shipmentIdParam),
  shipmentController.deleteShipment,
);

export default router;
