
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import vendorService from "../../services/vendor.service";

// Fetch vendor dashboard data
export const fetchVendorDashboard = createAsyncThunk(
  "vendorDashboard/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await vendorService.getDashboard();

      if (response?.success === false) {
        return rejectWithValue(
          response.message || "Failed to fetch vendor dashboard"
        );
      }

      // vendorService returns the API response body
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch vendor dashboard"
      );
    }
  }
);

const vendorDashboardSlice = createSlice({
  name: "vendorDashboard",

  initialState: {
    data: null,
    loading: false,
    error: null,
  },

  reducers: {
    clearVendorDashboardError: (state) => {
      state.error = null;
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
      })
      .addCase(fetchVendorDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch vendor dashboard";
      });
  },
});

export const { clearVendorDashboardError } =
  vendorDashboardSlice.actions;

export default vendorDashboardSlice.reducer;
