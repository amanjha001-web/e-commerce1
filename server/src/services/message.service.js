import mongoose from "mongoose";

import messageRepository from "../repositories/message.repository.js";
import Conversation from "../models/Conversation.model.js";

import ApiError from "../utils/ApiError.js";

/*                    Validate ObjectId                    */

const validateObjectId = (id, message) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, message);
  }
};

/*                 Get Conversation & Authorization          */

const getAuthorizedConversation = async (conversationId, userId) => {
  validateObjectId(conversationId, "Invalid conversation id.");

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new ApiError(404, "Conversation not found.");
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId.toString(),
  );

  if (!isParticipant) {
    throw new ApiError(
      403,
      "You are not authorized to access this conversation.",
    );
  }

  return conversation;
};

/*                    Create Message                    */

const createMessage = async (userId, messageData) => {
  const {
    conversation: conversationId,
    message,
    attachments = [],
    messageType = "TEXT",
  } = messageData;

  const conversation = await getAuthorizedConversation(conversationId, userId);

  if (conversation.isClosed) {
    throw new ApiError(400, "Cannot send message in a closed conversation.");
  }

  if (messageType === "TEXT" && !message?.trim()) {
    throw new ApiError(400, "Message cannot be empty.");
  }

  if (["IMAGE", "FILE"].includes(messageType) && attachments.length === 0) {
    throw new ApiError(400, "Attachment is required for this message type.");
  }

  const createdMessage = await messageRepository.createMessage({
    conversation: conversationId,
    sender: userId,
    message: message?.trim() || undefined,
    attachments,
    messageType,
  });

  /*             Update conversation last message             */

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: createdMessage._id,
  });

  return messageRepository.getMessageById(createdMessage._id);
};

/*                 Get Message By Id                    */

const getMessageById = async (messageId, userId) => {
  validateObjectId(messageId, "Invalid message id.");

  const message = await messageRepository.getMessageById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found.");
  }

  await getAuthorizedConversation(message.conversation._id, userId);

  return message;
};

/*              Get Messages By Conversation             */

const getMessagesByConversation = async (
  conversationId,
  userId,
  query = {},
) => {
  await getAuthorizedConversation(conversationId, userId);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;

  return messageRepository.getMessagesByConversation(conversationId, {
    page,
    limit,
  });
};

/*                    Update Message                    */

const updateMessage = async (messageId, userId, updateData) => {
  validateObjectId(messageId, "Invalid message id.");

  const message = await messageRepository.getMessageById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found.");
  }

  await getAuthorizedConversation(message.conversation._id, userId);

  if (message.sender._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this message.");
  }

  if (!updateData.message?.trim()) {
    throw new ApiError(400, "Message cannot be empty.");
  }

  return messageRepository.updateMessage(messageId, {
    message: updateData.message.trim(),
  });
};

/*                    Delete Message                    */

const deleteMessage = async (messageId, userId) => {
  validateObjectId(messageId, "Invalid message id.");

  const message = await messageRepository.getMessageById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found.");
  }

  await getAuthorizedConversation(message.conversation._id, userId);

  if (message.sender._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this message.");
  }

  await messageRepository.deleteMessage(messageId);

  return true;
};

/*                         Export                         */

export default {
  createMessage,
  getMessageById,
  getMessagesByConversation,
  updateMessage,
  deleteMessage,
};
