import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";

export const loginUser = async (credentials) => {
  const response = await api.post(ENDPOINTS.AUTH.LOGIN, credentials);

  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post(ENDPOINTS.AUTH.LOGOUT);

  return response.data;
};
