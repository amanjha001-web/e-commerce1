import api from "./api";

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

  // Admin

  getAdminPayments: async (params = {}) => {
    const response = await api.get("/admin/payments", {
      params,
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
};

export default paymentService;
