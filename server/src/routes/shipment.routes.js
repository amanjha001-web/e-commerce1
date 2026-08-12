import { Router } from "express";

import {shipmentController} from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";
import { authorize } from "../middlewares/index.js";

const router = Router();

/*                              Public Routes                                 */

// Track shipment
router.get("/track/:trackingId", shipmentController.getShipmentByTrackingId);

/*                              Vendor Routes                                 */

router.get(
  "/vendor/my-shipments",
  authMiddleware,
  authorize("VENDOR"),
  shipmentController.getVendorShipments,
);

/*                              Admin Routes                                  */

// Create shipment
router.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  shipmentController.createShipment,
);

// Get all shipments
router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  shipmentController.getAllShipments,
);

// Get shipment by id
router.get(
  "/:shipmentId",
  authMiddleware,
  authorize("ADMIN"),
  shipmentController.getShipmentById,
);

// Get shipment by order id
router.get(
  "/order/:orderId",
  authMiddleware,
  authorize("ADMIN"),
  shipmentController.getShipmentByOrder,
);

// Update shipment
router.patch(
  "/:shipmentId",
  authMiddleware,
  authorize("ADMIN"),
  shipmentController.updateShipment,
);

// Update shipment status
router.patch(
  "/:shipmentId/status",
  authMiddleware,
  authorize("ADMIN", "VENDOR"),
  shipmentController.updateShipmentStatus,
);

// Soft delete shipment
router.delete(
  "/:shipmentId",
  authMiddleware,
  authorize("ADMIN"),
  shipmentController.deleteShipment,
);

export default router;
