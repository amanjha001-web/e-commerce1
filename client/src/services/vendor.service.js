import api from "./api";

const vendorService = {
  // Public / Customer

  getVendors: async (params = {}) => {
    const response = await api.get("/vendors", {
      params,
    });

    return response.data;
  },

  getVendorById: async (vendorId) => {
    const response = await api.get(`/vendors/${vendorId}`);

    return response.data;
  },

  getVendorBySlug: async (slug) => {
    const response = await api.get(`/vendors/slug/${slug}`);

    return response.data;
  },

  getVendorProducts: async (vendorId, params = {}) => {
    const response = await api.get(`/vendors/${vendorId}/products`, {
      params,
    });

    return response.data;
  },

  // Vendor Profile / Store

  getMyStore: async () => {
    const response = await api.get("/vendor/store");

    return response.data;
  },

  updateStore: async (storeData) => {
    const response = await api.patch("/vendor/store", storeData);

    return response.data;
  },

  updateStoreLogo: async (formData) => {
    const response = await api.patch("/vendor/store/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  updateStoreBanner: async (formData) => {
    const response = await api.patch("/vendor/store/banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Vendor Dashboard

  getDashboard: async (params = {}) => {
    const response = await api.get("/vendor/dashboard", {
      params,
    });

    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get("/vendor/dashboard/stats", {
      params,
    });

    return response.data;
  },

  getSalesReport: async (params = {}) => {
    const response = await api.get("/vendor/dashboard/sales", {
      params,
    });

    return response.data;
  },

  // Earnings

  getEarnings: async (params = {}) => {
    const response = await api.get("/vendor/earnings", {
      params,
    });

    return response.data;
  },

  getEarningsSummary: async () => {
    const response = await api.get("/vendor/earnings/summary");

    return response.data;
  },

  // Inventory

  getInventory: async (params = {}) => {
    const response = await api.get("/vendor/inventory", {
      params,
    });

    return response.data;
  },

  updateInventory: async (productId, data) => {
    const response = await api.patch(`/vendor/inventory/${productId}`, data);

    return response.data;
  },

  // Payouts

  getPayouts: async (params = {}) => {
    const response = await api.get("/vendor/payouts", {
      params,
    });

    return response.data;
  },

  getPayoutById: async (payoutId) => {
    const response = await api.get(`/vendor/payouts/${payoutId}`);

    return response.data;
  },

  // Vendor account

  getProfile: async () => {
    const response = await api.get("/vendor/profile");

    return response.data;
  },

  updateProfile: async (vendorData) => {
    const response = await api.patch("/vendor/profile", vendorData);

    return response.data;
  },
};

export default vendorService;
