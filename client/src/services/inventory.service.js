import api from "./api";

const inventoryService = {
  // ==================== Inventory ====================

  // Get inventory list
  getAll: async (params = {}) => {
    const response = await api.get("/admin/inventory", { params });
    return response.data;
  },

  // Get inventory by product ID
  getByProductId: async (productId, params = {}) => {
    const response = await api.get(`/admin/inventory/${productId}`, { params });
    return response.data;
  },

  // Adjust inventory stock
  adjustStock: async (productId, adjustment) => {
    const response = await api.patch(`/admin/inventory/${productId}`, adjustment);
    return response.data;
  },

  // Get low stock items
  getLowStock: async (threshold = 10, params = {}) => {
    const response = await api.get("/admin/inventory/low-stock", { 
      params: { threshold, ...params } 
    });
    return response.data;
  },

  // Get out of stock items
  getOutOfStock: async (params = {}) => {
    const response = await api.get("/admin/inventory/out-of-stock", { params });
    return response.data;
  },

  // Get inventory movements
  getMovements: async (productId, params = {}) => {
    const response = await api.get(`/admin/inventory/${productId}/movements`, { params });
    return response.data;
  },

  // Vendor inventory
  getVendorInventory: async (params = {}) => {
    const response = await api.get('/vendor/inventory', { params });
    return response.data;
  },

  updateVendorInventory: async (productId, data) => {
    const response = await api.patch(`/vendor/inventory/${productId}`, data);
    return response.data;
  },
};

export default inventoryService;