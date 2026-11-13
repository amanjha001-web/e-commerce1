import { Conversation } from '../../models/Conversation.model.js';
import { Message } from '../../models/Message.model.js';
import { ApiError } from '../../utils/apiError.js';
import { getIO } from '../../config/socket.js';
import { uploadToCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

export class ChatService {
  async getConversations(userId) {
    return Conversation.find({ participants: userId })
      .populate('participants', 'name email avatar role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
  }

  async getConversationById(conversationId, userId) {
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).populate('participants', 'name email avatar role');

    if (!conv) throw ApiError.notFound('Conversation not found');
    return conv;
  }

  async createConversation(userId, { recipientId }) {
    if (!recipientId) throw ApiError.badRequest('Recipient ID is required');

    let conv = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [userId, recipientId],
      });
    }

    return conv.populate('participants', 'name email avatar role');
  }

  async getMessages(conversationId, userId) {
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conv) throw ApiError.notFound('Conversation not found');

    return Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
  }

  async sendMessage(conversationId, userId, { content, recipientId }) {
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });
    if (!conv) throw ApiError.notFound('Conversation not found');

    const msg = await Message.create({
      conversationId,
      sender: userId,
      recipient: recipientId,
      content,
    });

    conv.lastMessage = msg._id;
    await conv.save();

    await msg.populate('sender', 'name avatar');

    // Emit live message via Socket.IO
    getIO().to(`conversation:${conversationId}`).emit('new_message', msg);

    return msg;
  }

  async markAsRead(messageId, userId) {
    return Message.findOneAndUpdate(
      { _id: messageId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markConversationAsRead(conversationId, userId) {
    await Message.updateMany(
      { conversationId, recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return { success: true };
  }

  async getUnreadCount(userId) {
    const count = await Message.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return { unreadCount: count };
  }

  async uploadAttachment(conversationId, userId, file) {
    if (!file) throw ApiError.badRequest('File is required');
    const uploaded = await uploadToCloudinary(file.buffer, 'chat-attachments');
    return uploaded;
  }
}

export const chatService = new ChatService();
export default chatService;
