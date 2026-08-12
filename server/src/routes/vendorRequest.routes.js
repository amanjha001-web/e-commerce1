import { Router } from "express";

import {
  vendorRequestController
} from "../controllers/index.js";

import {
  validate,
  authMiddleware as verifyJWT,
  authorize,
  uploadVendorDocuments,
} from "../middlewares/index.js";

import {
  createVendorRequestSchema,
  updateVendorRequestSchema,
  vendorRequestIdSchema,
  rejectVendorRequestSchema,
  vendorRequestQuerySchema,
} from "../validators/index.js";

import { ROLES } from "../constants/roles.js";

const router = Router();

/*                             Customer Routes                                */

router.post(
  "/",
  verifyJWT,
  authorize(ROLES.CUSTOMER),
  validate(createVendorRequestSchema),
  vendorRequestController.submitVendorRequest,
);

router.get(
  "/me",
  verifyJWT,
  authorize(ROLES.CUSTOMER, ROLES.VENDOR),
  vendorRequestController.getMyRequest,
);

router.patch(
  "/:id",
  verifyJWT,
  authorize(ROLES.CUSTOMER),
  validate(updateVendorRequestSchema),
  vendorRequestController.updateVendorRequest,
);

router.post(
  "/:id/documents",
  verifyJWT,
  authorize(ROLES.CUSTOMER),
  uploadVendorDocuments,
  validate(vendorRequestIdSchema),
  vendorRequestController.uploadVendorDocuments,
);

/*                              Admin Routes                                  */

router.get(
  "/",
  verifyJWT,
  authorize(ROLES.ADMIN),
  validate(vendorRequestQuerySchema),
  vendorRequestController.getAllVendorRequests,
);

router.get(
  "/:id",
  verifyJWT,
  authorize(ROLES.ADMIN),
  validate(vendorRequestIdSchema),
  vendorRequestController.getVendorRequestById,
);

router.patch(
  "/:id/review",
  verifyJWT,
  authorize(ROLES.ADMIN),
  validate(vendorRequestIdSchema),
  vendorRequestController.markUnderReview,
);

router.patch(
  "/:id/approve",
  verifyJWT,
  authorize(ROLES.ADMIN),
  validate(vendorRequestIdSchema),
  vendorRequestController.approveVendorRequest,
);

router.patch(
  "/:id/reject",
  verifyJWT,
  authorize(ROLES.ADMIN),
  validate(rejectVendorRequestSchema),
  vendorRequestController.rejectVendorRequest,
);

router.delete(
  "/:id",
  verifyJWT,
  authorize(ROLES.ADMIN),
  validate(vendorRequestIdSchema),
  vendorRequestController.deleteVendorRequest,
);

router.patch(
  "/:id/restore",
  verifyJWT,
  authorize(ROLES.ADMIN),
  validate(vendorRequestIdSchema),
  vendorRequestController.restoreVendorRequest,
);

export { router as vendorRequestRoutes };
