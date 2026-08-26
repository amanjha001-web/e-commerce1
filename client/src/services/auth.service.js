import api from "./api";

const authService = {
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("/auth/refresh-token");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  verifyEmail: async (data) => {
    const response = await api.post("/auth/verify-email", data);
    return response.data;
  },

  sendVerificationOTP: async (data) => {
    const response = await api.post("/auth/send-verification-otp", data);

    return response.data;
  },

  verifyOTP: async (data) => {
    const response = await api.post("/auth/verify-otp", data);

    return response.data;
  },

  forgotPassword: async (data) => {
    const response = await api.post("/auth/forgot-password", data);

    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post("/auth/reset-password", data);

    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.patch("/auth/change-password", data);

    return response.data;
  },

  googleLogin: async (data) => {
    const response = await api.post("/auth/google", data);

    return response.data;
  },

  checkUsername: async (username) => {
    const response = await api.get(
      `/auth/check-username/${encodeURIComponent(username)}`,
    );

    return response.data;
  },

  checkEmail: async (email) => {
    const response = await api.get(
      `/auth/check-email/${encodeURIComponent(email)}`,
    );

    return response.data;
  },
};

export default authService;
