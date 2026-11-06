import api from "./api";

const adminService = {
  // ==================== Dashboard ====================
  getDashboard: async (params = {}) => {
    const response = await api.get("/admin/dashboard", { params });
    return response.data;
  },

  getDashboardAnalytics: async (params = {}) => {
    const response = await api.get("/admin/dashboard/analytics", { params });
    return response.data;
  },

  // ==================== Orders ====================
  getOrders: async (params = {}) => {
    const response = await api.get("/admin/orders", { params });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status, notes) => {
    const response = await api.patch(`/admin/orders/${orderId}/status`, { status, notes });
    return response.data;
  },

  cancelOrder: async (orderId, reason) => {
    const response = await api.patch(`/admin/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  refundOrder: async (orderId, amount, reason) => {
    const response = await api.patch(`/admin/orders/${orderId}/refund`, { amount, reason });
    return response.data;
  },

  // ==================== Categories ====================
  getCategories: async (params = {}) => {
    const response = await api.get("/admin/categories", { params });
    return response.data;
  },

  getCategoryById: async (categoryId) => {
    const response = await api.get(`/admin/categories/${categoryId}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post("/admin/categories", categoryData);
    return response.data;
  },

  updateCategory: async (categoryId, categoryData) => {
    const response = await api.patch(`/admin/categories/${categoryId}`, categoryData);
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },

  // ==================== Brands ====================
  getBrands: async (params = {}) => {
    const response = await api.get("/admin/brands", { params });
    return response.data;
  },

  getBrandById: async (brandId) => {
    const response = await api.get(`/admin/brands/${brandId}`);
    return response.data;
  },

  createBrand: async (brandData) => {
    const response = await api.post("/admin/brands", brandData);
    return response.data;
  },

  updateBrand: async (brandId, brandData) => {
    const response = await api.patch(`/admin/brands/${brandId}`, brandData);
    return response.data;
  },

  deleteBrand: async (brandId) => {
    const response = await api.delete(`/admin/brands/${brandId}`);
    return response.data;
  },

  // ==================== Products ====================
  getProducts: async (params = {}) => {
    const response = await api.get("/admin/products", { params });
    return response.data;
  },

  getProductById: async (productId) => {
    const response = await api.get(`/admin/products/${productId}`);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await api.patch(`/admin/products/${productId}`, productData);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/admin/products/${productId}`);
    return response.data;
  },

  approveProduct: async (productId) => {
    const response = await api.patch(`/admin/products/${productId}/approve`);
    return response.data;
  },

  rejectProduct: async (productId, reason) => {
    const response = await api.patch(`/admin/products/${productId}/reject`, { reason });
    return response.data;
  },

  getPendingProducts: async (params = {}) => {
    const response = await api.get("/admin/products/pending", { params });
    return response.data;
  },

  // ==================== Vendors ====================
  getVendors: async (params = {}) => {
    const response = await api.get("/admin/vendors", { params });
    return response.data;
  },

  getVendorById: async (vendorId) => {
    const response = await api.get(`/admin/vendors/${vendorId}`);
    return response.data;
  },

  updateVendor: async (vendorId, vendorData) => {
    const response = await api.patch(`/admin/vendors/${vendorId}`, vendorData);
    return response.data;
  },

  deleteVendor: async (vendorId) => {
    const response = await api.delete(`/admin/vendors/${vendorId}`);
    return response.data;
  },

  // ==================== Users ====================
  getUsers: async (params = {}) => {
    const response = await api.get("/admin/users", { params });
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
    const response = await api.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  // ==================== Reports ====================
  getReports: async (params = {}) => {
    const response = await api.get("/admin/reports", { params });
    return response.data;
  },

  getSalesReport: async (params = {}) => {
    const response = await api.get("/admin/reports/sales", { params });
    return response.data;
  },

  getRevenueReport: async (params = {}) => {
    const response = await api.get("/admin/reports/revenue", { params });
    return response.data;
  },

  exportReport: async (params = {}) => {
    const response = await api.get("/admin/reports/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // ==================== Settings ====================
  getSettings: async () => {
    const response = await api.get("/admin/settings");
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await api.patch("/admin/settings", settingsData);
    return response.data;
  },

  // ==================== Activity Logs ====================
  getActivityLogs: async (params = {}) => {
    const response = await api.get("/admin/activity-logs", { params });
    return response.data;
  },

  // ==================== Support ====================
  getSupportTickets: async (params = {}) => {
    const response = await api.get("/admin/support-tickets", { params });
    return response.data;
  },

  getSupportTicketById: async (ticketId) => {
    const response = await api.get(`/admin/support-tickets/${ticketId}`);
    return response.data;
  },

  updateSupportTicket: async (ticketId, ticketData) => {
    const response = await api.patch(`/admin/support-tickets/${ticketId}`, ticketData);
    return response.data;
  },

  // ==================== Payments ====================
  getPayments: async (params = {}) => {
    const response = await api.get("/admin/payments", { params });
    return response.data;
  },

  getPaymentById: async (paymentId) => {
    const response = await api.get(`/admin/payments/${paymentId}`);
    return response.data;
  },

  refundPayment: async (paymentId, amount, reason) => {
    const response = await api.patch(`/admin/payments/${paymentId}/refund`, { amount, reason });
    return response.data;
  },

  // ==================== Vendor Payouts ====================
  getVendorPayouts: async (params = {}) => {
    const response = await api.get("/admin/vendor-payouts", { params });
    return response.data;
  },

  // ==================== Taxes ====================
  getTaxes: async (params = {}) => {
    const response = await api.get("/admin/taxes", { params });
    return response.data;
  },

  createTax: async (taxData) => {
    const response = await api.post("/admin/taxes", taxData);
    return response.data;
  },

  updateTax: async (taxId, taxData) => {
    const response = await api.patch(`/admin/taxes/${taxId}`, taxData);
    return response.data;
  },

  deleteTax: async (taxId) => {
    const response = await api.delete(`/admin/taxes/${taxId}`);
    return response.data;
  },

  // ==================== Shipping Zones ====================
  getShippingZones: async (params = {}) => {
    const response = await api.get("/admin/shipping-zones", { params });
    return response.data;
  },

  createShippingZone: async (zoneData) => {
    const response = await api.post("/admin/shipping-zones", zoneData);
    return response.data;
  },

  updateShippingZone: async (zoneId, zoneData) => {
    const response = await api.patch(`/admin/shipping-zones/${zoneId}`, zoneData);
    return response.data;
  },

  deleteShippingZone: async (zoneId) => {
    const response = await api.delete(`/admin/shipping-zones/${zoneId}`);
    return response.data;
  },

  // ==================== Products (Additional) ====================
  approveProduct: async (productId) => {
    const response = await api.patch(`/admin/products/${productId}/approve`);
    return response.data;
  },

  rejectProduct: async (productId, reason) => {
    const response = await api.patch(`/admin/products/${productId}/reject`, { reason });
    return response.data;
  },

  updateProductStatus: async (productId, isActive) => {
    const response = await api.patch(`/admin/products/${productId}/status`, { isActive });
    return response.data;
  },

  getAdminProducts: async (params = {}) => {
    const response = await api.get("/admin/products", { params });
    return response.data;
  },

  getAdminProductById: async (productId) => {
    const response = await api.get(`/admin/products/${productId}`);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await api.patch(`/admin/products/${productId}`, productData);
    return response.data;
  },
};

export default adminService;
