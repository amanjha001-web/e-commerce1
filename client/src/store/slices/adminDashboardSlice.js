import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api.js";

export const fetchAdminDashboard = createAsyncThunk(
  "adminDashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/dashboard");
      const result = response.data;

      if (!result.success) {
        return rejectWithValue(
          result.message || "Failed to fetch dashboard stats",
        );
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch dashboard stats",
      );
    }
  },
);

const adminDashboardSlice = createSlice({
  name: "adminDashboard",

  initialState: {
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
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = {
          ...state.stats,
          ...action.payload,
        };
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch dashboard stats";
      });
  },
});

export default adminDashboardSlice.reducer;
