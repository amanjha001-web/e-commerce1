import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import chatService from "../services/chat.service.js";

/*                               Create Chat                                  */

const createChat = asyncHandler(async (req, res) => {
  const chat = await chatService.createChat(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, chat, "Chat created successfully."));
});

/*                              Get Chat By Id                                */

const getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await chatService.getChatById(chatId);

  return res.json(new ApiResponse(200, chat, "Chat fetched successfully."));
});

/*                      Get Chats By Conversation                             */

const getChatsByConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const result = await chatService.getChatsByConversation(
    conversationId,
    req.query,
  );

  return res.json(new ApiResponse(200, result, "Chats fetched successfully."));
});

/*                             Get User Chats                                 */

const getUserChats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await chatService.getUserChats(userId, req.query);

  return res.json(
    new ApiResponse(200, result, "User chats fetched successfully."),
  );
});

/*                              Update Chat                                   */

const updateChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await chatService.updateChat(chatId, req.body);

  return res.json(new ApiResponse(200, chat, "Chat updated successfully."));
});

/*                        Update User Presence                                */

const updatePresence = asyncHandler(async (req, res) => {
  const { conversationId, userId } = req.params;

  const chat = await chatService.updatePresence(
    conversationId,
    userId,
    req.body,
  );

  return res.json(new ApiResponse(200, chat, "Presence updated successfully."));
});

/*                           Get Online Users                                 */

const getOnlineUsers = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const users = await chatService.getOnlineUsers(conversationId);

  return res.json(
    new ApiResponse(200, users, "Online users fetched successfully."),
  );
});

/*                      Get Online Users Count                                */

const getOnlineUsersCount = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const count = await chatService.getOnlineUsersCount(conversationId);

  return res.json(
    new ApiResponse(200, { count }, "Online users count fetched successfully."),
  );
});

/*                              Delete Chat                                   */

const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  await chatService.deleteChat(chatId);

  return res.json(new ApiResponse(200, null, "Chat deleted successfully."));
});

export default{
  createChat,
  getChatById,
  getChatsByConversation,
  getUserChats,
  updateChat,
  updatePresence,
  getOnlineUsers,
  getOnlineUsersCount,
  deleteChat,
};

