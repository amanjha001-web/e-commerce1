import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../../services/admin.service";

// Fetch Admin Dashboard Stats
export const fetchAdminDashboard = createAsyncThunk(
  "adminDashboard/fetchDashboard",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboard(params);

      if (!response?.success) {
        return rejectWithValue(
          response?.message || "Failed to fetch dashboard data"
        );
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch dashboard data"
      );
    }
  }
);

// Fetch Admin Dashboard Analytics (Sales & Revenue)
export const fetchAdminDashboardAnalytics = createAsyncThunk(
  "adminDashboard/fetchAnalytics",
  async (period = "7d", { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboardAnalytics({ period });

      if (!response?.success) {
        return rejectWithValue(
          response?.message || "Failed to fetch dashboard analytics"
        );
      }

      const data = response.data || response;
      
      // Transform salesTrend data to chart format
      const salesData = (data?.salesTrend || []).map((item, index) => ({
        label: getDayLabel(index),
        value: item?.sales || 0,
      }));

      // Transform revenueTrend data to chart format
      const revenueData = (data?.salesTrend || []).map((item, index) => ({
        label: getDayLabel(index),
        value: item?.revenue || 0,
      }));

      return {
        period,
        salesData,
        revenueData,
        summary: data?.summary || {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch dashboard analytics"
      );
    }
  }
);

// Helper to get day labels for charts
const getDayLabel = (index) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days[index % 7];
};

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
  salesData: [],
  revenueData: [],
  period: "7d",
  loading: false,
  analyticsLoading: false,
  error: null,
  analyticsError: null,
};

// Dashboard Slice
const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,

  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },

    clearAnalyticsError: (state) => {
      state.analyticsError = null;
    },

    resetDashboard: () => initialState,

    setAnalyticsPeriod: (state, action) => {
      state.period = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.stats = {
          ...state.stats,
          ...(action.payload || {}),
        };
      })

      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch dashboard data";
      })

      // Analytics
      .addCase(fetchAdminDashboardAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })

      .addCase(fetchAdminDashboardAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = null;
        state.period = action.payload.period;
        state.salesData = action.payload.salesData || [];
        state.revenueData = action.payload.revenueData || [];
      })

      .addCase(fetchAdminDashboardAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload || "Failed to fetch dashboard analytics";
      });
  },
});

export const { clearDashboardError, clearAnalyticsError, resetDashboard, setAnalyticsPeriod } =
  adminDashboardSlice.actions;

export default adminDashboardSlice.reducer;
