import api from "./api";

const userService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get("/users/profile");

    return response.data;
  },

  // Update current user profile
  updateProfile: async (userData) => {
    const response = await api.patch("/users/me", userData);

    return response.data;
  },

  // Update avatar
  updateAvatar: async (formData) => {
    const response = await api.patch("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Delete avatar
  deleteAvatar: async () => {
    const response = await api.delete("/users/avatar");

    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);

    return response.data;
  },

  // Update username
  updateUsername: async (username) => {
    const response = await api.patch("/users/username", { username });

    return response.data;
  },

  // Update email
  updateEmail: async (email) => {
    const response = await api.patch("/users/email", { email });

    return response.data;
  },

  // Deactivate account
  deactivateAccount: async () => {
    const response = await api.patch("/users/deactivate");

    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete("/users/account");

    return response.data;
  },
};

export default userService;
