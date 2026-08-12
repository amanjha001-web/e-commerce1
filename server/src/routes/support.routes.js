import { Router } from "express";

import {supportController} from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";
import { authorize } from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  createSupportTicketSchema,
  updateSupportTicketSchema,
  assignTicketSchema,
  resolveTicketSchema,
  closeTicketSchema,
  ticketIdSchema,
  supportQuerySchema,
} from "../validators/support.validator.js";

const router = Router();

/*                              User Routes                                   */

router.post(
  "/",
  authMiddleware,
  validate(createSupportTicketSchema),
  supportController.createSupportTicket,
);

router.get(
  "/my-tickets",
  authMiddleware,
  validate(supportQuerySchema),
  supportController.getMyTickets,
);

router.get(
  "/:ticketId",
  authMiddleware,
  validate(ticketIdSchema),
  supportController.getTicketById,
);

router.patch(
  "/:ticketId",
  authMiddleware,
  validate(updateSupportTicketSchema),
  supportController.updateTicket,
);

router.delete(
  "/:ticketId",
  authMiddleware,
  validate(ticketIdSchema),
  supportController.deleteTicket,
);

router.patch(
  "/:ticketId/close",
  authMiddleware,
  validate(closeTicketSchema),
  supportController.closeTicket,
);

/*                              Admin Routes                                  */

router.get(
  "/admin/all",
  authMiddleware,
  authorize("ADMIN"),
  validate(supportQuerySchema),
  supportController.getAllTickets,
);

router.patch(
  "/:ticketId/assign",
  authMiddleware,
  authorize("ADMIN"),
  validate(assignTicketSchema),
  supportController.assignTicket,
);

router.patch(
  "/:ticketId/resolve",
  authMiddleware,
  authorize("ADMIN"),
  validate(resolveTicketSchema),
  supportController.resolveTicket,
);

export default router;
