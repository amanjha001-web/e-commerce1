import api from "./api";

const productService = {
  // Customer

  getProducts: async (params = {}) => {
    const response = await api.get("/products", {
      params,
    });

    return response.data;
  },

  // Customer: Home page product sections

  getFlashSaleProducts: async (params = {}) => {
    const response = await api.get("/products/flash-sale", { params });
    return response.data;
  },

  getTrendingProducts: async (params = {}) => {
    const response = await api.get("/products/trending", { params });
    return response.data;
  },

  getBestSellerProducts: async (params = {}) => {
    const response = await api.get("/products/best-sellers", { params });
    return response.data;
  },

  getNewArrivalProducts: async (params = {}) => {
    const response = await api.get("/products/new-arrivals", { params });
    return response.data;
  },

  getProductById: async (productId) => {
    const response = await api.get(`/products/${productId}`);

    return response.data;
  },

  searchProducts: async (query, params = {}) => {
    const response = await api.get("/products/search", {
      params: {
        search: query,
        ...params,
      },
    });

    return response.data;
  },

  getProductsByCategory: async (categoryId, params = {}) => {
    const response = await api.get(`/products/category/${categoryId}`, {
      params,
    });

    return response.data;
  },

  getProductsByBrand: async (brandId, params = {}) => {
    const response = await api.get(`/products/brand/${brandId}`, {
      params,
    });

    return response.data;
  },

  getRelatedProducts: async (productId) => {
    const response = await api.get(`/products/${productId}/related`);

    return response.data;
  },

  getRecentlyViewed: async () => {
    const response = await api.get("/products/recently-viewed");

    return response.data;
  },

  addRecentlyViewed: async (productId) => {
    const response = await api.post(`/products/${productId}/recently-viewed`);

    return response.data;
  },

  // Vendor

  getVendorProducts: async (params = {}) => {
    const response = await api.get("/vendor/products", {
      params,
    });

    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post("/vendor/products", productData);

    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await api.patch(
      `/vendor/products/${productId}`,
      productData,
    );

    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/vendor/products/${productId}`);

    return response.data;
  },

  updateProductStock: async (productId, stock) => {
    const response = await api.patch(`/vendor/products/${productId}/stock`, {
      stock,
    });

    return response.data;
  },

  // Product images

  uploadProductImages: async (productId, formData) => {
    const response = await api.post(
      `/vendor/products/${productId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  deleteProductImage: async (productId, imageId) => {
    const response = await api.delete(
      `/vendor/products/${productId}/images/${imageId}`,
    );

    return response.data;
  },

  // Admin

  getAdminProducts: async (params = {}) => {
    const response = await api.get("/admin/products", {
      params,
    });

    return response.data;
  },

  approveProduct: async (productId) => {
    const response = await api.patch(`/admin/products/${productId}/approve`);

    return response.data;
  },

  rejectProduct: async (productId, reason) => {
    const response = await api.patch(`/admin/products/${productId}/reject`, {
      reason,
    });

    return response.data;
  },
};

export default productService;
