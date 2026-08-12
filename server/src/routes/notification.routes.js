import { Router } from "express";

import {notificationController} from "../controllers/index.js";

import {authMiddleware as verifyJWT} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  notificationIdSchema,
  createNotificationSchema,
  notificationQuerySchema,
} from "../validators/index.js";

const router = Router();

/*                             Protected Routes                               */

router.use(verifyJWT);

/*                          Create Notification                               */

router.post(
  "/",
  validate(createNotificationSchema),
  notificationController.createNotification,
);

/*                         Get My Notifications                               */

router.get(
  "/",
  validate(notificationQuerySchema),
  notificationController.getMyNotifications,
);

/*                      Get Unread Notification Count                         */

router.get("/unread-count", notificationController.getUnreadCount);

/*                     Mark All Notifications As Read                         */

router.patch("/mark-all-read", notificationController.markAllAsRead);

/*                     Clear All Notifications                                */

router.delete("/clear", notificationController.clearAllNotifications);

/*                      Get Notification By Id                                */

router.get(
  "/:notificationId",
  validate(notificationIdSchema),
  notificationController.getNotificationById,
);

/*                     Mark Notification As Read                              */

router.patch(
  "/:notificationId/read",
  validate(notificationIdSchema),
  notificationController.markAsRead,
);

/*                       Delete Notification                                  */

router.delete(
  "/:notificationId",
  validate(notificationIdSchema),
  notificationController.deleteNotification,
);

/*                                  Export                                    */

export default router;
