import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import notificationService from "../services/notification.service.js";

/*                          Create Notification                               */

const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(req.body);

  return res
    .status(201)
    .json(
      new ApiResponse(201, notification, "Notification created successfully"),
    );
});

/*                         Get My Notifications                               */

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getMyNotifications(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, notifications, "Notifications fetched successfully"),
    );
});

/*                        Get Notification By Id                              */

const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(
    req.params.notificationId,
    req.user._id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, notification, "Notification fetched successfully"),
    );
});
/*                           Mark Notification Read                           */

const markAsRead = asyncHandler(
  async (req, res) => {
    const notification =
      await notificationService.markAsRead(
        req.params.notificationId,
        req.user._id,
      );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          notification,
          "Notification marked as read successfully",
        ),
      );
  },
);

/*                        Mark All Notifications Read                         */

const markAllAsRead =
  asyncHandler(async (req, res) => {
    const result =
      await notificationService.markAllAsRead(
        req.user._id,
      );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "All notifications marked as read successfully",
        ),
      );
  })
/*                         Get Unread Notification Count                      */

const getUnreadCount =
  asyncHandler(async (req, res) => {
    const unreadCount =
      await notificationService.getUnreadCount(
        req.user._id,
      );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          unreadCount,
          "Unread notification count fetched successfully",
        ),
      );
  });

/*                           Delete Notification                              */

const deleteNotification =
  asyncHandler(async (req, res) => {
    const result =
      await notificationService.deleteNotification(
        req.params.notificationId,
        req.user._id,
      );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Notification deleted successfully",
        ),
      );
  })
/*                         Clear All Notifications                            */

const clearAllNotifications =
  asyncHandler(async (req, res) => {
    const result =
      await notificationService.clearAllNotifications(
        req.user._id,
      );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "All notifications cleared successfully",
        ),
      );
  });

/*                                  Export                                    */

export default {
  createNotification,

  getMyNotifications,

  getNotificationById,

  markAsRead,

  markAllAsRead,

  getUnreadCount,

  deleteNotification,

  clearAllNotifications,
};