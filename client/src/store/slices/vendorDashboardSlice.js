import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import vendorService from "../../services/vendor.service";

// Fetch vendor dashboard data (GET /vendors/dashboard)
export const fetchVendorDashboard = createAsyncThunk(
  "vendorDashboard/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await vendorService.getDashboard();

      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to fetch vendor dashboard",
        );
      }

      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch vendor dashboard",
      );
    }
  },
);

// Fetch vendor sales trend by period (GET /vendors/dashboard/sales?period=...)
export const fetchVendorSalesReport = createAsyncThunk(
  "vendorDashboard/fetchSalesReport",
  async (period = "8w", { rejectWithValue }) => {
    try {
      const response = await vendorService.getSalesReport({ period });

      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to fetch vendor sales report",
        );
      }

      const data = response?.data ?? response;
      const salesTrend = Array.isArray(data?.salesTrend)
        ? data.salesTrend
        : Array.isArray(data)
          ? data
          : [];

      return {
        period: data?.period || period,
        salesTrend,
        summary: data?.summary || {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch vendor sales report",
      );
    }
  },
);

const vendorDashboardSlice = createSlice({
  name: "vendorDashboard",

  initialState: {
    data: null,
    loading: false,
    error: null,
    salesReport: null,
    salesPeriod: "8w",
    salesLoading: false,
    salesError: null,
  },

  reducers: {
    clearVendorDashboardError: (state) => {
      state.error = null;
      state.salesError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        if (action.payload?.salesReport) {
          state.salesReport = action.payload.salesReport;
          state.salesPeriod = action.payload.salesReport.period || "8w";
        }
      })
      .addCase(fetchVendorDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch vendor dashboard";
      })
      .addCase(fetchVendorSalesReport.pending, (state) => {
        state.salesLoading = true;
        state.salesError = null;
      })
      .addCase(fetchVendorSalesReport.fulfilled, (state, action) => {
        state.salesLoading = false;
        state.salesReport = action.payload;
        state.salesPeriod = action.payload?.period || "8w";
      })
      .addCase(fetchVendorSalesReport.rejected, (state, action) => {
        state.salesLoading = false;
        state.salesError =
          action.payload || "Failed to fetch vendor sales report";
      });
  },
});

export const { clearVendorDashboardError } =
  vendorDashboardSlice.actions;

export default vendorDashboardSlice.reducer;
