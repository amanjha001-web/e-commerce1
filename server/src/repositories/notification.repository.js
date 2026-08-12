import Notification from "../models/Notification.model.js";

/*                           Create Notification                              */

const createNotification = async (notificationData) => {
  return await Notification.create(notificationData);
};

/*                       Get Notification By Id                               */

const getNotificationById = async (notificationId) => {
  return await Notification.findById(notificationId).populate(
    "user",
    "fullName username email avatar",
  );
};

/*                      Get My Notifications                                  */

const getMyNotifications = async (filter, options) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

  const skip = (page - 1) * limit;

  const [notifications, totalNotifications] = await Promise.all([
    Notification.find(filter).sort(sort).skip(skip).limit(limit),

    Notification.countDocuments(filter),
  ]);

  return {
    notifications,

    pagination: {
      total: totalNotifications,
      page,
      limit,
      totalPages: Math.ceil(totalNotifications / limit),
    },
  };
};

/*                          Update Notification                               */

const updateNotification = async (notificationId, updateData) => {
  return await Notification.findByIdAndUpdate(notificationId, updateData, {
    new: true,
    runValidators: true,
  });
};

/*                          Mark As Read                                      */

const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                     Mark All Notifications As Read                         */

const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    {
      user: userId,
      isDeleted: false,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );
};

/*                        Get Unread Count                                    */

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    user: userId,
    isDeleted: false,
    isRead: false,
  });
};

/*                        Delete Notification                                 */

const deleteNotification = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                     Clear All Notifications                                */

const clearAllNotifications = async (userId) => {
  return await Notification.updateMany(
    {
      user: userId,
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    },
  );
};

export default {
  createNotification,
  getNotificationById,
  getMyNotifications,
  updateNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  clearAllNotifications,
};
