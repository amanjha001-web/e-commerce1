
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import authService from "../../services/auth.service";

/* =========================================================
   Initial State
========================================================= */

const initialState = {
  user: null,

  accessToken: localStorage.getItem("accessToken") || null,

  isAuthenticated: !!localStorage.getItem("accessToken"),

  loading: false,
  error: null,
};

/* =========================================================
   Login
========================================================= */

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

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

/* =========================================================
   Register
========================================================= */

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

/* =========================================================
   Get Current User
========================================================= */

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
          "Failed to fetch current user",
      );
    }
  },
);

/* =========================================================
   Logout
========================================================= */

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

/* =========================================================
   Auth Slice
========================================================= */

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    loginSuccess: (state, action) => {
      state.loading = false;

      state.user = action.payload?.user || null;

      state.accessToken = action.payload?.accessToken || null;

      state.isAuthenticated = !!action.payload?.accessToken;

      state.error = null;

      if (action.payload?.accessToken) {
        localStorage.setItem(
          "accessToken",
          action.payload.accessToken,
        );
      }
    },

    loginFailure: (state, action) => {
      state.loading = false;

      state.error = action.payload;

      state.isAuthenticated = false;

      state.user = null;
    },

    setUser: (state, action) => {
      state.user = action.payload;

      if (action.payload) {
        state.isAuthenticated = true;
      }
    },

    setAccessToken: (state, action) => {
      state.accessToken = action.payload;

      state.isAuthenticated = !!action.payload;

      if (action.payload) {
        localStorage.setItem("accessToken", action.payload);
      } else {
        localStorage.removeItem("accessToken");
      }
    },

    clearAuthError: (state) => {
      state.error = null;
    },

    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
  },

  /* =======================================================
     Async Thunks
  ======================================================= */

  extraReducers: (builder) => {
    /* -------------------------------------------------------
       LOGIN
    ------------------------------------------------------- */

    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const data = action.payload?.data || action.payload;

        state.user = data?.user || null;

        state.accessToken = data?.accessToken || null;

        state.isAuthenticated = !!data?.accessToken;

        if (data?.accessToken) {
          localStorage.setItem(
            "accessToken",
            data.accessToken,
          );
        }
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Login failed";

        state.isAuthenticated = false;

        state.user = null;
      });

    /* -------------------------------------------------------
       REGISTER
    ------------------------------------------------------- */

    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        /*
         * Registration normally doesn't need to authenticate
         * the user automatically.
         *
         * If backend returns an accessToken, we support that too.
         */

        const data = action.payload?.data || action.payload;

        if (data?.user) {
          state.user = data.user;
        }

        if (data?.accessToken) {
          state.accessToken = data.accessToken;

          state.isAuthenticated = true;

          localStorage.setItem(
            "accessToken",
            data.accessToken,
          );
        }
      })

      .addCase(register.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload || "Registration failed";
      });

    /* -------------------------------------------------------
       GET CURRENT USER
    ------------------------------------------------------- */

    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const data = action.payload?.data || action.payload;

        state.user = data?.user || data || null;

        /*
         * Current user successfully fetched means the
         * existing access token is valid.
         */

        state.isAuthenticated = true;
      })

      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload || "Failed to fetch current user";

        /*
         * Don't immediately remove authentication state
         * here if the API interceptor handles token refresh.
         */
      });

    /* -------------------------------------------------------
       LOGOUT
    ------------------------------------------------------- */

    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(logout.fulfilled, (state) => {
        state.loading = false;

        state.user = null;

        state.accessToken = null;

        state.isAuthenticated = false;

        state.error = null;

        localStorage.removeItem("accessToken");
      })

      .addCase(logout.rejected, (state, action) => {
        /*
         * Even if backend logout fails, locally we should
         * clear the authentication state.
         */

        state.loading = false;

        state.user = null;

        state.accessToken = null;

        state.isAuthenticated = false;

        state.error = action.payload || "Logout failed";

        localStorage.removeItem("accessToken");
      });
  },
});

/* =========================================================
   Actions
========================================================= */

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  setUser,
  setAccessToken,
  clearAuthError,
  setAuthLoading,
} = authSlice.actions;

/* =========================================================
   Reducer
========================================================= */

export default authSlice.reducer;
