import api from "./api";

const adminService = {
  // Dashboard

  getDashboard: async (params = {}) => {
    const response = await api.get("/admin/dashboard", {
      params,
    });

    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get("/admin/dashboard/stats", {
      params,
    });

    return response.data;
  },

  getSalesData: async (params = {}) => {
    const response = await api.get("/admin/dashboard/sales", {
      params,
    });

    return response.data;
  },

  getRevenueData: async (params = {}) => {
    const response = await api.get("/admin/dashboard/revenue", {
      params,
    });

    return response.data;
  },

  // Users

  getUsers: async (params = {}) => {
    const response = await api.get("/admin/users", {
      params,
    });

    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);

    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.patch(`/admin/users/${userId}`, userData);

    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);

    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/status`);

    return response.data;
  },

  // Reports

  getReports: async (params = {}) => {
    const response = await api.get("/admin/reports", {
      params,
    });

    return response.data;
  },

  getSalesReport: async (params = {}) => {
    const response = await api.get("/admin/reports/sales", {
      params,
    });

    return response.data;
  },

  getRevenueReport: async (params = {}) => {
    const response = await api.get("/admin/reports/revenue", {
      params,
    });

    return response.data;
  },

  exportReport: async (params = {}) => {
    const response = await api.get("/admin/reports/export", {
      params,
      responseType: "blob",
    });

    return response.data;
  },

  // Settings

  getSettings: async () => {
    const response = await api.get("/admin/settings");

    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await api.patch("/admin/settings", settingsData);

    return response.data;
  },

  // Permissions

  getPermissions: async () => {
    const response = await api.get("/admin/permissions");

    return response.data;
  },

  updatePermissions: async (permissionData) => {
    const response = await api.patch("/admin/permissions", permissionData);

    return response.data;
  },

  // General admin activity

  getActivityLogs: async (params = {}) => {
    const response = await api.get("/admin/activity-logs", {
      params,
    });

    return response.data;
  },
};

export default adminService;
