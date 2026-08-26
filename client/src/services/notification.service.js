import api from "./api";

const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get("/notifications", {
      params,
    });

    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");

    return response.data;
  },

  getNotificationById: async (notificationId) => {
    const response = await api.get(`/notifications/${notificationId}`);

    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);

    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");

    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);

    return response.data;
  },

  clearNotifications: async () => {
    const response = await api.delete("/notifications");

    return response.data;
  },

  // Admin

  getAdminNotifications: async (params = {}) => {
    const response = await api.get("/admin/notifications", {
      params,
    });

    return response.data;
  },

  sendNotification: async (notificationData) => {
    const response = await api.post("/admin/notifications", notificationData);

    return response.data;
  },

  deleteAdminNotification: async (notificationId) => {
    const response = await api.delete(`/admin/notifications/${notificationId}`);

    return response.data;
  },
};

export default notificationService;
