import api from "./api";

const taxService = {
  // ==================== Taxes ====================

  // Get all taxes
  getAll: async (params = {}) => {
    const response = await api.get("/admin/taxes", { params });
    return response.data;
  },

  // Get single tax
  getById: async (taxId) => {
    const response = await api.get(`/admin/taxes/${taxId}`);
    return response.data;
  },

  // Create tax
  create: async (taxData) => {
    const response = await api.post("/admin/taxes", taxData);
    return response.data;
  },

  // Update tax
  update: async (taxId, taxData) => {
    const response = await api.patch(`/admin/taxes/${taxId}`, taxData);
    return response.data;
  },

  // Delete tax
  delete: async (taxId) => {
    const response = await api.delete(`/admin/taxes/${taxId}`);
    return response.data;
  },

  // Update tax status
  updateStatus: async (taxId, isActive) => {
    const response = await api.patch(`/admin/taxes/${taxId}/status`, { isActive });
    return response.data;
  },
};

export default taxService;