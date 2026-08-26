import api from "./api";

const reviewService = {
  // Customer

  getProductReviews: async (productId, params = {}) => {
    const response = await api.get(`/products/${productId}/reviews`, {
      params,
    });

    return response.data;
  },

  getProductRatingSummary: async (productId) => {
    const response = await api.get(`/products/${productId}/reviews/summary`);

    return response.data;
  },

  createReview: async (productId, reviewData) => {
    const response = await api.post(
      `/products/${productId}/reviews`,
      reviewData,
    );

    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await api.patch(`/reviews/${reviewId}`, reviewData);

    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);

    return response.data;
  },

  getMyReviews: async (params = {}) => {
    const response = await api.get("/reviews/my-reviews", {
      params,
    });

    return response.data;
  },

  // Helpful / like

  markHelpful: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);

    return response.data;
  },

  removeHelpful: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}/helpful`);

    return response.data;
  },

  // Vendor

  getVendorReviews: async (params = {}) => {
    const response = await api.get("/vendor/reviews", {
      params,
    });

    return response.data;
  },

  replyToReview: async (reviewId, reply) => {
    const response = await api.post(`/vendor/reviews/${reviewId}/reply`, {
      reply,
    });

    return response.data;
  },

  // Admin

  getAdminReviews: async (params = {}) => {
    const response = await api.get("/admin/reviews", {
      params,
    });

    return response.data;
  },

  approveReview: async (reviewId) => {
    const response = await api.patch(`/admin/reviews/${reviewId}/approve`);

    return response.data;
  },

  rejectReview: async (reviewId, reason = "") => {
    const response = await api.patch(`/admin/reviews/${reviewId}/reject`, {
      reason,
    });

    return response.data;
  },

  deleteAdminReview: async (reviewId) => {
    const response = await api.delete(`/admin/reviews/${reviewId}`);

    return response.data;
  },
};

export default reviewService;
