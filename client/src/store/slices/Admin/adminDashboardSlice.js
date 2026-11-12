import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminService from "../../../services/admin.service";

// Fetch Admin Dashboard Stats (GET /admin/dashboard)
export const fetchAdminDashboard = createAsyncThunk(
  "adminDashboard/fetchDashboard",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboard(params);

      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to fetch dashboard data",
        );
      }

      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch dashboard data",
      );
    }
  },
);

// Fetch Admin Dashboard Analytics (GET /admin/dashboard/analytics)
export const fetchAdminDashboardAnalytics = createAsyncThunk(
  "adminDashboard/fetchAnalytics",
  async (period = "7d", { rejectWithValue }) => {
    try {
      const response = await adminService.getDashboardAnalytics({ period });

      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to fetch dashboard analytics",
        );
      }

      const data = response?.data || response;

      const salesData = (data?.salesTrend || []).map((item, index) => ({
        label: item?.date || getDayLabel(index),
        value: item?.sales || 0,
      }));

      const revenueData = (data?.salesTrend || []).map((item, index) => ({
        label: item?.date || getDayLabel(index),
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
          "Failed to fetch dashboard analytics",
      );
    }
  },
);

// Fetch Admin Dashboard Recent Orders (GET /admin/dashboard/recent-orders)
export const fetchAdminRecentOrders = createAsyncThunk(
  "adminDashboard/fetchRecentOrders",
  async (params = { limit: 10 }, { rejectWithValue }) => {
    try {
      const response = await adminService.getRecentOrders(params);
      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to fetch recent orders",
        );
      }
      const data = response?.data ?? response;
      return Array.isArray(data) ? data : data?.orders || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch recent orders",
      );
    }
  },
);

// Fetch Admin Dashboard Low Stock Products (GET /admin/dashboard/low-stock)
export const fetchAdminLowStockProducts = createAsyncThunk(
  "adminDashboard/fetchLowStockProducts",
  async (params = { threshold: 10, limit: 10 }, { rejectWithValue }) => {
    try {
      const response = await adminService.getLowStockProducts(params);
      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to fetch low stock products",
        );
      }
      const data = response?.data ?? response;
      return data?.products || (Array.isArray(data) ? data : []);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch low stock products",
      );
    }
  },
);

const getDayLabel = (index) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days[index % 7];
};

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
  summary: {},
  recentOrders: [],
  lowStockProducts: [],
  period: "7d",
  loading: false,
  analyticsLoading: false,
  error: null,
  analyticsError: null,
};

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
        state.summary = action.payload.summary || {};
      })
      .addCase(fetchAdminDashboardAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError =
          action.payload || "Failed to fetch dashboard analytics";
      })
      .addCase(fetchAdminRecentOrders.fulfilled, (state, action) => {
        state.recentOrders = action.payload || [];
      })
      .addCase(fetchAdminLowStockProducts.fulfilled, (state, action) => {
        state.lowStockProducts = action.payload || [];
      });
  },
});

export const {
  clearDashboardError,
  clearAnalyticsError,
  resetDashboard,
  setAnalyticsPeriod,
} = adminDashboardSlice.actions;

export default adminDashboardSlice.reducer;
