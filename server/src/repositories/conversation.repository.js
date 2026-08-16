import Conversation from "../models/Conversation.model.js";

/*                         Create Conversation                              */

const createConversation = async (conversationData, session = null) => {
  const conversation = await Conversation.create([conversationData], {
    session,
  });

  return conversation[0];
};

/*                     Get Conversation By Id                               */

const getConversationById = async (conversationId) => {
  return await Conversation.findById(conversationId)
    .populate("participants", "fullName username email avatar")
    .populate("lastMessage")
    .lean();
};

/*              Find Conversation By Participants                           */

const findConversationByParticipants = async (participants, type = null) => {
  const query = {
    participants: {
      $all: participants,
    },
  };

  if (type) {
    query.type = type;
  }

  return await Conversation.findOne(query)
    .populate("participants", "fullName username email avatar")
    .populate("lastMessage")
    .lean();
};

/*                        Get User Conversations                            */

const getConversationsByUser = async (userId, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const skip = (page - 1) * limit;

  const query = {
    participants: userId,
  };

  const [conversations, totalConversations] = await Promise.all([
    Conversation.find(query)
      .populate("participants", "fullName username email avatar")
      .populate("lastMessage")
      .sort({
        updatedAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Conversation.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalConversations / limit);

  return {
    conversations,

    pagination: {
      totalConversations,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/*                         Update Conversation                              */

const updateConversation = async (
  conversationId,
  updateData,
  session = null,
) => {
  return await Conversation.findByIdAndUpdate(conversationId, updateData, {
    new: true,
    runValidators: true,
    session,
  })
    .populate("participants", "fullName username email avatar")
    .populate("lastMessage");
};

/*                     Update Last Message                                  */

const updateLastMessage = async (conversationId, messageId, session = null) => {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    {
      lastMessage: messageId,
    },
    {
      new: true,
      session,
    },
  )
    .populate("participants", "fullName username email avatar")
    .populate("lastMessage");
};

/*                        Close Conversation                                */

const closeConversation = async (conversationId, session = null) => {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    {
      isClosed: true,
    },
    {
      new: true,
      session,
    },
  );
};

/*                        Delete Conversation                               */

const deleteConversation = async (conversationId, session = null) => {
  return await Conversation.findByIdAndDelete(conversationId, {
    session,
  });
};

/*                              Export                                       */

export default {
  createConversation,

  getConversationById,

  findConversationByParticipants,

  getConversationsByUser,

  updateConversation,

  updateLastMessage,

  closeConversation,

  deleteConversation,
};
