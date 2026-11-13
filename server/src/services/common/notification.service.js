import { Notification } from '../../models/Notification.model.js';
import { parsePagination } from '../../utils/helpers.js';
import { getIO } from '../../config/socket.js';

export class NotificationService {
  async getNotifications(userId, params = {}) {
    const { page, limit, skip } = parsePagination(params);
    const filter = { userId };

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({ userId, isRead: false });
    return { unreadCount: count };
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  async createNotification({ userId, title, message, type = 'system', data = {} }) {
    const notif = await Notification.create({
      userId,
      title,
      message,
      type,
      data,
    });

    getIO().to(`user:${userId}`).emit('notification', notif);
    return notif;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
