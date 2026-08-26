import api from "./api";

const chatService = {
  // Conversations

  getConversations: async (params = {}) => {
    const response = await api.get("/chat/conversations", {
      params,
    });

    return response.data;
  },

  getConversationById: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}`);

    return response.data;
  },

  createConversation: async (participantData) => {
    const response = await api.post("/chat/conversations", participantData);

    return response.data;
  },

  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/chat/conversations/${conversationId}`);

    return response.data;
  },

  // Messages

  getMessages: async (conversationId, params = {}) => {
    const response = await api.get(
      `/chat/conversations/${conversationId}/messages`,
      {
        params,
      },
    );

    return response.data;
  },

  sendMessage: async (conversationId, messageData) => {
    const response = await api.post(
      `/chat/conversations/${conversationId}/messages`,
      messageData,
    );

    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}`);

    return response.data;
  },

  markMessageAsRead: async (messageId) => {
    const response = await api.patch(`/chat/messages/${messageId}/read`);

    return response.data;
  },

  markConversationAsRead: async (conversationId) => {
    const response = await api.patch(
      `/chat/conversations/${conversationId}/read`,
    );

    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/chat/unread-count");

    return response.data;
  },

  // Attachments

  uploadAttachment: async (conversationId, formData) => {
    const response = await api.post(
      `/chat/conversations/${conversationId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },
};

export default chatService;
