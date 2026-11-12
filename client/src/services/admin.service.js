import api from "./api";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        String(v).toLowerCase() !== "all",
    ),
  );

const adminService = {
  // ==================== 1. Dashboard (/api/v1/admin/dashboard*) ====================
  getDashboard: async (params = {}) => {
    const response = await api.get("/admin/dashboard", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getDashboardAnalytics: async (params = {}) => {
    const response = await api.get("/admin/dashboard/analytics", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getRecentOrders: async (params = {}) => {
    const response = await api.get("/admin/dashboard/recent-orders", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getLowStockProducts: async (params = {}) => {
    const response = await api.get("/admin/dashboard/low-stock", {
      params: cleanParams(params),
    });
    return response.data;
  },

  // ==================== 2. User Management (/api/v1/admin/users*) ====================
  getUsers: async (params = {}) => {
    const response = await api.get("/admin/users", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      status,
    });
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

  putUserStatus: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/status`);
    return response.data;
  },

  // ==================== 3. Vendors & Vendor Requests (/api/v1/admin/vendors*, /api/v1/admin/vendor-requests*) ====================
  getVendors: async (params = {}) => {
    const response = await api.get("/admin/vendors", {
      params: cleanParams(params),
    });
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

  toggleVendorStatus: async (vendorId, isActive) => {
    const activeBool =
      typeof isActive === "object" && isActive !== null
        ? Boolean(isActive.isActive)
        : Boolean(isActive);
    const response = await api.patch(`/admin/vendors/${vendorId}/status`, {
      isActive: activeBool,
    });
    return response.data;
  },

  approveVendor: async (vendorId) => {
    const response = await api.patch(`/admin/vendors/${vendorId}/approve`);
    return response.data;
  },

  rejectVendor: async (vendorId, reason = "Application rejected by admin") => {
    const response = await api.patch(`/admin/vendors/${vendorId}/reject`, {
      reason,
    });
    return response.data;
  },

  getVendorRequests: async (params = {}) => {
    const response = await api.get("/admin/vendor-requests", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getPendingVendorRequests: async (params = {}) => {
    const response = await api.get("/admin/vendor-requests/pending", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getVendorRequestById: async (requestId) => {
    const response = await api.get(`/admin/vendor-requests/${requestId}`);
    return response.data;
  },

  // ==================== 4. Product Moderation (/api/v1/admin/products*) ====================
  getPendingProducts: async (params = {}) => {
    const response = await api.get("/admin/products/pending", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getProducts: async (params = {}) => {
    const response = await api.get("/admin/products", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getAdminProducts: async (params = {}) => {
    const response = await api.get("/admin/products", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getProductById: async (productId) => {
    const response = await api.get(`/admin/products/${productId}`);
    return response.data;
  },

  getAdminProductById: async (productId) => {
    const response = await api.get(`/admin/products/${productId}`);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await api.patch(
      `/admin/products/${productId}`,
      productData,
    );
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

  rejectProduct: async (productId, reason = "Rejected by admin moderation") => {
    const response = await api.patch(`/admin/products/${productId}/reject`, {
      reason,
    });
    return response.data;
  },

  updateProductStatus: async (productId, isActive) => {
    const response = await api.patch(`/admin/products/${productId}/status`, {
      isActive: Boolean(isActive),
    });
    return response.data;
  },

  // ==================== 5. Order Management & Refunds (/api/v1/admin/orders*) ====================
  getOrders: async (params = {}) => {
    const response = await api.get("/admin/orders", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getRefundRequests: async (params = {}) => {
    const response = await api.get("/admin/orders/refunds", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status, note = "") => {
    const response = await api.patch(`/admin/orders/${orderId}/status`, {
      status,
      note,
    });
    return response.data;
  },

  cancelOrder: async (orderId, reason = "Cancelled by admin") => {
    const response = await api.patch(`/admin/orders/${orderId}/cancel`, {
      reason,
    });
    return response.data;
  },

  processRefund: async (orderId, amountOrPayload, reason = "") => {
    const payload =
      typeof amountOrPayload === "object" && amountOrPayload !== null
        ? amountOrPayload
        : { amount: amountOrPayload, reason };
    const response = await api.patch(`/admin/orders/${orderId}/refund`, payload);
    return response.data;
  },

  refundOrder: async (orderId, amountOrPayload, reason = "") => {
    const payload =
      typeof amountOrPayload === "object" && amountOrPayload !== null
        ? amountOrPayload
        : { amount: amountOrPayload, reason };
    const response = await api.patch(`/admin/orders/${orderId}/refund`, payload);
    return response.data;
  },

  updateOrderShipping: async (orderId, payload = {}) => {
    const response = await api.patch(
      `/admin/orders/${orderId}/shipping`,
      payload,
    );
    return response.data;
  },

  getOrderStatusHistory: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}/history`);
    return response.data;
  },

  // ==================== 6. Category Management (/api/v1/admin/categories*) ====================
  getCategories: async (params = {}) => {
    const response = await api.get("/admin/categories", {
      params: cleanParams(params),
    });
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
    const response = await api.patch(
      `/admin/categories/${categoryId}`,
      categoryData,
    );
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },

  updateCategoryStatus: async (categoryId, isActive) => {
    const response = await api.patch(`/admin/categories/${categoryId}/status`, {
      isActive: Boolean(isActive),
    });
    return response.data;
  },

  // ==================== 7. Brand Management (/api/v1/admin/brands*) ====================
  getBrands: async (params = {}) => {
    const response = await api.get("/admin/brands", {
      params: cleanParams(params),
    });
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

  updateBrandStatus: async (brandId, isActive) => {
    const response = await api.patch(`/admin/brands/${brandId}/status`, {
      isActive: Boolean(isActive),
    });
    return response.data;
  },

  updateBrandLogo: async (brandId, formData) => {
    const response = await api.patch(`/admin/brands/${brandId}/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteBrandLogo: async (brandId) => {
    const response = await api.delete(`/admin/brands/${brandId}/logo`);
    return response.data;
  },

  // ==================== 8. Coupon Management (/api/v1/admin/coupons*) ====================
  getCoupons: async (params = {}) => {
    const response = await api.get("/admin/coupons", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getCouponById: async (couponId) => {
    const response = await api.get(`/admin/coupons/${couponId}`);
    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await api.post("/admin/coupons", couponData);
    return response.data;
  },

  updateCoupon: async (couponId, couponData) => {
    const response = await api.patch(`/admin/coupons/${couponId}`, couponData);
    return response.data;
  },

  deleteCoupon: async (couponId) => {
    const response = await api.delete(`/admin/coupons/${couponId}`);
    return response.data;
  },

  updateCouponStatus: async (couponId, isActive) => {
    const response = await api.patch(`/admin/coupons/${couponId}/status`, {
      isActive: Boolean(isActive),
    });
    return response.data;
  },

  getCouponUsage: async (couponId) => {
    const response = await api.get(`/admin/coupons/${couponId}/usage`);
    return response.data;
  },

  // ==================== 9. Reviews Management (/api/v1/admin/reviews*) ====================
  getReviews: async (params = {}) => {
    const response = await api.get("/admin/reviews", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getReportedReviews: async (params = {}) => {
    const response = await api.get("/admin/reviews/reported", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getReviewById: async (reviewId) => {
    const response = await api.get(`/admin/reviews/${reviewId}`);
    return response.data;
  },

  updateReviewStatus: async (reviewId, status) => {
    const response = await api.patch(`/admin/reviews/${reviewId}/status`, {
      status,
    });
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/admin/reviews/${reviewId}`);
    return response.data;
  },

  // ==================== 10. Payments & Vendor Payouts (/api/v1/admin/payments*, /api/v1/admin/vendor-payouts*) ====================
  getPayments: async (params = {}) => {
    const response = await api.get("/admin/payments", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getPaymentById: async (paymentId) => {
    const response = await api.get(`/admin/payments/${paymentId}`);
    return response.data;
  },

  refundPayment: async (paymentId, amountOrPayload, reason = "") => {
    const payload =
      typeof amountOrPayload === "object" && amountOrPayload !== null
        ? amountOrPayload
        : { amount: amountOrPayload, reason };
    const response = await api.post(
      `/admin/payments/${paymentId}/refund`,
      payload,
    );
    return response.data;
  },

  reconcilePayment: async (paymentId) => {
    const response = await api.post("/admin/payments/reconcile", { paymentId });
    return response.data;
  },

  getVendorPayouts: async (params = {}) => {
    const response = await api.get("/admin/vendor-payouts", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getVendorPayoutById: async (payoutId) => {
    const response = await api.get(`/admin/vendor-payouts/${payoutId}`);
    return response.data;
  },

  updateVendorPayoutStatus: async (payoutId, status) => {
    const response = await api.patch(
      `/admin/vendor-payouts/${payoutId}/status`,
      { status: String(status).toUpperCase() },
    );
    return response.data;
  },

  // ==================== 11. Reports & Activity Logs (/api/v1/admin/reports*, /api/v1/admin/activity-logs*) ====================
  getReports: async (params = {}) => {
    const response = await api.get("/admin/reports/summary", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getReportSummary: async (params = {}) => {
    const response = await api.get("/admin/reports/summary", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getSalesReport: async (params = {}) => {
    const response = await api.get("/admin/reports/sales", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getRevenueReport: async (params = {}) => {
    const response = await api.get("/admin/reports/revenue", {
      params: cleanParams(params),
    });
    return response.data;
  },

  exportReport: async (params = {}) => {
    const response = await api.get("/admin/reports/export", {
      params: cleanParams(params),
      responseType: "blob",
    });
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get("/admin/activity-logs", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getActivityLogById: async (logId) => {
    const response = await api.get(`/admin/activity-logs/${logId}`);
    return response.data;
  },

  // ==================== 12. Inventory Management (/api/v1/admin/inventory*) ====================
  getInventory: async (params = {}) => {
    const response = await api.get("/admin/inventory", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getLowStockInventory: async (params = {}) => {
    const response = await api.get("/admin/inventory/low-stock", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getOutOfStockInventory: async (params = {}) => {
    const response = await api.get("/admin/inventory/out-of-stock", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getInventoryByProductId: async (productId) => {
    const response = await api.get(`/admin/inventory/${productId}`);
    return response.data;
  },

  adjustInventoryStock: async (productId, payload) => {
    const response = await api.patch(
      `/admin/inventory/${productId}/adjust`,
      payload,
    );
    return response.data;
  },

  getInventoryMovements: async (productId, params = {}) => {
    const response = await api.get(`/admin/inventory/${productId}/movements`, {
      params: cleanParams(params),
    });
    return response.data;
  },

  // ==================== 13. Settings, Taxes & Shipping Zones (/api/v1/admin/settings*, /api/v1/admin/taxes*, /api/v1/admin/shipping-zones*) ====================
  getSettings: async (params = {}) => {
    const response = await api.get("/admin/settings", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getSettingsHistory: async (params = {}) => {
    const response = await api.get("/admin/settings/history", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getSettingByKey: async (key) => {
    const response = await api.get(
      `/admin/settings/${encodeURIComponent(key)}`,
    );
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const payload =
      settingsData &&
      typeof settingsData === "object" &&
      !Object.prototype.hasOwnProperty.call(settingsData, "settings")
        ? { settings: settingsData }
        : settingsData;
    const response = await api.patch("/admin/settings", payload);
    return response.data;
  },

  updateMultipleSettings: async (settingsData) => {
    const payload =
      settingsData &&
      typeof settingsData === "object" &&
      !Object.prototype.hasOwnProperty.call(settingsData, "settings")
        ? { settings: settingsData }
        : settingsData;
    const response = await api.patch("/admin/settings", payload);
    return response.data;
  },

  updateSetting: async (key, payload) => {
    const body =
      payload &&
      typeof payload === "object" &&
      Object.prototype.hasOwnProperty.call(payload, "value")
        ? payload
        : { value: payload };
    const response = await api.patch(
      `/admin/settings/${encodeURIComponent(key)}`,
      body,
    );
    return response.data;
  },

  getTaxes: async (params = {}) => {
    const response = await api.get("/admin/taxes", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getTaxById: async (taxId) => {
    const response = await api.get(`/admin/taxes/${taxId}`);
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

  updateTaxStatus: async (taxId, isActive) => {
    const response = await api.patch(`/admin/taxes/${taxId}/status`, {
      isActive: Boolean(isActive),
    });
    return response.data;
  },

  getShippingZones: async (params = {}) => {
    const response = await api.get("/admin/shipping-zones", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getShippingZoneById: async (zoneId) => {
    const response = await api.get(`/admin/shipping-zones/${zoneId}`);
    return response.data;
  },

  createShippingZone: async (zoneData) => {
    const response = await api.post("/admin/shipping-zones", zoneData);
    return response.data;
  },

  updateShippingZone: async (zoneId, zoneData) => {
    const response = await api.patch(
      `/admin/shipping-zones/${zoneId}`,
      zoneData,
    );
    return response.data;
  },

  deleteShippingZone: async (zoneId) => {
    const response = await api.delete(`/admin/shipping-zones/${zoneId}`);
    return response.data;
  },

  updateShippingZoneStatus: async (zoneId, isActive) => {
    const response = await api.patch(`/admin/shipping-zones/${zoneId}/status`, {
      isActive: Boolean(isActive),
    });
    return response.data;
  },

  // ==================== 14. Support Tickets (/api/v1/admin/support-tickets*) ====================
  getSupportTickets: async (params = {}) => {
    const response = await api.get("/admin/support-tickets", {
      params: cleanParams(params),
    });
    return response.data;
  },

  getSupportTicketById: async (ticketId) => {
    const response = await api.get(`/admin/support-tickets/${ticketId}`);
    return response.data;
  },

  updateSupportTicketStatus: async (ticketId, status) => {
    const response = await api.patch(
      `/admin/support-tickets/${ticketId}/status`,
      { status: String(status).toUpperCase() },
    );
    return response.data;
  },

  updateSupportTicketPriority: async (ticketId, priority) => {
    const response = await api.patch(
      `/admin/support-tickets/${ticketId}/priority`,
      { priority: String(priority).toUpperCase() },
    );
    return response.data;
  },

  assignSupportTicket: async (ticketId, assignedTo) => {
    const response = await api.patch(
      `/admin/support-tickets/${ticketId}/assign`,
      { assignedTo },
    );
    return response.data;
  },

  replyToSupportTicket: async (ticketId, message) => {
    const response = await api.post(
      `/admin/support-tickets/${ticketId}/reply`,
      { message },
    );
    return response.data;
  },

  addSupportTicketNote: async (ticketId, note) => {
    const response = await api.post(
      `/admin/support-tickets/${ticketId}/notes`,
      { note },
    );
    return response.data;
  },

  closeSupportTicket: async (ticketId, resolution = "") => {
    const response = await api.patch(
      `/admin/support-tickets/${ticketId}/close`,
      { resolution },
    );
    return response.data;
  },

  reopenSupportTicket: async (ticketId) => {
    const response = await api.patch(
      `/admin/support-tickets/${ticketId}/reopen`,
    );
    return response.data;
  },

  getSupportTicketHistory: async (ticketId, params = {}) => {
    const response = await api.get(
      `/admin/support-tickets/${ticketId}/history`,
      { params: cleanParams(params) },
    );
    return response.data;
  },
};

export default adminService;
