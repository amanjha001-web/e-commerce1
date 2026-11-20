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
      const trend = Array.isArray(data?.salesTrend) ? data.salesTrend : [];

      const salesData = trend.map((item, index) => ({
        label: item?.label || item?.date || item?._id || getDayLabel(index),
        date: item?.date || item?._id,
        value: Number(item?.orders ?? item?.sales ?? 0) || 0,
      }));

      const revenueData = trend.map((item, index) => ({
        label: item?.label || item?.date || item?._id || getDayLabel(index),
        date: item?.date || item?._id,
        value: Number(item?.revenue ?? 0) || 0,
      }));

      return {
        period: data?.period || period,
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

// Fetch Admin Dashboard Recent Users (GET /admin/dashboard/recent-users)
export const fetchAdminDashboardRecentUsers = createAsyncThunk(
  "adminDashboard/fetchRecentUsers",
  async (params = { limit: 5 }, { rejectWithValue }) => {
    try {
      const response = await adminService.getRecentUsers(params);
      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to fetch recent users",
        );
      }
      const data = response?.data ?? response;
      return Array.isArray(data) ? data : data?.users || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch recent users",
      );
    }
  },
);

// Fetch Admin Dashboard Top Products (GET /admin/dashboard/top-products)
export const fetchAdminTopProducts = createAsyncThunk(
  "adminDashboard/fetchTopProducts",
  async (params = { limit: 5 }, { rejectWithValue }) => {
    try {
      const response = await adminService.getTopProducts(params);
      if (response?.success === false) {
        return rejectWithValue(
          response?.message || "Failed to fetch top products",
        );
      }
      const data = response?.data ?? response;
      return Array.isArray(data) ? data : data?.products || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch top products",
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
    publishedProducts: 0,
    lowStockCount: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    usersGrowth: 0,
    ordersGrowth: 0,
    revenueGrowth: 0,
    openTickets: 0,
  },
  salesData: [],
  revenueData: [],
  summary: {},
  recentOrders: [],
  recentUsers: [],
  topProducts: [],
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
        const payload = action.payload || {};
        // Backend returns { metrics, recentOrders, recentUsers, lowStockProducts, topProducts }
        const metrics =
          payload.metrics && typeof payload.metrics === "object"
            ? payload.metrics
            : payload;
        const {
          recentOrders,
          recentUsers,
          lowStockProducts,
          topProducts,
          metrics: _ignored,
          ...flatMetrics
        } = metrics;
        state.stats = {
          ...state.stats,
          ...flatMetrics,
        };
        if (Array.isArray(payload.recentOrders)) {
          state.recentOrders = payload.recentOrders;
        }
        if (Array.isArray(payload.recentUsers)) {
          state.recentUsers = payload.recentUsers;
        }
        if (Array.isArray(payload.lowStockProducts)) {
          state.lowStockProducts = payload.lowStockProducts;
        }
        if (Array.isArray(payload.topProducts)) {
          state.topProducts = payload.topProducts;
        }
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
      .addCase(fetchAdminDashboardRecentUsers.fulfilled, (state, action) => {
        state.recentUsers = action.payload || [];
      })
      .addCase(fetchAdminTopProducts.fulfilled, (state, action) => {
        state.topProducts = action.payload || [];
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
