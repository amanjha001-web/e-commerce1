import ApiError from "../utils/ApiError.js";

import notificationRepository from "../repositories/notification.repository.js";


/*                              Helper Functions                              */


const getNotification = async (notificationId) => {
  const notification =
    await notificationRepository.getNotificationById(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

const validateOwnership = (notification, userId) => {
  if (notification.user._id.toString() !== userId.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to access this notification",
    );
  }
};


/*                           Create Notification                              */


const createNotification = async (notificationData) => {
  const {
    user,
    title,
    message,
    type = "SYSTEM",
    priority = "MEDIUM",
    resourceType = "NONE",
    resourceId = null,
    data = {},
    actionUrl = "",
    sentVia = ["APP"],
    scheduledFor = null,
    expiresAt = null,
  } = notificationData;

  if (!user) {
    throw new ApiError(400, "User is required");
  }

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  if (!message?.trim()) {
    throw new ApiError(400, "Message is required");
  }

  const notification = await notificationRepository.createNotification({
    user,

    title: title.trim(),

    message: message.trim(),

    type,

    priority,

    resourceType,

    resourceId,

    data,

    actionUrl,

    sentVia,

    scheduledFor,

    expiresAt,
  });

  return notification;
};

/*                         Get My Notifications                               */


const getMyNotifications = async (
  userId,
  query = {},
) => {
  const {
    page = 1,
    limit = 10,
    type,
    status,
    isRead,
    priority,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {
    user: userId,
    isDeleted: false,
  };

  /*                       ilters                       /

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (isRead !== undefined) {
    filter.isRead =
      isRead === "true";
  }

  /*                        Sort                       */

  const sort = {
    [sortBy]:
      order === "asc"
        ? 1
        : -1,
  };

  return await notificationRepository.getMyNotifications(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};


/*                      Get Notification By Id                                */


const getNotificationById = async (
  notificationId,
  userId,
) => {
  const notification =
    await getNotification(
      notificationId,
    );

  validateOwnership(
    notification,
    userId,
  );

  return notification;
};
/*                         Mark Notification As Read                          */


const markAsRead = async (
  notificationId,
  userId,
) => {
  const notification =
    await getNotification(
      notificationId,
    );

  validateOwnership(
    notification,
    userId,
  );

  if (notification.isRead) {
    return notification;
  }

  return await notificationRepository.updateNotification(
    notificationId,
    {
      isRead: true,
      readAt: new Date(),
    },
  );
};


/*                      Mark All Notifications As Read                        */


const markAllAsRead = async (
  userId,
) => {
  await notificationRepository.markAllAsRead(
    userId,
    {
      isRead: true,
      readAt: new Date(),
    },
  );

  return {
    success: true,
    message:
      "All notifications marked as read successfully",
  };
};
/*                      Get Unread Notification Count                         */


const getUnreadCount = async (
  userId,
) => {
  const unreadCount =
    await notificationRepository.countUnreadNotifications(
      userId,
    );

  return {
    unreadCount,
  };
};


/*                          Delete Notification                               */


const deleteNotification = async (
  notificationId,
  userId,
) => {
  const notification =
    await getNotification(
      notificationId,
    );

  validateOwnership(
    notification,
    userId,
  );

  await notificationRepository.updateNotification(
    notificationId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
  );

  return {
    success: true,
    message:
      "Notification deleted successfully",
  };
};
/*                       Clear All Notifications                              */


const clearAllNotifications = async (
  userId,
) => {
  await notificationRepository.clearAllNotifications(
    userId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
  );

  return {
    success: true,
    message:
      "All notifications cleared successfully",
  };
};


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