import api from "./api";

const userService = {
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.patch("/users/profile", userData);

    return response.data;
  },

  updateAvatar: async (formData) => {
    const response = await api.patch("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  deleteAvatar: async () => {
    const response = await api.delete("/users/avatar");
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateUsername: async (username) => {
    const response = await api.patch("/users/username", { username });

    return response.data;
  },

  updateEmail: async (email) => {
    const response = await api.patch("/users/email", { email });

    return response.data;
  },

  deactivateAccount: async () => {
    const response = await api.patch("/users/deactivate");

    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete("/users/account");

    return response.data;
  },
};

export default userService;
