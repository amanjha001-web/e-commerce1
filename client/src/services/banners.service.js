import api from "./api";

const bannersService = {
  // ==================== Banners ====================

  // Get all banners
  getAll: async (params = {}) => {
    const response = await api.get("/admin/banners", { params });
    return response.data;
  },

  // Get banner by ID
  getById: async (bannerId) => {
    const response = await api.get(`/admin/banners/${bannerId}`);
    return response.data;
  },

  // Create banner
  create: async (bannerData) => {
    const response = await api.post("/admin/banners", bannerData);
    return response.data;
  },

  // Update banner
  update: async (bannerId, bannerData) => {
    const response = await api.patch(`/admin/banners/${bannerId}`, bannerData);
    return response.data;
  },

  // Delete banner
  delete: async (bannerId) => {
    const response = await api.delete(`/admin/banners/${bannerId}`);
    return response.data;
  },

  // Get banner stats
  getStats: async () => {
    const response = await api.get("/admin/banners/stats");
    return response.data;
  },

  // Reorder banners
  reorder: async (order) => {
    const response = await api.patch("/admin/banners/reorder", { order });
    return response.data;
  },
};

export default bannersService;