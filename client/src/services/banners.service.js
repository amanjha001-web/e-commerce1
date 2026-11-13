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

// Note: Backend banner routes are mounted at /api/v1/banners (in server/src/routes/banner.routes.js)
const bannersService = {
  // Get all banners (Admin: GET /admin/banners)
  getAll: async (params = {}) => {
    const response = await api.get("/admin/banners", { params: cleanParams(params) });
    return response.data;
  },

  // Get active banners (Public: GET /banners/active)
  getActive: async (params = {}) => {
    const response = await api.get("/banners/active", {
      params: cleanParams(params),
    });
    return response.data;
  },

  // Get banner by slug (Public: GET /banners/slug/:slug)
  getBySlug: async (slug) => {
    const response = await api.get(`/banners/slug/${slug}`);
    return response.data;
  },

  // Get banner by ID (Admin: GET /admin/banners/:bannerId)
  getById: async (bannerId) => {
    const response = await api.get(`/admin/banners/${bannerId}`);
    return response.data;
  },

  // Create banner (Admin: POST /admin/banners)
  create: async (bannerData) => {
    const response = await api.post("/admin/banners", bannerData);
    return response.data;
  },

  // Update banner (Admin: PATCH /admin/banners/:bannerId)
  update: async (bannerId, bannerData) => {
    const response = await api.patch(`/admin/banners/${bannerId}`, bannerData);
    return response.data;
  },

  // Delete banner (Admin: DELETE /admin/banners/:bannerId)
  delete: async (bannerId) => {
    const response = await api.delete(`/admin/banners/${bannerId}`);
    return response.data;
  },

  // Record impression (Public: PATCH /banners/:bannerId/impression)
  incrementImpression: async (bannerId) => {
    const response = await api.patch(`/banners/${bannerId}/impression`);
    return response.data;
  },

  // Record click (Public: PATCH /banners/:bannerId/click)
  incrementClick: async (bannerId) => {
    const response = await api.patch(`/banners/${bannerId}/click`);
    return response.data;
  },
};

export default bannersService;
