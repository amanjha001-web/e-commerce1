import api from "./api";

const wishlistService = {
  // GET /api/v1/wishlist
  getWishlist: async () => {
    const response = await api.get("/wishlist");
    return response.data;
  },

  // POST /api/v1/wishlist
  addToWishlist: async (productId) => {
    const response = await api.post("/wishlist", {
      productId,
    });

    return response.data;
  },

  // DELETE /api/v1/wishlist/:productId
  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data;
  },

  // DELETE /api/v1/wishlist
  clearWishlist: async () => {
    const response = await api.delete("/wishlist");
    return response.data;
  },
};

export default wishlistService;
