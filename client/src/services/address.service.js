import api from "./api";

const addressService = {
  getAddresses: async () => {
    const response = await api.get("/addresses");
    return response.data;
  },

  getAddressById: async (addressId) => {
    const response = await api.get(`/addresses/${addressId}`);

    return response.data;
  },

  addAddress: async (addressData) => {
    const response = await api.post("/addresses", addressData);

    return response.data;
  },

  updateAddress: async (addressId, addressData) => {
    const response = await api.patch(`/addresses/${addressId}`, addressData);

    return response.data;
  },

  deleteAddress: async (addressId) => {
    const response = await api.delete(`/addresses/${addressId}`);

    return response.data;
  },

  setDefaultAddress: async (addressId) => {
    const response = await api.patch(`/addresses/${addressId}/default`);

    return response.data;
  },

  getDefaultAddress: async () => {
    const response = await api.get("/addresses/default");

    return response.data;
  },
};

export default addressService;
