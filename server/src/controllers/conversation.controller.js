import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import conversationService from "../services/conversation.service.js";

/*                    Create Conversation                              */

const createConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.createConversation(
    req.user._id,
    req.body,
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, conversation, "Conversation created successfully."),
    );
});

/*                 Get Conversation By Id                              */

const getConversationById = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await conversationService.getConversationById(
    conversationId,
    req.user._id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, conversation, "Conversation fetched successfully."),
    );
});

/*                  Get My Conversations                               */

const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await conversationService.getUserConversations(
    req.user._id,
    req.query,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        conversations,
        "Conversations fetched successfully.",
      ),
    );
});

/*                    Update Conversation                               */

const updateConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await conversationService.updateConversation(
    conversationId,
    req.user._id,
    req.body,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, conversation, "Conversation updated successfully."),
    );
});

/*                    Close Conversation                                */

const closeConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await conversationService.closeConversation(
    conversationId,
    req.user._id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, conversation, "Conversation closed successfully."),
    );
});

/*                    Delete Conversation                               */

const deleteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  await conversationService.deleteConversation(conversationId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Conversation deleted successfully."));
});

/*                              Export                                    */

export default {
  createConversation,
  getConversationById,
  getMyConversations,
  updateConversation,
  closeConversation,
  deleteConversation,
};
