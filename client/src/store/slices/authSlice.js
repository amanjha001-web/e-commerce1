import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import authService from "../../services/auth.service";
import userService from "../../services/user.service";

// =========================
// Initial State
// =========================

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  accessToken: localStorage.getItem("accessToken") || null,

  isAuthenticated: !!localStorage.getItem("accessToken"),

  loading: false,
  updatingProfile: false,

  error: null,
};

// =========================
// Login
// =========================

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      const data = response?.data;

      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Login failed",
      );
    }
  },
);

// =========================
// Register
// =========================

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Registration failed",
      );
    }
  },
);

// =========================
// Forgot Password
// =========================

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword({
        email,
      });

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to generate password reset link",
      );
    }
  },
);

// =========================
// Reset Password
// =========================

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(token, {
        password,
        confirmPassword,
      });

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Password reset failed",
      );
    }
  },
);

// =========================
// Get Current User
// =========================

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to get current user",
      );
    }
  },
);

// =========================
// Update Profile
// =========================

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(userData);

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Profile update failed",
      );
    }
  },
);

// =========================
// Logout
// =========================

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.logout();

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Logout failed",
      );
    }
  },
);

// =========================
// Auth Slice
// =========================

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = !!accessToken;

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }
    },

    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };

      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },

  extraReducers: (builder) => {
    builder

      // =========================
      // Login
      // =========================

      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const responseData = action.payload?.data;

        const user = responseData?.user;
        const accessToken = responseData?.accessToken;

        if (user) {
          state.user = user;

          localStorage.setItem("user", JSON.stringify(user));
        }

        if (accessToken) {
          state.accessToken = accessToken;
          state.isAuthenticated = true;

          localStorage.setItem("accessToken", accessToken);
        }
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
      })

      // =========================
      // Register
      // =========================

      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const responseData = action.payload?.data;

        const user = responseData?.user;
        const accessToken = responseData?.accessToken;

        if (user) {
          state.user = user;

          localStorage.setItem("user", JSON.stringify(user));
        }

        if (accessToken) {
          state.accessToken = accessToken;
          state.isAuthenticated = true;

          localStorage.setItem("accessToken", accessToken);
        }
      })

      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })

      // =========================
      // Forgot Password
      // =========================

      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })

      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Unable to generate password reset link";
      })

      // =========================
      // Reset Password
      // =========================

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })

      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Password reset failed";
      })

      // =========================
      // Get Current User
      // =========================

      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const currentUser = action.payload?.data;

        if (currentUser) {
          state.user = currentUser;

          localStorage.setItem("user", JSON.stringify(currentUser));
        }

        state.isAuthenticated = true;
      })

      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to get current user";

        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;

        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
      })

      // =========================
      // Update Profile
      // =========================

      .addCase(updateProfile.pending, (state) => {
        state.updatingProfile = true;
        state.error = null;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updatingProfile = false;
        state.error = null;

        const updatedUser = action.payload?.data;

        if (updatedUser) {
          state.user = {
            ...state.user,
            ...updatedUser,
          };

          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })

      .addCase(updateProfile.rejected, (state, action) => {
        state.updatingProfile = false;
        state.error = action.payload || "Profile update failed";
      })

      // =========================
      // Logout
      // =========================

      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.error = null;

        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.updatingProfile = false;

        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })

      .addCase(logout.rejected, (state, action) => {
        // Backend request fail hone par bhi
        // frontend par logout complete karenge.
        state.loading = false;

        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.updatingProfile = false;

        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        state.error = action.payload || "Logout failed";
      });
  },
});

export const { clearError, setCredentials, updateUser } = authSlice.actions;

export default authSlice.reducer;
