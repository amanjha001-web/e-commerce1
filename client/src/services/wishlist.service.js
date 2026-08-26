import api from "./api";

const wishlistService = {
  getWishlist: async (params = {}) => {
    const response = await api.get("/wishlist", {
      params,
    });

    return response.data;
  },

  addToWishlist: async (productId) => {
    const response = await api.post("/wishlist/items", {
      productId,
    });

    return response.data;
  },

  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/wishlist/items/${productId}`);

    return response.data;
  },

  toggleWishlist: async (productId) => {
    const response = await api.post(`/wishlist/items/${productId}/toggle`);

    return response.data;
  },

  clearWishlist: async () => {
    const response = await api.delete("/wishlist");

    return response.data;
  },

  moveToCart: async (productId, quantity = 1) => {
    const response = await api.post(
      `/wishlist/items/${productId}/move-to-cart`,
      {
        quantity,
      },
    );

    return response.data;
  },

  checkWishlist: async (productId) => {
    const response = await api.get(`/wishlist/check/${productId}`);

    return response.data;
  },
};

export default wishlistService;
