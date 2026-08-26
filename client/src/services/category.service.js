import api from "./api";

const categoryService = {
  // Customer

  getCategories: async (params = {}) => {
    const response = await api.get("/categories", {
      params,
    });

    return response.data;
  },

  getCategoryById: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);

    return response.data;
  },

  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);

    return response.data;
  },

  getCategoryProducts: async (categoryId, params = {}) => {
    const response = await api.get(`/categories/${categoryId}/products`, {
      params,
    });

    return response.data;
  },

  // Admin

  getAdminCategories: async (params = {}) => {
    const response = await api.get("/admin/categories", {
      params,
    });

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

  toggleCategoryStatus: async (categoryId) => {
    const response = await api.patch(`/admin/categories/${categoryId}/status`);

    return response.data;
  },
};

export default categoryService;
