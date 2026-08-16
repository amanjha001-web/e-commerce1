import Message from "../models/Message.model.js";

/*                         Create Message                         */

const createMessage = async (messageData, session = null) => {
  const message = await Message.create([messageData], {
    session,
  });

  return message[0];
};

/*                       Get Message By Id                       */

const getMessageById = async (messageId) => {
  return await Message.findById(messageId)
    .populate("sender", "fullName username avatar")
    .populate("conversation")
    .lean();
};

/*                    Get Messages By Conversation               */

const getMessagesByConversation = async (conversationId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  const skip = (page - 1) * limit;

  const query = {
    conversation: conversationId,
  };

  const [messages, totalMessages] = await Promise.all([
    Message.find(query)
      .populate("sender", "fullName username avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Message.countDocuments(query),
  ]);

  return {
    messages,

    pagination: {
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalMessages / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                         Update Message                         */

const updateMessage = async (messageId, updateData, session = null) => {
  return await Message.findByIdAndUpdate(messageId, updateData, {
    new: true,
    runValidators: true,
    session,
  })
    .populate("sender", "fullName username avatar")
    .lean();
};

/*                         Delete Message                         */

const deleteMessage = async (messageId, session = null) => {
  return await Message.findByIdAndDelete(messageId, { session });
};

/*                         Read Message                           */

const markAsRead = async (messageId, session = null) => {
  return await Message.findByIdAndUpdate(
    messageId,
    {
      isRead: true,
      readAt: new Date(),
    },
    {
      new: true,
      session,
    },
  )
    .populate("sender", "fullName username avatar")
    .lean();
};

export default {
  createMessage,
  getMessageById,
  getMessagesByConversation,
  updateMessage,
  deleteMessage,
  markAsRead,
};
