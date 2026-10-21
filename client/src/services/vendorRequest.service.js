import api from "./api";

const vendorRequestService = {
  // Customer: create vendor application
  createRequest: async (requestData) => {
    const response = await api.post("/vendor-requests", requestData);
    return response.data;
  },

  // Customer: get own request
  getMyRequest: async () => {
    const response = await api.get("/vendor-requests/me");
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

 
// Admin: list requests + pagination/filters
getAdminRequests: async (params = {}) => {
  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    )
  );

  const response = await api.get("/vendor-requests", {
    params: cleanedParams,
  });

  return response.data;
},


  // Admin: request details
  getRequestById: async (requestId) => {
    const response = await api.get(`/vendor-requests/${requestId}`);
    return response.data;
  },

  // Admin: approve
  approveRequest: async (requestId) => {
    const response = await api.patch(`/vendor-requests/${requestId}/approve`);
    return response.data;
  },

  // Admin: reject
  rejectRequest: async (requestId, reason = "") => {
    const response = await api.patch(`/vendor-requests/${requestId}/reject`, {
      reason,
    });
    return response.data;
  },

  // Admin: review
  reviewRequest: async (requestId, reviewData = {}) => {
    const response = await api.patch(
      `/vendor-requests/${requestId}/review`,
      reviewData,
    );
    return response.data;
  },

  // Admin: restore soft-deleted request
  restoreRequest: async (requestId) => {
    const response = await api.patch(`/vendor-requests/${requestId}/restore`);
    return response.data;
  },

  // Admin: delete request
  deleteRequest: async (requestId) => {
    const response = await api.delete(`/vendor-requests/${requestId}`);
    return response.data;
  },
};

export default vendorRequestService;
