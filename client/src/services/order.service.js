import api from "./api";

const orderService = {
  // Customer

  createOrder: async (orderData) => {
    const response = await api.post("/orders", orderData);

    return response.data;
  },

  getMyOrders: async (params = {}) => {
    const response = await api.get("/orders/my-orders", {
      params,
    });

    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);

    return response.data;
  },

  cancelOrder: async (orderId, reason = "") => {
    const response = await api.patch(`/orders/${orderId}/cancel`, {
      reason,
    });

    return response.data;
  },

  returnOrder: async (orderId, data = {}) => {
    const response = await api.post(`/orders/${orderId}/return`, data);

    return response.data;
  },

  trackOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/track`);

    return response.data;
  },

  // Vendor

  getVendorOrders: async (params = {}) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(
        ([, v]) =>
          v !== undefined &&
          v !== null &&
          v !== "" &&
          String(v).toLowerCase() !== "all" &&
          String(v).toLowerCase() !== "all statuses",
      ),
    );
    const response = await api.get("/vendor/orders", {
      params: cleaned,
    });

    return response.data;
  },

  getVendorOrderById: async (orderId) => {
    const response = await api.get(`/vendor/orders/${orderId}`);

    return response.data;
  },

  updateOrderStatus: async (orderId, status, note = "", tracking = undefined) => {
    const payload = { status, note };
    if (tracking && typeof tracking === "object") {
      payload.tracking = tracking;
    }
    const response = await api.patch(`/vendor/orders/${orderId}/status`, payload);

    return response.data;
  },

  updateOrderTracking: async (orderId, trackingData) => {
    const response = await api.patch(
      `/vendor/orders/${orderId}/tracking`,
      trackingData,
    );

    return response.data;
  },

  // Admin

  getAdminOrders: async (params = {}) => {
    const response = await api.get("/admin/orders", {
      params,
    });

    return response.data;
  },

  getAdminOrderById: async (orderId) => {
    const response = await api.get(`/admin/orders/${orderId}`);

    return response.data;
  },

  adminUpdateOrderStatus: async (orderId, status, note = "") => {
    const response = await api.patch(`/admin/orders/${orderId}/status`, {
      status,
      note,
    });

    return response.data;
  },

  approveReturn: async (orderId) => {
    const response = await api.patch(`/admin/orders/${orderId}/return/approve`);

    return response.data;
  },

  rejectReturn: async (orderId, reason = "") => {
    const response = await api.patch(`/admin/orders/${orderId}/return/reject`, {
      reason,
    });

    return response.data;
  },
};

export default orderService;
