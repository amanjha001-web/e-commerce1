import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../services/admin.service";

// Fetch Admin Dashboard
export const fetchAdminDashboard = createAsyncThunk(
  "adminDashboard/fetchDashboard",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboard(params);

      if (!response?.success) {
        return rejectWithValue(
          response?.message || "Failed to fetch dashboard data",
        );
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch dashboard data",
      );
    }
  },
);

// Initial State
const initialState = {
  stats: {
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingVendors: 0,
    pendingProducts: 0,
  },
  loading: false,
  error: null,
};

// Dashboard Slice
const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,

  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },

    resetDashboard: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Pending
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Success
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.stats = {
          ...state.stats,
          ...(action.payload || {}),
        };
      })

      // Error
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch dashboard data";
      });
  },
});

export const { clearDashboardError, resetDashboard } =
  adminDashboardSlice.actions;

export default adminDashboardSlice.reducer;
