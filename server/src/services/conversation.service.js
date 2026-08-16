import mongoose from "mongoose";

import conversationRepository from "../repositories/conversation.repository.js";
import userRepository from "../repositories/user.repository.js";
import ApiError from "../utils/ApiError.js";

/*                         Validate ObjectId                              */

const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}.`);
  }
};

/*                     Validate Participants                              */

const validateParticipants = async (participants) => {
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new ApiError(400, "Conversation must have at least 2 participants.");
  }

  const uniqueParticipants = [
    ...new Set(participants.map((id) => id.toString())),
  ];

  if (uniqueParticipants.length !== participants.length) {
    throw new ApiError(400, "Conversation participants must be unique.");
  }

  for (const participantId of participants) {
    validateObjectId(participantId, "participant id");

    const user = await userRepository.getUserById(participantId);

    if (!user) {
      throw new ApiError(404, `User not found: ${participantId}`);
    }
  }
};

/*                     Create Conversation                                */

const createConversation = async (userId, conversationData) => {
  validateObjectId(userId, "user id");

  const { participants, type = "CUSTOMER_SUPPORT" } = conversationData;

  const allowedTypes = ["CUSTOMER_VENDOR", "CUSTOMER_SUPPORT", "VENDOR_ADMIN"];

  if (!allowedTypes.includes(type)) {
    throw new ApiError(400, "Invalid conversation type.");
  }

  await validateParticipants(participants);

  /*
   * Logged-in user must be one of the participants.
   */

  const isParticipant = participants.some(
    (participantId) => participantId.toString() === userId.toString(),
  );

  if (!isParticipant) {
    throw new ApiError(403, "You must be a participant in the conversation.");
  }

  /*
   * Prevent duplicate conversation.
   */

  const existingConversation =
    await conversationRepository.findConversationByParticipants(
      participants,
      type,
    );

  if (existingConversation) {
    throw new ApiError(409, "Conversation already exists.");
  }

  return await conversationRepository.createConversation({
    participants,
    type,
  });
};

/*                    Get Conversation By Id                              */

const getConversationById = async (conversationId, userId) => {
  validateObjectId(conversationId, "conversation id");

  validateObjectId(userId, "user id");

  const conversation =
    await conversationRepository.getConversationById(conversationId);

  if (!conversation) {
    throw new ApiError(404, "Conversation not found.");
  }

  /*
   * User isolation.
   */

  const isParticipant = conversation.participants.some(
    (participant) => participant._id.toString() === userId.toString(),
  );

  if (!isParticipant) {
    throw new ApiError(
      403,
      "You are not authorized to access this conversation.",
    );
  }

  return conversation;
};

/*                    Get User Conversations                              */

const getUserConversations = async (userId, query = {}) => {
  validateObjectId(userId, "user id");

  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  return await conversationRepository.getConversationsByUser(userId, {
    page,
    limit,
  });
};

/*                       Update Conversation                               */

const updateConversation = async (conversationId, userId, updateData) => {
  const conversation = await getConversationById(conversationId, userId);

  if (conversation.isClosed) {
    throw new ApiError(400, "Conversation is already closed.");
  }

  const allowedFields = {};

  if (typeof updateData.isClosed === "boolean") {
    allowedFields.isClosed = updateData.isClosed;
  }

  if (Object.keys(allowedFields).length === 0) {
    throw new ApiError(400, "No valid fields to update.");
  }

  return await conversationRepository.updateConversation(
    conversationId,
    allowedFields,
  );
};

/*                       Close Conversation                                */

const closeConversation = async (conversationId, userId) => {
  await getConversationById(conversationId, userId);

  return await conversationRepository.closeConversation(conversationId);
};

/*                      Delete Conversation                                */

const deleteConversation = async (conversationId, userId) => {
  await getConversationById(conversationId, userId);

  const conversation =
    await conversationRepository.deleteConversation(conversationId);

  if (!conversation) {
    throw new ApiError(404, "Conversation not found.");
  }

  return true;
};

export default {
  createConversation,

  getConversationById,

  getUserConversations,

  updateConversation,

  closeConversation,

  deleteConversation,
};
