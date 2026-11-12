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
      params: cleanParams(params),
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

  // Admin (/api/v1/admin/coupons*)
  getAdminCoupons: async (params = {}) => {
    const cleaned = cleanParams(params);
    if (cleaned.status === "active") {
      cleaned.isActive = "true";
      delete cleaned.status;
    } else if (cleaned.status === "inactive" || cleaned.status === "scheduled") {
      cleaned.isActive = "false";
      delete cleaned.status;
    }
    if (cleaned.type) {
      cleaned.discountType = cleaned.type;
      delete cleaned.type;
    }
    const response = await api.get("/admin/coupons", {
      params: cleaned,
    });
    return response.data;
  },

  getCouponById: async (couponId) => {
    const response = await api.get(`/admin/coupons/${couponId}`);
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

  toggleCouponStatus: async (couponId, isActive = true) => {
    const response = await api.patch(`/admin/coupons/${couponId}/status`, {
      isActive: Boolean(isActive),
    });
    return response.data;
  },

  getCouponUsage: async (couponId) => {
    const response = await api.get(`/admin/coupons/${couponId}/usage`);
    return response.data;
  },
};

export default couponService;
