import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";

export const getProducts = async (params = {}) => {
  const response = await api.get(ENDPOINTS.PRODUCTS.GET_ALL, {
    params,
  });

  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(ENDPOINTS.PRODUCTS.GET_BY_ID(id));

  return response.data;
};
