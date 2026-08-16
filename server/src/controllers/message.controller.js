import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import messageService from "../services/message.service.js";

/*                         Create Message                         */

const createMessage = asyncHandler(async (req, res) => {
  const message = await messageService.createMessage(req.user._id, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, message, "Message sent successfully."));
});

/*                       Get Message By Id                       */

const getMessageById = asyncHandler(async (req, res) => {
  const message = await messageService.getMessageById(
    req.params.messageId,
    req.user._id,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message fetched successfully."));
});

/*                 Get Messages By Conversation                 */

const getMessagesByConversation = asyncHandler(async (req, res) => {
  const result = await messageService.getMessagesByConversation(
    req.params.conversationId,
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Messages fetched successfully."));
});

/*                         Update Message                         */

const updateMessage = asyncHandler(async (req, res) => {
  const message = await messageService.updateMessage(
    req.params.messageId,
    req.user._id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message updated successfully."));
});

/*                         Delete Message                         */

const deleteMessage = asyncHandler(async (req, res) => {
  await messageService.deleteMessage(req.params.messageId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Message deleted successfully."));
});

export default {
  createMessage,
  getMessageById,
  getMessagesByConversation,
  updateMessage,
  deleteMessage,
};
