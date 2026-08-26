import api from "./api";

const couponService = {
  // Customer

  validateCoupon: async (couponCode, cartData = {}) => {
    const response = await api.post("/coupons/validate", {
      couponCode,
      ...cartData,
    });

    return response.data;
  },

  applyCoupon: async (couponCode) => {
    const response = await api.post("/cart/coupon", {
      couponCode,
    });

    return response.data;
  },

  removeCoupon: async () => {
    const response = await api.delete("/cart/coupon");

    return response.data;
  },

  // Vendor

  getVendorCoupons: async (params = {}) => {
    const response = await api.get("/vendor/coupons", {
      params,
    });

    return response.data;
  },

  createVendorCoupon: async (couponData) => {
    const response = await api.post("/vendor/coupons", couponData);

    return response.data;
  },

  updateVendorCoupon: async (couponId, couponData) => {
    const response = await api.patch(`/vendor/coupons/${couponId}`, couponData);

    return response.data;
  },

  deleteVendorCoupon: async (couponId) => {
    const response = await api.delete(`/vendor/coupons/${couponId}`);

    return response.data;
  },

  // Admin

  getAdminCoupons: async (params = {}) => {
    const response = await api.get("/admin/coupons", {
      params,
    });

    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await api.post("/admin/coupons", couponData);

    return response.data;
  },

  updateCoupon: async (couponId, couponData) => {
    const response = await api.patch(`/admin/coupons/${couponId}`, couponData);

    return response.data;
  },

  deleteCoupon: async (couponId) => {
    const response = await api.delete(`/admin/coupons/${couponId}`);

    return response.data;
  },

  toggleCouponStatus: async (couponId) => {
    const response = await api.patch(`/admin/coupons/${couponId}/status`);

    return response.data;
  },
};

export default couponService;
