import api from "./api";

const supportService = {
  // Customer

  createTicket: async (ticketData) => {
    const response = await api.post("/support/tickets", ticketData);

    return response.data;
  },

  getMyTickets: async (params = {}) => {
    const response = await api.get("/support/tickets", {
      params,
    });

    return response.data;
  },

  getTicketById: async (ticketId) => {
    const response = await api.get(`/support/tickets/${ticketId}`);

    return response.data;
  },

  addMessage: async (ticketId, messageData) => {
    const response = await api.post(
      `/support/tickets/${ticketId}/messages`,
      messageData,
    );

    return response.data;
  },

  closeTicket: async (ticketId) => {
    const response = await api.patch(`/support/tickets/${ticketId}/close`);

    return response.data;
  },

  reopenTicket: async (ticketId) => {
    const response = await api.patch(`/support/tickets/${ticketId}/reopen`);

    return response.data;
  },

  // Admin

  getAdminTickets: async (params = {}) => {
    const response = await api.get("/admin/support/tickets", {
      params,
    });

    return response.data;
  },

  getAdminTicketById: async (ticketId) => {
    const response = await api.get(`/admin/support/tickets/${ticketId}`);

    return response.data;
  },

  replyToTicket: async (ticketId, messageData) => {
    const response = await api.post(
      `/admin/support/tickets/${ticketId}/reply`,
      messageData,
    );

    return response.data;
  },

  updateTicketStatus: async (ticketId, status) => {
    const response = await api.patch(
      `/admin/support/tickets/${ticketId}/status`,
      {
        status,
      },
    );

    return response.data;
  },

  assignTicket: async (ticketId, userId) => {
    const response = await api.patch(
      `/admin/support/tickets/${ticketId}/assign`,
      {
        userId,
      },
    );

    return response.data;
  },

  deleteTicket: async (ticketId) => {
    const response = await api.delete(`/admin/support/tickets/${ticketId}`);

    return response.data;
  },
};

export default supportService;
