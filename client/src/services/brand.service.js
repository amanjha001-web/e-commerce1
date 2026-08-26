import api from "./api";

const brandService = {
  // Customer

  getBrands: async (params = {}) => {
    const response = await api.get("/brands", {
      params,
    });

    return response.data;
  },

  getBrandById: async (brandId) => {
    const response = await api.get(`/brands/${brandId}`);

    return response.data;
  },

  getBrandBySlug: async (slug) => {
    const response = await api.get(`/brands/slug/${slug}`);

    return response.data;
  },

  getBrandProducts: async (brandId, params = {}) => {
    const response = await api.get(`/brands/${brandId}/products`, {
      params,
    });

    return response.data;
  },

  // Admin

  getAdminBrands: async (params = {}) => {
    const response = await api.get("/admin/brands", {
      params,
    });

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

  toggleBrandStatus: async (brandId) => {
    const response = await api.patch(`/admin/brands/${brandId}/status`);

    return response.data;
  },
};

export default brandService;
