import api from "./api";

const shippingService = {
  // ==================== Shipping Zones ====================

  // Get all shipping zones
  getAll: async (params = {}) => {
    const response = await api.get("/admin/shipping-zones", { params });
    return response.data;
  },

  // Get shipping zone by ID
  getById: async (zoneId) => {
    const response = await api.get(`/admin/shipping-zones/${zoneId}`);
    return response.data;
  },

  // Create shipping zone
  create: async (zoneData) => {
    const response = await api.post("/admin/shipping-zones", zoneData);
    return response.data;
  },

  // Update shipping zone
  update: async (zoneId, zoneData) => {
    const response = await api.patch(`/admin/shipping-zones/${zoneId}`, zoneData);
    return response.data;
  },

  // Delete shipping zone
  delete: async (zoneId) => {
    const response = await api.delete(`/admin/shipping-zones/${zoneId}`);
    return response.data;
  },

  // Update shipping zone status
  updateStatus: async (zoneId, isActive) => {
    const response = await api.patch(`/admin/shipping-zones/${zoneId}/status`, { isActive });
    return response.data;
  },
};

export default shippingService;