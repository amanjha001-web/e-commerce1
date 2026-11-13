import { chatService } from '../../services/common/chat.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user._id);
  return ApiResponse.success(res, conversations, 'Conversations retrieved');
});

export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await chatService.getConversationById(req.params.conversationId, req.user._id);
  return ApiResponse.success(res, conversation, 'Conversation details');
});

export const createConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.createConversation(req.user._id, req.body);
  return ApiResponse.created(res, conversation, 'Conversation started');
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(req.params.conversationId, req.user._id);
  return ApiResponse.success(res, messages, 'Messages retrieved');
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.params.conversationId, req.user._id, req.body);
  return ApiResponse.created(res, message, 'Message sent');
});

export const markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await chatService.markAsRead(req.params.messageId, req.user._id);
  return ApiResponse.success(res, message, 'Message marked as read');
});

export const markConversationAsRead = asyncHandler(async (req, res) => {
  const result = await chatService.markConversationAsRead(req.params.conversationId, req.user._id);
  return ApiResponse.success(res, result, 'Conversation marked as read');
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await chatService.getUnreadCount(req.user._id);
  return ApiResponse.success(res, count, 'Unread message count');
});

export const uploadAttachment = asyncHandler(async (req, res) => {
  const result = await chatService.uploadAttachment(req.params.conversationId, req.user._id, req.file);
  return ApiResponse.success(res, result, 'Attachment uploaded');
});
