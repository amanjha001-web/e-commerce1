import api from "./api";

const cartService = {
  // Get cart
  getCart: async () => {
    const response = await api.get("/cart");
    return response.data;
  },

  // Add product to cart
  addToCart: async (productId, quantity = 1, variant = null) => {
    const response = await api.post("/cart", {
      productId,
      quantity,
      ...(variant ? { variant } : {}),
    });

    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (productId, quantity, variant = null) => {
    const response = await api.patch(`/cart/${productId}`, {
      quantity,
      ...(variant ? { variant } : {}),
    });

    return response.data;
  },

  // Remove cart item
  removeCartItem: async (productId, variant = null) => {
    const response = await api.delete(`/cart/${productId}`, {
      data: variant ? { variant } : {},
    });

    return response.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete("/cart");
    return response.data;
  },

  // Apply coupon
  applyCoupon: async (couponCode) => {
    const response = await api.post("/cart/coupon", {
      couponCode,
    });

    return response.data;
  },

  // Remove coupon
  removeCoupon: async () => {
    const response = await api.delete("/cart/coupon");
    return response.data;
  },

  // Validate cart
  validateCart: async () => {
    const response = await api.get("/cart/validate");
    return response.data;
  },
};

export default cartService;
