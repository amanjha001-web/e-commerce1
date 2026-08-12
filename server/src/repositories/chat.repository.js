import Chat from "../models/Chat.model.js";

/*                               Create Chat                                  */

const createChat = async (chatData, session = null) => {
  const [chat] = await Chat.create([chatData], { session });
  return chat;
};

/*                           Find Chat By Id                                  */

const findChatById = async (chatId) => {
  return Chat.findById(chatId)
    .populate("user", "name email avatar")
    .populate("conversation");
};

/*                     Find Chat By Conversation & User                       */

const findChatByConversationAndUser = async (conversationId, userId) => {
  return Chat.findOne({
    conversation: conversationId,
    user: userId,
  });
};

/*                       Get Chats By Conversation                            */

const findChatsByConversation = async (
  conversationId,
  filter = {},
  options = {},
) => {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

  const skip = (page - 1) * limit;

  const chats = await Chat.find({
    conversation: conversationId,
    ...filter,
  })
    .populate("user", "name email avatar")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Chat.countDocuments({
    conversation: conversationId,
    ...filter,
  });

  return {
    chats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                         Get User Chats                                     */

const findChatsByUser = async (userId, filter = {}, options = {}) => {
  const { page = 1, limit = 20, sort = { updatedAt: -1 } } = options;

  const skip = (page - 1) * limit;

  const chats = await Chat.find({
    user: userId,
    ...filter,
  })
    .populate("conversation")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Chat.countDocuments({
    user: userId,
    ...filter,
  });

  return {
    chats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                         Update Chat                                        */

const updateChat = async (chatId, updateData, session = null) => {
  return Chat.findByIdAndUpdate(chatId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                Update User Presence                                        */

const updatePresence = async (conversationId, userId, updateData) => {
  return Chat.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                         Delete Chat                                        */

const deleteChat = async (chatId, session = null) => {
  return Chat.findByIdAndDelete(chatId, {
    session,
  });
};

/*                        Count Online Users                                  */

const countOnlineUsers = async (conversationId) => {
  return Chat.countDocuments({
    conversation: conversationId,
    online: true,
  });
};

/*                        Get Online Users                                    */

const findOnlineUsers = async (conversationId) => {
  return Chat.find({
    conversation: conversationId,
    online: true,
  }).populate("user", "name email avatar");
};

export default {
  createChat,
  findChatById,
  findChatByConversationAndUser,
  findChatsByConversation,
  findChatsByUser,
  updateChat,
  updatePresence,
  deleteChat,
  countOnlineUsers,
  findOnlineUsers,
};
