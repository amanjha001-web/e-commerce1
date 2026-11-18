import mongoose from 'mongoose';
import { Conversation } from '../../models/Conversation.model.js';
import { Message } from '../../models/Message.model.js';
import { User } from '../../models/User.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { getIO } from '../../config/socket.js';
import { uploadToCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';
import { notificationService } from './notification.service.js';
import { ADMIN_ROLES } from '../../constants/roles.constant.js';

const PARTICIPANT_SELECT = 'fullName name username email avatar role';
const SUPPORT_ROLE_FILTER = [...new Set([...ADMIN_ROLES, 'admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'])];

const formatDisplayName = (user, fallback = 'Someone') =>
  user?.fullName || user?.name || user?.username || fallback;

const ensureValidObjectId = (id, label = 'ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

export class ChatService {
  async getAvailableContacts(userId) {
    const [supportUsers, approvedVendors] = await Promise.all([
      User.find({
        role: { $in: SUPPORT_ROLE_FILTER },
        isActive: { $ne: false },
        _id: { $ne: userId },
      })
        .select(PARTICIPANT_SELECT)
        .limit(10),
      Vendor.find({
        status: 'approved',
        isActive: { $ne: false },
        userId: { $ne: userId },
      })
        .populate('userId', PARTICIPANT_SELECT)
        .select('userId storeName logo')
        .limit(30),
    ]);

    const seen = new Set();
    const contacts = [];

    for (const admin of supportUsers || []) {
      const id = String(admin._id);
      if (seen.has(id)) continue;
      seen.add(id);
      contacts.push({
        _id: admin._id,
        name: formatDisplayName(admin, 'Customer Support'),
        label: 'Customer Support',
        role: 'support',
        email: admin.email || '',
        avatar: admin.avatar,
      });
    }

    for (const vendor of approvedVendors || []) {
      const vendorUser = vendor?.userId;
      const targetUserId = vendorUser?._id || vendorUser;
      if (!targetUserId) continue;
      const id = String(targetUserId);
      if (seen.has(id)) continue;
      seen.add(id);
      contacts.push({
        _id: targetUserId,
        vendorId: vendor._id,
        name: vendor.storeName || formatDisplayName(vendorUser, 'Seller'),
        label: 'Verified Seller',
        role: 'vendor',
        email: vendorUser?.email || '',
        avatar: vendor.logo?.url ? vendor.logo : vendorUser?.avatar,
      });
    }

    return contacts;
  }

  async getConversations(userId) {
    const [conversations, unreadMessages] = await Promise.all([
      Conversation.find({ participants: userId })
        .populate('participants', PARTICIPANT_SELECT)
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: PARTICIPANT_SELECT },
        })
        .sort({ updatedAt: -1 }),
      Message.find({ recipient: userId, isRead: false }).select('conversationId'),
    ]);

    const unreadByConv = {};
    for (const msg of unreadMessages || []) {
      const key = String(msg.conversationId);
      unreadByConv[key] = (unreadByConv[key] || 0) + 1;
    }

    return (conversations || []).map((conv) => {
      const plain = conv.toObject ? conv.toObject() : { ...conv };
      const mapCount =
        typeof conv.unreadCounts?.get === 'function'
          ? conv.unreadCounts.get(String(userId))
          : plain.unreadCounts?.[String(userId)];
      plain.unreadCount = unreadByConv[String(plain._id)] ?? Number(mapCount || 0);
      return plain;
    });
  }

  async getConversationById(conversationId, userId) {
    ensureValidObjectId(conversationId, 'conversation ID');

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    })
      .populate('participants', PARTICIPANT_SELECT)
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: PARTICIPANT_SELECT },
      });

    if (!conv) throw ApiError.notFound('Conversation not found');
    return conv;
  }

  async createConversation(userId, payload = {}) {
    let targetRecipientId = payload.recipientId || payload.participantId;

    if (payload.type === 'support' || targetRecipientId === 'support') {
      const supportUser = await User.findOne({
        role: { $in: SUPPORT_ROLE_FILTER },
        isActive: { $ne: false },
        _id: { $ne: userId },
      }).select('_id');
      if (!supportUser) {
        throw ApiError.notFound('No customer support representative is available right now');
      }
      targetRecipientId = supportUser._id;
    } else if (!targetRecipientId && payload.vendorId) {
      ensureValidObjectId(payload.vendorId, 'vendor ID');
      const vendor = await Vendor.findById(payload.vendorId).select('userId');
      if (!vendor?.userId) {
        throw ApiError.notFound('Seller account not found');
      }
      targetRecipientId = vendor.userId;
    }

    if (!targetRecipientId) {
      throw ApiError.badRequest('Recipient ID is required');
    }
    ensureValidObjectId(targetRecipientId, 'recipient ID');

    if (String(targetRecipientId) === String(userId)) {
      throw ApiError.badRequest('Cannot start a conversation with yourself');
    }

    const recipientUser = await User.findById(targetRecipientId).select('_id isActive');
    if (!recipientUser) {
      throw ApiError.notFound('Recipient user not found');
    }

    let conv = await Conversation.findOne({
      participants: { $all: [userId, targetRecipientId], $size: 2 },
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [userId, targetRecipientId],
      });
    }

    return conv.populate('participants', PARTICIPANT_SELECT);
  }

  async getMessages(conversationId, userId) {
    ensureValidObjectId(conversationId, 'conversation ID');

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conv) throw ApiError.notFound('Conversation not found');

    return Message.find({ conversationId })
      .populate('sender', PARTICIPANT_SELECT)
      .sort({ createdAt: 1 });
  }

  async sendMessage(conversationId, userId, payload = {}) {
    ensureValidObjectId(conversationId, 'conversation ID');

    const cleanContent = String(
      payload.content ?? payload.text ?? payload.message ?? ''
    ).trim();
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

    if (!cleanContent && attachments.length === 0) {
      throw ApiError.badRequest('Message content cannot be empty');
    }

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conv) throw ApiError.notFound('Conversation not found');

    const targetRecipient =
      payload.recipientId ||
      conv.participants.find((p) => String(p) !== String(userId));

    const msg = await Message.create({
      conversationId,
      sender: userId,
      recipient: targetRecipient,
      content: cleanContent,
      attachments,
    });

    conv.lastMessage = msg._id;
    if (
      targetRecipient &&
      String(targetRecipient) !== String(userId) &&
      conv.unreadCounts &&
      typeof conv.unreadCounts.set === 'function'
    ) {
      const key = String(targetRecipient);
      conv.unreadCounts.set(key, (Number(conv.unreadCounts.get(key)) || 0) + 1);
    }
    await conv.save();

    await msg.populate('sender', PARTICIPANT_SELECT);

    // Emit live message via Socket.IO
    getIO().to(`conversation:${conversationId}`).emit('new_message', msg);

    if (targetRecipient && String(targetRecipient) !== String(userId)) {
      getIO().to(`user:${targetRecipient}`).emit('new_message', msg);

      notificationService
        .createNotification({
          userId: targetRecipient,
          title: 'New Message Received',
          message: `${formatDisplayName(msg.sender)}: ${cleanContent.slice(0, 120) || 'Sent an attachment'}`,
          type: 'chat',
          link: `/chat/${conversationId}`,
          data: { conversationId, messageId: msg._id },
        })
        .catch(() => {});
    }

    return msg;
  }

  async markAsRead(messageId, userId) {
    ensureValidObjectId(messageId, 'message ID');

    const updated = await Message.findOneAndUpdate(
      { _id: messageId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!updated) throw ApiError.notFound('Message not found');
    return updated;
  }

  async markConversationAsRead(conversationId, userId) {
    ensureValidObjectId(conversationId, 'conversation ID');

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conv) throw ApiError.notFound('Conversation not found');

    await Message.updateMany(
      { conversationId, recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    if (conv.unreadCounts && typeof conv.unreadCounts.set === 'function') {
      conv.unreadCounts.set(String(userId), 0);
      await conv.save();
    }

    return { success: true };
  }

  async deleteConversation(conversationId, userId) {
    ensureValidObjectId(conversationId, 'conversation ID');

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conv) throw ApiError.notFound('Conversation not found');

    await Promise.all([
      Message.deleteMany({ conversationId }),
      Conversation.deleteOne({ _id: conversationId }),
    ]);

    return { success: true, message: 'Conversation removed' };
  }

  async deleteMessage(messageId, userId) {
    ensureValidObjectId(messageId, 'message ID');

    const msg = await Message.findOneAndDelete({ _id: messageId, sender: userId });
    if (!msg) throw ApiError.notFound('Message not found');

    const latestMsg = await Message.findOne({ conversationId: msg.conversationId })
      .sort({ createdAt: -1 })
      .select('_id');
    await Conversation.updateOne(
      { _id: msg.conversationId },
      { lastMessage: latestMsg?._id || null }
    );

    return { success: true, message: 'Message removed' };
  }

  async getUnreadCount(userId) {
    const count = await Message.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return { unreadCount: count };
  }

  async uploadAttachment(conversationId, userId, file) {
    ensureValidObjectId(conversationId, 'conversation ID');
    if (!file) throw ApiError.badRequest('File is required');

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conv) throw ApiError.notFound('Conversation not found');

    const uploaded = await uploadToCloudinary(file.buffer, 'chat-attachments');
    return uploaded;
  }
}

export const chatService = new ChatService();
export default chatService;
