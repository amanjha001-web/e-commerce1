import api from "./api";

const vendorRequestService = {
  // User

  createRequest: async (requestData) => {
    const response = await api.post("/vendor-requests", requestData);

    return response.data;
  },

  getMyRequest: async () => {
    const response = await api.get("/vendor-requests/my-request");

    return response.data;
  },

  getMyRequests: async (params = {}) => {
    const response = await api.get("/vendor-requests/my-requests", {
      params,
    });

    return response.data;
  },

  cancelRequest: async (requestId) => {
    const response = await api.patch(`/vendor-requests/${requestId}/cancel`);

    return response.data;
  },

  // Admin

  getAdminRequests: async (params = {}) => {
    const response = await api.get("/admin/vendor-requests", {
      params,
    });

    return response.data;
  },

  getRequestById: async (requestId) => {
    const response = await api.get(`/admin/vendor-requests/${requestId}`);

    return response.data;
  },

  approveRequest: async (requestId) => {
    const response = await api.patch(
      `/admin/vendor-requests/${requestId}/approve`,
    );

    return response.data;
  },

  rejectRequest: async (requestId, reason = "") => {
    const response = await api.patch(
      `/admin/vendor-requests/${requestId}/reject`,
      {
        reason,
      },
    );

    return response.data;
  },

  updateRequest: async (requestId, requestData) => {
    const response = await api.patch(
      `/admin/vendor-requests/${requestId}`,
      requestData,
    );

    return response.data;
  },
};

export default vendorRequestService;
