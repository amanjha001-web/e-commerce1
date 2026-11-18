import mongoose from 'mongoose';
import { Notification } from '../../models/Notification.model.js';
import { User } from '../../models/User.model.js';
import { Order } from '../../models/Order.model.js';
import { VendorRequest } from '../../models/VendorRequest.model.js';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { ROLES } from '../../constants/roles.constant.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination } from '../../utils/helpers.js';
import { getIO } from '../../config/socket.js';

const VALID_TYPES = new Set([
  'order',
  'payment',
  'product',
  'vendor',
  'system',
  'chat',
  'promotion',
  'general',
]);

const buildUserFilter = (userId) => ({ $or: [{ userId }, { user: userId }] });

export class NotificationService {
  constructor() {
    this.pendingSyncs = new Map();
  }

  /**
   * One-time safe backfill for existing customer activity (orders, vendor requests, support tickets)
   * when a user has not yet had notifications synced and currently has zero notifications.
   */
  async syncUserActivityNotifications(userId) {
    if (!userId || mongoose.connection.readyState !== 1) return;

    const syncKey = String(userId);
    if (this.pendingSyncs.has(syncKey)) {
      return this.pendingSyncs.get(syncKey);
    }

    const syncPromise = (async () => {
      try {
        const existingCount = await Notification.countDocuments(buildUserFilter(userId));
        if (existingCount > 0) {
          await User.updateOne(
            { _id: userId, notificationsSynced: { $ne: true } },
            { $set: { notificationsSynced: true } }
          ).catch(() => {});
          return;
        }

        const claimedUser = await User.findOneAndUpdate(
          { _id: userId, notificationsSynced: { $ne: true } },
          { $set: { notificationsSynced: true } },
          { new: false }
        );

        if (!claimedUser) return;

        const [orders, vendorRequests, tickets] = await Promise.all([
          Order.find(buildUserFilter(userId)).sort({ createdAt: -1 }).limit(15).lean(),
          VendorRequest.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(5).lean(),
          SupportTicket.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
        ]);

        const docs = [];

        for (const order of orders) {
          const status = String(order.orderStatus || 'pending').toLowerCase();
          const orderLabel = order.orderNumber || String(order._id).slice(-8);
          const link = `/orders/${order._id}`;
          let title = 'Order Placed';
          let message = `Your order #${orderLabel} (₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}) was placed and is currently ${status.replace(/_/g, ' ')}.`;

          if (status === 'cancelled') {
            title = 'Order Cancelled';
            message = `Your order #${orderLabel} has been cancelled.`;
          } else if (status === 'delivered') {
            title = 'Order Delivered';
            message = `Your order #${orderLabel} has been delivered.`;
          } else if (status === 'shipped') {
            title = 'Order Shipped';
            message = `Your order #${orderLabel} has been shipped.`;
          } else if (status === 'confirmed') {
            title = 'Order Confirmed';
            message = `Your order #${orderLabel} (₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}) is confirmed.`;
          }

          docs.push({
            userId,
            title,
            message,
            type: 'order',
            link,
            data: { orderId: order._id, orderNumber: order.orderNumber, status, link },
            isRead: false,
            createdAt: order.updatedAt || order.createdAt || new Date(),
            updatedAt: order.updatedAt || order.createdAt || new Date(),
          });
        }

        for (const reqDoc of vendorRequests) {
          const status = String(reqDoc.status || 'pending').toLowerCase();
          const store = reqDoc.storeName || reqDoc.shopName || reqDoc.businessName || 'Your Store';
          let title = 'Seller Application Submitted';
          let message = `Your seller application for "${store}" is currently ${status.replace(/_/g, ' ')}.`;
          let link = '/seller/request-status';

          if (status === 'approved') {
            title = 'Seller Application Approved';
            message = `Congratulations! Your seller application for "${store}" has been approved.`;
            link = '/vendor';
          } else if (status === 'rejected') {
            title = 'Seller Application Rejected';
            message = `Your seller application for "${store}" was rejected${reqDoc.rejectionReason ? `: ${reqDoc.rejectionReason}` : '.'}`;
          }

          docs.push({
            userId,
            title,
            message,
            type: 'vendor',
            link,
            data: { requestId: reqDoc._id, status, link },
            isRead: false,
            createdAt: reqDoc.updatedAt || reqDoc.createdAt || new Date(),
            updatedAt: reqDoc.updatedAt || reqDoc.createdAt || new Date(),
          });
        }

        for (const ticket of tickets) {
          docs.push({
            userId,
            title: `Support Ticket #${ticket.ticketId || String(ticket._id).slice(-6)}`,
            message: `${ticket.subject} — Status: ${String(ticket.status || 'open').replace(/_/g, ' ')}`,
            type: 'system',
            link: '/support',
            data: { ticketId: ticket._id, ticketCode: ticket.ticketId, link: '/support' },
            isRead: false,
            createdAt: ticket.updatedAt || ticket.createdAt || new Date(),
            updatedAt: ticket.updatedAt || ticket.createdAt || new Date(),
          });
        }

        if (docs.length > 0) {
          await Notification.insertMany(docs, { ordered: false }).catch(() => {});
        }
      } catch {
        // Never block notification retrieval if backfill fails
      } finally {
        this.pendingSyncs.delete(syncKey);
      }
    })();

    this.pendingSyncs.set(syncKey, syncPromise);
    return syncPromise;
  }

  async getNotifications(userId, params = {}) {
    await this.syncUserActivityNotifications(userId);

    const { page, limit, skip } = parsePagination({
      ...params,
      limit: params.limit || 50,
    });

    const baseFilter = buildUserFilter(userId);
    const conditions = [baseFilter];

    if (params.isRead === 'true' || params.isRead === true || params.status === 'read') {
      conditions.push({ isRead: true });
    } else if (params.isRead === 'false' || params.isRead === false || params.status === 'unread') {
      conditions.push({ isRead: false });
    }

    if (params.type && VALID_TYPES.has(String(params.type).toLowerCase())) {
      conditions.push({ type: String(params.type).toLowerCase() });
    }

    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };
      conditions.push({ $or: [{ title: regex }, { message: regex }] });
    }

    const filter = conditions.length > 1 ? { $and: conditions } : baseFilter;

    const [notifications, total, totalCount, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments(baseFilter),
      Notification.countDocuments({ ...baseFilter, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      totalCount,
      readCount: Math.max(0, totalCount - unreadCount),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId) {
    await this.syncUserActivityNotifications(userId);
    const count = await Notification.countDocuments({ ...buildUserFilter(userId), isRead: false });
    return { unreadCount: count };
  }

  async getNotificationById(notificationId, userId) {
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, ...buildUserFilter(userId) },
      { isRead: true },
      { new: true }
    );
    if (!notif) throw ApiError.notFound('Notification not found');
    return notif;
  }

  async markAsRead(notificationId, userId) {
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, ...buildUserFilter(userId) },
      { isRead: true },
      { new: true }
    );
    if (!notif) throw ApiError.notFound('Notification not found');
    return notif;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ ...buildUserFilter(userId), isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(notificationId, userId) {
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      ...buildUserFilter(userId),
    });
    if (!deleted) throw ApiError.notFound('Notification not found');
    return deleted;
  }

  async clearNotifications(userId) {
    await Notification.deleteMany(buildUserFilter(userId));
    await User.updateOne({ _id: userId }, { $set: { notificationsSynced: true } }).catch(() => {});
    return { message: 'All notifications cleared' };
  }

  async createNotification({ userId, title, message, type = 'system', link = '', data = {} }) {
    const targetUserId = userId?._id || userId;
    if (!targetUserId) return null;

    const normalizedType = VALID_TYPES.has(String(type).toLowerCase())
      ? String(type).toLowerCase()
      : 'system';

    const resolvedLink = link || data?.link || '';
    const mergedData = resolvedLink ? { ...(data || {}), link: resolvedLink } : data || {};

    const notif = await Notification.create({
      userId: targetUserId,
      title: String(title || 'Notification').trim(),
      message: String(message || '').trim() || 'You have a new update.',
      type: normalizedType,
      link: resolvedLink,
      data: mergedData,
    });

    try {
      getIO().to(`user:${targetUserId}`).emit('notification', notif);
    } catch {
      // Socket emission is best-effort
    }

    return notif;
  }

  async notifyAdmins({ title, message, type = 'system', link = '', data = {} }) {
    try {
      if (mongoose.connection.readyState !== 1) return [];
      const admins = await User.find({
        role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
        isActive: true,
      }).select('_id');

      if (!admins.length) return [];

      return await Promise.all(
        admins.map((admin) =>
          this.createNotification({
            userId: admin._id,
            title,
            message,
            type,
            link,
            data,
          }).catch(() => null)
        )
      );
    } catch {
      return [];
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
