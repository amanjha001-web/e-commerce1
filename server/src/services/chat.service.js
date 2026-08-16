import mongoose from "mongoose";

import chatRepository from "../repositories/chat.repository.js";

import ApiError from "../utils/ApiError.js";


/*                               Create Chat                                  */


const createChat = async (chatData) => {
  const { conversation, user } = chatData;

  const existingChat = await chatRepository.findChatByConversationAndUser(
    conversation,
    user,
  );

  if (existingChat) {
    throw new ApiError(409, "Chat already exists for this conversation.");
  }

  return chatRepository.createChat(chatData);
};


/*                              Get Chat By Id                                */


const getChatById = async (chatId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chat id.");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  const chat = await chatRepository.findChatById(chatId);

  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  const isOwner =
    chat.user?._id?.toString() === userId.toString() ||
    chat.user?.toString() === userId.toString();

  const isParticipant = chat.conversation?.participants?.some(
    (participant) => participant.toString() === userId.toString(),
  );

  if (!isOwner && !isParticipant) {
    throw new ApiError(403, "You are not authorized to access this chat.");
  }

  return chat;
};


/*                         Get Chats By Conversation                          */


const getChatsByConversation = async (conversationId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, "Invalid conversation id.");
  }

  return chatRepository.findChatsByConversation(conversationId, {}, query);
};


/*                             Get User Chats                                 */


const getUserChats = async (userId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  return chatRepository.findChatsByUser(userId, {}, query);
};


/*                              Update Chat                                   */


const updateChat = async (chatId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chat id.");
  }

  const chat = await chatRepository.updateChat(chatId, updateData);

  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  return chat;
};


/*                        Update User Presence                                */


const updatePresence = async (conversationId, userId, presenceData) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, "Invalid conversation id.");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  const chat = await chatRepository.updatePresence(conversationId, userId, {
    ...presenceData,
    lastSeen: new Date(),
  });

  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  return chat;
};


/*                             Delete Chat                                    */


const deleteChat = async (chatId) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chat id.");
  }

  const chat = await chatRepository.deleteChat(chatId);

  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  return true;
};


/*                          Get Online Users                                  */


const getOnlineUsers = async (conversationId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, "Invalid conversation id.");
  }

  return chatRepository.findOnlineUsers(conversationId);
};


/*                       Count Online Users                                   */


const getOnlineUsersCount = async (conversationId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, "Invalid conversation id.");
  }

  return chatRepository.countOnlineUsers(conversationId);
};

export default {
  createChat,
  getChatById,
  getChatsByConversation,
  getUserChats,
  updateChat,
  updatePresence,
  deleteChat,
  getOnlineUsers,
  getOnlineUsersCount,
};
