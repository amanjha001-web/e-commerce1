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

const paymentService = {
  // Create payment order
  createPaymentOrder: async (orderId) => {
    const response = await api.post("/payments/create-order", {
      orderId,
    });
    return response.data;
  },

  // Verify Razorpay payment
  verifyPayment: async (paymentData) => {
    const response = await api.post("/payments/verify", paymentData);
    return response.data;
  },

  // Get payment details
  getPaymentById: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  getOrderPayment: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },

  // Payment status
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  },

  // Retry failed payment
  retryPayment: async (orderId) => {
    const response = await api.post("/payments/retry", {
      orderId,
    });
    return response.data;
  },

  // Refund
  requestRefund: async (paymentId, data = {}) => {
    const response = await api.post(`/payments/${paymentId}/refund`, data);
    return response.data;
  },

  // Admin (/api/v1/admin/payments* & /api/v1/admin/vendor-payouts*)
  getAdminPayments: async (params = {}) => {
    const cleaned = cleanParams(params);
    if (cleaned.method) {
      cleaned.paymentMethod = cleaned.method;
      delete cleaned.method;
    }
    delete cleaned.dateRange;
    const response = await api.get("/admin/payments", {
      params: cleaned,
    });
    return response.data;
  },

  getAdminPaymentById: async (paymentId) => {
    const response = await api.get(`/admin/payments/${paymentId}`);
    return response.data;
  },

  adminRefundPayment: async (paymentId, data = {}) => {
    const response = await api.post(
      `/admin/payments/${paymentId}/refund`,
      data,
    );
    return response.data;
  },

  adminReconcilePayment: async (paymentId) => {
    const response = await api.post("/admin/payments/reconcile", {
      paymentId,
    });
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
};

export default paymentService;
